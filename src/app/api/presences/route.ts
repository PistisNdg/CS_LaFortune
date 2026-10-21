import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { requirePermission, type UserRole } from '@/lib/rbac';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { startOfKinshasaDayUtc } from '@/lib/time-kinshasa';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as UserRole, 'view:dashboard');

    const supabase = await createServerSupabaseClient();
    const dayStart = startOfKinshasaDayUtc();
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    const { data, error } = await supabase
      .from('presences')
      .select(
        `
        id,
        statut,
        heure_arrivee_locale,
        eleve:eleves(prenom, nom, matricule),
        classe:classes(nom)
      `
      )
      .gte('date', dayStart.toISOString())
      .lt('date', dayEnd.toISOString())
      .order('heure_arrivee_locale', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Presences:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
