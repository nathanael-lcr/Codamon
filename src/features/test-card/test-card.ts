import { Component, inject, OnInit, signal } from '@angular/core';
import { Card } from '../../app/core/cards/card.model';
import { CardsService } from '../../app/core/cards/cards.service';
import { CardDisplayComponent } from '../../shared/card-display/card-display';

@Component({
  selector: 'app-test-card',
  standalone: true,
  imports: [CardDisplayComponent],
  templateUrl: './test-card.html',
})
export class TestCardComponent implements OnInit {
  private readonly cards = inject(CardsService);

  protected readonly card = signal<Card | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadFirstCard();
  }

  protected async loadFirstCard(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      this.card.set(await this.cards.getFirstActiveCard());
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Impossible de charger la carte.');
    } finally {
      this.loading.set(false);
    }
  }

}
