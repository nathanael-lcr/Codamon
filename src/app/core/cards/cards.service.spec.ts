import { TestBed } from '@angular/core/testing';
import { CardsService } from './cards.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('CardsService', () => {
  it('accepts card rows with fields absent from the local Card model', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        availablePacks: 4,
        nextRefillAt: '2026-11-03T19:00:00.000Z',
        cards: Array.from({ length: 5 }, (_, index) => ({
          id: `card-${index + 1}`,
          name: `Card ${index + 1}`,
          rarity: 'common',
        })),
      },
      error: null,
    });

    await TestBed.configureTestingModule({
      providers: [
        CardsService,
        {
          provide: SupabaseService,
          useValue: { client: { rpc } },
        },
      ],
    }).compileComponents();

    const service = TestBed.inject(CardsService);
    const pack = await service.openRandomPack();

    expect(rpc).toHaveBeenCalledWith('pack_energy', { p_consume: true });
    expect(pack.availablePacks).toBe(4);
    expect(pack.cards).toHaveLength(5);
    expect(pack.cards[0]).toMatchObject({
      id: 'card-1',
      name: 'Card 1',
      rarity: 'common',
      subtitle: null,
      speed: null,
    });
  });
});
