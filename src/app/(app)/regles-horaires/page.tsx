'use client';

import { useState, useEffect } from 'react';

interface RegleHoraire {
  id: string;
  session: string;
  heureDebut: string;
  heureLimite: string;
  heureTolerance: string;
  estActif: boolean;
  annee: {
    libelle: string;
  };
}

export default function ReglesHorairesPage() {
  const [regles, setRegles] = useState<RegleHoraire[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRegle, setEditingRegle] = useState<RegleHoraire | null>(null);

  useEffect(() => {
    loadRegles();
  }, []);

  const loadRegles = async () => {
    try {
      const response = await fetch('/api/regles-horaires', {
        credentials: 'include',
      });
      const data = await response.json();
      setRegles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des règles horaires:', error);
      setRegles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRegle(null);
    setShowModal(true);
  };

  const handleEdit = (regle: RegleHoraire) => {
    setEditingRegle(regle);
    setShowModal(true);
  };

  const handleToggle = async (id: string, estActif: boolean) => {
    try {
      const response = await fetch(`/api/regles-horaires/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ estActif: !estActif }),
      });

      if (response.ok) {
        loadRegles();
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) return;

    try {
      const response = await fetch(`/api/regles-horaires/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        loadRegles();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const getSessionLabel = (session: string) => {
    const labels: Record<string, string> = {
      MATIN: 'Matin',
      APRES_MIDI: 'Après-midi',
    };
    return labels[session] || session;
  };

  return (
    <div>
      <div className="top flex justify-between items-center gap-3.5 flex-wrap mb-6">
        <div>
          <h2 className="text-[25px] font-extrabold tracking-[-0.5px]">Règles horaires</h2>
          <p className="text-[var(--mut)] text-[13.5px] mt-0.5">
            Configuration des horaires de présence
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-[var(--blue)] text-white px-4 py-2 rounded-[12px] font-semibold text-[14px] hover:bg-[#1a4fa0] transition-colors"
        >
          + Nouvelle règle
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--mut)]">Chargement...</div>
      ) : regles.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-[18px] p-8 text-center">
          <p className="text-[var(--mut)] mb-4">Aucune règle horaire configurée</p>
          <button
            onClick={handleCreate}
            className="bg-[var(--blue)] text-white px-4 py-2 rounded-[12px] font-semibold text-[14px]"
          >
            Créer la première règle
          </button>
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-[18px] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--bg)]">
              <tr>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Session</th>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Heure début</th>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Heure limite</th>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Tolérance</th>
                <th className="text-center p-4 text-[13px] font-semibold text-[var(--mut)]">Statut</th>
                <th className="text-center p-4 text-[13px] font-semibold text-[var(--mut)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {regles.map((regle) => (
                <tr key={regle.id} className="border-t border-[var(--line)] hover:bg-[var(--bg)]">
                  <td className="p-4 font-semibold text-[14px]">
                    {getSessionLabel(regle.session)}
                  </td>
                  <td className="p-4 text-[13px] text-[var(--mut)]">
                    {regle.heureDebut}
                  </td>
                  <td className="p-4 text-[13px] text-[var(--mut)]">
                    {regle.heureLimite}
                  </td>
                  <td className="p-4 text-[13px] text-[var(--mut)]">
                    {regle.heureTolerance}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleToggle(regle.id, regle.estActif)}
                      className={`px-2 py-1 rounded-[6px] text-[12px] font-semibold ${
                        regle.estActif
                          ? 'bg-[var(--ok)] text-white'
                          : 'bg-[var(--mut)] text-white'
                      }`}
                    >
                      {regle.estActif ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEdit(regle)}
                      className="text-[var(--blue)] hover:text-[#1a4fa0] mr-3 text-[13px] font-semibold"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(regle.id)}
                      className="text-[var(--red)] hover:text-[#b81a14] text-[13px] font-semibold"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <RegleModal
          regle={editingRegle}
          onClose={() => {
            setShowModal(false);
            setEditingRegle(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingRegle(null);
            loadRegles();
          }}
        />
      )}
    </div>
  );
}

function RegleModal({
  regle,
  onClose,
  onSave,
}: {
  regle: RegleHoraire | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    session: regle?.session || 'APRES_MIDI',
    heureDebut: regle?.heureDebut || '12:30',
    heureLimite: regle?.heureLimite || '13:00',
    heureTolerance: regle?.heureTolerance || '14:00',
    estActif: regle?.estActif ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = regle ? `/api/regles-horaires/${regle.id}` : '/api/regles-horaires';
      const method = regle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
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
          {regle ? 'Modifier la règle' : 'Nouvelle règle horaire'}
        </h3>

        {error && (
          <div className="bg-[rgba(215,38,30,0.1)] border border-[var(--red)] text-[var(--red)] p-3 rounded-[12px] mb-4 text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[12.5px] font-bold mb-1.5">Session</label>
            <select
              value={formData.session}
              onChange={(e) => setFormData({ ...formData, session: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              required
            >
              <option value="MATIN">Matin</option>
              <option value="APRES_MIDI">Après-midi</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-[12.5px] font-bold mb-1.5">Heure de début</label>
            <input
              type="time"
              value={formData.heureDebut}
              onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-[12.5px] font-bold mb-1.5">Heure limite (présence)</label>
            <input
              type="time"
              value={formData.heureLimite}
              onChange={(e) => setFormData({ ...formData, heureLimite: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-[12.5px] font-bold mb-1.5">Heure de tolérance</label>
            <input
              type="time"
              value={formData.heureTolerance}
              onChange={(e) => setFormData({ ...formData, heureTolerance: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              required
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.estActif}
                onChange={(e) => setFormData({ ...formData, estActif: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-[12.5px] font-bold">Règle active</span>
            </label>
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
              {loading ? 'Sauvegarde...' : regle ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
