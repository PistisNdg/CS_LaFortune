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
  statut: z.enum(['ACTIF', 'SUSPENDU', 'SORTI']).default('ACTIF'),
});

// GET - Récupérer tous les élèves
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as any, 'view:all_students');

    const { searchParams } = new URL(request.url);
    const classeId = searchParams.get('classeId');

    let query = supabase
      .from('eleves')
      .select(`
        *,
        classe:classes(id, nom)
      `)
      .order('nom', { ascending: true });

    if (classeId) {
      query = query.eq('classe_id', classeId);
    }

    const { data: eleves, error } = await query;

    if (error) {
      console.error('Erreur Supabase:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des élèves' },
        { status: 500 }
      );
    }

    return NextResponse.json(eleves);
  } catch (error) {
    console.error('Erreur lors de la récupération des élèves:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des élèves' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel élève
export async function POST(request: NextRequest) {
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

    // Générer un QR public ID unique
    const qrPublicId = generateRandomId();

    const { data: eleve, error: createError } = await supabase
      .from('eleves')
      .insert({
        ...result.data,
        qr_public_id: qrPublicId,
        date_inscription: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Erreur Supabase:', createError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'élève' },
        { status: 500 }
      );
    }

    // Journalisation
    await supabase.from('journal_audit').insert({
      action: 'CREATE',
      entite: 'Eleve',
      entite_id: eleve.id,
      user_id: session.userId,
      ip_hash: hashIp(request.headers.get('x-forwarded-for') || 'unknown'),
      details_json: { matricule: eleve.matricule, nom: eleve.nom },
    });

    return NextResponse.json(eleve, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'élève:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'élève' },
      { status: 500 }
    );
  }
}

function generateRandomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
