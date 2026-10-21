'use client';

import { useState, useEffect } from 'react';

interface Classe {
  id: string;
  nom: string;
  niveau: string;
  section?: string;
  effectifMax: number;
  annee: {
    libelle: string;
  };
  _count: {
    eleves: number;
  };
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClasse, setEditingClasse] = useState<Classe | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/classes', {
        credentials: 'include',
      });
      const data = await response.json();
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des classes:', error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingClasse(null);
    setShowModal(true);
  };

  const handleEdit = (classe: Classe) => {
    setEditingClasse(classe);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) return;

    try {
      const response = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        loadClasses();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const getNiveauLabel = (niveau: string) => {
    const labels: Record<string, string> = {
      MATERNELLE: 'Maternelle',
      PRIMAIRE: 'Primaire',
      SECONDAIRE: 'Secondaire',
    };
    return labels[niveau] || niveau;
  };

  return (
    <div>
      <div className="top flex justify-between items-center gap-3.5 flex-wrap mb-6">
        <div>
          <h2 className="text-[25px] font-extrabold tracking-[-0.5px]">Classes</h2>
          <p className="text-[var(--mut)] text-[13.5px] mt-0.5">
            Gestion des classes de l'école
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-[var(--blue)] text-white px-4 py-2 rounded-[12px] font-semibold text-[14px] hover:bg-[#1a4fa0] transition-colors"
        >
          + Nouvelle classe
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--mut)]">Chargement...</div>
      ) : classes.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-[18px] p-8 text-center">
          <p className="text-[var(--mut)] mb-4">Aucune classe créée</p>
          <button
            onClick={handleCreate}
            className="bg-[var(--blue)] text-white px-4 py-2 rounded-[12px] font-semibold text-[14px]"
          >
            Créer la première classe
          </button>
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-[18px] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--bg)]">
              <tr>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Nom</th>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Niveau</th>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Section</th>
                <th className="text-center p-4 text-[13px] font-semibold text-[var(--mut)]">Élèves</th>
                <th className="text-center p-4 text-[13px] font-semibold text-[var(--mut)]">Effectif max</th>
                <th className="text-center p-4 text-[13px] font-semibold text-[var(--mut)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((classe) => (
                <tr key={classe.id} className="border-t border-[var(--line)] hover:bg-[var(--bg)]">
                  <td className="p-4 font-semibold text-[14px]">{classe.nom}</td>
                  <td className="p-4 text-[13px] text-[var(--mut)]">
                    {getNiveauLabel(classe.niveau)}
                  </td>
                  <td className="p-4 text-[13px] text-[var(--mut)]">
                    {classe.section || '-'}
                  </td>
                  <td className="p-4 text-center text-[13px]">
                    <span className="bg-[var(--ok)] text-white px-2 py-1 rounded-[6px] text-[12px] font-semibold">
                      {classe._count.eleves}
                    </span>
                  </td>
                  <td className="p-4 text-center text-[13px] text-[var(--mut)]">
                    {classe.effectifMax}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEdit(classe)}
                      className="text-[var(--blue)] hover:text-[#1a4fa0] mr-3 text-[13px] font-semibold"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(classe.id)}
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
        <ClasseModal
          classe={editingClasse}
          onClose={() => {
            setShowModal(false);
            setEditingClasse(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingClasse(null);
            loadClasses();
          }}
        />
      )}
    </div>
  );
}

function ClasseModal({
  classe,
  onClose,
  onSave,
}: {
  classe: Classe | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    nom: classe?.nom || '',
    niveau: classe?.niveau || 'PRIMAIRE',
    section: classe?.section || '',
    effectifMax: classe?.effectifMax || 40,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Submitting form:', formData);

    try {
      const url = classe ? `/api/classes/${classe.id}` : '/api/classes';
      const method = classe ? 'PUT' : 'POST';

      console.log('Fetching:', url, method);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (e) {
          data = { error: 'Erreur serveur inconnue' };
        }
        console.error('Error response:', data);
        setError(data.error || 'Erreur lors de la sauvegarde');
        return;
      }

      onSave();
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-[18px] p-6 w-full max-w-md">
        <h3 className="text-[20px] font-extrabold mb-4">
          {classe ? 'Modifier la classe' : 'Nouvelle classe'}
        </h3>

        {error && (
          <div className="bg-[rgba(215,38,30,0.1)] border border-[var(--red)] text-[var(--red)] p-3 rounded-[12px] mb-4 text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[12.5px] font-bold mb-1.5">Nom de la classe</label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              required
              placeholder="Ex: 6e Primaire A"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[12.5px] font-bold mb-1.5">Niveau</label>
            <select
              value={formData.niveau}
              onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              required
            >
              <option value="MATERNELLE">Maternelle</option>
              <option value="PRIMAIRE">Primaire</option>
              <option value="SECONDAIRE">Secondaire</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-[12.5px] font-bold mb-1.5">Section (optionnel)</label>
            <input
              type="text"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              placeholder="Ex: Scientifique"
            />
          </div>

          <div className="mb-6">
            <label className="block text-[12.5px] font-bold mb-1.5">Effectif maximum</label>
            <input
              type="number"
              value={formData.effectifMax}
              onChange={(e) => setFormData({ ...formData, effectifMax: parseInt(e.target.value) })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              required
              min="1"
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
              {loading ? 'Sauvegarde...' : classe ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
