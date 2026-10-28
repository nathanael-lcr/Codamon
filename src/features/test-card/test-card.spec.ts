import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Card } from '../../app/core/cards/card.model';
import { CardsService } from '../../app/core/cards/cards.service';
import { TestCardComponent } from './test-card';

const card: Card = {
  id: 'card-id',
  card_number: 1,
  slug: 'first-card',
  name: 'First Card',
  subtitle: null,
  description: null,
  flavor_text: null,
  quote: null,
  rarity: 'common',
  serie: null,
  card_type: 'item',
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

describe('TestCardComponent', () => {
  let fixture: ComponentFixture<TestCardComponent>;
  let getFirstActiveCard: ReturnType<typeof vi.fn>;

  async function createComponent(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TestCardComponent],
      providers: [
        {
          provide: CardsService,
          useValue: { getFirstActiveCard },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestCardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    getFirstActiveCard = vi.fn().mockResolvedValue(card);
  });

  it('renders the first card returned by the catalog service', async () => {
    getFirstActiveCard.mockResolvedValue(card);
    await createComponent();

    expect(fixture.nativeElement.textContent).toContain('First Card');
    expect(getFirstActiveCard).toHaveBeenCalledOnce();
  });

  it('shows an explicit error and retry action when the query fails', async () => {
    getFirstActiveCard.mockRejectedValue(new Error('Accès refusé'));
    await createComponent();

    expect(fixture.nativeElement.textContent).toContain('Accès refusé');
    const retryButton = [...fixture.nativeElement.querySelectorAll('button')].find((button) =>
      button.textContent.includes('Réessayer'),
    );
    expect(retryButton).toBeDefined();
  });

  it('shows an empty state when no active card is available', async () => {
    getFirstActiveCard.mockResolvedValue(null);
    await createComponent();

    expect(fixture.nativeElement.textContent).toContain('Aucune carte publiée');
  });

  it('keeps the catalog test page focused on rendering a single card', async () => {
    await createComponent();

    expect(fixture.nativeElement.querySelector('app-card-display')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Ouverture de pack');
  });
});
