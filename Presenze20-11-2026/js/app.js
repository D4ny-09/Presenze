/**
 * ==========================================================================
 * REGISTRO PRESENZE ORATORIO - js/app.js
 * Logica Condivisa: Data, Navigazione, Modali con Telefoni Multipli, PWA e Titoli
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

// 7. MODALE PROFILO ISCRITTO CON TELEFONI MULTIPLI
let currentEditingPersonId = null;
let userTouchedCatechismoCheckbox = false;

function renderPhonesInModal(phonesList) {
  const container = document.getElementById('phonesContainer');
  if (!container) return;

  container.innerHTML = '';

  const phones = phonesList && phonesList.length > 0 ? phonesList : [{ etichetta: 'Mamma', numero: '' }];

  phones.forEach((p, idx) => {
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

      const isNotesOnly = typeof isAnimatore === 'function' && isAnimatore();
      const canFullEdit = typeof canEditPeopleInfo === 'function' ? canEditPeopleInfo() : true;

      if (!canFullEdit && !isNotesOnly) {
        showToast('Non hai i permessi per modificare i dati dei ragazzi.');
        return;
      }

      const isEdit = Boolean(currentEditingPersonId);

      if (isNotesOnly) {
        if (!isEdit) {
          showToast('Gli animatori non possono inserire nuovi ragazzi.');
          return;
        }
        const existing = getPeople().find((p) => p.id === currentEditingPersonId);
        if (!existing) {
          closeModal();
          return;
        }
        const updatedNote = (document.getElementById('inputNote').value || '').trim();
        const personToSave = {
          ...existing,
          note: updatedNote,
        };
        saveSinglePerson(personToSave);
        closeModal();
        showToast('Note aggiornate!');
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
      const deleghe = (document.getElementById('inputDeleghe').value || '').trim();
      const note = (document.getElementById('inputNote').value || '').trim();

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

      const personToSave = {
        id: isEdit ? currentEditingPersonId : `p_${Date.now()}`,
        nome,
        cognome,
        ruolo,
        anno,
        iscrittoCatechismo,
        telefoni: phones,
        allergie,
        deleghe,
        note,
      };

      saveSinglePerson(personToSave);
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
  const isNotesOnly = typeof isAnimatore === 'function' && isAnimatore();

  if (!person && (typeof canAddOrDeletePeople === 'function' && !canAddOrDeletePeople())) {
    showToast('Solo l\'amministratore può inserire nuovi iscritti.');
    return;
  }

  if (person && !canFullEdit && !isNotesOnly) {
    showToast('Non hai i permessi per modificare i dati dei ragazzi.');
    return;
  }

  const modal = document.getElementById('personModal');
  const modalTitle = document.getElementById('personModalTitle');
  const btnDelete = document.getElementById('deletePersonBtn');
  const btnAddPhone = document.getElementById('btnAddPhoneField');

  if (!modal) return;

  currentEditingPersonId = person ? person.id : null;
  userTouchedCatechismoCheckbox = Boolean(person);

  if (modalTitle) {
    if (isNotesOnly) {
      modalTitle.textContent = 'Note Ragazzo (Solo Note)';
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
  document.getElementById('inputDeleghe').value = person ? person.deleghe || '' : '';
  document.getElementById('inputNote').value = person ? person.note || '' : '';

  // Renderizza la lista dei telefoni
  const phones = person ? getPersonPhones(person) : [{ etichetta: 'Mamma', numero: '' }];
  renderPhonesInModal(phones);

  // Blocca tutti i campi tranne Note se Animatore
  const readOnlyIds = [
    'inputNome',
    'inputCognome',
    'selectRuolo',
    'selectAnno',
    'inputCatechismo',
    'inputAllergie',
    'inputDeleghe',
  ];
  readOnlyIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = !canFullEdit;
  });

  document.querySelectorAll('#phonesContainer .phone-label-input, #phonesContainer .phone-number-input').forEach((el) => {
    el.disabled = !canFullEdit;
  });
  document.querySelectorAll('#phonesContainer .remove-phone-btn').forEach((btn) => {
    btn.style.display = canFullEdit ? 'inline-flex' : 'none';
  });

  modal.classList.add('open');
  if (isNotesOnly) {
    document.getElementById('inputNote').focus();
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
