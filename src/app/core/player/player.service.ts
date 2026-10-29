import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { SupabaseService } from '../supabase/supabase.service';
import { Player } from './player.model';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService).client;

  private readonly _player = signal<Player | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly player = this._player.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly balance = computed(() => this.player()?.balance ?? 0);

  constructor() {
    effect((onCleanup) => {
      const user = this.auth.user();

      // Ignore le résultat d'une ancienne requête si le compte change
      // ou si l'utilisateur se déconnecte entre-temps.
      let active = true;
      onCleanup(() => {
        active = false;
      });

      this._player.set(null);
      this._error.set(null);
      this._loading.set(false);

      if (!user) return;

      this._loading.set(true);

      void this.fetchPlayer(user.id)
        .then((player) => {
          if (active) {
            this._player.set(player);
          }
        })
        .catch((error: unknown) => {
          if (active) {
            this._error.set(
              error instanceof Error
                ? error.message
                : 'Impossible de charger le profil.'
            );
          }
        })
        .finally(() => {
          if (active) {
            this._loading.set(false);
          }
        });
    });
  }

  private async fetchPlayer(userId: string): Promise<Player> {
    const { data, error } = await this.supabase
      .from('player')
      .select(
        'id, username, display_name, avatar_url, currency, created_at'
      )
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Player;
  }
}