export interface Player {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    currency: string;
    balance: number;
    created_at: string;
  }