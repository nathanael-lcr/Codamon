import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Card } from '../../app/core/cards/card.model';
import { CardsService } from '../../app/core/cards/cards.service';
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

  beforeEach(async () => {
    openRandomPack = vi.fn().mockResolvedValue(pack);

    await TestBed.configureTestingModule({
      imports: [PackOpeningComponent],
      providers: [
        {
          provide: CardsService,
          useValue: { openRandomPack },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PackOpeningComponent);
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

  it('shows a simple booster prompt before opening', () => {
    expect(fixture.nativeElement.querySelector('.sealed-pack')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Découvrir mon pack');
  });

  it('reveals cards one at a time and ends with a five-card recap', async () => {
    clickButton('Découvrir mon pack');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(openRandomPack).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('.sealed-pack-button')).not.toBeNull();

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
    expect(fixture.nativeElement.textContent).toContain('Voici ton tirage');
    expect(fixture.nativeElement.textContent).toContain('Pack Card 5');
  });

  it('shows the first card without waiting for an animation event', async () => {
    clickButton('Découvrir mon pack');
    await fixture.whenStable();
    fixture.detectChanges();
    clickButton('Ouvrir le booster');

    expect(fixture.nativeElement.textContent).toContain('Carte 1 sur 5');
    expect(fixture.nativeElement.querySelector('.card-back-face')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Révéler la carte');
  });

  it('displays a retry action when pack creation fails', async () => {
    openRandomPack.mockRejectedValueOnce(new Error('Catalogue indisponible'));

    clickButton('Découvrir mon pack');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Catalogue indisponible');
    expect(fixture.nativeElement.textContent).toContain('Réessayer');
  });
});
