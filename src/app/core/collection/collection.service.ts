import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { SupabaseService } from '../supabase/supabase.service';
import { OwnedCard } from './owned-card.model';

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService).client;

  // Supabase renvoie au maximum 1000 lignes par requête par défaut
  private static readonly PAGE_SIZE = 1000;

  private readonly _items = signal<OwnedCard[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly distinctCount = computed(() => this._items().length);
  readonly totalCount = computed(() =>
    this._items().reduce((sum, item) => sum + item.quantity, 0),
  );

  // Ne change que si l'utilisateur change (pas au simple rafraîchissement du token)
  private readonly userId = computed(() => this.auth.user()?.id ?? null);
  private requestId = 0;

  constructor() {
    effect(() => {
      const userId = this.userId();
      untracked(() => void this.load(userId));
    });
  }

  /** À appeler après une ouverture de booster, un échange, etc. */
  reload(): Promise<void> {
    return this.load(this.userId());
  }

  private async load(userId: string | null): Promise<void> {
    const requestId = ++this.requestId;
    this._error.set(null);

    if (!userId) {
      this._items.set([]);
      this._loading.set(false);
      return;
    }

    this._loading.set(true);

    try {
      const items = await this.fetchAll(userId);
      if (requestId === this.requestId) this._items.set(items);
    } catch (error: unknown) {
      if (requestId === this.requestId) {
        this._items.set([]);
        this._error.set(
          error instanceof Error ? error.message : 'Impossible de charger la collection.',
        );
      }
    } finally {
      if (requestId === this.requestId) this._loading.set(false);
    }
  }

  private async fetchAll(userId: string): Promise<OwnedCard[]> {
    const all: OwnedCard[] = [];
    const size = CollectionService.PAGE_SIZE;

    for (let from = 0; ; from += size) {
      const { data, error } = await this.supabase
        .from('player_card')
        .select('quantity, acquired_at, card:card_id(*)')
        .eq('player_id', userId)
        .order('acquired_at', { ascending: false })
        .order('card_id', { ascending: true })
        .range(from, from + size - 1);

      if (error) throw new Error(error.message);

      const rows = (data ?? []) as unknown as OwnedCard[];
      all.push(...rows.filter((row) => row.card)); // ignore les cartes illisibles
      if (rows.length < size) break;
    }

    return all;
  }
}