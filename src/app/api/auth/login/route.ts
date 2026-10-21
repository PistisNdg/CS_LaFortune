import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.issues },
        { status: 400 }
      );
    }

    const email = result.data.email.toLowerCase();
    const { password } = result.data;
    const supabase = await createServerSupabaseClient();

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !authData.user) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    const { data: utilisateur, error: profileError } = await supabase
      .from('utilisateurs')
      .select('id, email, role, actif, force_changement_mdp')
      .eq('email', email)
      .maybeSingle();

    if (profileError || !utilisateur) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Compte non configuré. Contactez la direction.' },
        { status: 403 }
      );
    }

    if (!utilisateur.actif) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: 'Ce compte est désactivé' }, { status: 403 });
    }

    await supabase
      .from('utilisateurs')
      .update({ derniere_connexion_utc: new Date().toISOString() })
      .eq('id', utilisateur.id);

    await supabase.from('journal_audit').insert({
      action: 'LOGIN',
      entite: 'Utilisateur',
      entite_id: utilisateur.id,
      user_id: utilisateur.id,
      ip_hash: hashIp(
        request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown'
      ),
      details_json: { role: utilisateur.role },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: utilisateur.id,
        email: utilisateur.email,
        role: utilisateur.role,
        forceChangementMdp: utilisateur.force_changement_mdp,
      },
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la connexion' },
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
