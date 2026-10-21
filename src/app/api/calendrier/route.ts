import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac';
import { z } from 'zod';

const calendrierSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  type: z.enum(['COURS', 'FERIE', 'VACANCES', 'EXAMEN']),
  libelle: z.string().optional(),
});

// GET - Récupérer le calendrier
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as any, 'view:all_classes');

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

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

    let query = supabase
      .from('calendrier')
      .select('*')
      .eq('annee_id', anneeActive.id)
      .order('date', { ascending: true });
    
    if (month) {
      // Filtrer par mois (format YYYY-MM)
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      query = query.gte('date', startDate.toISOString()).lt('date', endDate.toISOString());
    }

    const { data: calendrier, error } = await query;

    if (error) {
      console.error('Erreur Supabase:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du calendrier' },
        { status: 500 }
      );
    }

    return NextResponse.json(calendrier);
  } catch (error) {
    console.error('Erreur lors de la récupération du calendrier:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du calendrier' },
      { status: 500 }
    );
  }
}

// POST - Créer ou mettre à jour une entrée de calendrier
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as any, 'manage:calendar');

    const body = await request.json();
    const result = calendrierSchema.safeParse(body);

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

    // Upsert : vérifier si existe déjà
    const { data: existing, error: checkError } = await supabase
      .from('calendrier')
      .select('*')
      .eq('date', result.data.date.toISOString())
      .single();

    let calendrier;
    if (existing) {
      // Update
      const { data: updated, error: updateError } = await supabase
        .from('calendrier')
        .update({
          type: result.data.type,
          libelle: result.data.libelle,
        })
        .eq('date', result.data.date.toISOString())
        .select()
        .single();
      
      if (updateError) throw updateError;
      calendrier = updated;
    } else {
      // Create
      const { data: created, error: createError } = await supabase
        .from('calendrier')
        .insert({
          date: result.data.date.toISOString(),
          type: result.data.type,
          libelle: result.data.libelle,
          annee_id: anneeActive.id,
        })
        .select()
        .single();
      
      if (createError) throw createError;
      calendrier = created;
    }

    // Journalisation
    await supabase.from('journal_audit').insert({
      action: 'UPSERT',
      entite: 'Calendrier',
      entite_id: calendrier.date,
      user_id: session.userId,
      ip_hash: hashIp(request.headers.get('x-forwarded-for') || 'unknown'),
      details_json: { type: calendrier.type, libelle: calendrier.libelle },
    });

    return NextResponse.json(calendrier);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du calendrier:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde du calendrier' },
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
