import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, getSession } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const supabase = await createServerSupabaseClient();

    if (session) {
      await supabase.from('journal_audit').insert({
        action: 'LOGOUT',
        entite: 'Utilisateur',
        entite_id: session.userId,
        user_id: session.userId,
        ip_hash: hashIp(
          request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown'
        ),
      });
    }

    await deleteSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la déconnexion' },
      { status: 500 }
    );
  }
}

function hashIp(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}
