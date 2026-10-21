import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac';
import { z } from 'zod';

const classeSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  niveau: z.enum(['MATERNELLE', 'PRIMAIRE', 'SECONDAIRE']),
  section: z.string().optional(),
  effectifMax: z.number().min(1, 'L\'effectif doit être positif'),
});

// PUT - Modifier une classe
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

    requirePermission(session.role as any, 'manage:classes');

    const body = await request.json();
    const result = classeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.issues },
        { status: 400 }
      );
    }

    const { data: classe, error: updateError } = await supabase
      .from('classes')
      .update(result.data)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur Supabase:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la modification de la classe' },
        { status: 500 }
      );
    }

    // Journalisation
    await supabase.from('journal_audit').insert({
      action: 'UPDATE',
      entite: 'Classe',
      entite_id: classe.id,
      user_id: session.userId,
      ip_hash: hashIp(request.headers.get('x-forwarded-for') || 'unknown'),
      details_json: { nom: classe.nom, niveau: classe.niveau },
    });

    return NextResponse.json(classe);
  } catch (error) {
    console.error('Erreur lors de la modification de la classe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification de la classe' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une classe
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

    requirePermission(session.role as any, 'manage:classes');

    // Vérifier si la classe a des élèves
    const { data: eleves, error: countError } = await supabase
      .from('eleves')
      .select('id')
      .eq('classe_id', id);

    if (countError) {
      console.error('Erreur Supabase:', countError);
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des élèves' },
        { status: 500 }
      );
    }

    if (eleves && eleves.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer une classe contenant des élèves' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Erreur Supabase:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de la classe' },
        { status: 500 }
      );
    }

    // Journalisation
    await supabase.from('journal_audit').insert({
      action: 'DELETE',
      entite: 'Classe',
      entite_id: id,
      user_id: session.userId,
      ip_hash: hashIp(request.headers.get('x-forwarded-for') || 'unknown'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de la classe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la classe' },
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
