import React from 'react';
import {
  FaBookOpen,
  FaVolleyball,
  FaCross,
  FaPenToSquare,
  FaTriangleExclamation,
  FaIdCard,
  FaCircleCheck,
  FaPersonWalkingDashedLineArrowRight,
  FaHouse,
} from 'react-icons/fa6';
import type { Person, AttendanceRecord } from '../types';
import { ANNO_LABELS } from '../constants';

interface PersonCardProps {
  person: Person;
  attendance: AttendanceRecord;
  onTogglePresence: (personId: string, type: 'catechismo' | 'oratorio' | 'messa') => void;
  onToggleUscita: (personId: string) => void;
  onEdit: (person: Person) => void;
}

export const PersonCard: React.FC<PersonCardProps> = ({
  person,
  attendance,
  onTogglePresence,
  onToggleUscita,
  onEdit,
}) => {
  const isAnimatore = person.ruolo === 'Animatore';
  const initials = `${(person.nome || 'A').charAt(0)}${(person.cognome || 'B').charAt(0)}`.toUpperCase();
  const annoLabel = ANNO_LABELS[person.anno] || person.anno;

  const catActive = attendance.catechismo ? 'active-cat' : '';
  const oraActive = attendance.oratorio ? 'active-ora' : '';
  const mesActive = attendance.messa ? 'active-mes' : '';
  const presentOratorioClass = attendance.oratorio ? 'present-in-oratorio' : '';

  return (
    <div className={`person-card ${presentOratorioClass}`} id={`card-${person.id}`}>
      <div className="person-header">
        <div className="person-info">
          <div className={`avatar-circle ${isAnimatore ? 'avatar-animatore' : ''}`}>
            {initials}
          </div>
          <div className="person-name-group">
            <span className="person-fullname">
              {person.nome} {person.cognome}
            </span>
            <div className="person-meta">
              <span className={`badge ${isAnimatore ? 'badge-role' : 'badge-anno'}`}>
                {annoLabel}
              </span>
              {person.iscrittoCatechismo ? (
                <span className="badge badge-cat-yes">
                  <FaBookOpen style={{ marginRight: '4px' }} /> Catechismo
                </span>
              ) : (
                <span className="badge badge-cat-no">
                  <FaHouse style={{ marginRight: '4px' }} /> Solo Oratorio
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          className="btn-icon-edit"
          onClick={() => onEdit(person)}
          title="Modifica profilo e note"
        >
          <FaPenToSquare />
        </button>
      </div>

      {(person.allergie || person.deleghe || person.note) && (
        <div className="person-alerts">
          {person.allergie && (
            <div className="alert-allergy" title="Attenzione per la merenda">
              <FaTriangleExclamation />
              <span>
                <strong>Allergia:</strong> {person.allergie}
              </span>
            </div>
          )}

          {person.deleghe && (
            <div className="alert-delega">
              <FaIdCard />
              <span>
                <strong>Uscite/Deleghe:</strong> {person.deleghe}
              </span>
            </div>
          )}

          {person.note && (
            <div className="person-note">
              <span>{person.note}</span>
            </div>
          )}
        </div>
      )}

      <div className="presence-buttons-row">
        <button
          className={`btn-presence ${catActive}`}
          onClick={() => onTogglePresence(person.id, 'catechismo')}
          disabled={!person.iscrittoCatechismo}
          title={!person.iscrittoCatechismo ? 'Non frequenta il catechismo' : 'Segna presenza a catechismo'}
        >
          <FaBookOpen />
          <span>{attendance.catechismo ? 'Presente' : 'Catechismo'}</span>
        </button>

        <button
          className={`btn-presence ${oraActive}`}
          onClick={() => onTogglePresence(person.id, 'oratorio')}
          title="Segna se si ferma in oratorio per i giochi e doposcuola"
        >
          <FaVolleyball />
          <span>{attendance.oratorio ? 'In Oratorio' : 'Oratorio'}</span>
        </button>

        <button
          className={`btn-presence ${mesActive}`}
          onClick={() => onTogglePresence(person.id, 'messa')}
          title="Partecipazione alla S. Messa"
        >
          <FaCross />
          <span>{attendance.messa ? 'A Messa' : 'Messa'}</span>
        </button>
      </div>

      {attendance.oratorio && (
        <div className="uscita-row">
          <span>
            {attendance.uscito ? (
              <strong style={{ color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaPersonWalkingDashedLineArrowRight />
                Uscito alle {attendance.oraUscita || '--:--'}
              </strong>
            ) : (
              <span style={{ color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaCircleCheck />
                In cortile
              </span>
            )}
          </span>
          <button
            className={`btn-toggle-uscita ${attendance.uscito ? 'uscito' : ''}`}
            onClick={() => onToggleUscita(person.id)}
          >
            {attendance.uscito ? 'Annulla uscita' : 'Segna uscita genitore'}
          </button>
        </div>
      )}
    </div>
  );
};
