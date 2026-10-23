import { Injectable, inject, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;
  readonly user = signal<User | null>(null);
  readonly initialized = signal(false);

  constructor() {
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.user.set(session?.user ?? null);
      this.initialized.set(true);
    });
  }

  // Inscription
  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    this.user.set(data.session?.user ?? null);
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
