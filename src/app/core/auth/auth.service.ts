import { Injectable, inject, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';

export interface SignUpProfile {
  displayName: string;
  username: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;
  private static readonly ALLOWED_DOMAINS = ['coda.school', 'coda-student.school'];

  readonly user = signal<User | null>(null);
  readonly initialized = signal(false);

  constructor() {
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.user.set(session?.user ?? null);
      this.initialized.set(true);
    });
  }

  // Inscription
  async signUp(email: string, password: string, profile: SignUpProfile) {
    const normalizedEmail = email.trim().toLowerCase();
    const domain = normalizedEmail.split('@')[1];

    if (!domain || !AuthService.ALLOWED_DOMAINS.includes(domain)) {
      throw new Error(
        'Seules les adresses @coda.school et @coda-student.school sont autorisées.'
      );
    }

    const { data, error } = await this.supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          display_name: profile.displayName.trim(),
          username: profile.username.trim().toLowerCase(),
        },
      },
    });

    if (error) {
      throw error;
    }

    this.user.set(data.session?.user ?? null);
    return data;
  }

  // Vérifier si un pseudo est libre (RPC créée côté Supabase)
  async isUsernameAvailable(username: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('is_username_available', {
      p_username: username.trim().toLowerCase(),
    });

    if (error) {
      throw error;
    }

    return data === true;
  }

  // Connexion
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw error;
    }

    this.user.set(data.user);
    return data;
  }

  // Déconnexion
  async signOut() {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw error;
    }

    this.user.set(null);
  }

  // Récupérer la session actuelle
  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  }

  // Vérifier l'accès à Supabase Auth
  async testConnection() {
    const { data, error } = await this.supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return {
      success: true,
      authenticated: data.session !== null,
      email: data.session?.user.email ?? null,
    };
  }
}