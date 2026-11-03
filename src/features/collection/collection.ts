import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../app/core/auth/auth.service';
import { CollectionService } from '../../app/core/collection/collection.service';
import { OwnedCard } from '../../app/core/collection/owned-card.model';
import { CardDisplayComponent } from '../../shared/card-display/card-display';

type CollectionSort = 'rarity' | 'name' | 'number' | 'quantity' | 'acquired';

const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary', 'slegendary'];

@Component({
  selector: 'app-collection',
  standalone: true,
  imports: [RouterLink, CardDisplayComponent],
  templateUrl: './collection.html',
})
export class CollectionComponent {
  protected readonly auth = inject(AuthService);
  protected readonly collection = inject(CollectionService);
  protected readonly searchTerm = signal('');
  protected readonly sortBy = signal<CollectionSort>('rarity');
  protected readonly filteredItems = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const items = this.collection.items().filter((item) => {
      if (!query) return true;

      const card = item.card;
      return [
        card.name,
        card.subtitle,
        card.description,
        card.rarity,
        card.serie,
        String(card.card_number),
      ].some((value) => value?.toLocaleLowerCase().includes(query));
    });

    return [...items].sort((first, second) => this.compareItems(first, second));
  });

  protected onSearchInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.searchTerm.set(event.target.value);
    }
  }

  protected onSortChange(event: Event): void {
    if (event.target instanceof HTMLSelectElement && isCollectionSort(event.target.value)) {
      this.sortBy.set(event.target.value);
    }
  }

  private compareItems(first: OwnedCard, second: OwnedCard): number {
    switch (this.sortBy()) {
      case 'name':
        return first.card.name.localeCompare(second.card.name, 'fr', { sensitivity: 'base' });
      case 'number':
        return first.card.card_number - second.card.card_number;
      case 'quantity':
        return second.quantity - first.quantity;
      case 'acquired':
        return Date.parse(second.acquired_at) - Date.parse(first.acquired_at);
      case 'rarity':
        return rarityRank(second.card.rarity) - rarityRank(first.card.rarity);
    }
  }
}

function isCollectionSort(value: string): value is CollectionSort {
  return ['rarity', 'name', 'number', 'quantity', 'acquired'].includes(value);
}

function rarityRank(rarity: string): number {
  const index = RARITY_ORDER.indexOf(rarity.toLowerCase());
  return index === -1 ? RARITY_ORDER.length : index;
}