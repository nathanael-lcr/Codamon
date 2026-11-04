import { Injectable, inject, signal } from '@angular/core';
import { Card } from '../cards/card.model';
import { normalizeCard } from '../cards/cards.service';
import { SupabaseService } from '../supabase/supabase.service';

export interface CardAuction {
  id: string;
  sellerId: string;
  sellerName: string;
  card: Card;
  startingPrice: number;
  highestBid: number | null;
  highestBidderId: string | null;
  endsAt: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuctionService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly _auctions = signal<CardAuction[]>([]);
  private readonly _loading = signal(false);

  readonly auctions = this._auctions.asReadonly();
  readonly loading = this._loading.asReadonly();

  async load(): Promise<void> {
    this._loading.set(true);
    try {
      const { data, error } = await this.supabase.rpc('list_card_auctions');
      if (error) throw new Error(error.message);

      const result = asRecord(data);
      if (!Array.isArray(result['auctions'])) {
        throw new Error('La réponse du marché est invalide.');
      }

      this._auctions.set(result['auctions'].map(parseAuction));
    } finally {
      this._loading.set(false);
    }
  }

  async create(cardId: string, startingPrice: number, durationHours: number): Promise<void> {
    const { error } = await this.supabase.rpc('create_card_auction', {
      p_card_id: cardId,
      p_starting_price: startingPrice,
      p_duration_hours: durationHours,
    });
    if (error) throw new Error(error.message);
  }

  async bid(auctionId: string, amount: number): Promise<void> {
    const { error } = await this.supabase.rpc('place_card_auction_bid', {
      p_auction_id: auctionId,
      p_bid_amount: amount,
    });
    if (error) throw new Error(error.message);
  }

  async cancel(auctionId: string): Promise<void> {
    const { error } = await this.supabase.rpc('cancel_card_auction', {
      p_auction_id: auctionId,
    });
    if (error) throw new Error(error.message);
  }
}

function parseAuction(value: unknown): CardAuction {
  const auction = asRecord(value);
  const id = auction['id'];
  const sellerId = auction['sellerId'];
  const sellerName = auction['sellerName'];
  const startingPrice = auction['startingPrice'];
  const highestBid = auction['highestBid'];
  const highestBidderId = auction['highestBidderId'];
  const endsAt = auction['endsAt'];
  const createdAt = auction['createdAt'];

  if (
    typeof id !== 'string' ||
    typeof sellerId !== 'string' ||
    typeof sellerName !== 'string' ||
    !isPositiveInteger(startingPrice) ||
    (highestBid !== null && !isPositiveInteger(highestBid)) ||
    (highestBidderId !== null && typeof highestBidderId !== 'string') ||
    !isValidDate(endsAt) ||
    !isValidDate(createdAt)
  ) {
    throw new Error('Une enchère retournée par le serveur est invalide.');
  }

  return {
    id,
    sellerId,
    sellerName,
    card: normalizeCard(auction['card']),
    startingPrice,
    highestBid,
    highestBidderId,
    endsAt,
    createdAt,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('La réponse du marché est invalide.');
  }
  return value as Record<string, unknown>;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}
