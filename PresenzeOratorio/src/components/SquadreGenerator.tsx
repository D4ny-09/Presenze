import React, { useState, useEffect } from 'react';
import { FaDice, FaWhatsapp, FaUsers, FaUsersSlash } from 'react-icons/fa6';
import type { Person, AttendanceRecord, GeneratedTeam } from '../types';
import { TEAM_DEFINITIONS, ANNO_LABELS, ANNO_WEIGHTS } from '../constants';

interface SquadreGeneratorProps {
  currentDate: string;
  people: Person[];
  attendance: Record<string, AttendanceRecord>;
  onShowToast: (msg: string) => void;
}

export const SquadreGenerator: React.FC<SquadreGeneratorProps> = ({
  currentDate,
  people,
  attendance,
  onShowToast,
}) => {
  const [numSquadre, setNumSquadre] = useState<number>(4);
  const [bilanciaEta, setBilanciaEta] = useState<boolean>(true);
  const [teams, setTeams] = useState<GeneratedTeam[]>([]);

  // Filtra solo i bambini segnati presenti in Oratorio per la data corrente
  const presentInOratorio = people.filter((p) => {
    const att = attendance[p.id];
    return att && att.oratorio && p.ruolo === 'Bambino';
  });

  const generateTeams = () => {
    if (presentInOratorio.length === 0) {
      setTeams([]);
      return;
    }

    const currentTeams: GeneratedTeam[] = Array.from(
      { length: numSquadre },
      (_, i) => ({
        definition: TEAM_DEFINITIONS[i % TEAM_DEFINITIONS.length],
        members: [],
      })
    );

    if (bilanciaEta) {
      // Ordina per classe/età (dai più grandi ai più piccoli)
      const sorted = [...presentInOratorio].sort(
        (a, b) => (ANNO_WEIGHTS[b.anno] || 0) - (ANNO_WEIGHTS[a.anno] || 0)
      );

      // Distribuzione a serpente (snake draft)
      let teamIndex = 0;
      let direction = 1;

      sorted.forEach((person) => {
        currentTeams[teamIndex].members.push(person);
        teamIndex += direction;
        if (teamIndex >= numSquadre) {
          teamIndex = numSquadre - 1;
          direction = -1;
        } else if (teamIndex < 0) {
          teamIndex = 0;
          direction = 1;
        }
      });
    } else {
      // Distribuzione casuale
      const shuffled = [...presentInOratorio].sort(() => Math.random() - 0.5);
      shuffled.forEach((person, idx) => {
        currentTeams[idx % numSquadre].members.push(person);
      });
    }

    setTeams(currentTeams);
  };

  useEffect(() => {
    generateTeams();
  }, [numSquadre, bilanciaEta, currentDate, presentInOratorio.length]);

  const copyForWhatsApp = () => {
    if (teams.length === 0 || teams.every((t) => t.members.length === 0)) {
      onShowToast('Nessuna squadra da copiare. Segna prima i presenti in oratorio!');
      return;
    }

    const total = teams.reduce((acc, t) => acc + t.members.length, 0);
    let text = `SQUADRE GIOCHI ORATORIO (${currentDate})\n`;
    text += `Totale ragazzi in campo: ${total}\n\n`;

    teams.forEach((t) => {
      text += `[${t.definition.name.toUpperCase()}] (${t.members.length} giocatori)\n`;
      t.members.forEach((m) => {
        const anno = ANNO_LABELS[m.anno] || m.anno;
        text += `  - ${m.nome} ${m.cognome} (${anno})\n`;
      });
      text += '\n';
    });

    text += 'Buon gioco a tutti!';

    navigator.clipboard
      .writeText(text)
      .then(() => {
        onShowToast('Squadre copiate negli appunti per WhatsApp!');
      })
      .catch(() => {
        onShowToast('Errore durante la copia. Seleziona il testo manualmente.');
      });
  };

  return (
    <section id="SquadreContainer" className="main-content">
      <div className="squadre-panel">
        <div className="squadre-controls">
          <div className="squadre-options">
            <div className="control-item">
              <label htmlFor="numSquadre">Numero di squadre:</label>
              <select
                id="numSquadre"
                className="filter-select"
                value={numSquadre}
                onChange={(e) => setNumSquadre(parseInt(e.target.value, 10))}
              >
                <option value={2}>2 Squadre</option>
                <option value={3}>3 Squadre</option>
                <option value={4}>4 Squadre</option>
                <option value={5}>5 Squadre</option>
                <option value={6}>6 Squadre</option>
              </select>
            </div>

            <div className="control-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  id="checkBilanciaEta"
                  checked={bilanciaEta}
                  onChange={(e) => setBilanciaEta(e.target.checked)}
                />
                <span>Bilancia per età (elementari & medie)</span>
              </label>
            </div>
          </div>

          <div className="quick-action-buttons">
            <button
              id="btnGeneraSquadre"
              className="btn-action-oratorio"
              onClick={generateTeams}
            >
              <FaDice />
              <span>Rigenera Squadre</span>
            </button>

            <button
              id="btnCopiaSquadre"
              className="btn-action-secondary"
              title="Copia testo formattato per WhatsApp (senza emoji)"
              onClick={copyForWhatsApp}
            >
              <FaWhatsapp />
              <span>Copia per WhatsApp</span>
            </button>
          </div>
        </div>

        {presentInOratorio.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FaUsersSlash />
            </div>
            <h3 style={{ fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              Nessun ragazzo in Oratorio oggi
            </h3>
            <p style={{ fontSize: '0.85rem' }}>
              Torna alla scheda <strong>Appello</strong> e segna i ragazzi presenti in Oratorio
              (puoi usare il tasto <em>"Fermali tutti in Oratorio"</em>).
            </p>
          </div>
        ) : (
          <div className="teams-grid">
            {teams.map((t) => (
              <div className="team-card" key={t.definition.id}>
                <div
                  className="team-header"
                  style={{
                    backgroundColor: t.definition.headerBg,
                    color: t.definition.headerText,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaUsers />
                    {t.definition.name}
                  </span>
                  <span
                    className="team-count-badge"
                    style={{ backgroundColor: t.definition.badgeBg }}
                  >
                    {t.members.length} giocatori
                  </span>
                </div>

                <div className="team-members-list">
                  {t.members.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>
                      Nessun componente
                    </p>
                  ) : (
                    t.members.map((m) => (
                      <div className="team-member-item" key={m.id}>
                        <span>
                          {m.nome} {m.cognome}
                        </span>
                        <span className="team-member-class">
                          {ANNO_LABELS[m.anno] || m.anno}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
