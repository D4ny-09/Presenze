/**
 * ==========================================================================
 * REGISTRO PRESENZE ORATORIO - js/parrocchia.js
 * Logica per la Home Parrocchia (Attività della Giornata & Statistiche Oratorio)
 * ==========================================================================
 */

// 1. RENDERING DELLA HOME ATTIVITÀ PARROCCHIA
function renderParrocchia() {
  const currentDate = getCurrentDate();
  const people = getPeople();
  const dayAttendance = getDayAttendance(currentDate);

  // Aggiorna Titolo Scheda Browser
  updateBrowserTitle('Attività di Oggi • Parrocchia Oratorio');

  // Intestazione data
  const dateTitle = document.getElementById('parrocchiaDateTitle');
  if (dateTitle) {
    dateTitle.textContent = `Attività di ${formatItalianDate(currentDate)}`;
  }

  // Contatori Generali
  let countOratorio = 0;
  let countCatechismo = 0;
  let countMessa = 0;

  Object.values(dayAttendance).forEach((att) => {
    if (att.oratorio) countOratorio++;
    if (att.catechismo) countCatechismo++;
    if (att.messa) countMessa++;
  });

  document.getElementById('statCountOratorio').textContent = countOratorio;
  document.getElementById('statCountCatechismo').textContent = countCatechismo;
  document.getElementById('statCountMessa').textContent = countMessa;
  document.getElementById('statCountIscritti').textContent = people.length;

  // Renderizza la Timeline delle Attività
  renderActivitiesTimeline(currentDate);

  // Renderizza le Allerte Merenda dei presenti oggi
  renderAllergiesToday(people, dayAttendance);
}

