import { Component, inject, signal } from '@angular/core';
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
  protected displayName = '';
  protected username = '';

  protected readonly loading = signal(false);
  protected readonly feedback = signal('');
  protected readonly hasError = signal(false);

  private static readonly USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

  protected get usernameValid(): boolean {
    return AccountComponent.USERNAME_REGEX.test(this.username.trim());
  }
  protected selectMode(mode: 'sign-in' | 'sign-up'): void {
    this.mode = mode;
    this.feedback.set('');
    this.hasError.set(false);
  }

  protected get canSubmit(): boolean {
    if (this.loading() || !this.email.trim() || this.password.length < 6) {
      return false;
    }

    if (this.mode === 'sign-in') {
      return true;
    }

    return this.displayName.trim().length > 0 && this.usernameValid;
  }

  protected async submit(): Promise<void> {
    if (!this.canSubmit) return;

    this.loading.set(true);
    this.feedback.set('');
    this.hasError.set(false);

    try {
      const email = this.email.trim().toLowerCase();
      const parts = email.split('@');

      if (parts.length !== 2 || !['coda.school', 'coda-student.school'].includes(parts[1])) {
        throw new Error(
          'Seules les adresses @coda.school et @coda-student.school sont autorisées.',
        );
      }
      if (this.mode === 'sign-up') {
        const username = this.username.trim().toLowerCase();

        if (!(await this.auth.isUsernameAvailable(username))) {
          this.hasError.set(true);
          this.feedback.set('Ce pseudo est déjà pris.');
          return;
        }

        const data = await this.auth.signUp(this.email, this.password, {
          displayName: this.displayName.trim(),
          username,
        });

        if (!data.session) {
          this.feedback.set('Compte créé. Consulte tes e-mails pour confirmer ton inscription.');
          return;
        }
      } else {
        await this.auth.signIn(this.email, this.password);
      }

      await this.router.navigateByUrl('/');
    } catch (error: unknown) {
      this.hasError.set(true);
      this.feedback.set(
        error instanceof Error ? error.message : 'Une erreur est survenue. Réessaie.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  protected async signOut(): Promise<void> {
    if (this.loading()) return;

    this.loading.set(true);
    this.feedback.set('');
    this.hasError.set(false);

    try {
      await this.auth.signOut();
      this.feedback.set('Tu es déconnecté.');
    } catch (error: unknown) {
      this.hasError.set(true);
      this.feedback.set(
        error instanceof Error ? error.message : 'La déconnexion a échoué. Réessaie.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
