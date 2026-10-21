import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSession } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac';
import { z } from 'zod';

const classeSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  niveau: z.enum(['MATERNELLE', 'PRIMAIRE', 'SECONDAIRE']),
  section: z.string().optional(),
  effectifMax: z.number().min(1, 'L\'effectif doit être positif'),
});

// GET - Récupérer toutes les classes
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    console.log('GET /api/classes - Session:', session);
    
    if (!session) {
      console.log('GET /api/classes - No session found');
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as any, 'view:all_classes');

    const supabase = await createServerSupabaseClient();
    const { data: classes, error } = await supabase
      .from('classes')
      .select(`
        *,
        annee:annees_scolaires(libelle),
        eleves(count)
      `)
      .order('nom', { ascending: true });

    if (error) {
      console.error('Erreur Supabase:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des classes' },
        { status: 500 }
      );
    }

    // Format the response to match the expected structure
    const formattedClasses = classes.map((classe: any) => ({
      ...classe,
      _count: {
        eleves: classe.eleves?.[0]?.count || 0,
      },
    }));

    return NextResponse.json(formattedClasses);
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des classes' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle classe
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    console.log('POST /api/classes - Session:', session);
    
    if (!session) {
      console.log('POST /api/classes - No session found');
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as any, 'manage:classes');

    const body = await request.json();
    const result = classeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.issues },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

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

    const { data: classe, error: createError } = await supabase
      .from('classes')
      .insert({
        ...result.data,
        annee_id: anneeActive.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Erreur Supabase:', createError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la classe' },
        { status: 500 }
      );
    }

    // Journalisation
    await supabase.from('journal_audit').insert({
      action: 'CREATE',
      entite: 'Classe',
      entite_id: classe.id,
      user_id: session.userId,
      ip_hash: hashIp(request.headers.get('x-forwarded-for') || 'unknown'),
      details_json: { nom: classe.nom, niveau: classe.niveau },
    });

    return NextResponse.json(classe, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la classe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la classe' },
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
