'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface EleveOption {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
  postnom: string;
  classe?: { nom: string };
}

export default function CarteElevePage() {
  const [eleves, setEleves] = useState<EleveOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [qrSvg, setQrSvg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/eleves', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setEleves(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data[0]) setSelectedId(data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/eleves/${selectedId}/qr`, { credentials: 'include' })
      .then((r) => r.json())
      .then(async (data) => {
        if (data.payload) {
          const svg = await QRCode.toString(data.payload, { type: 'svg', margin: 1 });
          setQrSvg(svg);
        }
      });
  }, [selectedId]);

  const eleve = eleves.find((e) => e.id === selectedId);

  if (loading) {
    return <p className="text-[var(--mut)]">Chargement…</p>;
  }

  return (
    <div>
      <h2 className="text-[25px] font-extrabold tracking-[-0.5px] mb-1">Carte élève</h2>
      <p className="text-[var(--mut)] text-[13.5px] mb-6">Badge QR pour impression ou test</p>

      <label className="block text-[12.5px] font-bold mb-1.5">Élève</label>
      <select
        className="inp w-full max-w-md p-3 rounded-[12px] border border-[var(--line)] bg-[var(--card)] mb-6"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        {eleves.map((e) => (
          <option key={e.id} value={e.id}>
            {e.prenom} {e.nom} — {e.classe?.nom ?? e.matricule}
          </option>
        ))}
      </select>

      {eleve && (
        <div className="max-w-sm bg-[var(--card)] border border-[var(--line)] rounded-[20px] p-6 shadow-sm">
          <div className="text-[var(--red)] font-extrabold text-sm">CSF Présence</div>
          <div className="mt-2 text-[20px] font-extrabold">
            {eleve.prenom} {eleve.nom}
          </div>
          <div className="text-[var(--mut)] text-sm">{eleve.classe?.nom}</div>
          <div className="text-xs mt-1 font-mono">{eleve.matricule}</div>
          {qrSvg && (
            <div
              className="mt-4 mx-auto w-[180px] [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          )}
        </div>
      )}
    </div>
  );
}
