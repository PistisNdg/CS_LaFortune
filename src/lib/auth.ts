import { createServerSupabaseClient } from './supabase-server';

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  lieAId?: string;
}

export { hashPassword, verifyPassword, generateSecurePassword } from './auth-credentials';

/**
 * Session applicative : Supabase Auth (JWT cookies) + métier dans `utilisateurs`.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return null;
  }

  const email = user.email.toLowerCase();

  const { data: utilisateur } = await supabase
    .from('utilisateurs')
    .select('role, lie_a_id, actif')
    .eq('email', email)
    .maybeSingle();

  if (!utilisateur || !utilisateur.actif) {
    return null;
  }

  return {
    userId: user.id,
    email,
    role: utilisateur.role,
    lieAId: utilisateur.lie_a_id || undefined,
  };
}

export async function deleteSession(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
}
