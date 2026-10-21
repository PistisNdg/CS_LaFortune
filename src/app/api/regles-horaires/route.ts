import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac';
import { z } from 'zod';

const regleSchema = z.object({
  niveau: z.enum(['MATERNELLE', 'PRIMAIRE', 'SECONDAIRE']),
  session: z.enum(['MATIN', 'APRES_MIDI']),
  heure_debut: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  heure_limite: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  heure_tolerance: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  est_actif: z.boolean().default(true),
});

// GET - Récupérer toutes les règles horaires
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as any, 'view:all_classes');

    // Récupérer l'année scolaire active
    const { data: anneeActive, error: anneeError } = await supabase
      .from('annees_scolaires')
      .select('*')
      .eq('est_active', true)
      .single();

    if (anneeError || !anneeActive) {
      return NextResponse.json(
        { error: 'Aucune année scolaire active trouvée' },
        { status: 400 }
      );
    }

    const { data: regles, error } = await supabase
      .from('regles_horaires')
      .select(`
        *,
        annee:annees_scolaires(libelle)
      `)
      .eq('annee_id', anneeActive.id)
      .order('session', { ascending: true });

    if (error) {
      console.error('Erreur Supabase:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des règles horaires' },
        { status: 500 }
      );
    }

    return NextResponse.json(regles);
  } catch (error) {
    console.error('Erreur lors de la récupération des règles horaires:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des règles horaires' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle règle horaire
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as any, 'manage:time_rules');

    const body = await request.json();
    const result = regleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.issues },
        { status: 400 }
      );
    }

    // Récupérer l'année scolaire active
    const { data: anneeActive, error: anneeError } = await supabase
      .from('annees_scolaires')
      .select('*')
      .eq('est_active', true)
      .single();

    if (anneeError || !anneeActive) {
      return NextResponse.json(
        { error: 'Aucune année scolaire active trouvée' },
        { status: 400 }
      );
    }

    const { data: regle, error: createError } = await supabase
      .from('regles_horaires')
      .insert({
        ...result.data,
        annee_id: anneeActive.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Erreur Supabase:', createError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la règle horaire' },
        { status: 500 }
      );
    }

    // Journalisation
    await supabase.from('journal_audit').insert({
      action: 'CREATE',
      entite: 'RegleHoraire',
      entite_id: regle.id,
      user_id: session.userId,
      ip_hash: hashIp(request.headers.get('x-forwarded-for') || 'unknown'),
      details_json: { session: regle.session, heureDebut: regle.heure_debut },
    });

    return NextResponse.json(regle, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la règle horaire:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la règle horaire' },
      { status: 500 }
    );
  }
}

function hashIp(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}
