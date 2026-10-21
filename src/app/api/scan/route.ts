import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { requirePermission, type UserRole } from '@/lib/rbac';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { verifyQrPayload } from '@/lib/qr';
import {
  kinshasaTimeString,
  startOfKinshasaDayUtc,
  toKinshasaDateKey,
} from '@/lib/time-kinshasa';
import { unwrapOne } from '@/lib/supabase-relations';
import { z } from 'zod';

const scanSchema = z.object({
  qrPayload: z.string().min(1),
  appareilId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as UserRole, 'scan:qr');

    const body = await request.json();
    const parsed = scanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const verification = verifyQrPayload(parsed.data.qrPayload);
    if (!verification.ok) {
      return NextResponse.json({
        resultat: 'QR_INVALIDE',
        message: 'QR code invalide ou falsifié',
      });
    }

    const supabase = await createServerSupabaseClient();
    const now = new Date();
    const dateKey = toKinshasaDateKey(now);
    const dayStart = startOfKinshasaDayUtc(now);

    const { data: eleve, error: eleveError } = await supabase
      .from('eleves')
      .select(
        `
        id,
        matricule,
        nom,
        postnom,
        prenom,
        statut,
        classe_id,
        qr_public_id,
        classe:classes(id, nom, niveau, annee_id)
      `
      )
      .eq('qr_public_id', verification.qrPublicId)
      .maybeSingle();

    if (eleveError || !eleve) {
      await supabase.from('scans').insert({
        horodatage_utc: now.toISOString(),
        horodatage_local: now.toISOString(),
        resultat: 'ELEVE_INCONNU',
        user_id: session.userId,
        appareil_id: parsed.data.appareilId,
      });
      return NextResponse.json({
        resultat: 'ELEVE_INCONNU',
        message: 'Élève introuvable',
      });
    }

    if (eleve.statut !== 'ACTIF') {
      await supabase.from('scans').insert({
        horodatage_utc: now.toISOString(),
        horodatage_local: now.toISOString(),
        eleve_id: eleve.id,
        resultat: 'ERREUR_SYSTEME',
        user_id: session.userId,
        appareil_id: parsed.data.appareilId,
      });
      return NextResponse.json({
        resultat: 'ELEVE_INACTIF',
        message: 'Élève inactif',
        eleve: formatEleve(eleve),
      });
    }

    const classe = unwrapOne<{
      id: string;
      nom: string;
      niveau: string;
      annee_id: string;
    }>(eleve.classe);

    if (!classe) {
      return NextResponse.json({
        resultat: 'ERREUR_SYSTEME',
        message: 'Classe introuvable pour cet élève',
      });
    }

    const { data: calendrier } = await supabase
      .from('calendrier')
      .select('type')
      .eq('annee_id', classe.annee_id)
      .eq('date', dayStart.toISOString())
      .maybeSingle();

    if (calendrier && calendrier.type !== 'COURS' && calendrier.type !== 'EXAMEN') {
      await supabase.from('scans').insert({
        horodatage_utc: now.toISOString(),
        horodatage_local: now.toISOString(),
        eleve_id: eleve.id,
        resultat: 'ERREUR_SYSTEME',
        user_id: session.userId,
        appareil_id: parsed.data.appareilId,
      });
      return NextResponse.json({
        resultat: 'HORS_CALENDRIER',
        message: 'Pas de cours ce jour',
        eleve: formatEleve(eleve),
      });
    }

    const { data: existingPresence } = await supabase
      .from('presences')
      .select('id')
      .eq('eleve_id', eleve.id)
      .gte('date', dayStart.toISOString())
      .lt('date', new Date(dayStart.getTime() + 86400000).toISOString())
      .maybeSingle();

    if (existingPresence) {
      const { data: scan } = await supabase
        .from('scans')
        .insert({
          horodatage_utc: now.toISOString(),
          horodatage_local: now.toISOString(),
          eleve_id: eleve.id,
          resultat: 'ERREUR_SYSTEME',
          user_id: session.userId,
          appareil_id: parsed.data.appareilId,
        })
        .select('id')
        .single();

      return NextResponse.json({
        resultat: 'DOUBLON',
        message: 'Présence déjà enregistrée aujourd\'hui',
        eleve: formatEleve(eleve),
        scanId: scan?.id,
      });
    }

    const { data: regle } = await supabase
      .from('regles_horaires')
      .select('heure_limite_retard')
      .eq('annee_id', classe.annee_id)
      .eq('niveau', classe.niveau)
      .order('date_effet', { ascending: false })
      .limit(1)
      .maybeSingle();

    const heureLocale = kinshasaTimeString(now);
    let statut: 'PRESENT' | 'RETARD' = 'PRESENT';
    let minutesRetard: number | null = null;

    if (regle?.heure_limite_retard) {
      const limit = regle.heure_limite_retard as string;
      if (heureLocale > limit) {
        statut = 'RETARD';
        minutesRetard = diffMinutes(limit, heureLocale);
      }
    }

    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        horodatage_utc: now.toISOString(),
        horodatage_local: now.toISOString(),
        eleve_id: eleve.id,
        resultat: 'SUCCES',
        user_id: session.userId,
        appareil_id: parsed.data.appareilId,
      })
      .select('id')
      .single();

    if (scanError || !scan) {
      return NextResponse.json({ error: 'Erreur lors du scan' }, { status: 500 });
    }

    await supabase.from('presences').insert({
      date: dayStart.toISOString(),
      eleve_id: eleve.id,
      classe_id: classe.id,
      annee_id: classe.annee_id,
      statut,
      heure_arrivee_locale: heureLocale,
      minutes_retard: minutesRetard,
      source: 'SCAN',
      scan_id: scan.id,
      saisi_par_user_id: session.userId,
    });

    await supabase.from('journal_audit').insert({
      action: 'SCAN',
      entite: 'Presence',
      entite_id: eleve.id,
      user_id: session.userId,
      details_json: { date: dateKey, statut, scan_id: scan.id },
    });

    return NextResponse.json({
      resultat: 'SUCCES',
      statut,
      minutesRetard,
      eleve: formatEleve(eleve),
      scanId: scan.id,
    });
  } catch (error) {
    console.error('Erreur scan:', error);
    return NextResponse.json({ error: 'Erreur lors du scan' }, { status: 500 });
  }
}

function formatEleve(eleve: {
  id: string;
  matricule: string;
  nom: string;
  postnom: string;
  prenom: string;
  classe?: { nom: string } | { nom: string }[] | null;
}) {
  const classeRaw = eleve.classe;
  const classeNom = Array.isArray(classeRaw)
    ? classeRaw[0]?.nom
    : classeRaw?.nom;

  return {
    id: eleve.id,
    matricule: eleve.matricule,
    nomComplet: `${eleve.prenom} ${eleve.nom} ${eleve.postnom}`.trim(),
    classe: classeNom ?? '—',
  };
}

function diffMinutes(from: string, to: string): number {
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  return (th! - fh!) * 60 + (tm! - fm!);
}
