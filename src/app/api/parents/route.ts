import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac';
import { z } from 'zod';

const parentSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  postnom: z.string().min(1, 'Le postnom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  lien: z.enum(['PERE', 'MERE', 'TUTEUR', 'AUTRE']),
  telephone_e164: z.string().optional(),
  whatsapp_e164: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  canal_prefere: z.enum(['SMS', 'WHATSAPP', 'EMAIL', 'AUCUN']).default('AUCUN'),
});

// GET - Récupérer tous les parents
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as any, 'view:all_parents');

    const { data: parents, error } = await supabase
      .from('parents')
      .select(`
        *,
        liens_parent_eleve(count)
      `)
      .order('nom', { ascending: true });

    if (error) {
      console.error('Erreur Supabase:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des parents' },
        { status: 500 }
      );
    }

    // Format the response to match the expected structure
    const formattedParents = parents.map((parent: any) => ({
      ...parent,
      _count: {
        liensEleve: parent.liens_parent_eleve?.[0]?.count || 0,
      },
    }));

    return NextResponse.json(formattedParents);
  } catch (error) {
    console.error('Erreur lors de la récupération des parents:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des parents' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau parent
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as any, 'manage:parents');

    const body = await request.json();
    const result = parentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.issues },
        { status: 400 }
      );
    }

    const { data: parent, error: createError } = await supabase
      .from('parents')
      .insert(result.data)
      .select()
      .single();

    if (createError) {
      console.error('Erreur Supabase:', createError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du parent' },
        { status: 500 }
      );
    }

    // Journalisation
    await supabase.from('journal_audit').insert({
      action: 'CREATE',
      entite: 'Parent',
      entite_id: parent.id,
      user_id: session.userId,
      ip_hash: hashIp(request.headers.get('x-forwarded-for') || 'unknown'),
      details_json: { nom: parent.nom, lien: parent.lien },
    });

    return NextResponse.json(parent, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du parent:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du parent' },
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
