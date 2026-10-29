import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { LucideBookOpen, LucideHandshake, LucidePlayingCardsFan, LucideStore, LucideTorus, LucideTrophy, LucideUser } from '@lucide/angular';
import { PlayerService } from './core/player/player.service';


@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet,
    LucidePlayingCardsFan, LucideStore, LucideHandshake,
    LucideTrophy, LucideBookOpen, LucideTorus, LucideUser],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly playerService = inject(PlayerService);

  protected readonly user = this.auth.user;
  protected readonly initialized = this.auth.initialized;

  protected readonly pill = signal({ left: 0, width: 0, ready: false });

  protected onActiveChange(isActive: boolean, el: HTMLElement) {
    if (!isActive) return;
    this.pill.set({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
  }
}
