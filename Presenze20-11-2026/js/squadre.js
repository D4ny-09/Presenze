/**
 * ==========================================================================
 * REGISTRO PRESENZE ORATORIO - js/squadre.js
 * Logica per il Generatore Squadre Giochi
 * ==========================================================================
 */

let currentTeams = [];
let numSquadre = 4;
let bilanciaEta = true;

// 1. GENERAZIONE DELLE SQUADRE
function generateTeams() {
  updateBrowserTitle('Generatore Squadre • Oratorio');
  const currentDate = getCurrentDate();
  const people = getPeople();
  const dayAttendance = getDayAttendance(currentDate);

  // Filtra solo i bambini segnati presenti in Oratorio oggi
  const presentInOratorio = people.filter((p) => {
    const att = dayAttendance[p.id];
    return att && att.oratorio && p.ruolo === 'Bambino';
  });

  const emptyState = document.getElementById('squadreEmptyState');
  const teamsGrid = document.getElementById('teamsGrid');

  if (presentInOratorio.length === 0) {
    currentTeams = [];
    if (emptyState) emptyState.style.display = 'block';
    if (teamsGrid) teamsGrid.innerHTML = '';
    return;
  } else {
    if (emptyState) emptyState.style.display = 'none';
  }

  // Prepara l'array delle squadre
  const teams = Array.from({ length: numSquadre }, (_, i) => ({
    definition: TEAM_DEFINITIONS[i % TEAM_DEFINITIONS.length],
    members: [],
  }));

  if (bilanciaEta) {
    // Ordina per età/classe decrescente (dai più grandi ai più piccoli)
    const sorted = [...presentInOratorio].sort(
      (a, b) => (ANNO_WEIGHTS[b.anno] || 0) - (ANNO_WEIGHTS[a.anno] || 0)
    );

    // Distribuzione a serpente (Snake Draft)
    let teamIndex = 0;
    let direction = 1;

    sorted.forEach((person) => {
      teams[teamIndex].members.push(person);
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
    // Distribuzione casuale pura
    const shuffled = [...presentInOratorio].sort(() => Math.random() - 0.5);
    shuffled.forEach((person, idx) => {
      teams[idx % numSquadre].members.push(person);
    });
  }

  currentTeams = teams;
  renderTeams();
}

// 2. RENDERING DELLE CARD SQUADRA
function renderTeams() {
  const teamsGrid = document.getElementById('teamsGrid');
  if (!teamsGrid) return;

  teamsGrid.innerHTML = '';

  currentTeams.forEach((t) => {
    const card = document.createElement('div');
    card.className = 'team-card';

    let membersHtml = '';
    if (t.members.length === 0) {
      membersHtml = `
        <p style="font-size: 0.8rem; color: #94a3b8; text-align: center; padding: 10px;">
          Nessun componente
        </p>
      `;
    } else {
      membersHtml = t.members
        .map(
          (m) => `
          <div class="team-member-item">
            <span>${escapeHtml(m.nome)} ${escapeHtml(m.cognome)}</span>
            <span class="team-member-class">${ANNO_LABELS[m.anno] || m.anno}</span>
          </div>
        `
        )
        .join('');
    }

    card.innerHTML = `
      <div class="team-header" style="background-color: ${t.definition.headerBg}; color: ${t.definition.headerText};">
        <span style="display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-users"></i>
          ${t.definition.name}
        </span>
        <span class="team-count-badge" style="background-color: ${t.definition.badgeBg};">
          ${t.members.length} giocatori
        </span>
      </div>

      <div class="team-members-list">
        ${membersHtml}
      </div>
    `;

    teamsGrid.appendChild(card);
  });
}

// 3. COPIA PER WHATSAPP
function copyForWhatsApp() {
  if (currentTeams.length === 0 || currentTeams.every((t) => t.members.length === 0)) {
    showToast('Nessuna squadra da copiare. Segna prima i presenti in oratorio!');
    return;
  }

  const currentDate = getCurrentDate();
  const total = currentTeams.reduce((acc, t) => acc + t.members.length, 0);

  let text = `SQUADRE GIOCHI ORATORIO (${currentDate})\n`;
  text += `Totale ragazzi in campo: ${total}\n\n`;

  currentTeams.forEach((t) => {
    text += `[${t.definition.name.toUpperCase()}] (${t.members.length} giocatori)\n`;
    t.members.forEach((m) => {
      const anno = ANNO_LABELS[m.anno] || m.anno;
      text += `  - ${m.nome} ${m.cognome} (${anno})\n`;
    });
    text += '\n';
  });

  text += 'Buon gioco a tutti!';

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast('Squadre copiate negli appunti per WhatsApp!');
      })
      .catch(() => {
        fallbackCopyText(text);
      });
  } else {
    fallbackCopyText(text);
  }
}

function fallbackCopyText(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('Squadre copiate negli appunti!');
  } catch (err) {
    showToast('Errore durante la copia. Seleziona manualmente il testo.');
  }
  document.body.removeChild(textArea);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 4. INIZIALIZZAZIONE EVENTI
document.addEventListener('DOMContentLoaded', () => {
  const selNum = document.getElementById('numSquadre');
  const checkBilancia = document.getElementById('checkBilanciaEta');
  const btnRigenera = document.getElementById('btnRigeneraSquadre');
  const btnWhatsApp = document.getElementById('btnCopiaSquadre');

  if (selNum) {
    selNum.value = numSquadre;
    selNum.addEventListener('change', (e) => {
      numSquadre = parseInt(e.target.value, 10);
      generateTeams();
    });
  }

  if (checkBilancia) {
    checkBilancia.checked = bilanciaEta;
    checkBilancia.addEventListener('change', (e) => {
      bilanciaEta = e.target.checked;
      generateTeams();
    });
  }

  if (btnRigenera) {
    btnRigenera.addEventListener('click', generateTeams);
  }

  if (btnWhatsApp) {
    btnWhatsApp.addEventListener('click', copyForWhatsApp);
  }

  generateTeams();
});

// Callback aggiornamento data o dati
window.onDateUpdated = function () {
  generateTeams();
};

window.onDataUpdated = function () {
  generateTeams();
};
