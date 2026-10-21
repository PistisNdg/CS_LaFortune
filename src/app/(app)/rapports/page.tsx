'use client';

export default function RapportsPage() {
  return (
    <div>
      <h2 className="text-[25px] font-extrabold tracking-[-0.5px] mb-1">Rapports</h2>
      <p className="text-[var(--mut)] text-[13.5px] mb-6">
        Exports assiduité et présence (Excel détaillé via Données Excel).
      </p>

      <div className="grid gap-4 max-w-lg">
        <a
          href="/api/export/presences-jour"
          className="block p-4 rounded-[14px] border border-[var(--line)] bg-[var(--card)] font-semibold hover:border-[var(--blue)]"
        >
          Télécharger présences du jour (.xlsx)
        </a>
        <p className="text-[12px] text-[var(--mut)]">
          Rapports mensuels avec graphiques : prochaine itération (ExcelJS + modèles CSF).
        </p>
      </div>
    </div>
  );
}
