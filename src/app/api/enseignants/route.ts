import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac';
import { z } from 'zod';

const enseignantSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  postnom: z.string().min(1, 'Le postnom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  telephone_e164: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  matiere_principale: z.string().optional(),
});

// GET - Récupérer tous les enseignants
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as any, 'view:all_teachers');

    const { data: enseignants, error } = await supabase
      .from('enseignants')
      .select(`
        *,
        affectations(count)
      `)
      .order('nom', { ascending: true });

    if (error) {
      console.error('Erreur Supabase:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des enseignants' },
        { status: 500 }
      );
    }

    // Format the response to match the expected structure
    const formattedEnseignants = enseignants.map((enseignant: any) => ({
      ...enseignant,
      _count: {
        affectations: enseignant.affectations?.[0]?.count || 0,
      },
    }));

    return NextResponse.json(formattedEnseignants);
  } catch (error) {
    console.error('Erreur lors de la récupération des enseignants:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des enseignants' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel enseignant
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as any, 'manage:teachers');

    const body = await request.json();
    const result = enseignantSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.issues },
        { status: 400 }
      );
    }

    const { data: enseignant, error: createError } = await supabase
      .from('enseignants')
      .insert(result.data)
      .select()
      .single();

    if (createError) {
      console.error('Erreur Supabase:', createError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'enseignant' },
        { status: 500 }
      );
    }

    // Journalisation
    await supabase.from('journal_audit').insert({
      action: 'CREATE',
      entite: 'Enseignant',
      entite_id: enseignant.id,
      user_id: session.userId,
      ip_hash: hashIp(request.headers.get('x-forwarded-for') || 'unknown'),
      details_json: { nom: enseignant.nom, matierePrincipale: enseignant.matiere_principale },
    });

    return NextResponse.json(enseignant, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'enseignant:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'enseignant' },
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
