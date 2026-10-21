'use client';

import { useState, useEffect } from 'react';

interface Parent {
  id: string;
  nom: string;
  postnom: string;
  prenom: string;
  lien: string;
  telephoneE164?: string;
  whatsappE164?: string;
  email?: string;
  canalPrefere: string;
  _count: {
    liensEleve: number;
  };
}

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadParents();
  }, []);

  const loadParents = async () => {
    try {
      const response = await fetch('/api/parents', {
        credentials: 'include',
      });
      const data = await response.json();
      setParents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des parents:', error);
      setParents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredParents = parents.filter(
    (parent) =>
      parent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.postnom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (parent.email && parent.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreate = () => {
    setEditingParent(null);
    setShowModal(true);
  };

  const handleEdit = (parent: Parent) => {
    setEditingParent(parent);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce parent ?')) return;

    try {
      const response = await fetch(`/api/parents/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        loadParents();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const getLienLabel = (lien: string) => {
    const labels: Record<string, string> = {
      PERE: 'Père',
      MERE: 'Mère',
      TUTEUR: 'Tuteur',
      AUTRE: 'Autre',
    };
    return labels[lien] || lien;
  };

  const getCanalLabel = (canal: string) => {
    const labels: Record<string, string> = {
      SMS: 'SMS',
      WHATSAPP: 'WhatsApp',
      EMAIL: 'E-mail',
      AUCUN: 'Aucun',
    };
    return labels[canal] || canal;
  };

  return (
    <div>
      <div className="top flex justify-between items-center gap-3.5 flex-wrap mb-6">
        <div>
          <h2 className="text-[25px] font-extrabold tracking-[-0.5px]">Parents</h2>
          <p className="text-[var(--mut)] text-[13.5px] mt-0.5">
            Gestion des parents d'élèves
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-[var(--blue)] text-white px-4 py-2 rounded-[12px] font-semibold text-[14px] hover:bg-[#1a4fa0] transition-colors"
        >
          + Nouveau parent
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher par nom, postnom, prénom ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="inp w-full max-w-md p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--mut)]">Chargement...</div>
      ) : filteredParents.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-[18px] p-8 text-center">
          <p className="text-[var(--mut)] mb-4">
            {searchTerm ? 'Aucun résultat trouvé' : 'Aucun parent enregistré'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreate}
              className="bg-[var(--blue)] text-white px-4 py-2 rounded-[12px] font-semibold text-[14px]"
            >
              Créer le premier parent
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-[18px] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--bg)]">
              <tr>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Nom complet</th>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Lien</th>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Téléphone</th>
                <th className="text-left p-4 text-[13px] font-semibold text-[var(--mut)]">Email</th>
                <th className="text-center p-4 text-[13px] font-semibold text-[var(--mut)]">Canal préféré</th>
                <th className="text-center p-4 text-[13px] font-semibold text-[var(--mut)]">Enfants</th>
                <th className="text-center p-4 text-[13px] font-semibold text-[var(--mut)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParents.map((parent) => (
                <tr key={parent.id} className="border-t border-[var(--line)] hover:bg-[var(--bg)]">
                  <td className="p-4 font-semibold text-[14px]">
                    {parent.nom} {parent.postnom} {parent.prenom}
                  </td>
                  <td className="p-4 text-[13px] text-[var(--mut)]">
                    {getLienLabel(parent.lien)}
                  </td>
                  <td className="p-4 text-[13px] text-[var(--mut)]">
                    {parent.telephoneE164 || '-'}
                  </td>
                  <td className="p-4 text-[13px] text-[var(--mut)]">
                    {parent.email || '-'}
                  </td>
                  <td className="p-4 text-center text-[13px] text-[var(--mut)]">
                    {getCanalLabel(parent.canalPrefere)}
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-[var(--blue)] text-white px-2 py-1 rounded-[6px] text-[12px] font-semibold">
                      {parent._count.liensEleve}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEdit(parent)}
                      className="text-[var(--blue)] hover:text-[#1a4fa0] mr-3 text-[13px] font-semibold"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(parent.id)}
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
        <ParentModal
          parent={editingParent}
          onClose={() => {
            setShowModal(false);
            setEditingParent(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingParent(null);
            loadParents();
          }}
        />
      )}
    </div>
  );
}

function ParentModal({
  parent,
  onClose,
  onSave,
}: {
  parent: Parent | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    nom: parent?.nom || '',
    postnom: parent?.postnom || '',
    prenom: parent?.prenom || '',
    lien: parent?.lien || 'PERE',
    telephoneE164: parent?.telephoneE164 || '',
    whatsappE164: parent?.whatsappE164 || '',
    email: parent?.email || '',
    canalPrefere: parent?.canalPrefere || 'AUCUN',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = parent ? `/api/parents/${parent.id}` : '/api/parents';
      const method = parent ? 'PUT' : 'POST';

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
          {parent ? 'Modifier le parent' : 'Nouveau parent'}
        </h3>

        {error && (
          <div className="bg-[rgba(215,38,30,0.1)] border border-[var(--red)] text-[var(--red)] p-3 rounded-[12px] mb-4 text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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

          <div className="mb-4">
            <label className="block text-[12.5px] font-bold mb-1.5">Lien</label>
            <select
              value={formData.lien}
              onChange={(e) => setFormData({ ...formData, lien: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              required
            >
              <option value="PERE">Père</option>
              <option value="MERE">Mère</option>
              <option value="TUTEUR">Tuteur</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-[12.5px] font-bold mb-1.5">Téléphone (format E.164)</label>
            <input
              type="text"
              value={formData.telephoneE164}
              onChange={(e) => setFormData({ ...formData, telephoneE164: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              placeholder="+243999123456"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[12.5px] font-bold mb-1.5">WhatsApp (format E.164)</label>
            <input
              type="text"
              value={formData.whatsappE164}
              onChange={(e) => setFormData({ ...formData, whatsappE164: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              placeholder="+243999123456"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[12.5px] font-bold mb-1.5">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
            />
          </div>

          <div className="mb-6">
            <label className="block text-[12.5px] font-bold mb-1.5">Canal de notification préféré</label>
            <select
              value={formData.canalPrefere}
              onChange={(e) => setFormData({ ...formData, canalPrefere: e.target.value })}
              className="inp w-full p-3 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 focus:border-[var(--blue)]"
              required
            >
              <option value="AUCUN">Aucun</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">E-mail</option>
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
              {loading ? 'Sauvegarde...' : parent ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
