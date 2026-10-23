import { Card, CardRarity } from './card.model';

export const PACK_SIZE = 5;

export const RARITY_WEIGHTS: Record<CardRarity, number> = {
  common: 60,
  rare: 25,
  epic: 10,
  legendary: 4,
  mythic: 1,
};

const RARITY_ORDER = Object.keys(RARITY_WEIGHTS) as CardRarity[];

export function createRandomPack(cards: readonly Card[], random = Math.random): Card[] {
  if (cards.length < PACK_SIZE) {
    throw new Error(`Il faut au moins ${PACK_SIZE} cartes publiées pour ouvrir un pack.`);
  }

  const availableByRarity = new Map<CardRarity, Card[]>(RARITY_ORDER.map((rarity) => [rarity, []]));

  for (const card of cards) {
    const rarity = isCardRarity(card.rarity) ? card.rarity : 'common';
    availableByRarity.get(rarity)?.push(card);
  }

  const selected: Card[] = [];

  while (selected.length < PACK_SIZE) {
    const availableRarities = RARITY_ORDER.filter(
      (rarity) => (availableByRarity.get(rarity)?.length ?? 0) > 0,
    );
    const totalWeight = availableRarities.reduce(
      (total, rarity) => total + RARITY_WEIGHTS[rarity],
      0,
    );
    let choice = random() * totalWeight;
    let selectedRarity = availableRarities[availableRarities.length - 1];

    for (const rarity of availableRarities) {
      choice -= RARITY_WEIGHTS[rarity];
      if (choice < 0) {
        selectedRarity = rarity;
        break;
      }
    }

    const pool = availableByRarity.get(selectedRarity);
    if (!pool?.length) {
      throw new Error('Impossible de sélectionner une carte pour le pack.');
    }

    const cardIndex = Math.min(pool.length - 1, Math.floor(random() * pool.length));
    selected.push(pool.splice(cardIndex, 1)[0]);
  }

  return selected.sort(
    (first, second) => getRarityRank(first.rarity) - getRarityRank(second.rarity),
  );
}

function isCardRarity(value: string): value is CardRarity {
  return RARITY_ORDER.includes(value as CardRarity);
}

function getRarityRank(value: string): number {
  const rank = RARITY_ORDER.indexOf(value as CardRarity);
  return rank === -1 ? 0 : rank;
}
