/**
 * ==========================================================================
 * REGISTRO PRESENZE ORATORIO - js/app.js
 * Logica Condivisa: Data, Navigazione Laterale Mobile, Modali, PWA e Versione
 * ==========================================================================
 */

// 1. REGISTRAZIONE SERVICE WORKER (PWA - Installazione su Tablet & Smartphone)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => {
        console.log('PWA Service Worker registrato:', reg.scope);
      })
      .catch((err) => {
        console.warn('Registrazione Service Worker non riuscita:', err);
      });
  });
}

// 2. CAMBIO TITOLO DINAMICO DELLA SCHEDA BROWSER
function updateBrowserTitle(titleText) {
  if (titleText) {
    document.title = `${titleText} • Oratorio & Catechismo`;
  }
}

// 3. NOTIFICA TOAST
let toastTimeout = null;
function showToast(message) {
  const toastEl = document.getElementById('app-toast');
  if (!toastEl) return;

  toastEl.textContent = message;
  toastEl.style.display = 'block';

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = setTimeout(() => {
    toastEl.style.display = 'none';
  }, 2800);
}

// 3B. BARRA DI NAVIGAZIONE LATERALE SU MOBILE
function initMobileSidebar() {
  const headerBrand = document.querySelector('.app-header .header-brand');
  const navWrapper = document.querySelector('.tab-nav-wrapper');
  if (!headerBrand || !navWrapper) return;

  if (!document.getElementById('mobileMenuToggle')) {
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.id = 'mobileMenuToggle';
    toggleBtn.className = 'mobile-menu-btn';
    toggleBtn.setAttribute('aria-label', 'Apri menu di navigazione');
    toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    headerBrand.insertBefore(toggleBtn, headerBrand.firstChild);
  }

  if (!navWrapper.querySelector('.mobile-sidebar-header')) {
    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'mobile-sidebar-header';
    sidebarHeader.innerHTML = `
      <div class="mobile-sidebar-title">
        <i class="fa-solid fa-church"></i>
        <span>Menu Navigazione</span>
      </div>
      <button type="button" id="mobileSidebarClose" class="mobile-sidebar-close" aria-label="Chiudi menu">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
    navWrapper.insertBefore(sidebarHeader, navWrapper.firstChild);
  }

  if (!document.getElementById('mobileSidebarClasses')) {
    const classesSection = document.createElement('div');
    classesSection.id = 'mobileSidebarClasses';
    classesSection.className = 'mobile-sidebar-classes';
    navWrapper.appendChild(classesSection);
  }

  let backdrop = document.getElementById('mobileSidebarBackdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'mobileSidebarBackdrop';
    backdrop.className = 'mobile-sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  function openSidebar() {
    navWrapper.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    navWrapper.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  window.closeMobileSidebar = closeSidebar;
  window.isMobileView = function () {
    return window.innerWidth <= 768;
  };

  const toggleBtn = document.getElementById('mobileMenuToggle');
  const closeBtn = document.getElementById('mobileSidebarClose');

  if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  backdrop.addEventListener('click', closeSidebar);

  navWrapper.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeSidebar);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navWrapper.classList.contains('open')) {
      closeSidebar();
    }
  });
}

// 3C. FOOTER VERSIONE AUTOMATICA IN FONDO ALLE PAGINE
function renderAppFooter() {
  if (document.getElementById('appVersionFooter')) return;
  const v = window.APP_VERSION || { count: 16, label: 'v1.16', updatedAt: '' };
  const footer = document.createElement('footer');
  footer.id = 'appVersionFooter';
  footer.className = 'app-footer';
  footer.innerHTML = `Registro Presenze Oratorio &amp; Catechismo &bull; Versione <strong>${escapeHtml(v.label)}</strong>`;
  document.body.appendChild(footer);
}

// 4. GESTIONE DATA CONDIVISA
function initHeaderDateControls() {
  const datePicker = document.getElementById('dataPicker');
  const btnPrev = document.getElementById('btnPrevDate');
  const btnNext = document.getElementById('btnNextDate');
  const btnToday = document.getElementById('btnToday');

  const currentDate = getCurrentDate();
  if (datePicker) {
    datePicker.value = currentDate;

    datePicker.addEventListener('change', (e) => {
      const newDate = e.target.value;
      if (newDate) {
        setCurrentDate(newDate);
        if (typeof window.onDateUpdated === 'function') {
          window.onDateUpdated(newDate);
        }
      }
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => shiftDate(-1));
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => shiftDate(1));
  }

  if (btnToday) {
    btnToday.addEventListener('click', () => {
      const today = getTodayString();
      setCurrentDate(today);
      if (datePicker) datePicker.value = today;
      if (typeof window.onDateUpdated === 'function') {
        window.onDateUpdated(today);
      }
    });
  }
}

function shiftDate(deltaDays) {
  const current = getCurrentDate();
  const parts = current.split('-');
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  d.setDate(d.getDate() + deltaDays);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const newDateStr = `${yyyy}-${mm}-${dd}`;

  setCurrentDate(newDateStr);
  const datePicker = document.getElementById('dataPicker');
  if (datePicker) datePicker.value = newDateStr;

  if (typeof window.onDateUpdated === 'function') {
    window.onDateUpdated(newDateStr);
  }
}

// 5. STATO CONNESSIONE DATABASE (Solo indicatore: Connesso / Offline)
function updateCloudStatus(isConnected) {
  const statusSpan = document.getElementById('supabaseStatus');
  const btn = document.getElementById('btnSyncDatabase') || document.getElementById('btnSupabaseConfig');

  if (statusSpan) {
    statusSpan.textContent = isConnected ? 'Database Connesso' : 'Database Offline';
  }
  if (btn) {
    if (isConnected) {
      btn.classList.add('connected');
      btn.classList.remove('offline');
      btn.setAttribute('title', 'Database Connesso: i dati sono sincronizzati');
    } else {
      btn.classList.remove('connected');
      btn.classList.add('offline');
      btn.setAttribute('title', 'Database Offline: i dati sono salvati sul dispositivo. Clicca per verificare la connessione');
    }
  }
}

// 6. PULSANTE SINCRONIZZAZIONE RAPIDA DATABASE (Nessuna password o chiave esposta)
function initDatabaseSyncButton() {
  const btn = document.getElementById('btnSyncDatabase') || document.getElementById('btnSupabaseConfig');
  if (!btn) return;

  btn.addEventListener('click', () => {
    showToast('Verifica sincronizzazione Database...');
    syncRemoteSupabase(getCurrentDate(), (connected) => {
      updateCloudStatus(connected);
      if (connected) {
        showToast('Database connesso e sincronizzato!');
        if (typeof window.onDataUpdated === 'function') {
          window.onDataUpdated();
        }
      } else {
        showToast('Database non raggiungibile (modalità offline attiva).');
      }
    });
  });
}

// 7. MODALE PROFILO ISCRITTO CON TELEFONI MULTIPLI + AMBITO USCITE/NOTE (OGGI vs ANNO)
let currentEditingPersonId = null;
let userTouchedCatechismoCheckbox = false;
let currentNoteScope = 'anno';
let scopeDrafts = {
  anno: { deleghe: '', note: '' },
  giorno: { deleghe: '', note: '' },
};

function formatShortItalianDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function updateScopeUI(selectedScope) {
  currentNoteScope = selectedScope;
  const optGiorno = document.getElementById('scopeOptGiorno');
  const optAnno = document.getElementById('scopeOptAnno');
  const radioGiorno = document.getElementById('radioScopeGiorno');
  const radioAnno = document.getElementById('radioScopeAnno');

  if (radioGiorno) radioGiorno.checked = selectedScope === 'giorno';
  if (radioAnno) radioAnno.checked = selectedScope === 'anno';
  if (optGiorno) optGiorno.classList.toggle('active', selectedScope === 'giorno');
  if (optAnno) optAnno.classList.toggle('active', selectedScope === 'anno');

  const lblDeleghe = document.querySelector('label[for="inputDeleghe"]');
  const lblNote = document.querySelector('label[for="inputNote"]');
  if (lblDeleghe) {
    lblDeleghe.textContent = selectedScope === 'giorno'
      ? 'Uscite anticipate / Deleghe (Solo per oggi)'
      : 'Uscite / Deleghe (Per tutto l\'anno)';
  }
  if (lblNote) {
    lblNote.textContent = selectedScope === 'giorno'
      ? 'Note per gli animatori (Solo per oggi)'
      : 'Note aggiuntive (Per tutto l\'anno)';
  }
}

function ensureScopeSelectorInModal() {
  const inputDeleghe = document.getElementById('inputDeleghe');
  if (!inputDeleghe || document.getElementById('usciteNoteScopeBox')) return;

  const delegheGroup = inputDeleghe.closest('.form-group');
  if (!delegheGroup || !delegheGroup.parentElement) return;

  const box = document.createElement('div');
  box.id = 'usciteNoteScopeBox';
  box.className = 'scope-toggle-box';
  box.innerHTML = `
    <div class="scope-toggle-title">
      <i class="fa-solid fa-calendar-week"></i>
      <span>Le uscite anticipate e le note valgono per tutto l'anno o solo per questo giorno?</span>
    </div>
    <div class="scope-options-row">
      <label class="scope-option" id="scopeOptGiorno">
        <input type="radio" name="usciteNoteScope" id="radioScopeGiorno" value="giorno">
        <span id="scopeLabelGiorno">Solo per oggi</span>
      </label>
      <label class="scope-option active" id="scopeOptAnno">
        <input type="radio" name="usciteNoteScope" id="radioScopeAnno" value="anno" checked>
        <span>Per tutto l'anno</span>
      </label>
    </div>
  `;

  delegheGroup.parentElement.insertBefore(box, delegheGroup);

  const handleScopeChange = (newScope) => {
    if (newScope === currentNoteScope) return;
    const delEl = document.getElementById('inputDeleghe');
    const noteEl = document.getElementById('inputNote');
    scopeDrafts[currentNoteScope] = {
      deleghe: delEl ? delEl.value : '',
      note: noteEl ? noteEl.value : '',
    };
    updateScopeUI(newScope);
    if (delEl) delEl.value = scopeDrafts[newScope].deleghe || '';
    if (noteEl) noteEl.value = scopeDrafts[newScope].note || '';
  };

  box.querySelector('#radioScopeGiorno').addEventListener('change', () => handleScopeChange('giorno'));
  box.querySelector('#radioScopeAnno').addEventListener('change', () => handleScopeChange('anno'));
}

function renderPhonesInModal(phonesList) {
  const container = document.getElementById('phonesContainer');
  if (!container) return;

  container.innerHTML = '';

  const phones = phonesList && phonesList.length > 0 ? phonesList : [{ etichetta: 'Mamma', numero: '' }];

  phones.forEach((p) => {
    const row = document.createElement('div');
    row.className = 'phone-input-row';
    row.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-bottom: 6px;';

    row.innerHTML = `
      <input
        type="text"
        class="form-input phone-label-input"
        style="width: 110px; flex-shrink: 0;"
        placeholder="Es. Mamma"
        value="${escapeHtml(p.etichetta || 'Famiglia')}"
      >
      <input
        type="tel"
        class="form-input phone-number-input"
        style="flex: 1;"
        placeholder="Numero di telefono"
        value="${escapeHtml(p.numero || '')}"
      >
      <button
        type="button"
        class="btn-danger-icon remove-phone-btn"
        style="background: #fee2e2; border: 1px solid #fecaca; color: #dc2626; border-radius: 6px; width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;"
        title="Rimuovi questo numero"
      >
        <i class="fa-solid fa-trash-can" style="font-size: 0.8rem;"></i>
      </button>
    `;

    const removeBtn = row.querySelector('.remove-phone-btn');
    removeBtn.addEventListener('click', () => {
      row.remove();
      if (container.children.length === 0) {
        renderPhonesInModal([{ etichetta: 'Famiglia', numero: '' }]);
      }
    });

    container.appendChild(row);
  });
}

function initPersonModal() {
  const modal = document.getElementById('personModal');
  const btnClose = document.getElementById('closePersonModal');
  const btnCancel = document.getElementById('cancelPersonModal');
  const btnDelete = document.getElementById('deletePersonBtn');
  const form = document.getElementById('personForm');
  const btnAddPhone = document.getElementById('btnAddPhoneField');

  if (!modal) return;

  ensureScopeSelectorInModal();

  function closeModal() {
    modal.classList.remove('open');
    currentEditingPersonId = null;
    userTouchedCatechismoCheckbox = false;
    if (form) form.reset();
  }

  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  const selectAnnoEl = document.getElementById('selectAnno');
  const inputCatEl = document.getElementById('inputCatechismo');
  if (inputCatEl) {
    inputCatEl.addEventListener('change', () => {
      userTouchedCatechismoCheckbox = true;
    });
  }
  if (selectAnnoEl && inputCatEl) {
    selectAnnoEl.addEventListener('change', () => {
      if (!currentEditingPersonId && !userTouchedCatechismoCheckbox) {
        inputCatEl.checked = CATECHISMO_CLASSES.some((c) => c.id === selectAnnoEl.value);
      }
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Aggiungi nuovo campo telefono
  if (btnAddPhone) {
    btnAddPhone.addEventListener('click', () => {
      const container = document.getElementById('phonesContainer');
      if (!container) return;
      const count = container.children.length;
      const defaultLabel = count === 0 ? 'Mamma' : count === 1 ? 'Papà' : count === 2 ? 'Nonna' : 'Altro';

      const row = document.createElement('div');
      row.className = 'phone-input-row';
      row.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-bottom: 6px;';

      row.innerHTML = `
        <input
          type="text"
          class="form-input phone-label-input"
          style="width: 110px; flex-shrink: 0;"
          placeholder="Es. Papà"
          value="${defaultLabel}"
        >
        <input
          type="tel"
          class="form-input phone-number-input"
          style="flex: 1;"
          placeholder="Numero di telefono"
        >
        <button
          type="button"
          class="btn-danger-icon remove-phone-btn"
          style="background: #fee2e2; border: 1px solid #fecaca; color: #dc2626; border-radius: 6px; width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;"
          title="Rimuovi questo numero"
        >
          <i class="fa-solid fa-trash-can" style="font-size: 0.8rem;"></i>
        </button>
      `;

      row.querySelector('.remove-phone-btn').addEventListener('click', () => {
        row.remove();
      });

      container.appendChild(row);
      row.querySelector('.phone-number-input').focus();
    });
  }

  // Gestione Eliminazione
  if (btnDelete) {
    btnDelete.addEventListener('click', () => {
      if (typeof canAddOrDeletePeople === 'function' && !canAddOrDeletePeople()) {
        showToast('Solo l\'amministratore può eliminare gli iscritti.');
        return;
      }
      if (!currentEditingPersonId) return;
      const people = getPeople();
      const person = people.find((p) => p.id === currentEditingPersonId);
      const name = person ? `${person.nome} ${person.cognome}` : 'questo iscritto';

      if (confirm(`Sei sicuro di voler eliminare ${name}?`)) {
        deleteSinglePerson(currentEditingPersonId);
        closeModal();
        showToast('Iscritto eliminato.');
        if (typeof window.onDataUpdated === 'function') {
          window.onDataUpdated();
        }
      }
    });
  }

  // Salvataggio form
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const isAnimatoreEdit = typeof isAnimatore === 'function' && isAnimatore();
      const canFullEdit = typeof canEditPeopleInfo === 'function' ? canEditPeopleInfo() : true;

      if (!canFullEdit && !isAnimatoreEdit) {
        showToast('Non hai i permessi per modificare i dati dei ragazzi.');
        return;
      }

      // Salva il contenuto attuale nel draft dello scope selezionato
      const delVal = (document.getElementById('inputDeleghe').value || '').trim();
      const noteVal = (document.getElementById('inputNote').value || '').trim();
      scopeDrafts[currentNoteScope] = { deleghe: delVal, note: noteVal };

      const isEdit = Boolean(currentEditingPersonId);
      const currentDate = getCurrentDate();

      if (isAnimatoreEdit) {
        if (!isEdit) {
          showToast('Gli animatori non possono inserire nuovi ragazzi.');
          return;
        }
        const existing = getPeople().find((p) => p.id === currentEditingPersonId);
        if (!existing) {
          closeModal();
          return;
        }

        if (currentNoteScope === 'anno') {
          const personToSave = {
            ...existing,
            deleghe: scopeDrafts.anno.deleghe,
            note: scopeDrafts.anno.note,
          };
          saveSinglePerson(personToSave);
          showToast('Uscite / Deleghe e Note annuali aggiornate!');
        } else {
          const dayAtt = getDayAttendance(currentDate);
          const currentRecord = dayAtt[existing.id] || {
            catechismo: false,
            oratorio: false,
            messa: false,
            uscito: false,
            oraUscita: '',
          };
          const updatedRecord = {
            ...currentRecord,
            noteGiorno: serializeDailyNoteAndExit(scopeDrafts.giorno.deleghe, scopeDrafts.giorno.note),
          };
          savePersonAttendance(currentDate, existing.id, updatedRecord);
          showToast(`Uscite / Note salvate per il ${formatShortItalianDate(currentDate)}!`);
        }

        closeModal();
        if (typeof window.onDataUpdated === 'function') {
          window.onDataUpdated();
        }
        return;
      }

      const nome = (document.getElementById('inputNome').value || '').trim();
      const cognome = (document.getElementById('inputCognome').value || '').trim();
      const ruolo = document.getElementById('selectRuolo').value;
      const anno = document.getElementById('selectAnno').value;
      const inputCat = document.getElementById('inputCatechismo');
      const iscrittoCatechismo = inputCat ? inputCat.checked : true;
      const allergie = (document.getElementById('inputAllergie').value || '').trim();

      if (!nome || !cognome) {
        alert('Inserisci sia il nome che il cognome!');
        return;
      }

      // Raccoglie tutti i telefoni inseriti
      const phones = [];
      const phoneRows = document.querySelectorAll('#phonesContainer .phone-input-row');
      phoneRows.forEach((r) => {
        const lbl = (r.querySelector('.phone-label-input')?.value || 'Famiglia').trim();
        const num = (r.querySelector('.phone-number-input')?.value || '').trim();
        if (num) {
          phones.push({ etichetta: lbl || 'Famiglia', numero: num });
        }
      });

      const personId = isEdit ? currentEditingPersonId : `p_${Date.now()}`;
      const personToSave = {
        id: personId,
        nome,
        cognome,
        ruolo,
        anno,
        iscrittoCatechismo,
        telefoni: phones,
        allergie,
        deleghe: scopeDrafts.anno.deleghe,
        note: scopeDrafts.anno.note,
      };

      saveSinglePerson(personToSave);

      // Se ci sono uscite/note giornaliere o l'utente ha modificato lo scope giornaliero, salva anche per oggi
      if (currentNoteScope === 'giorno' || scopeDrafts.giorno.deleghe || scopeDrafts.giorno.note) {
        const dayAtt = getDayAttendance(currentDate);
        const currentRecord = dayAtt[personId] || {
          catechismo: false,
          oratorio: false,
          messa: false,
          uscito: false,
          oraUscita: '',
        };
        const serializedDaily = serializeDailyNoteAndExit(scopeDrafts.giorno.deleghe, scopeDrafts.giorno.note);
        if (currentRecord.noteGiorno !== serializedDaily && (serializedDaily || currentRecord.noteGiorno)) {
          savePersonAttendance(currentDate, personId, {
            ...currentRecord,
            noteGiorno: serializedDaily,
          });
        }
      }

      closeModal();
      showToast(isEdit ? 'Profilo aggiornato!' : 'Nuovo iscritto salvato!');

      if (typeof window.onDataUpdated === 'function') {
        window.onDataUpdated();
      }
    });
  }
}

function openPersonModal(person, prefillAnno) {
  const canFullEdit = typeof canEditPeopleInfo === 'function' ? canEditPeopleInfo() : true;
  const isAnimatoreEdit = typeof isAnimatore === 'function' && isAnimatore();

  if (!person && (typeof canAddOrDeletePeople === 'function' && !canAddOrDeletePeople())) {
    showToast('Solo l\'amministratore può inserire nuovi iscritti.');
    return;
  }

  if (person && !canFullEdit && !isAnimatoreEdit) {
    showToast('Non hai i permessi per modificare i dati dei ragazzi.');
    return;
  }

  const modal = document.getElementById('personModal');
  const modalTitle = document.getElementById('personModalTitle');
  const btnDelete = document.getElementById('deletePersonBtn');
  const btnAddPhone = document.getElementById('btnAddPhoneField');

  if (!modal) return;

  ensureScopeSelectorInModal();

  currentEditingPersonId = person ? person.id : null;
  userTouchedCatechismoCheckbox = Boolean(person);

  if (modalTitle) {
    if (isAnimatoreEdit) {
      modalTitle.textContent = 'Uscite / Deleghe & Note';
    } else {
      modalTitle.textContent = person ? 'Modifica Iscritto' : 'Nuovo Iscritto';
    }
  }

  if (btnDelete) {
    btnDelete.style.display = person && canFullEdit ? 'inline-flex' : 'none';
  }
  if (btnAddPhone) {
    btnAddPhone.style.display = canFullEdit ? 'inline-block' : 'none';
  }

  // Precompila campi base
  const targetAnno = person ? person.anno || 'prima' : (prefillAnno || 'prima');
  document.getElementById('inputNome').value = person ? person.nome || '' : '';
  document.getElementById('inputCognome').value = person ? person.cognome || '' : '';
  document.getElementById('selectRuolo').value = person ? person.ruolo || 'Bambino' : 'Bambino';
  document.getElementById('selectAnno').value = targetAnno;

  const inputCat = document.getElementById('inputCatechismo');
  if (inputCat) {
    inputCat.checked = person
      ? Boolean(person.iscrittoCatechismo)
      : CATECHISMO_CLASSES.some((c) => c.id === targetAnno);
  }

  document.getElementById('inputAllergie').value = person ? person.allergie || '' : '';

  // Prepara i dati per i due ambiti (Annuale vs Giornaliero)
  const currentDate = getCurrentDate();
  const dayAtt = getDayAttendance(currentDate);
  const att = person ? dayAtt[person.id] : null;
  const dailyParsed = parseDailyNoteAndExit(att ? att.noteGiorno : '');

  scopeDrafts = {
    anno: {
      deleghe: person ? person.deleghe || '' : '',
      note: person ? person.note || '' : '',
    },
    giorno: {
      deleghe: dailyParsed.uscita || '',
      note: dailyParsed.note || '',
    },
  };

  const scopeLabelGiorno = document.getElementById('scopeLabelGiorno');
  if (scopeLabelGiorno) {
    scopeLabelGiorno.textContent = `Solo oggi (${formatShortItalianDate(currentDate)})`;
  }

  // Per l'animatore parte su "Solo oggi", per Admin su "Per tutto l'anno"
  const initialScope = isAnimatoreEdit ? 'giorno' : 'anno';
  updateScopeUI(initialScope);
  document.getElementById('inputDeleghe').value = scopeDrafts[initialScope].deleghe;
  document.getElementById('inputNote').value = scopeDrafts[initialScope].note;

  // Renderizza la lista dei telefoni
  const phones = person ? getPersonPhones(person) : [{ etichetta: 'Mamma', numero: '' }];
  renderPhonesInModal(phones);

  // Blocca tutti i campi anagrafici se Animatore, ma lascia modificabili Uscite/Deleghe e Note!
  const readOnlyIds = [
    'inputNome',
    'inputCognome',
    'selectRuolo',
    'selectAnno',
    'inputCatechismo',
    'inputAllergie',
  ];
  readOnlyIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = !canFullEdit;
  });

  document.getElementById('inputDeleghe').disabled = false;
  document.getElementById('inputNote').disabled = false;

  document.querySelectorAll('#phonesContainer .phone-label-input, #phonesContainer .phone-number-input').forEach((el) => {
    el.disabled = !canFullEdit;
  });
  document.querySelectorAll('#phonesContainer .remove-phone-btn').forEach((btn) => {
    btn.style.display = canFullEdit ? 'inline-flex' : 'none';
  });

  modal.classList.add('open');
  if (isAnimatoreEdit) {
    document.getElementById('inputDeleghe').focus();
  } else {
    document.getElementById('inputNome').focus();
  }
}

// Funzione globale per aprire modale modifica
window.editPerson = function (personId) {
  const people = getPeople();
  const found = people.find((p) => p.id === personId);
  if (found) {
    openPersonModal(found);
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 8. INIZIALIZZAZIONE ALL'AVVIO
document.addEventListener('DOMContentLoaded', async () => {
  initMobileSidebar();
  renderAppFooter();

  if (typeof window.whenAuthReady === 'function') {
    const session = await window.whenAuthReady();
    if (!session) return;
  }
  initHeaderDateControls();
  initDatabaseSyncButton();
  initPersonModal();

  // Verifica connessione al database Cloud e sincronizzazione
  syncRemoteSupabase(getCurrentDate(), (connected) => {
    updateCloudStatus(connected);
    if (connected && typeof window.onDataUpdated === 'function') {
      window.onDataUpdated();
    }
  });
});
