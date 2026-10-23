import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Card } from '../../app/core/cards/card.model';
import { CardDisplayComponent } from './card-display';

const card: Card = {
  id: 'card-id',
  card_number: 7,
  slug: 'fire-fox',
  name: 'Fire Fox',
  subtitle: 'Guardian of the ember',
  description: 'A quick and clever guardian.',
  flavor_text: 'It watches over the old forest.',
  quote: 'The flame remembers.',
  rarity: 'legendary',
  category: 'forest spirit',
  card_type: 'character',
  image_url: 'https://example.com/fire-fox.png',
  thumbnail_url: null,
  attack: 8,
  defense: 5,
  hp: 20,
  speed: 9,
  ability_name: 'Kindle',
  ability_description: 'Restores a spark to its allies.',
  is_active: true,
  released_at: '2026-01-10T12:00:00.000Z',
  metadata: { element: 'fire', foil: true },
  created_by: 'creator-id',
  created_at: '2026-01-01T12:00:00.000Z',
  updated_at: '2026-01-02T12:00:00.000Z',
};

const matchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia');

describe('CardDisplayComponent', () => {
  let fixture: ComponentFixture<CardDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardDisplayComponent);
    fixture.componentRef.setInput('card', card);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (matchMediaDescriptor) {
      Object.defineProperty(window, 'matchMedia', matchMediaDescriptor);
    } else {
      Reflect.deleteProperty(window, 'matchMedia');
    }
  });

  it('renders the card illustration and its game information', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('img')?.getAttribute('src')).toBe(card.image_url);
    expect(element.textContent).toContain('Fire Fox');
    expect(element.textContent).toContain('Attaque');
    expect(element.textContent).toContain('Kindle');
    expect(element.textContent).toContain('The flame remembers.');
    expect(element.textContent).toContain('fire');
    expect(element.querySelector('.card-debug')).toBeNull();
    expect(element.textContent).not.toContain('creator-id');
  });

  it('shows a visual fallback when the illustration cannot load', () => {
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Illustration indisponible');
  });

  it('tilts toward the pointer and returns to neutral when the pointer leaves', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 200, 300),
    );

    const cardElement = fixture.nativeElement.querySelector('.trading-card') as HTMLElement;
    const pointerMove = new Event('pointermove', { bubbles: true });
    Object.defineProperties(pointerMove, {
      pointerType: { value: 'mouse' },
      clientX: { value: 200 },
      clientY: { value: 0 },
    });
    cardElement.dispatchEvent(pointerMove);
    fixture.detectChanges();

    expect(cardElement.style.getPropertyValue('--tilt-x')).toBe('7deg');
    expect(cardElement.style.getPropertyValue('--tilt-y')).toBe('7deg');

    cardElement.dispatchEvent(new Event('pointerleave'));
    fixture.detectChanges();

    expect(cardElement.style.getPropertyValue('--tilt-x')).toBe('0deg');
    expect(cardElement.style.getPropertyValue('--tilt-y')).toBe('0deg');
  });
});
