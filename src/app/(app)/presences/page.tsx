'use client';

import { useEffect, useState } from 'react';

interface PresenceRow {
  id: string;
  statut: string;
  heure_arrivee_locale: string | null;
  eleve?: { prenom: string; nom: string; matricule: string };
  classe?: { nom: string };
}

export default function PresencesPage() {
  const [rows, setRows] = useState<PresenceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/presences', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-[25px] font-extrabold tracking-[-0.5px] mb-1">Présences</h2>
      <p className="text-[var(--mut)] text-[13.5px] mb-6">Journal du jour (Kinshasa)</p>

      {loading ? (
        <p className="text-[var(--mut)]">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="text-[var(--mut)]">Aucune présence enregistrée aujourd&apos;hui.</p>
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-[var(--line)]">
          <table className="w-full text-[13.5px]">
            <thead className="bg-[var(--line)]/40 text-left">
              <tr>
                <th className="p-3">Élève</th>
                <th className="p-3">Classe</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Heure</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-[var(--line)]">
                  <td className="p-3">
                    {p.eleve ? `${p.eleve.prenom} ${p.eleve.nom}` : '—'}
                  </td>
                  <td className="p-3">{p.classe?.nom ?? '—'}</td>
                  <td className="p-3">{p.statut}</td>
                  <td className="p-3">{p.heure_arrivee_locale ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
