import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { startOfKinshasaDayUtc } from '@/lib/time-kinshasa';
import { unwrapOne } from '@/lib/supabase-relations';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const dayStart = startOfKinshasaDayUtc();
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    const { count: inscrits } = await supabase
      .from('eleves')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'ACTIF');

    const { data: presences } = await supabase
      .from('presences')
      .select('statut')
      .gte('date', dayStart.toISOString())
      .lt('date', dayEnd.toISOString());

    const stats = {
      inscrits: inscrits ?? 0,
      presents: 0,
      retards: 0,
      absents: 0,
    };

    for (const p of presences ?? []) {
      if (p.statut === 'PRESENT') stats.presents++;
      else if (p.statut === 'RETARD') stats.retards++;
      else if (p.statut === 'ABSENT' || p.statut === 'ABSENT_JUSTIFIE') stats.absents++;
    }

    const { data: recentScans } = await supabase
      .from('scans')
      .select(
        `
        id,
        horodatage_local,
        resultat,
        eleve:eleves(prenom, nom, postnom, classe:classes(nom))
      `
      )
      .eq('resultat', 'SUCCES')
      .order('horodatage_local', { ascending: false })
      .limit(8);

    const scans = (recentScans ?? []).map((s) => {
      const el = unwrapOne<{
        prenom: string;
        nom: string;
        postnom: string;
        classe?: unknown;
      }>(s.eleve);
      const classeNom = unwrapOne<{ nom: string }>(el?.classe)?.nom;
      const time = new Date(s.horodatage_local).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Africa/Kinshasa',
      });
      return {
        name: el ? `${el.prenom} ${el.nom}` : '—',
        class: classeNom ?? '—',
        time,
        status: 'present' as const,
      };
    });

    return NextResponse.json({ stats, recentScans: scans });
  } catch (error) {
    console.error('Dashboard stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
