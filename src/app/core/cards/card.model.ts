export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'slegendary';
export type CardType = 'character' | 'event' | 'item' | 'special';

export interface Card {
  id: string;
  card_number: number;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  flavor_text: string | null;
  quote: string | null;
  rarity: CardRarity | string;
  serie: string | null;
  card_type: CardType | string;
  image_url: string | null;
  thumbnail_url: string | null;
  attack: number | null;
  defense: number | null;
  hp: number | null;
  speed: number | null;
  ability_name: string | null;
  ability_description: string | null;
  is_active: boolean;
  released_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
