'use client';

import { useState, useEffect } from 'react';

interface Calendrier {
  date: string;
  type: string;
  libelle?: string;
}

export default function CalendrierPage() {
  const [calendrier, setCalendrier] = useState<Calendrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadCalendrier();
  }, [selectedMonth]);

  const loadCalendrier = async () => {
    try {
      const response = await fetch(`/api/calendrier?month=${selectedMonth}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setCalendrier(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement du calendrier:', error);
      setCalendrier([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (date: string) => {
    setEditingDate(date);
    setShowModal(true);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      COURS: 'Cours',
      FERIE: 'Férié',
      VACANCES: 'Vacances',
      EXAMEN: 'Examen',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      COURS: 'bg-[var(--ok)]',
      FERIE: 'bg-[var(--red)]',
      VACANCES: 'bg-[var(--warn)]',
      EXAMEN: 'bg-[var(--blue)]',
    };
    return colors[type] || 'bg-[var(--mut)]';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <div>
      <div className="top flex justify-between items-center gap-3.5 flex-wrap mb-6">
        <div>
          <h2 className="text-[25px] font-extrabold tracking-[-0.5px]">Calendrier scolaire</h2>
          <p className="text-[var(--mut)] text-[13.5px] mt-0.5">
            Gestion des jours de cours, fériés et vacances
          </p>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="inp p-2 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--mut)]">Chargement...</div>
      ) : calendrier.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-[18px] p-8 text-center">
          <p className="text-[var(--mut)] mb-4">Aucune entrée pour ce mois</p>
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-[18px] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--bg)]">
              <tr>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Date</th>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Type</th>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Libellé</th>
                <th className="text-center p-4 text-[13px] font-semibold text-[var(--mut)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {calendrier.map((entry) => (
                <tr key={entry.date} className="border-t border-[var(--line)] hover:bg-[var(--bg)]">
                  <td className="p-4 font-semibold text-[14px] capitalize">
                    {formatDate(entry.date)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`${getTypeColor(entry.type)} text-white px-2 py-1 rounded-[6px] text-[12px] font-semibold`}
                    >
                      {getTypeLabel(entry.type)}
                    </span>
                  </td>
                  <td className="p-4 text-[13px] text-[var(--mut)]">
                    {entry.libelle || '-'}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEdit(entry.date)}
                      className="text-[var(--blue)] hover:text-[#1a4fa0] text-[13px] font-semibold"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <CalendrierModal
          date={editingDate}
          onClose={() => {
            setShowModal(false);
            setEditingDate(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingDate(null);
            loadCalendrier();
          }}
        />
      )}
    </div>
  );
}

function CalendrierModal({
  date,
  onClose,
  onSave,
}: {
  date: string | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    date: date || new Date().toISOString().split('T')[0],
    type: 'COURS',
    libelle: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/calendrier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la sauvegarde');
        return;
      }

      onSave();
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-[18px] p-6 w-full max-w-md">
        <h3 className="text-[20px] font-extrabold mb-4">
          {date ? 'Modifier le jour' : 'Ajouter un jour'}
        </h3>

        {error && (
          <div className="bg-[rgba(215,38,30,0.1)] border border-[var(--red)] text-[var(--red)] p-3 rounded-[12px] mb-4 text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[12.5px] font-bold mb-1.5">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-[12.5px] font-bold mb-1.5">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              required
            >
              <option value="COURS">Cours</option>
              <option value="FERIE">Férié</option>
              <option value="VACANCES">Vacances</option>
              <option value="EXAMEN">Examen</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-[12.5px] font-bold mb-1.5">Libellé (optionnel)</label>
            <input
              type="text"
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              placeholder="Ex: Fête nationale"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[var(--card)] text-[var(--ink)] border border-[var(--line)] rounded-[12px] p-3 font-semibold text-[14px]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[var(--blue)] text-white rounded-[12px] p-3 font-semibold text-[14px] disabled:opacity-50"
            >
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
