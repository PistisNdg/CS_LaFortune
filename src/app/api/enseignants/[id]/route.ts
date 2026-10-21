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

// PUT - Modifier un enseignant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: enseignant, error: updateError } = await supabase
      .from('enseignants')
      .update(result.data)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur Supabase:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la modification de l\'enseignant' },
        { status: 500 }
      );
    }

    // Journalisation
    await supabase.from('journal_audit').insert({
      action: 'UPDATE',
      entite: 'Enseignant',
      entite_id: enseignant.id,
      user_id: session.userId,
      ip_hash: hashIp(request.headers.get('x-forwarded-for') || 'unknown'),
      details_json: { nom: enseignant.nom, matierePrincipale: enseignant.matiere_principale },
    });

    return NextResponse.json(enseignant);
  } catch (error) {
    console.error('Erreur lors de la modification de l\'enseignant:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification de l\'enseignant' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un enseignant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as any, 'manage:teachers');

    // Vérifier si l'enseignant a des affectations
    const { data: affectations, error: countError } = await supabase
      .from('affectations')
      .select('enseignant_id')
      .eq('enseignant_id', id);

    if (countError) {
      console.error('Erreur Supabase:', countError);
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des affectations' },
        { status: 500 }
      );
    }

    if (affectations && affectations.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un enseignant ayant des affectations de classe' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('enseignants')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Erreur Supabase:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de l\'enseignant' },
        { status: 500 }
      );
    }

    // Journalisation
    await supabase.from('journal_audit').insert({
      action: 'DELETE',
      entite: 'Enseignant',
      entite_id: id,
      user_id: session.userId,
      ip_hash: hashIp(request.headers.get('x-forwarded-for') || 'unknown'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'enseignant:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'enseignant' },
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
