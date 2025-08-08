import { User } from '@supabase/supabase-js';
import { Request } from 'express';

type AuthenticatedUserPayload = User & {
  username: string;
};

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
}

export interface RegisterOptions {
  emailRedirectTo?: string;
}

export interface RecoveryOptions {
  redirectTo?: string;
}
