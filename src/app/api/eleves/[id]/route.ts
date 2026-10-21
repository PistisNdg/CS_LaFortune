import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac';
import { z } from 'zod';

const eleveSchema = z.object({
  matricule: z.string().min(1, 'Le matricule est requis'),
  nom: z.string().min(1, 'Le nom est requis'),
  postnom: z.string().min(1, 'Le postnom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  sexe: z.enum(['M', 'F']),
  date_naissance: z.string().transform((str) => new Date(str)),
  classe_id: z.string().min(1, 'La classe est requise'),
  statut: z.enum(['ACTIF', 'SUSPENDU', 'SORTI']),
});

// PUT - Modifier un élève
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as any, 'manage:students');

    const body = await request.json();
    const result = eleveSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.issues },
        { status: 400 }
      );
    }

    const { data: eleve, error: updateError } = await supabase
      .from('eleves')
      .update(result.data)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur Supabase:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la modification de l\'élève' },
        { status: 500 }
      );
    }

    // Journalisation
    await supabase.from('journal_audit').insert({
      action: 'UPDATE',
      entite: 'Eleve',
      entite_id: eleve.id,
      user_id: session.userId,
      ip_hash: hashIp(request.headers.get('x-forwarded-for') || 'unknown'),
      details_json: { matricule: eleve.matricule, nom: eleve.nom },
    });

    return NextResponse.json(eleve);
  } catch (error) {
    console.error('Erreur lors de la modification de l\'élève:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification de l\'élève' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un élève
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as any, 'manage:students');

    // Vérifier si l'élève a des présences
    const { data: presences, error: countError } = await supabase
      .from('presences')
      .select('id')
      .eq('eleve_id', params.id);

    if (countError) {
      console.error('Erreur Supabase:', countError);
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des présences' },
        { status: 500 }
      );
    }

    if (presences && presences.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un élève ayant un historique de présence' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('eleves')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Erreur Supabase:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de l\'élève' },
        { status: 500 }
      );
    }

    // Journalisation
    await supabase.from('journal_audit').insert({
      action: 'DELETE',
      entite: 'Eleve',
      entite_id: params.id,
      user_id: session.userId,
      ip_hash: hashIp(request.headers.get('x-forwarded-for') || 'unknown'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'élève:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'élève' },
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
