import { TestBed } from '@angular/core/testing';
import { SupabaseService } from '../supabase/supabase.service';
import { ExchangeService } from './exchange.service';

describe('ExchangeService', () => {
  let service: ExchangeService;
  let rpc: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    rpc = vi.fn();
    TestBed.configureTestingModule({
      providers: [ExchangeService, { provide: SupabaseService, useValue: { client: { rpc } } }],
    });
    service = TestBed.inject(ExchangeService);
  });

  it('loads and normalizes public pending offers', async () => {
    rpc.mockResolvedValue({
      data: {
        offers: [
          {
            id: 'offer-id',
            creatorId: 'player-id',
            creatorName: 'Player',
            offerCard: { id: 'card-a', name: 'Card A', rarity: 'rare' },
            offerQuantity: 2,
            wantCard: { id: 'card-b', name: 'Card B', rarity: 'epic' },
            wantQuantity: 1,
            createdAt: '2026-11-04T10:00:00.000Z',
          },
        ],
      },
      error: null,
    });

    await service.load();

    expect(rpc).toHaveBeenCalledWith('list_card_exchange_offers');
    expect(service.offers()).toHaveLength(1);
    expect(service.offers()[0]).toMatchObject({
      id: 'offer-id',
      offerCard: { id: 'card-a', name: 'Card A' },
      offerQuantity: 2,
      wantCard: { id: 'card-b', name: 'Card B' },
      wantQuantity: 1,
    });
  });

  it('publishes the offer and refreshes the offer list', async () => {
    rpc.mockImplementation(async (name: string) => ({
      data: name === 'list_card_exchange_offers' ? { offers: [] } : {},
      error: null,
    }));

    await service.create('card-a', 2, 'card-b', 1);

    expect(rpc).toHaveBeenNthCalledWith(1, 'create_card_exchange_offer', {
      p_offer_card_id: 'card-a',
      p_offer_quantity: 2,
      p_want_card_id: 'card-b',
      p_want_quantity: 1,
    });
    expect(rpc).toHaveBeenNthCalledWith(2, 'list_card_exchange_offers');
    expect(service.offers()).toEqual([]);
  });
});
