import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../app/core/auth/auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './account.html',
})
export class AccountComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;
  protected readonly initialized = this.auth.initialized;
  protected mode: 'sign-in' | 'sign-up' = 'sign-in';
  protected email = '';
  protected password = '';
  protected loading = false;
  protected feedback = '';
  protected hasError = false;

  protected selectMode(mode: 'sign-in' | 'sign-up'): void {
    this.mode = mode;
    this.feedback = '';
    this.hasError = false;
  }

  protected async submit(): Promise<void> {
    if (this.loading) return;

    this.loading = true;
    this.feedback = '';
    this.hasError = false;

    try {
      if (this.mode === 'sign-up') {
        const data = await this.auth.signUp(this.email, this.password);

        if (!data.session) {
          this.feedback = 'Compte créé. Consulte tes e-mails pour confirmer ton inscription.';
          return;
        }
      } else {
        await this.auth.signIn(this.email, this.password);
      }

      await this.router.navigateByUrl('/');
    } catch (error: unknown) {
      this.hasError = true;
      this.feedback =
        error instanceof Error ? error.message : 'Une erreur est survenue. Réessaie.';
    } finally {
      this.loading = false;
    }
  }

  protected async signOut(): Promise<void> {
    if (this.loading) return;

    this.loading = true;
    this.feedback = '';
    this.hasError = false;

    try {
      await this.auth.signOut();
      this.feedback = 'Tu es déconnecté.';
    } catch (error: unknown) {
      this.hasError = true;
      this.feedback =
        error instanceof Error ? error.message : 'La déconnexion a échoué. Réessaie.';
    } finally {
      this.loading = false;
    }
  }
}