// 2. TIMELINE ATTIVITÀ
function renderActivitiesTimeline(currentDate) {
  const container = document.getElementById('activitiesTimeline');
  if (!container) return;

  const activities = getDailyActivities(currentDate);
  container.innerHTML = '';

  if (activities.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: #64748b;">
        <i class="fa-solid fa-calendar-xmark" style="font-size: 2rem; color: #94a3b8; margin-bottom: 8px;"></i>
        <p style="font-size: 0.9rem;">Nessuna attività programmata per oggi. Premi <strong>+ Aggiungi Attività</strong> per inserirne una.</p>
      </div>
    `;
    return;
  }

  const canEdit = typeof canEditDailyActivities === 'function' ? canEditDailyActivities() : true;
  activities.forEach((act) => {
    const card = document.createElement('div');
    card.className = 'activity-card';

    card.innerHTML = `
      <div class="activity-time-badge">
        ${escapeHtml(act.ora)}
      </div>

      <div class="activity-icon-circle">
        <i class="fa-solid ${act.icona || 'fa-star'}"></i>
      </div>

      <div class="activity-body">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <h4 class="activity-title">${escapeHtml(act.titolo)}</h4>
          ${canEdit ? `<div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
            <button
              type="button"
              onclick="editActivity('${act.id}')"
              style="background: transparent; border: none; color: #4f46e5; cursor: pointer; padding: 4px 6px; font-size: 0.88rem;"
              title="Modifica attività"
            >
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button
              type="button"
              onclick="removeActivity('${act.id}')"
              style="background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 4px 6px; font-size: 0.85rem;"
              title="Rimuovi attività"
            >
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>` : ''}
        </div>
        <p class="activity-desc">${escapeHtml(act.desc || '')}</p>
      </div>
    `;

    container.appendChild(card);
  });
}

// 3. RIMOZIONE ATTIVITÀ
window.removeActivity = function (actId) {
  if (typeof canEditDailyActivities === 'function' && !canEditDailyActivities()) {
    showToast('Non hai i permessi per rimuovere le attività.');
    return;
  }
  const currentDate = getCurrentDate();
  const activities = getDailyActivities(currentDate).filter((a) => a.id !== actId);
  saveDailyActivities(currentDate, activities);
  renderActivitiesTimeline(currentDate);
  showToast('Attività rimossa.');
};

// 4. ALLERTE MERENDA DEI RAGAZZI PRESENTI IN ORATORIO OGGI
function renderAllergiesToday(people, dayAttendance) {
  const container = document.getElementById('allergiesTodayList');
  if (!container) return;

  // Filtra ragazzi che sono in oratorio oggi e hanno allergie segnalate
  const kidsWithAllergies = people.filter((p) => {
    const att = dayAttendance[p.id];
    return att && att.oratorio && p.allergie && p.allergie.trim();
  });

  if (kidsWithAllergies.length === 0) {
    container.innerHTML = `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 18px; color: #166534; display: flex; align-items: center; gap: 10px;">
        <i class="fa-solid fa-circle-check" style="font-size: 1.3rem; color: #16a34a;"></i>
        <span style="font-size: 0.85rem; font-weight: 600;">
          Nessuna allergia o intolleranza alimentare segnalata tra i ragazzi attualmente presenti in oratorio.
        </span>
      </div>
    `;
    return;
  }

  let html = `
    <div class="allergy-alert-card">
      <div style="font-weight: 800; color: #991b1b; font-size: 0.92rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
        <i class="fa-solid fa-triangle-exclamation"></i>
        Attenzione per la merenda: ${kidsWithAllergies.length} ${kidsWithAllergies.length === 1 ? 'ragazzo presente ha' : 'ragazzi presenti hanno'} intolleranze o allergie:
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
  `;

  kidsWithAllergies.forEach((k) => {
    const classLabel = ANNO_LABELS[k.anno] || k.anno;
    html += `
      <div style="background: #ffffff; border: 1px solid #fecaca; border-radius: 8px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
        <div>
          <strong style="color: #0f172a; font-size: 0.88rem;">${escapeHtml(k.cognome).toUpperCase()} ${escapeHtml(k.nome)}</strong>
          <span style="color: #64748b; font-size: 0.76rem;">(${classLabel})</span>
        </div>
        <span style="background: #fee2e2; color: #b91c1c; font-weight: 800; font-size: 0.78rem; padding: 3px 8px; border-radius: 6px;">
          ${escapeHtml(k.allergie)}
        </span>
      </div>
    `;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}

// 5. MODALE AGGIUNTA / MODIFICA ATTIVITÀ DEL GIORNO
let currentEditingActivityId = null;

window.editActivity = function (actId) {
  if (typeof canEditDailyActivities === 'function' && !canEditDailyActivities()) {
    showToast('Non hai i permessi per modificare le attività.');
    return;
  }
  const modal = document.getElementById('activityModal');
  if (!modal) return;

  const currentDate = getCurrentDate();
  const act = getDailyActivities(currentDate).find((a) => a.id === actId);
  if (!act) return;

  currentEditingActivityId = act.id;
  const titleEl = modal.querySelector('.modal-title');
  if (titleEl) titleEl.textContent = 'Modifica Attività / Avviso';

  document.getElementById('inputActOra').value = act.ora || '';
  document.getElementById('inputActTitolo').value = act.titolo || '';
  document.getElementById('inputActDesc').value = act.desc || '';

  modal.classList.add('open');
  document.getElementById('inputActOra').focus();
};

function initActivityModal() {
  const modal = document.getElementById('activityModal');
  const btnOpen = document.getElementById('btnOpenNewActivityModal');
  const btnClose = document.getElementById('closeActivityModal');
  const btnCancel = document.getElementById('cancelActivityModal');
  const form = document.getElementById('activityForm');

  if (!modal) return;

  function closeModal() {
    modal.classList.remove('open');
    currentEditingActivityId = null;
    if (form) form.reset();
  }

  if (btnOpen) {
    if (typeof canEditDailyActivities === 'function' && !canEditDailyActivities()) {
      btnOpen.style.display = 'none';
    } else {
      btnOpen.addEventListener('click', () => {
        currentEditingActivityId = null;
        const titleEl = modal.querySelector('.modal-title');
        if (titleEl) titleEl.textContent = 'Aggiungi Attività / Avviso del Giorno';
        if (form) form.reset();
        modal.classList.add('open');
        document.getElementById('inputActOra').focus();
      });
    }
  }

  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentDate = getCurrentDate();
      const ora = (document.getElementById('inputActOra').value || '').trim();
      const titolo = (document.getElementById('inputActTitolo').value || '').trim();
      const desc = (document.getElementById('inputActDesc').value || '').trim();

      if (!ora || !titolo) {
        alert('Inserisci orario e titolo!');
        return;
      }

      const activities = getDailyActivities(currentDate);
      if (currentEditingActivityId) {
        const idx = activities.findIndex((a) => a.id === currentEditingActivityId);
        if (idx >= 0) {
          activities[idx] = {
            ...activities[idx],
            ora,
            titolo,
            desc,
          };
        }
        saveDailyActivities(currentDate, activities);
        closeModal();
        renderActivitiesTimeline(currentDate);
        showToast('Attività aggiornata!');
      } else {
        activities.push({
          id: `act_${Date.now()}`,
          ora,
          titolo,
          icona: 'fa-star',
          desc,
        });
        saveDailyActivities(currentDate, activities);
        closeModal();
        renderActivitiesTimeline(currentDate);
        showToast('Attività aggiunta alla giornata!');
      }
    });
  }
}

// 6. UTILITY DATA IN ITALIANO
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

// 7. INIZIALIZZAZIONE ALL'AVVIO
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.whenAuthReady === 'function') {
    const session = await window.whenAuthReady();
    if (!session) return;
  }
  initActivityModal();
  renderParrocchia();
});

// Callback aggiornamento data o dati
window.onDateUpdated = function () {
  renderParrocchia();
};

window.onDataUpdated = function () {
  renderParrocchia();
};
