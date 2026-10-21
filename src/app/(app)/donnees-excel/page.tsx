'use client';

export default function DonneesExcelPage() {
  return (
    <div>
      <h2 className="text-[25px] font-extrabold tracking-[-0.5px] mb-1">Données Excel</h2>
      <p className="text-[var(--mut)] text-[13.5px] mb-6">
        Export de la base structurée (réservé Direction). Import complet : phase suivante.
      </p>

      <a
        href="/api/export/bdd"
        className="inline-block px-5 py-3 rounded-[12px] bg-gradient-to-br from-[var(--blue)] to-[#164a99] text-white font-bold"
      >
        Télécharger la BDD (.xlsx)
      </a>
    </div>
  );
}
