import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../app/core/auth/auth.service';

@Component({
  selector: 'app-auth-test',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './auth-test.component.html',
})
export class AuthTestComponent {
  private readonly auth = inject(AuthService);

  email = '';
  password = '';
  status = 'Prêt à tester.';
  authenticated = false;
  currentEmail: string | null = null;
  loading = false;

  async testConnection(): Promise<void> {
    await this.execute(async () => {
      const result = await this.auth.testConnection();

      this.authenticated = result.authenticated;
      this.currentEmail = result.email;
      this.status = 'Connexion à Supabase Auth réussie.';
    });
  }

  async signUp(): Promise<void> {
    await this.execute(async () => {
      const data = await this.auth.signUp(this.email, this.password);

      this.authenticated = data.session !== null;
      this.currentEmail = data.user?.email ?? null;

      this.status = data.session
        ? 'Compte créé et session ouverte.'
        : 'Compte créé. Vérifie tes e-mails pour confirmer ton inscription.';
    });
  }

  async signIn(): Promise<void> {
    await this.execute(async () => {
      const data = await this.auth.signIn(this.email, this.password);

      this.authenticated = true;
      this.currentEmail = data.user.email ?? null;
      this.status = 'Connexion réussie.';
    });
  }

  async signOut(): Promise<void> {
    await this.execute(async () => {
      await this.auth.signOut();

      this.authenticated = false;
      this.currentEmail = null;
      this.status = 'Déconnexion réussie.';
    });
  }

  private async execute(action: () => Promise<void>): Promise<void> {
    if (this.loading) return;

    this.loading = true;

    try {
      await action();
    } catch (error: unknown) {
      this.status = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
    } finally {
      this.loading = false;
    }
  }
}
