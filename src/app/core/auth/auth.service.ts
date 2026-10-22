import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;

  // Inscription
  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  // Connexion
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  // Déconnexion
  async signOut() {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw error;
    }
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

  // Écouter les changements de session
  onAuthStateChange(callback: (authenticated: boolean, email: string | null) => void) {
    const { data } = this.supabase.auth.onAuthStateChange((_event, session) => {
      callback(session !== null, session?.user.email ?? null);
    });

    return data.subscription;
  }
}
