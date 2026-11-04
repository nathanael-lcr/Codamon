import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Card } from '../../app/core/cards/card.model';
import { CardsService } from '../../app/core/cards/cards.service';
import { CollectionService } from '../../app/core/collection/collection.service';
import { CardExchangeOffer, ExchangeService } from '../../app/core/collection/exchange.service';
import { AuthService } from '../../app/core/auth/auth.service';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-exchanges',
  templateUrl: './exchanges.html',
})
export class ExchangesComponent {
  private readonly auth = inject(AuthService);
  private readonly cardsService = inject(CardsService);
  private readonly collection = inject(CollectionService);
  private readonly exchangeService = inject(ExchangeService);

  readonly offers = this.exchangeService.offers;
  readonly inventory = this.collection.items;
  readonly loadingOffers = this.exchangeService.loading;
  readonly authUser = this.auth.user;
  readonly authInitialized = this.auth.initialized;
  readonly cards = signal<Card[]>([]);
  readonly loading = signal(true);
  readonly busyOfferId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  offerCardId = '';
  wantCardId = '';
  offerQuantity = 1;
  wantQuantity = 1;

  constructor() {
    effect(() => {
      if (!this.auth.initialized()) return;

      untracked(() => {
        if (this.auth.user()) {
          void this.load();
        } else {
          this.loading.set(false);
        }
      });
    });
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [, cards] = await Promise.all([
        this.exchangeService.load(),
        this.cardsService.getActiveCards(),
      ]);
      this.cards.set(cards);
    } catch (error: unknown) {
      this.error.set(
        error instanceof Error ? error.message : 'Impossible de charger les échanges.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  ownedQuantity(cardId: string): number {
    return this.inventory().find((item) => item.card.id === cardId)?.quantity ?? 0;
  }

  canCreateOffer(): boolean {
    return (
      Boolean(this.offerCardId) &&
      Boolean(this.wantCardId) &&
      this.offerCardId !== this.wantCardId &&
      Number.isInteger(this.offerQuantity) &&
      this.offerQuantity > 0 &&
      this.offerQuantity <= this.ownedQuantity(this.offerCardId) &&
      Number.isInteger(this.wantQuantity) &&
      this.wantQuantity > 0
    );
  }

  async createOffer(): Promise<void> {
    if (!this.canCreateOffer()) return;

    this.busyOfferId.set('create');
    this.error.set(null);
    this.notice.set(null);
    try {
      await this.exchangeService.create(
        this.offerCardId,
        this.offerQuantity,
        this.wantCardId,
        this.wantQuantity,
      );
      this.notice.set('Ton offre est maintenant visible par les autres joueurs.');
      this.offerCardId = '';
      this.wantCardId = '';
      this.offerQuantity = 1;
      this.wantQuantity = 1;
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Impossible de créer cette offre.');
    } finally {
      this.busyOfferId.set(null);
    }
  }

  async accept(offer: CardExchangeOffer): Promise<void> {
    this.busyOfferId.set(offer.id);
    this.error.set(null);
    this.notice.set(null);
    try {
      await this.exchangeService.accept(offer.id);
      await this.collection.reload();
      this.notice.set('Échange effectué avec succès.');
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Impossible d’accepter cette offre.');
    } finally {
      this.busyOfferId.set(null);
    }
  }

  async cancel(offer: CardExchangeOffer): Promise<void> {
    this.busyOfferId.set(offer.id);
    this.error.set(null);
    this.notice.set(null);
    try {
      await this.exchangeService.cancel(offer.id);
      this.notice.set('Ton offre a été annulée.');
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Impossible d’annuler cette offre.');
    } finally {
      this.busyOfferId.set(null);
    }
  }

  cardImage(card: Card): string {
    return card.thumbnail_url || card.image_url || '';
  }
}
