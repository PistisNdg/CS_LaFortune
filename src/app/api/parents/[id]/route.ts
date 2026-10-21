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
  canal_prefere: z.enum(['SMS', 'WHATSAPP', 'EMAIL', 'AUCUN']),
});

// PUT - Modifier un parent
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: parent, error: updateError } = await supabase
      .from('parents')
      .update(result.data)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur Supabase:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la modification du parent' },
        { status: 500 }
      );
    }

    // Journalisation
    await supabase.from('journal_audit').insert({
      action: 'UPDATE',
      entite: 'Parent',
      entite_id: parent.id,
      user_id: session.userId,
      ip_hash: hashIp(request.headers.get('x-forwarded-for') || 'unknown'),
      details_json: { nom: parent.nom, lien: parent.lien },
    });

    return NextResponse.json(parent);
  } catch (error) {
    console.error('Erreur lors de la modification du parent:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification du parent' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un parent
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as any, 'manage:parents');

    // Vérifier si le parent a des enfants liés
    const { data: liens, error: countError } = await supabase
      .from('liens_parent_eleve')
      .select('parent_id')
      .eq('parent_id', params.id);

    if (countError) {
      console.error('Erreur Supabase:', countError);
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des liens' },
        { status: 500 }
      );
    }

    if (liens && liens.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un parent ayant des enfants liés' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('parents')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Erreur Supabase:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du parent' },
        { status: 500 }
      );
    }

    // Journalisation
    await supabase.from('journal_audit').insert({
      action: 'DELETE',
      entite: 'Parent',
      entite_id: params.id,
      user_id: session.userId,
      ip_hash: hashIp(request.headers.get('x-forwarded-for') || 'unknown'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression du parent:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du parent' },
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
