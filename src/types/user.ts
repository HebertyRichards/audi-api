export interface UserProfileData {
    id: string;
    username: string;
    website?: string;
    gender?: string;
    birthdate?: string;
    location?: string;
    joined_at?: string;
    last_login?: string;
    total_posts?: number;
    role?: string;
  }

  export interface UserProfileWithoutId {
    username: string;
    website?: string;
    gender?: string;
    birthdate?: string;
    location?: string;
    joined_at?: string;
    last_login?: string;
    total_posts?: number;
    role?: string;
  }