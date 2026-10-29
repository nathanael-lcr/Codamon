import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { Card } from '../../app/core/cards/card.model';
import { CardsService } from '../../app/core/cards/cards.service';
import { PACK_SIZE } from '../../app/core/cards/pack-opening';
import { CardDisplayComponent } from '../../shared/card-display/card-display';
import { LucideArrowUpRight } from '@lucide/angular';

type PackPhase = 'sealed' | 'revealing' | 'summary';
const CARD_EXIT_DURATION_MS = 720;

@Component({
  selector: 'app-pack-opening',
  standalone: true,
  imports: [CardDisplayComponent, LucideArrowUpRight],
  templateUrl: './pack-opening.html',
  styleUrl: './pack-summary.css',
})
export class PackOpeningComponent implements OnDestroy {
  private readonly cardsService = inject(CardsService);
  private advanceTimer?: ReturnType<typeof setTimeout>;

  protected readonly phase = signal<PackPhase | null>(null);
  protected readonly cards = signal<Card[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly revealedCount = signal(0);
  protected readonly currentCardRevealed = signal(false);
  protected readonly cardLeaving = signal(false);
  protected readonly currentCard = computed(
    () => this.cards()[this.revealedCount()] ?? null,
  );
  protected readonly remainingCards = computed(
    () => Math.max(0, PACK_SIZE - this.revealedCount()),
  );

  protected async getPack(): Promise<void> {
    if (this.loading()) return;

    this.clearAdvanceTimer();
    this.cardLeaving.set(false);
    this.loading.set(true);
    this.error.set(null);
    this.phase.set(null);
    this.cards.set([]);
    this.revealedCount.set(0);
    this.currentCardRevealed.set(false);

    try {
      this.cards.set(await this.cardsService.openRandomPack());
      this.phase.set('sealed');
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Impossible de préparer le pack.');
    } finally {
      this.loading.set(false);
    }
  }

  protected openBooster(): void {
    if (this.phase() === 'sealed') {
      this.phase.set('revealing');
    }
  }

  protected revealOrContinue(): void {
    if (this.phase() !== 'revealing') return;

    if (this.cardLeaving()) return;

    if (!this.currentCardRevealed()) {
      this.currentCardRevealed.set(true);
      return;
    }

    if (this.revealedCount() === this.cards().length - 1) {
      this.phase.set('summary');
      return;
    }

    this.cardLeaving.set(true);
    this.advanceTimer = setTimeout(() => {
      this.advanceTimer = undefined;
      this.revealedCount.update((count) => count + 1);
      this.currentCardRevealed.set(false);
      this.cardLeaving.set(false);
    }, CARD_EXIT_DURATION_MS);
  }

  protected retry(): void {
    void this.getPack();
  }

  ngOnDestroy(): void {
    this.clearAdvanceTimer();
  }

  private clearAdvanceTimer(): void {
    if (this.advanceTimer !== undefined) {
      clearTimeout(this.advanceTimer);
      this.advanceTimer = undefined;
    }
  }
}
