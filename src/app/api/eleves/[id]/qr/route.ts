import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { requirePermission, type UserRole } from '@/lib/rbac';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { buildQrPayload } from '@/lib/qr';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as UserRole, 'view:all_students');

    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: eleve, error } = await supabase
      .from('eleves')
      .select('id, qr_public_id, matricule, nom, postnom, prenom, classe:classes(nom)')
      .eq('id', id)
      .maybeSingle();

    if (error || !eleve?.qr_public_id) {
      return NextResponse.json({ error: 'Élève introuvable' }, { status: 404 });
    }

    return NextResponse.json({
      payload: buildQrPayload(eleve.qr_public_id),
      eleve,
    });
  } catch (error) {
    console.error('QR élève:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
