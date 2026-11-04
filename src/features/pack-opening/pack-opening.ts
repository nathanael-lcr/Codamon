import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from '../../app/core/cards/card.model';
import { CardsService, PackEnergy } from '../../app/core/cards/cards.service';
import { PACK_SIZE } from '../../app/core/cards/pack-opening';
import { AuthService } from '../../app/core/auth/auth.service';
import { CollectionService } from '../../app/core/collection/collection.service';
import { PackOpeningNavigationService } from '../../app/core/cards/pack-opening-navigation.service';
import { CardDisplayComponent } from '../../shared/card-display/card-display';
import { LucideArrowUpRight } from '@lucide/angular';

type PackPhase = 'sealed' | 'revealing' | 'summary';
const CARD_EXIT_DURATION_MS = 420;

@Component({
  selector: 'app-pack-opening',
  standalone: true,
  imports: [CardDisplayComponent, LucideArrowUpRight, RouterLink],
  templateUrl: './pack-opening.html',
  styleUrls: ['./pack-opening.css', './pack-summary.css'],
})
export class PackOpeningComponent implements OnDestroy {
  private readonly cardsService = inject(CardsService);
  private readonly packOpeningNavigation = inject(PackOpeningNavigationService);
  protected readonly auth = inject(AuthService);
  protected readonly collection = inject(CollectionService);
  private advanceTimer?: ReturnType<typeof setTimeout>;
  private energyTimer?: ReturnType<typeof setInterval>;
  private energyRequestId = 0;

  protected readonly packSize = PACK_SIZE;
  protected readonly phase = signal<PackPhase | null>(null);
  protected readonly cards = signal<Card[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly revealedCount = signal(0);
  protected readonly currentCardRevealed = signal(false);
  protected readonly cardLeaving = signal(false);
  protected readonly catalogCount = signal<number | null>(null);
  protected readonly catalogError = signal<string | null>(null);
  protected readonly packEnergy = signal<PackEnergy | null>(null);
  protected readonly energyLoading = signal(false);
  protected readonly energyError = signal<string | null>(null);
  protected readonly currentTime = signal(Date.now());
  protected readonly refillCountdown = computed(() => {
    const nextRefillAt = this.packEnergy()?.nextRefillAt;
    if (!nextRefillAt) return null;

    const remainingSeconds = Math.max(
      0,
      Math.ceil((Date.parse(nextRefillAt) - this.currentTime()) / 1000),
    );
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
  });
  protected readonly collectionProgress = computed(() => {
    const count = this.catalogCount();
    return count ? Math.min((this.collection.distinctCount() / count) * 100, 100) : 0;
  });
  protected readonly collectionProgressLabel = computed(() =>
    Math.round(this.collectionProgress()),
  );
  protected readonly currentCard = computed(
    () => this.cards()[this.revealedCount()] ?? null,
  );
  protected readonly remainingCards = computed(
    () => Math.max(0, PACK_SIZE - this.revealedCount()),
  );

  constructor() {
    effect(() => {
      const request = this.packOpeningNavigation.homeRequest();
      untracked(() => {
        if (request > 0) this.resetToHome();
      });
    });

    effect(() => {
      if (!this.auth.initialized()) return;

      const user = this.auth.user();
      untracked(() => {
        if (user) {
          void this.refreshPackEnergy();
        } else {
          this.energyRequestId++;
          this.packEnergy.set(null);
          this.energyError.set(null);
          this.energyLoading.set(false);
        }
      });
    });

    this.energyTimer = setInterval(() => {
      const nextRefillAt = this.packEnergy()?.nextRefillAt;
      if (!nextRefillAt) return;

      this.currentTime.set(Date.now());
      if (
        Date.parse(nextRefillAt) <= this.currentTime() &&
        !this.energyLoading() &&
        !this.energyError()
      ) {
        void this.refreshPackEnergy();
      }
    }, 1000);

    void this.loadCatalogCount();
  }

  protected async getPack(): Promise<void> {
    if (this.loading() || this.energyLoading()) return;

    if (!this.auth.user()) {
      this.error.set('Connecte-toi pour ouvrir un paquet.');
      return;
    }

    const availablePacks = this.packEnergy()?.availablePacks;
    if (availablePacks === undefined || availablePacks === 0) return;

    this.clearAdvanceTimer();
    this.cardLeaving.set(false);
    this.loading.set(true);
    this.error.set(null);
    this.phase.set(null);
    this.cards.set([]);
    this.revealedCount.set(0);
    this.currentCardRevealed.set(false);

    try {
      const openedPack = await this.cardsService.openRandomPack();
      this.cards.set(openedPack.cards);
      this.packEnergy.set({
        availablePacks: openedPack.availablePacks,
        nextRefillAt: openedPack.nextRefillAt,
      });
      this.energyError.set(null);
      await this.collection.reload();
      this.phase.set('sealed');
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Impossible de préparer le pack.');
      void this.refreshPackEnergy();
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

  protected retryPackEnergy(): void {
    void this.refreshPackEnergy();
  }

  ngOnDestroy(): void {
    this.clearAdvanceTimer();
    if (this.energyTimer !== undefined) {
      clearInterval(this.energyTimer);
      this.energyTimer = undefined;
    }
  }

  private clearAdvanceTimer(): void {
    if (this.advanceTimer !== undefined) {
      clearTimeout(this.advanceTimer);
      this.advanceTimer = undefined;
    }
  }

  private resetToHome(): void {
    this.clearAdvanceTimer();
    this.cardLeaving.set(false);
    this.error.set(null);
    this.phase.set(null);
    this.cards.set([]);
    this.revealedCount.set(0);
    this.currentCardRevealed.set(false);
  }

  private async loadCatalogCount(): Promise<void> {
    this.catalogError.set(null);

    try {
      this.catalogCount.set(await this.cardsService.getActiveCardCount());
    } catch (error: unknown) {
      this.catalogError.set(
        error instanceof Error ? error.message : 'Impossible de charger le catalogue.',
      );
    }
  }

  private async refreshPackEnergy(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const requestId = ++this.energyRequestId;
    this.energyLoading.set(true);
    this.energyError.set(null);

    try {
      const energy = await this.cardsService.getPackEnergy();
      if (requestId === this.energyRequestId && this.auth.user()?.id === userId) {
        this.packEnergy.set(energy);
      }
    } catch (error: unknown) {
      if (requestId === this.energyRequestId && this.auth.user()?.id === userId) {
        this.energyError.set(
          error instanceof Error ? error.message : 'Impossible de charger les paquets disponibles.',
        );
      }
    } finally {
      if (requestId === this.energyRequestId) {
        this.energyLoading.set(false);
      }
    }
  }
}
