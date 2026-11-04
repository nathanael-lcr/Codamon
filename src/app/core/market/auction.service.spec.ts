import { TestBed } from '@angular/core/testing';
import { AuctionService } from './auction.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('AuctionService', () => {
  it('loads and normalizes active auctions', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        auctions: [
          {
            id: 'auction-id',
            sellerId: 'seller-id',
            sellerName: 'Joueur',
            card: { id: 'card-id', name: 'Carte', rarity: 'legendary' },
            startingPrice: 10,
            highestBid: null,
            highestBidderId: null,
            endsAt: '2026-11-05T12:00:00.000Z',
            createdAt: '2026-11-04T12:00:00.000Z',
          },
        ],
      },
      error: null,
    });

    await TestBed.configureTestingModule({
      providers: [AuctionService, { provide: SupabaseService, useValue: { client: { rpc } } }],
    }).compileComponents();

    const service = TestBed.inject(AuctionService);
    await service.load();

    expect(rpc).toHaveBeenCalledWith('list_card_auctions');
    expect(service.auctions()).toMatchObject([
      {
        id: 'auction-id',
        sellerId: 'seller-id',
        startingPrice: 10,
        card: { id: 'card-id', name: 'Carte', rarity: 'legendary' },
      },
    ]);
    expect(service.loading()).toBe(false);
  });

  it('rejects malformed auction responses', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { auctions: [{ id: 'incomplete' }] },
      error: null,
    });

    await TestBed.configureTestingModule({
      providers: [AuctionService, { provide: SupabaseService, useValue: { client: { rpc } } }],
    }).compileComponents();

    const service = TestBed.inject(AuctionService);
    await expect(service.load()).rejects.toThrow(
      'Une enchère retournée par le serveur est invalide.',
    );
    expect(service.loading()).toBe(false);
  });
});
