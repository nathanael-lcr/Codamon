import { Injectable, inject, signal } from '@angular/core';
import { Card } from '../cards/card.model';
import { normalizeCard } from '../cards/cards.service';
import { SupabaseService } from '../supabase/supabase.service';

export interface CardExchangeOffer {
  id: string;
  creatorId: string;
  creatorName: string;
  offerCard: Card;
  offerQuantity: number;
  wantCard: Card;
  wantQuantity: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExchangeService {
  private readonly supabase = inject(SupabaseService).client;

  private readonly _offers = signal<CardExchangeOffer[]>([]);
  private readonly _loading = signal(false);

  readonly offers = this._offers.asReadonly();
  readonly loading = this._loading.asReadonly();

  async load(): Promise<void> {
    this._loading.set(true);
    try {
      const { data, error } = await this.supabase.rpc('list_card_exchange_offers');
      if (error) throw new Error(error.message);

      const result = asRecord(data);
      if (!Array.isArray(result['offers'])) {
        throw new Error('La réponse des échanges est invalide.');
      }

      this._offers.set(result['offers'].map(parseOffer));
    } finally {
      this._loading.set(false);
    }
  }

  async create(
    offerCardId: string,
    offerQuantity: number,
    wantCardId: string,
    wantQuantity: number,
  ): Promise<void> {
    const { error } = await this.supabase.rpc('create_card_exchange_offer', {
      p_offer_card_id: offerCardId,
      p_offer_quantity: offerQuantity,
      p_want_card_id: wantCardId,
      p_want_quantity: wantQuantity,
    });

    if (error) throw new Error(error.message);
    await this.load();
  }

  async accept(offerId: string): Promise<void> {
    const { error } = await this.supabase.rpc('accept_card_exchange_offer', {
      p_offer_id: offerId,
    });

    if (error) throw new Error(error.message);
    await this.load();
  }

  async cancel(offerId: string): Promise<void> {
    const { error } = await this.supabase.rpc('cancel_card_exchange_offer', {
      p_offer_id: offerId,
    });

    if (error) throw new Error(error.message);
    await this.load();
  }
}

function parseOffer(value: unknown): CardExchangeOffer {
  const offer = asRecord(value);
  const offerId = offer['id'];
  const creatorId = offer['creatorId'];
  const creatorName = offer['creatorName'];
  const offerQuantity = offer['offerQuantity'];
  const wantQuantity = offer['wantQuantity'];
  const createdAt = offer['createdAt'];

  if (
    typeof offerId !== 'string' ||
    typeof creatorId !== 'string' ||
    typeof creatorName !== 'string' ||
    !isPositiveInteger(offerQuantity) ||
    !isPositiveInteger(wantQuantity) ||
    typeof createdAt !== 'string'
  ) {
    throw new Error('Une offre d’échange retournée par le serveur est invalide.');
  }

  return {
    id: offerId,
    creatorId,
    creatorName,
    offerCard: normalizeCard(offer['offerCard']),
    offerQuantity,
    wantCard: normalizeCard(offer['wantCard']),
    wantQuantity,
    createdAt,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('La réponse des échanges est invalide.');
  }
  return value as Record<string, unknown>;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
