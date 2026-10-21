import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getSession } from '@/lib/auth';
import { requirePermission, type UserRole } from '@/lib/rbac';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toKinshasaDateKey } from '@/lib/time-kinshasa';

const SHEETS = [
  { table: 'annees_scolaires', name: 'Annees_Scolaires' },
  { table: 'classes', name: 'Classes' },
  { table: 'eleves', name: 'Eleves' },
  { table: 'parents', name: 'Parents' },
  { table: 'enseignants', name: 'Enseignants' },
  { table: 'utilisateurs', name: 'Utilisateurs' },
  { table: 'presences', name: 'Presences' },
] as const;

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    requirePermission(session.role as UserRole, 'export:excel');

    const supabase = await createServerSupabaseClient();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CSF Présence';

    for (const sheet of SHEETS) {
      const { data, error } = await supabase.from(sheet.table).select('*');
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const ws = workbook.addWorksheet(sheet.name);
      const rows = data ?? [];
      if (rows.length === 0) {
        ws.addRow(['(vide)']);
        continue;
      }

      const keys = Object.keys(rows[0]!).filter((k) => k !== 'password_hash');
      ws.addRow(keys);
      for (const row of rows) {
        const r = { ...row } as Record<string, unknown>;
        delete r.password_hash;
        ws.addRow(keys.map((k) => r[k]));
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `CSF_Presence_BDD_${toKinshasaDateKey()}.xlsx`;

    await supabase.from('journal_audit').insert({
      action: 'EXPORT',
      entite: 'Excel',
      user_id: session.userId,
      details_json: { type: 'bdd', sheets: SHEETS.length },
    });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export BDD:', error);
    return NextResponse.json({ error: 'Erreur export' }, { status: 500 });
  }
}
