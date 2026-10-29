import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { PlayerService } from '../player/player.service';
import { Player } from '../player/player.model';

export type LeaderboardEntry = Pick<
  Player,
  'id' | 'username' | 'display_name' | 'avatar_url' | 'currency'
>;

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly playerService = inject(PlayerService);

  private readonly _entries = signal<LeaderboardEntry[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _outsideRank = signal<number | null>(null);

  readonly entries = this._entries.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly currentPlayerId = computed(
    () => this.playerService.player()?.id ?? null
  );

  /** Rang du joueur connecté, qu'il soit dans le top ou non. */
  readonly myRank = computed(() => {
    const id = this.currentPlayerId();
    if (!id) return null;
    const index = this._entries().findIndex((e) => e.id === id);
    return index >= 0 ? index + 1 : this._outsideRank();
  });

  private requestId = 0;

  constructor() {
    // Si le joueur connecté n'est pas dans le top, on calcule son rang à part.
    effect((onCleanup) => {
      const me = this.playerService.player();
      const entries = this._entries();

      let active = true;
      onCleanup(() => (active = false));

      if (!me || entries.length === 0 || entries.some((e) => e.id === me.id)) {
        this._outsideRank.set(null);
        return;
      }

      void this.fetchRank(me.currency ?? 0)
        .then((rank) => active && this._outsideRank.set(rank))
        .catch(() => active && this._outsideRank.set(null));
    });
  }

  async load(limit = 100): Promise<void> {
    const id = ++this.requestId; // ignore les réponses obsolètes
    this._loading.set(true);
    this._error.set(null);

    try {
      const { data, error } = await this.supabase
        .from('player')
        .select('id, username, display_name, avatar_url, currency')
        .order('currency', { ascending: false, nullsFirst: false })
        .order('id', { ascending: true })
        .limit(limit);

      if (error) throw new Error(error.message);
      if (id === this.requestId) {
        this._entries.set((data ?? []) as LeaderboardEntry[]);
      }
    } catch (error: unknown) {
      if (id === this.requestId) {
        this._error.set(
          error instanceof Error ? error.message : 'Impossible de charger le classement.'
        );
      }
    } finally {
      if (id === this.requestId) this._loading.set(false);
    }
  }

  /** Rang = nombre de joueurs plus riches + 1 (sans télécharger les lignes). */
  private async fetchRank(currency: number): Promise<number> {
    const { count, error } = await this.supabase
      .from('player')
      .select('id', { count: 'exact', head: true })
      .gt('currency', currency);

    if (error) throw new Error(error.message);
    return (count ?? 0) + 1;
  }
}