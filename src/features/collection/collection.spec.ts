import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../app/core/auth/auth.service';
import { Card } from '../../app/core/cards/card.model';
import { CollectionService } from '../../app/core/collection/collection.service';
import { OwnedCard } from '../../app/core/collection/owned-card.model';
import { CollectionComponent } from './collection';

function createOwnedCard(
  id: string,
  name: string,
  rarity: string,
  cardNumber: number,
  serie: string | null,
  quantity: number,
): OwnedCard {
  const card: Card = {
    id,
    card_number: cardNumber,
    slug: id,
    name,
    subtitle: null,
    description: null,
    flavor_text: null,
    quote: null,
    rarity,
    serie,
    card_type: 'character',
    image_url: null,
    thumbnail_url: null,
    attack: null,
    defense: null,
    hp: null,
    speed: null,
    ability_name: null,
    ability_description: null,
    is_active: true,
    released_at: null,
    created_by: null,
    created_at: '2026-01-01T12:00:00.000Z',
    updated_at: '2026-01-01T12:00:00.000Z',
  };

  return {
    card,
    quantity,
    acquired_at: '2026-01-01T12:00:00.000Z',
  };
}

describe('CollectionComponent', () => {
  let fixture: ComponentFixture<CollectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user: signal({ id: 'player-id' }),
            initialized: signal(true),
          },
        },
        {
          provide: CollectionService,
          useValue: {
            items: signal([
              createOwnedCard('card-c', 'Zeta', 'common', 3, 'forest-spirit', 1),
              createOwnedCard('card-a', 'Alpha', 'epic', 1, 'academy', 2),
              createOwnedCard('card-b', 'Beta', 'rare', 2, 'forest-spirit', 5),
            ]),
            loading: signal(false),
            error: signal(null),
            distinctCount: signal(3),
            totalCount: signal(8),
            reload: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionComponent);
    fixture.detectChanges();
  });

  it('sorts cards by rarity by default', () => {
    const rarities = [...fixture.nativeElement.querySelectorAll('.trading-card')].map((card) =>
      card.getAttribute('data-rarity'),
    );

    expect(rarities).toEqual(['common', 'rare', 'epic']);
  });

  it('filters cards by name, rarity, series, and card number', () => {
    const search = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'forest-spirit';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const names = [...fixture.nativeElement.querySelectorAll('.trading-card h2')].map((heading) =>
      heading.textContent?.trim(),
    );

    expect(names).toEqual(['Zeta', 'Beta']);
  });

  it('allows sorting by name', () => {
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'name';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const names = [...fixture.nativeElement.querySelectorAll('.trading-card h2')].map((heading) =>
      heading.textContent?.trim(),
    );

    expect(names).toEqual(['Alpha', 'Beta', 'Zeta']);
  });

  it('shows an empty state when no card matches the search', () => {
    const search = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'missing-card';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aucune carte trouvée');
    expect(fixture.nativeElement.querySelectorAll('.trading-card')).toHaveLength(0);
  });
});
