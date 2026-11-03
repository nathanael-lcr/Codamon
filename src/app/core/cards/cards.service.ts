import { Injectable, inject } from '@angular/core';
import { Card } from './card.model';
import { SupabaseService } from '../supabase/supabase.service';
import { PACK_SIZE } from './pack-opening';

export interface PackEnergy {
  availablePacks: number;
  nextRefillAt: string | null;
}

export interface OpenedPack extends PackEnergy {
  cards: Card[];
}

@Injectable({
  providedIn: 'root',
})
export class CardsService {
  private readonly supabase = inject(SupabaseService).client;

  async getFirstActiveCard(): Promise<Card | null> {
    const { data, error } = await this.supabase
      .from('cards')
      .select('*')
      .eq('is_active', true)
      .order('card_number', { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as Card | null;
  }

  async getActiveCardCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('cards')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    if (count === null) {
      throw new Error('Impossible de compter les cartes actives du catalogue.');
    }

    return count;
  }

  async getPackEnergy(): Promise<PackEnergy> {
    const { data, error } = await this.supabase.rpc('pack_energy', {
      p_consume: false,
    });

    if (error) throw error;
    return parsePackEnergy(data);
  }

  async openRandomPack(): Promise<OpenedPack> {
    const { data, error } = await this.supabase.rpc('pack_energy', {
      p_consume: true,
    });

    if (error) throw error;

    const result = parsePackEnergy(data);
    if (!Array.isArray(result.cards) || result.cards.length !== PACK_SIZE) {
      throw new Error('Le serveur n’a pas retourné les cartes attendues pour ce paquet.');
    }

    return {
      ...result,
      cards: result.cards,
    };
  }
}

function parsePackEnergy(value: unknown): PackEnergy & { cards?: Card[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Réponse de recharge des paquets invalide.');
  }

  const result = value as Record<string, unknown>;
  if (
    typeof result['availablePacks'] !== 'number' ||
    !Number.isInteger(result['availablePacks']) ||
    result['availablePacks'] < 0 ||
    result['availablePacks'] > 5
  ) {
    throw new Error('Nombre de paquets disponibles invalide.');
  }

  const nextRefillAt = result['nextRefillAt'];
  if (
    nextRefillAt !== null &&
    (typeof nextRefillAt !== 'string' || Number.isNaN(Date.parse(nextRefillAt)))
  ) {
    throw new Error('Date de recharge des paquets invalide.');
  }

  const cards = result['cards'];
  if (cards !== undefined && cards !== null) {
    if (!Array.isArray(cards)) {
      throw new Error('Le serveur a retourné un paquet invalide.');
    }

    return {
      availablePacks: result['availablePacks'],
      nextRefillAt,
      cards: cards.map(normalizeCard),
    };
  }

  return {
    availablePacks: result['availablePacks'],
    nextRefillAt,
  };
}

function normalizeCard(value: unknown): Card {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Le serveur a retourné une carte invalide dans le paquet.');
  }

  const card = value as Record<string, unknown>;

  if (
    typeof card['id'] !== 'string' ||
    typeof card['name'] !== 'string' ||
    typeof card['rarity'] !== 'string'
  ) {
    throw new Error('Le serveur a retourné une carte sans identifiant, nom ou rareté.');
  }

  return {
    id: card['id'],
    card_number: isNumber(card['card_number']) ? card['card_number'] : 0,
    slug: isString(card['slug']) ? card['slug'] : card['id'],
    name: card['name'],
    subtitle: nullableString(card['subtitle']),
    description: nullableString(card['description']),
    flavor_text: nullableString(card['flavor_text']),
    quote: nullableString(card['quote']),
    rarity: card['rarity'],
    serie: nullableString(card['serie']),
    card_type: isString(card['card_type']) ? card['card_type'] : 'character',
    image_url: nullableString(card['image_url']),
    thumbnail_url: nullableString(card['thumbnail_url']),
    attack: nullableNumber(card['attack']),
    defense: nullableNumber(card['defense']),
    hp: nullableNumber(card['hp']),
    speed: nullableNumber(card['speed']),
    ability_name: nullableString(card['ability_name']),
    ability_description: nullableString(card['ability_description']),
    is_active: typeof card['is_active'] === 'boolean' ? card['is_active'] : true,
    released_at: nullableString(card['released_at']),
    created_by: nullableString(card['created_by']),
    created_at: isString(card['created_at']) ? card['created_at'] : '',
    updated_at: isString(card['updated_at']) ? card['updated_at'] : '',
  };
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function nullableString(value: unknown): string | null {
  return isString(value) ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return isNumber(value) ? value : null;
}
