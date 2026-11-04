import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../app/core/auth/auth.service';
import { AuctionService, CardAuction } from '../../app/core/market/auction.service';
import { CollectionService } from '../../app/core/collection/collection.service';
import { PlayerService } from '../../app/core/player/player.service';

@Component({
  imports: [DatePipe, DecimalPipe, FormsModule],
  selector: 'app-market',
  templateUrl: './market.html',
})
export class MarketComponent {
  private readonly auth = inject(AuthService);
  private readonly collection = inject(CollectionService);
  private readonly auctionService = inject(AuctionService);
  private readonly playerService = inject(PlayerService);

  protected readonly user = this.auth.user;
  protected readonly initialized = this.auth.initialized;
  protected readonly inventory = this.collection.items;
  protected readonly auctions = this.auctionService.auctions;
  protected readonly loading = this.auctionService.loading;
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly busyAuctionId = signal<string | null>(null);
  protected cardId = '';
  protected startingPrice = 1;
  protected durationHours = 24;
  protected bidAmounts: Record<string, number> = {};

  constructor() {
    effect(() => {
      const initialized = this.auth.initialized();
      const user = this.auth.user();
      if (!initialized || !user) return;

      untracked(() => {
        void this.load();
      });
    });
  }

  protected async load(): Promise<void> {
    this.error.set(null);
    try {
      await this.auctionService.load();
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Impossible de charger le marché.');
      return;
    }

    await this.collection.reload();
    if (this.collection.error()) {
      this.error.set(
        `Le marché a été chargé, mais ta collection n’a pas pu être actualisée : ${this.collection.error()}`,
      );
    }

    try {
      await this.playerService.refresh();
    } catch (error: unknown) {
      this.error.set(
        error instanceof Error
          ? `Le marché a été chargé, mais ton profil n’a pas pu être actualisé : ${error.message}`
          : 'Le marché a été chargé, mais ton profil n’a pas pu être actualisé.',
      );
    }
  }

  protected ownedQuantity(cardId: string): number {
    return this.inventory().find((item) => item.card.id === cardId)?.quantity ?? 0;
  }

  protected canCreateAuction(): boolean {
    return (
      Boolean(this.cardId) &&
      this.ownedQuantity(this.cardId) > 0 &&
      Number.isInteger(this.startingPrice) &&
      this.startingPrice > 0 &&
      [6, 12, 24, 48].includes(this.durationHours)
    );
  }

  protected minimumBid(auction: CardAuction): number {
    return auction.highestBid === null ? auction.startingPrice : auction.highestBid + 1;
  }

  protected canBid(auction: CardAuction): boolean {
    const amount = this.bidAmounts[auction.id] ?? this.minimumBid(auction);
    return (
      auction.sellerId !== this.user()?.id &&
      Number.isInteger(amount) &&
      amount >= this.minimumBid(auction)
    );
  }

  protected async createAuction(): Promise<void> {
    if (!this.canCreateAuction()) return;
    this.busyAuctionId.set('create');
    this.error.set(null);
    this.notice.set(null);
    try {
      await this.auctionService.create(this.cardId, this.startingPrice, this.durationHours);
      await this.collection.reload();
      this.cardId = '';
      this.startingPrice = 1;
      this.durationHours = 24;
      this.notice.set('Ton enchère est publiée.');
      await this.load();
    } catch (error: unknown) {
      this.error.set(
        error instanceof Error ? error.message : 'Impossible de publier cette enchère.',
      );
    } finally {
      this.busyAuctionId.set(null);
    }
  }

  protected async bid(auction: CardAuction): Promise<void> {
    if (!this.canBid(auction)) return;
    this.busyAuctionId.set(auction.id);
    this.error.set(null);
    this.notice.set(null);
    try {
      await this.auctionService.bid(
        auction.id,
        this.bidAmounts[auction.id] ?? this.minimumBid(auction),
      );
      this.notice.set('Ton enchère a été prise en compte.');
      await this.load();
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Impossible de placer ton enchère.');
    } finally {
      this.busyAuctionId.set(null);
    }
  }

  protected async cancel(auction: CardAuction): Promise<void> {
    this.busyAuctionId.set(auction.id);
    this.error.set(null);
    this.notice.set(null);
    try {
      await this.auctionService.cancel(auction.id);
      this.notice.set('Ton enchère a été annulée et la carte rendue à ta collection.');
      await this.load();
    } catch (error: unknown) {
      this.error.set(
        error instanceof Error ? error.message : 'Impossible d’annuler cette enchère.',
      );
    } finally {
      this.busyAuctionId.set(null);
    }
  }
}
