'use client';

import { useState, useEffect } from 'react';

interface Eleve {
  id: string;
  matricule: string;
  nom: string;
  postnom: string;
  prenom: string;
  sexe: string;
  dateNaissance: string;
  classe: {
    id: string;
    nom: string;
  };
  statut: string;
  qrPublicId: string;
}

interface Classe {
  id: string;
  nom: string;
}

export default function ElevesPage() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEleve, setEditingEleve] = useState<Eleve | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [elevesRes, classesRes] = await Promise.all([
        fetch('/api/eleves', { credentials: 'include' }),
        fetch('/api/classes', { credentials: 'include' }),
      ]);
      
      const elevesData = await elevesRes.json();
      const classesData = await classesRes.json();
      
      setEleves(Array.isArray(elevesData) ? elevesData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setEleves([]);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEleves = eleves.filter(
    (eleve) =>
      eleve.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eleve.postnom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eleve.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eleve.matricule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setEditingEleve(null);
    setShowModal(true);
  };

  const handleEdit = (eleve: Eleve) => {
    setEditingEleve(eleve);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) return;

    try {
      const response = await fetch(`/api/eleves/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      ACTIF: 'Actif',
      SUSPENDU: 'Suspendu',
      SORTI: 'Sorti',
    };
    return labels[statut] || statut;
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      ACTIF: 'bg-[var(--ok)]',
      SUSPENDU: 'bg-[var(--warn)]',
      SORTI: 'bg-[var(--red)]',
    };
    return colors[statut] || 'bg-[var(--mut)]';
  };

  return (
    <div>
      <div className="top flex justify-between items-center gap-3.5 flex-wrap mb-6">
        <div>
          <h2 className="text-[25px] font-extrabold tracking-[-0.5px]">Élèves</h2>
          <p className="text-[var(--mut)] text-[13.5px] mt-0.5">
            Gestion des élèves de l'école
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-[var(--blue)] text-white px-4 py-2 rounded-[12px] font-semibold text-[14px] hover:bg-[#1a4fa0] transition-colors"
        >
          + Nouvel élève
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher par nom, postnom, prénom ou matricule..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="inp w-full max-w-md p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--mut)]">Chargement...</div>
      ) : filteredEleves.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-[18px] p-8 text-center">
          <p className="text-[var(--mut)] mb-4">
            {searchTerm ? 'Aucun résultat trouvé' : 'Aucun élève enregistré'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreate}
              className="bg-[var(--blue)] text-white px-4 py-2 rounded-[12px] font-semibold text-[14px]"
            >
              Créer le premier élève
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-[18px] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--bg)]">
              <tr>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Matricule</th>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Nom complet</th>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Sexe</th>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Classe</th>
                <th className="text-center p-4 text-[13px] font-semibold text-[var(--mut)]">Statut</th>
                <th className="text-center p-4 text-[13px] font-semibold text-[var(--mut)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEleves.map((eleve) => (
                <tr key={eleve.id} className="border-t border-[var(--line)] hover:bg-[var(--bg)]">
                  <td className="p-4 font-mono text-[13px]">{eleve.matricule}</td>
                  <td className="p-4 font-semibold text-[14px]">
                    {eleve.nom} {eleve.postnom} {eleve.prenom}
                  </td>
                  <td className="p-4 text-[13px] text-[var(--mut)]">{eleve.sexe}</td>
                  <td className="p-4 text-[13px] text-[var(--mut)]">{eleve.classe.nom}</td>
                  <td className="p-4 text-center">
                    <span
                      className={`${getStatutColor(eleve.statut)} text-white px-2 py-1 rounded-[6px] text-[12px] font-semibold`}
                    >
                      {getStatutLabel(eleve.statut)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEdit(eleve)}
                      className="text-[var(--blue)] hover:text-[#1a4fa0] mr-3 text-[13px] font-semibold"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(eleve.id)}
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
        <EleveModal
          eleve={editingEleve}
          classes={classes}
          onClose={() => {
            setShowModal(false);
            setEditingEleve(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingEleve(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function EleveModal({
  eleve,
  classes,
  onClose,
  onSave,
}: {
  eleve: Eleve | null;
  classes: Classe[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    matricule: eleve?.matricule || '',
    nom: eleve?.nom || '',
    postnom: eleve?.postnom || '',
    prenom: eleve?.prenom || '',
    sexe: eleve?.sexe || 'M',
    dateNaissance: eleve?.dateNaissance?.split('T')[0] || '',
    classeId: eleve?.classe.id || '',
    statut: eleve?.statut || 'ACTIF',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = eleve ? `/api/eleves/${eleve.id}` : '/api/eleves';
      const method = eleve ? 'PUT' : 'POST';

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
      <div className="bg-[var(--card)] rounded-[18px] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-[20px] font-extrabold mb-4">
          {eleve ? 'Modifier l\'élève' : 'Nouvel élève'}
        </h3>

        {error && (
          <div className="bg-[rgba(215,38,30,0.1)] border border-[var(--red)] text-[var(--red)] p-3 rounded-[12px] mb-4 text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[12.5px] font-bold mb-1.5">Matricule</label>
            <input
              type="text"
              value={formData.matricule}
              onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              required
              placeholder="CSF-2026-00001"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[12.5px] font-bold mb-1.5">Nom</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
                required
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold mb-1.5">Postnom</label>
              <input
                type="text"
                value={formData.postnom}
                onChange={(e) => setFormData({ ...formData, postnom: e.target.value })}
                className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[12.5px] font-bold mb-1.5">Prénom</label>
            <input
              type="text"
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[12.5px] font-bold mb-1.5">Sexe</label>
              <select
                value={formData.sexe}
                onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
                className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
                required
              >
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold mb-1.5">Date de naissance</label>
              <input
                type="date"
                value={formData.dateNaissance}
                onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[12.5px] font-bold mb-1.5">Classe</label>
            <select
              value={formData.classeId}
              onChange={(e) => setFormData({ ...formData, classeId: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              required
            >
              <option value="">Sélectionner une classe</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>
                  {classe.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-[12.5px] font-bold mb-1.5">Statut</label>
            <select
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              required
            >
              <option value="ACTIF">Actif</option>
              <option value="SUSPENDU">Suspendu</option>
              <option value="SORTI">Sorti</option>
            </select>
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
              {loading ? 'Sauvegarde...' : eleve ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
