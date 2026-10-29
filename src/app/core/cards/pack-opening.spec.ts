import { Card, CardRarity } from './card.model';
import { createRandomPack, PACK_SIZE, RARITY_WEIGHTS } from './pack-opening';

const rarities: CardRarity[] = ['common', 'rare', 'epic', 'legendary', 'slegendary'];

function createCards(cardsPerRarity: number): Card[] {
  return rarities.flatMap((rarity) =>
    Array.from({ length: cardsPerRarity }, (_, index) => ({
      id: `${rarity}-${index}`,
      card_number: index,
      slug: `${rarity}-${index}`,
      name: `${rarity} ${index}`,
      subtitle: null,
      description: null,
      flavor_text: null,
      quote: null,
      rarity,
      serie: null,
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
    })),
  );
}

describe('createRandomPack', () => {
  it('returns five unique cards in nondecreasing rarity order', () => {
    const cards = createCards(5).filter((card) =>
      (card.rarity === 'legendary' && Number(card.id.split('-')[1]) < 3) ||
      (card.rarity === 'mythic' && Number(card.id.split('-')[1]) < 2),
    );
    const pack = createRandomPack(cards, () => 0.999);

    expect(pack).toHaveLength(PACK_SIZE);
    expect(new Set(pack.map((card) => card.id)).size).toBe(PACK_SIZE);
    expect(pack.map((card) => card.rarity)).toEqual([
      'legendary',
      'legendary',
      'legendary',
      'mythic',
      'mythic',
    ]);
  });

  it('selects common cards first when the weighted roll falls in the common range', () => {
    const pack = createRandomPack(createCards(5), () => 0);

    expect(pack.map((card) => card.rarity)).toEqual(Array(PACK_SIZE).fill('common'));
  });

  it('uses progressively lower weights for rarer cards', () => {
    expect(RARITY_WEIGHTS.common).toBeGreaterThan(RARITY_WEIGHTS.rare);
    expect(RARITY_WEIGHTS.rare).toBeGreaterThan(RARITY_WEIGHTS.epic);
    expect(RARITY_WEIGHTS.epic).toBeGreaterThan(RARITY_WEIGHTS.legendary);
    expect(RARITY_WEIGHTS.legendary).toBeGreaterThan(RARITY_WEIGHTS.slegendary);
  });

  it('does not create a partial pack if fewer than five cards are available', () => {
    expect(() => createRandomPack(createCards(0))).toThrow(
      'Il faut au moins 5 cartes publiées pour ouvrir un pack.',
    );
  });
});
