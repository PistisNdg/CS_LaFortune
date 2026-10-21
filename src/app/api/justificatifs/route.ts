import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { requireAnyPermission, type UserRole } from '@/lib/rbac';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requireAnyPermission(session.role as UserRole, [
      'manage:justificatifs',
      'submit:justificatif',
    ]);

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('justificatifs')
      .select(
        `
        id,
        date_debut,
        date_fin,
        motif,
        statut,
        eleve:eleves(prenom, nom)
      `
      )
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Justificatifs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
