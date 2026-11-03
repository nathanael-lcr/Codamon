import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from '../../app/core/auth/auth.service';
import { Card } from '../../app/core/cards/card.model';
import { CardsService } from '../../app/core/cards/cards.service';
import { PackOpeningNavigationService } from '../../app/core/cards/pack-opening-navigation.service';
import { CollectionService } from '../../app/core/collection/collection.service';
import { PackOpeningComponent } from './pack-opening';

const pack: Card[] = Array.from({ length: 5 }, (_, index) => ({
  id: `card-${index + 1}`,
  card_number: index + 1,
  slug: `card-${index + 1}`,
  name: `Pack Card ${index + 1}`,
  subtitle: null,
  description: null,
  flavor_text: null,
  quote: null,
  rarity: ['common', 'common', 'rare', 'epic', 'mythic'][index],
  serie: null,
  card_type: 'character',
  image_url: null,
  thumbnail_url: null,
  attack: index + 1,
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
}));

describe('PackOpeningComponent', () => {
  let fixture: ComponentFixture<PackOpeningComponent>;
  let openRandomPack: ReturnType<typeof vi.fn>;
  let getPackEnergy: ReturnType<typeof vi.fn>;
  let getActiveCardCount: ReturnType<typeof vi.fn>;
  let collectionReload: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    openRandomPack = vi.fn().mockResolvedValue({
      cards: pack,
      availablePacks: 4,
      nextRefillAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    });
    getPackEnergy = vi.fn().mockResolvedValue({
      availablePacks: 5,
      nextRefillAt: null,
    });
    getActiveCardCount = vi.fn().mockResolvedValue(110);
    collectionReload = vi.fn().mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [PackOpeningComponent],
      providers: [
        {
          provide: CardsService,
          useValue: { openRandomPack, getPackEnergy, getActiveCardCount },
        },
        {
          provide: CollectionService,
          useValue: {
            distinctCount: signal(47),
            totalCount: signal(52),
            loading: signal(false),
            error: signal(null),
            reload: collectionReload,
          },
        },
        {
          provide: AuthService,
          useValue: {
            user: signal({ id: 'player-id' }),
            initialized: signal(true),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PackOpeningComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function clickButton(label: string): void {
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((candidate) =>
      candidate.textContent.includes(label),
    ) as HTMLButtonElement | undefined;
    expect(button).toBeDefined();
    button?.click();
    fixture.detectChanges();
  }

  it('shows the collection overview with live catalogue and collection counts', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('110 cartes à collectionner');
    expect(fixture.nativeElement.textContent).toContain('47');
    expect(fixture.nativeElement.textContent).toContain('Ouvrir le paquet');
    expect(fixture.nativeElement.textContent).not.toContain('4 / 10 paquets disponibles');
    expect(fixture.nativeElement.textContent).toContain('5 / 5 paquets disponibles');
  });

  it('reveals cards one at a time and ends with a five-card recap', async () => {
    clickButton('Ouvrir le paquet');
    await fixture.whenStable();
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.sealed-pack')).not.toBeNull();
    });
    expect(openRandomPack).toHaveBeenCalledOnce();
    expect(collectionReload).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('4 / 5 paquets disponibles');

    clickButton('Ouvrir le booster');
    expect(fixture.nativeElement.textContent).toContain('Carte 1 sur 5');
    expect(fixture.nativeElement.querySelectorAll('.trading-card')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.card-flip-inner-revealed')).toBeNull();

    clickButton('Révéler la carte');
    expect(fixture.nativeElement.textContent).toContain('Pack Card 1');
    expect(fixture.nativeElement.querySelector('.card-flip-inner-revealed')).not.toBeNull();

    vi.useFakeTimers();
    for (let index = 2; index <= pack.length; index++) {
      clickButton('Carte suivante');
      expect(fixture.nativeElement.querySelector('.pull-card-leaving')).not.toBeNull();
      await vi.advanceTimersByTimeAsync(420);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain(`Carte ${index} sur 5`);
      expect(fixture.nativeElement.querySelector('.card-flip-inner-revealed')).toBeNull();
      clickButton('Révéler la carte');
      expect(fixture.nativeElement.textContent).toContain(`Pack Card ${index}`);
    }

    clickButton('Voir le récapitulatif');
    expect(fixture.nativeElement.querySelectorAll('.summary-card')).toHaveLength(5);
    expect(fixture.nativeElement.querySelectorAll('.summary-card .trading-card')).toHaveLength(5);
    expect(fixture.nativeElement.textContent).toContain('Voici ton tirage');
    expect(fixture.nativeElement.textContent).toContain('Pack Card 5');

    TestBed.inject(PackOpeningNavigationService).returnHome();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.summary-grid')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Aperçu de la collection et ouverture"]'))
      .not.toBeNull();
  });

  it('shows the first card without waiting for an animation event', async () => {
    clickButton('Ouvrir le paquet');
    await fixture.whenStable();
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.sealed-pack')).not.toBeNull();
    });
    clickButton('Ouvrir le booster');

    expect(fixture.nativeElement.textContent).toContain('Carte 1 sur 5');
    expect(fixture.nativeElement.querySelector('.card-back-face')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Révéler la carte');
  });

  it('displays a retry action when pack creation fails', async () => {
    openRandomPack.mockRejectedValueOnce(new Error('Catalogue indisponible'));

    clickButton('Ouvrir le paquet');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Catalogue indisponible');
    expect(fixture.nativeElement.textContent).toContain('Réessayer');
  });

  it('disables pack opening when the player has no packs left', async () => {
    getPackEnergy.mockResolvedValueOnce({
      availablePacks: 0,
      nextRefillAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
    fixture.destroy();
    fixture = TestBed.createComponent(PackOpeningComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const button = [...fixture.nativeElement.querySelectorAll('button')].find((candidate) =>
      candidate.textContent.includes('Aucun paquet disponible'),
    ) as HTMLButtonElement | undefined;

    expect(button?.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Prochain paquet dans');
  });
});
