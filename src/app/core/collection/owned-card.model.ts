import { Card } from '../cards/card.model';

export interface OwnedCard {
  card: Card;
  quantity: number;
  acquired_at: string;
}