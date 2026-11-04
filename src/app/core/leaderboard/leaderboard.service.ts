import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { PlayerService } from '../player/player.service';
import { Player } from '../player/player.model';

export type LeaderboardEntry = Pick<
  Player,
  'id' | 'username' | 'display_name' | 'avatar_url' | 'currency'
>;

export type LegendaryCardLeaderboardEntry = Pick<
  Player,
  'id' | 'username' | 'display_name' | 'avatar_url'
> & {
  legendaryCount: number;
};

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly playerService = inject(PlayerService);

  private readonly _entries = signal<LeaderboardEntry[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _outsideRank = signal<number | null>(null);
  private readonly _legendaryEntries = signal<LegendaryCardLeaderboardEntry[]>([]);
  private readonly _legendaryLoading = signal(false);
  private readonly _legendaryError = signal<string | null>(null);

  readonly entries = this._entries.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly legendaryEntries = this._legendaryEntries.asReadonly();
  readonly legendaryLoading = this._legendaryLoading.asReadonly();
  readonly legendaryError = this._legendaryError.asReadonly();

  readonly currentPlayerId = computed(() => this.playerService.player()?.id ?? null);

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
    void this.loadLegendaryCards(limit);
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
          error instanceof Error ? error.message : 'Impossible de charger le classement.',
        );
      }
    } finally {
      if (id === this.requestId) this._loading.set(false);
    }
  }

  private async loadLegendaryCards(limit: number): Promise<void> {
    this._legendaryLoading.set(true);
    this._legendaryError.set(null);

    try {
      const { data, error } = await this.supabase.rpc('list_legendary_card_leaderboard', {
        p_limit: limit,
      });
      if (error) throw new Error(error.message);

      const result = asRecord(data);
      if (!Array.isArray(result['players'])) {
        throw new Error('La réponse du classement des cartes rares est invalide.');
      }

      this._legendaryEntries.set(result['players'].map(parseLegendaryEntry));
    } catch (error: unknown) {
      this._legendaryError.set(
        error instanceof Error ? error.message : 'Impossible de charger ce classement.',
      );
    } finally {
      this._legendaryLoading.set(false);
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

function parseLegendaryEntry(value: unknown): LegendaryCardLeaderboardEntry {
  const entry = asRecord(value);
  const id = entry['id'];
  const username = entry['username'];
  const displayName = entry['display_name'];
  const avatarUrl = entry['avatar_url'];
  const legendaryCount = entry['legendaryCount'];

  if (
    typeof id !== 'string' ||
    (username !== null && typeof username !== 'string') ||
    (displayName !== null && typeof displayName !== 'string') ||
    (avatarUrl !== null && typeof avatarUrl !== 'string') ||
    typeof legendaryCount !== 'number' ||
    !Number.isSafeInteger(legendaryCount) ||
    legendaryCount < 1
  ) {
    throw new Error('Une entrée du classement des cartes rares est invalide.');
  }

  return {
    id,
    username,
    display_name: displayName,
    avatar_url: avatarUrl,
    legendaryCount,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('La réponse du classement des cartes rares est invalide.');
  }
  return value as Record<string, unknown>;
}
