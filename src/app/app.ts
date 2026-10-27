import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly auth = inject(AuthService);
  protected readonly user = this.auth.user;
  protected readonly initialized = this.auth.initialized;

  protected readonly pill = signal({ left: 0, width: 0, ready: false });

  protected onActiveChange(isActive: boolean, el: HTMLElement) {
    if (!isActive) return;
    this.pill.set({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
  }
}