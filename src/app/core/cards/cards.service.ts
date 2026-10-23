import { Injectable, inject } from '@angular/core';
import { Card } from './card.model';
import { SupabaseService } from '../supabase/supabase.service';
import { createRandomPack } from './pack-opening';

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

  async openRandomPack(): Promise<Card[]> {
    const pageSize = 500;
    const cards: Card[] = [];

    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await this.supabase
        .from('cards')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (error) {
        throw error;
      }

      const page = (data ?? []) as Card[];
      cards.push(...page);
      if (page.length < pageSize) break;
    }

    return createRandomPack(cards);
  }
}
