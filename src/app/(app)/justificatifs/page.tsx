'use client';

import { useEffect, useState } from 'react';

interface Justificatif {
  id: string;
  date_debut: string;
  date_fin: string;
  motif: string;
  statut: string;
  eleve?: { prenom: string; nom: string };
}

export default function JustificatifsPage() {
  const [items, setItems] = useState<Justificatif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/justificatifs', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-[25px] font-extrabold tracking-[-0.5px] mb-1">Justificatifs</h2>
      <p className="text-[var(--mut)] text-[13.5px] mb-6">
        Absences justifiées — dépôt parent et validation direction.
      </p>

      {loading ? (
        <p className="text-[var(--mut)]">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-[var(--mut)]">Aucun justificatif pour le moment.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((j) => (
            <li
              key={j.id}
              className="p-4 rounded-[14px] border border-[var(--line)] bg-[var(--card)]"
            >
              <b>
                {j.eleve ? `${j.eleve.prenom} ${j.eleve.nom}` : 'Élève'} — {j.statut}
              </b>
              <p className="text-[13px] text-[var(--mut)] mt-1">{j.motif}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
