import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getSession } from '@/lib/auth';
import { requirePermission, type UserRole } from '@/lib/rbac';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { startOfKinshasaDayUtc, toKinshasaDateKey } from '@/lib/time-kinshasa';
import { unwrapOne } from '@/lib/supabase-relations';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as UserRole, 'view:reports');

    const supabase = await createServerSupabaseClient();
    const dayStart = startOfKinshasaDayUtc();
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    const { data, error } = await supabase
      .from('presences')
      .select(
        `
        date,
        statut,
        heure_arrivee_locale,
        minutes_retard,
        eleve:eleves(matricule, nom, prenom),
        classe:classes(nom)
      `
      )
      .gte('date', dayStart.toISOString())
      .lt('date', dayEnd.toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Presences_Jour');
    ws.addRow([
      'date',
      'matricule',
      'nom',
      'prenom',
      'classe',
      'statut',
      'heure_arrivee',
      'minutes_retard',
    ]);

    for (const row of data ?? []) {
      const el = unwrapOne(
        row.eleve as
          | { matricule: string; nom: string; prenom: string }
          | { matricule: string; nom: string; prenom: string }[]
          | null
      );
      const cl = unwrapOne(row.classe as { nom: string } | { nom: string }[] | null);
      ws.addRow([
        toKinshasaDateKey(new Date(row.date)),
        el?.matricule,
        el?.nom,
        el?.prenom,
        cl?.nom,
        row.statut,
        row.heure_arrivee_locale,
        row.minutes_retard,
      ]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `CSF_Presences_${toKinshasaDateKey()}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export presences:', error);
    return NextResponse.json({ error: 'Erreur export' }, { status: 500 });
  }
}
