import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac';
import { z } from 'zod';

const regleUpdateSchema = z.object({
  niveau: z.enum(['MATERNELLE', 'PRIMAIRE', 'SECONDAIRE']).optional(),
  session: z.enum(['MATIN', 'APRES_MIDI']).optional(),
  heure_debut: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis').optional(),
  heure_limite: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis').optional(),
  heure_tolerance: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis').optional(),
  est_actif: z.boolean().optional(),
});

// PUT - Modifier une règle horaire
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as any, 'manage:time_rules');

    const body = await request.json();
    const result = regleUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.issues },
        { status: 400 }
      );
    }

    const { data: regle, error: updateError } = await supabase
      .from('regles_horaires')
      .update(result.data)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur Supabase:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la modification de la règle horaire' },
        { status: 500 }
      );
    }

    // Journalisation
    await supabase.from('journal_audit').insert({
      action: 'UPDATE',
      entite: 'RegleHoraire',
      entite_id: regle.id,
      user_id: session.userId,
      ip_hash: hashIp(request.headers.get('x-forwarded-for') || 'unknown'),
      details_json: { session: regle.session, estActif: regle.est_actif },
    });

    return NextResponse.json(regle);
  } catch (error) {
    console.error('Erreur lors de la modification de la règle horaire:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification de la règle horaire' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une règle horaire
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as any, 'manage:time_rules');

    const { error: deleteError } = await supabase
      .from('regles_horaires')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Erreur Supabase:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de la règle horaire' },
        { status: 500 }
      );
    }

    // Journalisation
    await supabase.from('journal_audit').insert({
      action: 'DELETE',
      entite: 'RegleHoraire',
      entite_id: params.id,
      user_id: session.userId,
      ip_hash: hashIp(request.headers.get('x-forwarded-for') || 'unknown'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de la règle horaire:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la règle horaire' },
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
