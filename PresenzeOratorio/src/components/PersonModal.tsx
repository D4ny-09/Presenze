import React, { useState, useEffect } from 'react';
import { FaXmark, FaFloppyDisk, FaTrashCan } from 'react-icons/fa6';
import type { Person, Anno, Ruolo } from '../types';
import { ANNO_LABELS } from '../constants';

interface PersonModalProps {
  isOpen: boolean;
  personToEdit: Person | null;
  onClose: () => void;
  onSave: (person: Person) => void;
  onDelete: (id: string) => void;
}

export const PersonModal: React.FC<PersonModalProps> = ({
  isOpen,
  personToEdit,
  onClose,
  onSave,
  onDelete,
}) => {
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [ruolo, setRuolo] = useState<Ruolo>('Bambino');
  const [anno, setAnno] = useState<Anno>('prima');
  const [iscrittoCatechismo, setIscrittoCatechismo] = useState(true);
  const [allergie, setAllergie] = useState('');
  const [deleghe, setDeleghe] = useState('');
  const [note, setNote] = useState('');
  const [telefono, setTelefono] = useState('');

  useEffect(() => {
    if (personToEdit) {
      setNome(personToEdit.nome || '');
      setCognome(personToEdit.cognome || '');
      setRuolo(personToEdit.ruolo || 'Bambino');
      setAnno(personToEdit.anno || 'prima');
      setIscrittoCatechismo(Boolean(personToEdit.iscrittoCatechismo));
      setAllergie(personToEdit.allergie || '');
      setDeleghe(personToEdit.deleghe || '');
      setNote(personToEdit.note || '');
      setTelefono(personToEdit.telefono || '');
    } else {
      setNome('');
      setCognome('');
      setRuolo('Bambino');
      setAnno('prima');
      setIscrittoCatechismo(true);
      setAllergie('');
      setDeleghe('');
      setNote('');
      setTelefono('');
    }
  }, [personToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !cognome.trim()) {
      alert('Inserisci sia il nome che il cognome!');
      return;
    }

    const savedPerson: Person = {
      id: personToEdit ? personToEdit.id : `p_${Date.now()}`,
      nome: nome.trim(),
      cognome: cognome.trim(),
      ruolo,
      anno,
      iscrittoCatechismo,
      allergie: allergie.trim(),
      deleghe: deleghe.trim(),
      note: note.trim(),
      telefono: telefono.trim(),
    };

    onSave(savedPerson);
  };

  const handleDelete = () => {
    if (!personToEdit) return;
    if (confirm(`Sei sicuro di voler eliminare ${personToEdit.nome} ${personToEdit.cognome}?`)) {
      onDelete(personToEdit.id);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {personToEdit ? 'Modifica Iscritto' : 'Nuovo Iscritto'}
          </h2>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <FaXmark />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="inputNome">Nome:</label>
            <input
              type="text"
              id="inputNome"
              className="form-input"
              required
              placeholder="Inserisci il nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="inputCognome">Cognome:</label>
            <input
              type="text"
              id="inputCognome"
              className="form-input"
              required
              placeholder="Inserisci il cognome"
              value={cognome}
              onChange={(e) => setCognome(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="selectRuolo">Ruolo:</label>
            <select
              id="selectRuolo"
              className="form-select"
              value={ruolo}
              onChange={(e) => setRuolo(e.target.value as Ruolo)}
            >
              <option value="Bambino">Bambino</option>
              <option value="Animatore">Animatore</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="selectAnno">Anno:</label>
            <select
              id="selectAnno"
              className="form-select"
              value={anno}
              onChange={(e) => setAnno(e.target.value as Anno)}
            >
              {(Object.keys(ANNO_LABELS) as Anno[]).map((key) => (
                <option key={key} value={key}>
                  {ANNO_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                id="inputCatechismo"
                checked={iscrittoCatechismo}
                onChange={(e) => setIscrittoCatechismo(e.target.checked)}
              />
              <span>Frequenta il Catechismo</span>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="inputAllergie">Allergie / Intolleranze alimentari:</label>
            <input
              type="text"
              id="inputAllergie"
              className="form-input"
              placeholder="Es. Lattosio, Glutine (Celiachia), Frutta a guscio..."
              value={allergie}
              onChange={(e) => setAllergie(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="inputDeleghe">Uscite / Deleghe:</label>
            <input
              type="text"
              id="inputDeleghe"
              className="form-input"
              placeholder="Es. Esce alle 16:30 con la nonna, Ritiro papà, Torna da solo..."
              value={deleghe}
              onChange={(e) => setDeleghe(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="inputNote">Note aggiuntive:</label>
            <textarea
              id="inputNote"
              className="form-textarea"
              rows={3}
              placeholder="Eventuali note utili per catechisti e animatori"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="form-actions">
            {personToEdit && (
              <button
                type="button"
                className="btn-danger"
                onClick={handleDelete}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FaTrashCan />
                <span>Elimina</span>
              </button>
            )}

            <button type="button" className="btn-secondary" onClick={onClose}>
              Annulla
            </button>

            <button
              type="submit"
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FaFloppyDisk />
              <span>Salva</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
