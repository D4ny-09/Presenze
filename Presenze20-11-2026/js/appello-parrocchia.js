/**
 * ==========================================================================
 * REGISTRO PRESENZE ORATORIO - js/appello-parrocchia.js
 * Logica per l'Appello Oratorio in Stile Elettronico (1ª Elem - 3ª Media + Staff)
 * ==========================================================================
 */

let selectedOratorioClass = localStorage.getItem('oratorio_classe_selezionata') || 'tutti';
let oratorioSearchQuery = '';

function isMobileAnimatoreLockedToAllClasses() {
  const isMob = typeof window.isMobileView === 'function' ? window.isMobileView() : window.innerWidth <= 768;
  const isAnim = typeof isAnimatore === 'function' && isAnimatore();
  return isMob && isAnim && selectedOratorioClass !== 'tutti';
}

// 1. RENDERING COMPLETO DELL'APPELLO ORATORIO
function renderAppelloOratorio() {
  const currentDate = getCurrentDate();
  const people = getPeople();
  const dayAttendance = getDayAttendance(currentDate);

  // Render Pillole Classi Oratorio
  renderOratorioClassPills(people);

  // Filtra per classe selezionata
  const classKids = people.filter((p) => {
    if (selectedOratorioClass === 'tutti') return true;
    return p.anno === selectedOratorioClass;
  }).sort((a, b) => (a.cognome || '').localeCompare(b.cognome || ''));

  // Aggiorna Titolo Scheda Browser
  const classLabel = selectedOratorioClass === 'tutti' ? 'Tutte le Classi' : (ANNO_LABELS[selectedOratorioClass] || selectedOratorioClass);
  updateBrowserTitle(`Appello ${classLabel} • Oratorio`);

  // Intestazioni Banner
  const titleEl = document.getElementById('oratorioAppelloTitle');
  const subtitleEl = document.getElementById('oratorioAppelloSubtitle');
  if (titleEl) titleEl.textContent = `Appello Oratorio • ${classLabel}`;
  if (subtitleEl) subtitleEl.textContent = `Anno Pastorale 2026/2027 • Appello del ${formatItalianDate(currentDate)}`;

  // Statistiche
  const total = classKids.length;
  let countPresenti = 0;
  let countUsciti = 0;

  classKids.forEach((k) => {
    const att = dayAttendance[k.id];
    if (att && att.oratorio) {
      countPresenti++;
      if (att.uscito) countUsciti++;
    }
  });

  const countAssenti = Math.max(0, total - countPresenti);

  document.getElementById('countOraIscritti').textContent = total;
  document.getElementById('countOraPresenti').textContent = countPresenti;
  document.getElementById('countOraAssenti').textContent = countAssenti;
  document.getElementById('countOraUsciti').textContent = countUsciti;

  // Filtra per ricerca testuale
  const filtered = classKids.filter((k) => {
    if (!oratorioSearchQuery.trim()) return true;
    const att = dayAttendance[k.id] || {};
    const daily = parseDailyNoteAndExit(att.noteGiorno || '');
    const q = oratorioSearchQuery.toLowerCase().trim();
    return `${k.cognome} ${k.nome} ${k.allergie || ''} ${k.deleghe || ''} ${k.note || ''} ${daily.uscita} ${daily.note}`.toLowerCase().includes(q);
  });

  const tableBody = document.getElementById('registerOratorioTableBody');
  const emptyState = document.getElementById('oratorioEmptyState');
  const tableEl = document.getElementById('registerOratorioTable');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (filtered.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (tableEl) tableEl.style.display = 'none';
    return;
  } else {
    if (emptyState) emptyState.style.display = 'none';
    if (tableEl) tableEl.style.display = 'table';
  }

  filtered.forEach((k, idx) => {
    const att = dayAttendance[k.id] || {
      catechismo: false,
      oratorio: false,
      messa: false,
      uscito: false,
      oraUscita: '',
      noteGiorno: '',
    };

    const daily = parseDailyNoteAndExit(att.noteGiorno || '');
    const isPresentInCortile = Boolean(att.oratorio);
    const initials = `${(k.nome || 'A').charAt(0)}${(k.cognome || 'B').charAt(0)}`.toUpperCase();
    const phones = getPersonPhones(k);
    const annoName = ANNO_LABELS[k.anno] || k.anno;

    const tr = document.createElement('tr');
    tr.className = isPresentInCortile ? 'row-presente' : 'row-assente';

    // Badge Telefoni Multipli
    let phonesHtml = '';
    if (phones.length > 0) {
      phonesHtml = phones
        .map(
          (p) => `
          <a
            href="tel:${escapeHtml(p.numero)}"
            class="btn-phone-pill"
            title="Chiama ${escapeHtml(p.etichetta)}"
          >
            <i class="fa-solid fa-phone"></i>
            <span>${escapeHtml(p.etichetta)}</span>
          </a>
        `
        )
        .join('');
    } else {
      phonesHtml = `<span style="color: #94a3b8; font-size: 0.75rem;">—</span>`;
    }

    // Badge Allergie sotto al nome
    const allergyHtml = k.allergie ? `
      <div style="margin-top: 4px;">
        <span style="background: #fee2e2; border: 1px solid #fecaca; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
          <i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(k.allergie)}
        </span>
      </div>
    ` : '';

    // Contenuto colonna Note (Uscite/Deleghe annuali e giornaliere + Note annuali e giornaliere)
    const noteBadges = [];
    if (daily.uscita) {
      noteBadges.push(`
        <span class="note-badge-multiline" style="background: #ffedd5; border: 1px solid #fdba74; color: #9a3412; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
          <i class="fa-solid fa-clock"></i> Oggi: ${escapeHtml(daily.uscita)}
        </span>
      `);
    }
    if (k.deleghe) {
      noteBadges.push(`
        <span class="note-badge-multiline" style="background: #fef3c7; border: 1px solid #fcd34d; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
          <i class="fa-solid fa-door-open"></i> ${escapeHtml(k.deleghe)}
        </span>
      `);
    }
    if (daily.note) {
      noteBadges.push(`
        <span class="note-badge-multiline" style="background: #e0e7ff; border: 1px solid #c7d2fe; color: #3730a3; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">
          Oggi: ${escapeHtml(daily.note)}
        </span>
      `);
    }
    if (k.note) {
      noteBadges.push(`
        <span class="note-badge-multiline" style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">
          ${escapeHtml(k.note)}
        </span>
      `);
    }

    const canMessa = typeof canToggleMessa === 'function' ? canToggleMessa() : true;
    const canUscita = typeof canToggleUscitaFamiglia === 'function' ? canToggleUscitaFamiglia() : true;
    const canFullEdit = typeof canEditPeopleInfo === 'function' ? canEditPeopleInfo() : true;
    const canNotes = typeof canEditNotes === 'function' ? canEditNotes() : true;
    const lockPaMobile = isMobileAnimatoreLockedToAllClasses();

    let uscitaCellHtml = '';
    if (isPresentInCortile) {
      if (att.uscito) {
        uscitaCellHtml = `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <strong style="color: #b91c1c; font-size: 0.8rem; display: flex; align-items: center; gap: 4px;">
              <i class="fa-solid fa-person-walking-arrow-right"></i>
              Uscito ore ${escapeHtml(att.oraUscita || '--:--')}
            </strong>
            ${canUscita ? `<button
              type="button"
              class="btn-toggle-uscita uscito"
              onclick="toggleUscitaGenitore('${k.id}')"
              style="font-size: 0.72rem; padding: 3px 8px;"
            >
              Annulla uscita
            </button>` : ''}
          </div>
        `;
      } else {
        uscitaCellHtml = `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <span style="color: #15803d; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 4px;">
              <i class="fa-solid fa-circle-check"></i>
              In Cortile
            </span>
            ${canUscita ? `<button
              type="button"
              class="btn-toggle-uscita"
              onclick="toggleUscitaGenitore('${k.id}')"
              style="font-size: 0.72rem; padding: 3px 8px;"
            >
              Segna uscita
            </button>` : ''}
          </div>
        `;
      }
    } else {
      uscitaCellHtml = `<span style="color: #94a3b8; font-size: 0.8rem; font-style: italic;">Non presente</span>`;
    }

    tr.innerHTML = `
      <!-- N° Progressivo -->
      <td class="col-num" style="font-weight: 800; color: #64748b;">
        ${idx + 1}
      </td>

      <!-- Ragazzo (Nome e Classe su due righe differenti) -->
      <td class="col-ragazzo">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 34px; height: 34px; border-radius: 8px; background: ${isPresentInCortile ? '#dcfce7' : '#e0f2fe'}; color: ${isPresentInCortile ? '#15803d' : '#4338ca'}; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; border: 1px solid ${isPresentInCortile ? '#86efac' : '#c7d2fe'}; flex-shrink: 0;">
            ${initials}
          </div>
          <div>
            <div style="font-size: 0.95rem; font-weight: 800; color: #0f172a; line-height: 1.2;">
              ${escapeHtml(k.cognome).toUpperCase()} ${escapeHtml(k.nome)}
            </div>
            <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; margin-top: 2px;">
              ${escapeHtml(annoName)}
            </div>
            ${allergyHtml}
          </div>
        </div>
      </td>

      <!-- Appello Oratorio P / A -->
      <td class="col-appello">
        <div class="pa-group" ${lockPaMobile ? 'style="opacity: 0.55;" title="Su telefono segna i presenti da Tutte le Classi"' : ''}>
          <button
            type="button"
            class="btn-pa btn-p ${isPresentInCortile ? 'active' : ''}"
            title="${lockPaMobile ? 'Su telefono segna i presenti solo da Tutte le Classi' : 'Presente in Oratorio (P)'}"
            onclick="setStudentOratorioPresence('${k.id}', true)"
          >
            P
          </button>
          <button
            type="button"
            class="btn-pa btn-a ${!isPresentInCortile ? 'active' : ''}"
            title="${lockPaMobile ? 'Su telefono segna i presenti solo da Tutte le Classi' : 'Assente dall\'Oratorio (A)'}"
            onclick="setStudentOratorioPresence('${k.id}', false)"
          >
            A
          </button>
        </div>
      </td>

      <!-- Messa -->
      <td class="col-messa">
        <button
          type="button"
          class="btn-reg-toggle ${att.messa ? 'active-messa' : ''}"
          ${!canMessa ? 'disabled style="cursor: not-allowed; opacity: 0.75;" title="Non autorizzato"' : `onclick="toggleOratorioPresenceAttribute('${k.id}', 'messa')" title="Partecipazione alla S. Messa"`}
        >
          <i class="fa-solid fa-cross"></i>
          <span>${att.messa ? 'Sì' : 'No'}</span>
        </button>
      </td>

      <!-- Stato Uscita -->
      <td class="col-uscita">
        ${uscitaCellHtml}
      </td>

      <!-- Telefoni -->
      <td class="col-telefoni">
        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          ${phonesHtml}
        </div>
      </td>

      <!-- Note & Uscite/Deleghe -->
      <td class="col-note">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${noteBadges.length > 0 ? noteBadges.join('') : '<span style="color: #94a3b8; font-size: 0.75rem;">—</span>'}
          </div>
          ${(canFullEdit || canNotes) ? `
          <button
            type="button"
            class="btn-icon-edit"
            title="${canFullEdit ? 'Modifica scheda iscritto' : 'Inserisci Uscite / Deleghe o Note'}"
            onclick="editPerson('${k.id}')"
          >
            <i class="fa-solid ${canFullEdit ? 'fa-pen-to-square' : 'fa-note-sticky'}"></i>
          </button>` : ''}
        </div>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

// 2. PILLOLE CLASSI ORATORIO (1ª Elem - 3ª Media + Staff)
function renderOratorioClassPills(people) {
  const container = document.getElementById('oratorioClassPillsContainer');
  if (!container) return;

  container.innerHTML = '';

  // Pillola "Tutte le Classi"
  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = `ora-pill-btn ${selectedOratorioClass === 'tutti' ? 'active' : ''}`;
  allBtn.innerHTML = `
    <span>Tutte le Classi</span>
    <span class="ora-pill-count">${people.length}</span>
  `;
  allBtn.onclick = () => {
    selectedOratorioClass = 'tutti';
    localStorage.setItem('oratorio_classe_selezionata', 'tutti');
    renderAppelloOratorio();
  };
  container.appendChild(allBtn);

  // Pillole per ciascuna classe dell'oratorio
  ORATORIO_CLASSES.forEach((c) => {
    const count = people.filter((p) => p.anno === c.id).length;
    const isActive = selectedOratorioClass === c.id;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `ora-pill-btn ${isActive ? 'active' : ''}`;
    btn.innerHTML = `
      <span>${c.label}</span>
      <span class="ora-pill-count">${count}</span>
    `;
    btn.onclick = () => {
      selectedOratorioClass = c.id;
      localStorage.setItem('oratorio_classe_selezionata', c.id);
      renderAppelloOratorio();
    };
    container.appendChild(btn);
  });

  // Popola anche il selettore classi nella barra laterale mobile
  const sidebarClasses = document.getElementById('mobileSidebarClasses');
  if (sidebarClasses) {
    sidebarClasses.innerHTML = `
      <div class="mobile-sidebar-classes-title">
        <i class="fa-solid fa-graduation-cap" style="color: #4f46e5;"></i>
        <span>Seleziona Classe</span>
      </div>
      <div class="mobile-sidebar-class-list" id="mobileSidebarClassList"></div>
    `;
    const listEl = sidebarClasses.querySelector('#mobileSidebarClassList');

    const makeSidebarBtn = (id, label, count) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `mobile-sidebar-class-btn ${selectedOratorioClass === id ? 'active' : ''}`;
      btn.innerHTML = `
        <span>${label}</span>
        <span class="mobile-sidebar-class-count">${count}</span>
      `;
      btn.onclick = () => {
        selectedOratorioClass = id;
        localStorage.setItem('oratorio_classe_selezionata', id);
        if (typeof window.closeMobileSidebar === 'function') {
          window.closeMobileSidebar();
        }
        renderAppelloOratorio();
      };
      listEl.appendChild(btn);
    };

    makeSidebarBtn('tutti', 'Tutte le Classi', people.length);
    ORATORIO_CLASSES.forEach((c) => {
      const count = people.filter((p) => p.anno === c.id).length;
      makeSidebarBtn(c.id, c.label, count);
    });
  }

  // Aggiorna stato pulsante "Segna Tutti Presenti" su mobile per animatori
  const btnTuttiPresenti = document.getElementById('btnOraTuttiPresenti');
  if (btnTuttiPresenti) {
    const locked = isMobileAnimatoreLockedToAllClasses();
    btnTuttiPresenti.style.opacity = locked ? '0.55' : '1';
    btnTuttiPresenti.title = locked ? 'Su telefono segna i presenti solo da Tutte le Classi' : '';
  }
}

// 3. TOGGLE PRESENZA IN ORATORIO P / A
window.setStudentOratorioPresence = function (personId, isPresent) {
  if (isMobileAnimatoreLockedToAllClasses()) {
    showToast('Su telefono gli animatori possono inserire i presenti solo da "Tutte le Classi".');
    return;
  }
  const currentDate = getCurrentDate();
  const dayAtt = getDayAttendance(currentDate);
  const currentRecord = dayAtt[personId] || {
    catechismo: false,
    oratorio: false,
    messa: false,
    uscito: false,
    oraUscita: '',
  };

  const updatedRecord = {
    ...currentRecord,
    oratorio: isPresent,
  };

  if (!isPresent) {
    updatedRecord.uscito = false;
    updatedRecord.oraUscita = '';
  }

  savePersonAttendance(currentDate, personId, updatedRecord);
  renderAppelloOratorio();
};

// 4. TOGGLE MESSA
window.toggleOratorioPresenceAttribute = function (personId, attr) {
  const canToggleAttr = attr === 'messa'
    ? (typeof canToggleMessa !== 'function' || canToggleMessa())
    : (typeof canToggleExtraAttributes !== 'function' || canToggleExtraAttributes());
  if (!canToggleAttr) {
    showToast('Solo l\'amministratore può modificare questo campo.');
    return;
  }
  const currentDate = getCurrentDate();
  const dayAtt = getDayAttendance(currentDate);
  const currentRecord = dayAtt[personId] || {
    catechismo: false,
    oratorio: false,
    messa: false,
    uscito: false,
    oraUscita: '',
  };

  const updatedRecord = {
    ...currentRecord,
    [attr]: !currentRecord[attr],
  };

  savePersonAttendance(currentDate, personId, updatedRecord);
  renderAppelloOratorio();
};

// 5. TOGGLE USCITA GENITORE
window.toggleUscitaGenitore = function (personId) {
  if (typeof canToggleUscitaFamiglia === 'function' && !canToggleUscitaFamiglia()) {
    showToast('Non hai i permessi per segnare l\'uscita.');
    return;
  }
  const currentDate = getCurrentDate();
  const dayAtt = getDayAttendance(currentDate);
  const currentRecord = dayAtt[personId] || {
    catechismo: false,
    oratorio: false,
    messa: false,
    uscito: false,
    oraUscita: '',
  };

  const isOut = Boolean(currentRecord.uscito);
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  const updatedRecord = {
    ...currentRecord,
    uscito: !isOut,
    oraUscita: !isOut ? `${hh}:${mm}` : '',
  };

  savePersonAttendance(currentDate, personId, updatedRecord);
  renderAppelloOratorio();
};

// 6. AZIONI RAPIDE BATCH
function markAllVisiblePresentOratorio() {
  if (isMobileAnimatoreLockedToAllClasses()) {
    showToast('Su telefono gli animatori possono inserire i presenti solo da "Tutte le Classi".');
    return;
  }
  const currentDate = getCurrentDate();
  const people = getPeople();
  const dayAtt = getDayAttendance(currentDate);

  const visible = people.filter((p) => {
    if (selectedOratorioClass === 'tutti') return true;
    return p.anno === selectedOratorioClass;
  });

  const updates = [];
  let count = 0;

  visible.forEach((p) => {
    const att = dayAtt[p.id] || { catechismo: false, oratorio: false, messa: false, uscito: false, oraUscita: '' };
    if (!att.oratorio) {
      updates.push({
        personId: p.id,
        record: { ...att, oratorio: true },
      });
      count++;
    }
  });

  if (count > 0) {
    batchSaveAttendance(currentDate, updates);
    renderAppelloOratorio();
    showToast(`${count} ragazzi segnati presenti in Oratorio!`);
  } else {
    showToast('Tutti i ragazzi selezionati sono già segnati presenti.');
  }
}

// 7. ESPORTA CSV
function exportOratorioCSV() {
  const currentDate = getCurrentDate();
  const people = getPeople();
  const dayAtt = getDayAttendance(currentDate);

  let csv = '\uFEFFData,Cognome,Nome,Ruolo,Classe,Presente in Cortile,Messa,Uscito,Ora Uscita,Telefoni,Allergie,Deleghe,Note\n';

  people.forEach((p) => {
    const att = dayAtt[p.id] || { catechismo: false, oratorio: false, messa: false, uscito: false, oraUscita: '', noteGiorno: '' };
    const daily = parseDailyNoteAndExit(att.noteGiorno || '');
    const phonesStr = getPersonPhones(p).map((t) => `${t.etichetta}: ${t.numero}`).join(' / ');
    const combinedDeleghe = [p.deleghe, daily.uscita ? `Oggi: ${daily.uscita}` : ''].filter(Boolean).join(' | ');
    const combinedNotes = [p.note, daily.note ? `Oggi: ${daily.note}` : ''].filter(Boolean).join(' | ');

    const row = [
      `"${currentDate}"`,
      `"${(p.cognome || '').replace(/"/g, '""')}"`,
      `"${(p.nome || '').replace(/"/g, '""')}"`,
      `"${p.ruolo}"`,
      `"${ANNO_LABELS[p.anno] || p.anno}"`,
      `"${att.oratorio ? 'Presente' : 'Assente'}"`,
      `"${att.messa ? 'Si' : 'No'}"`,
      `"${att.uscito ? 'Si' : 'No'}"`,
      `"${att.oraUscita || ''}"`,
      `"${phonesStr.replace(/"/g, '""')}"`,
      `"${(p.allergie || '').replace(/"/g, '""')}"`,
      `"${combinedDeleghe.replace(/"/g, '""')}"`,
      `"${combinedNotes.replace(/"/g, '""')}"`,
    ];
    csv += row.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `appello_oratorio_${currentDate}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('File CSV scaricato con successo!');
}

// 8. UTILITY DATA IN ITALIANO
function formatItalianDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  try {
    return d.toLocaleDateString('it-IT', options);
  } catch (e) {
    return dateStr;
  }
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

// 9. INIZIALIZZAZIONE ALL'AVVIO
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.whenAuthReady === 'function') {
    const session = await window.whenAuthReady();
    if (!session) return;
  }
  const btnTuttiPresenti = document.getElementById('btnOraTuttiPresenti');
  const btnNuovoIscritto = document.getElementById('btnOraNuovoIscritto');
  const btnExport = document.getElementById('btnOraExportCSV');
  const btnPrint = document.getElementById('btnOraPrint');
  const searchInput = document.getElementById('searchOratorioInput');

  if (btnTuttiPresenti) btnTuttiPresenti.addEventListener('click', markAllVisiblePresentOratorio);
  if (btnNuovoIscritto) {
    if (typeof canAddOrDeletePeople === 'function' && !canAddOrDeletePeople()) {
      btnNuovoIscritto.style.display = 'none';
    } else {
      btnNuovoIscritto.addEventListener('click', () => {
        const prefill = selectedOratorioClass !== 'tutti' ? selectedOratorioClass : 'prima';
        openPersonModal(null, prefill);
      });
    }
  }
  if (btnExport) btnExport.addEventListener('click', exportOratorioCSV);
  if (btnPrint) btnPrint.addEventListener('click', () => window.print());

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      oratorioSearchQuery = e.target.value;
      renderAppelloOratorio();
    });
  }

  renderAppelloOratorio();
});

// Callback aggiornamento data o dati
window.onDateUpdated = function () {
  renderAppelloOratorio();
};

window.onDataUpdated = function () {
  renderAppelloOratorio();
};

let resizeOratorioTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeOratorioTimer);
  resizeOratorioTimer = setTimeout(renderAppelloOratorio, 150);
});
