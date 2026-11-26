/**
 * ==========================================================================
 * REGISTRO PRESENZE ORATORIO - js/catechista.js
 * Logica per Catechiste: Home Assenti del Giorno e Registro Classi (3ª Elem - 2ª Media)
 * ==========================================================================
 */

let currentSection = 'home';
let classSearchQuery = '';

// 1. CAMBIO SEZIONE (Home Assenti o Singola Classe)
window.showCatechistaSection = function (sectionId) {
  currentSection = sectionId;
  localStorage.setItem('catechista_sezione_attiva', sectionId);
  classSearchQuery = '';
  const searchInput = document.getElementById('classSearchInput');
  if (searchInput) searchInput.value = '';

  renderCatechista();
};

// Helper: verifica se l'iscritto frequenta il catechismo ed appartiene a una classe di catechismo
function isCatechismoStudent(person) {
  return (
    Boolean(person && person.iscrittoCatechismo) &&
    CATECHISMO_CLASSES.some((c) => c.id === person.anno)
  );
}

// 2. RENDERING GENERALE DELL'AREA CATECHISTE
function renderCatechista() {
  const currentDate = getCurrentDate();
  const people = getPeople();
  const dayAttendance = getDayAttendance(currentDate);

  // Consideriamo SOLO chi ha "Frequenta il Catechismo" spuntato nelle classi 3ª Elem - 2ª Media
  const catechismoKids = people.filter(isCatechismoStudent);

  // Calcola assenti globali di oggi a catechismo
  // NOTA: TUTTI PRESENTI DI DEFAULT. È assente solo se esplicitamente contrassegnato con assente: true
  const absentKidsToday = catechismoKids.filter((k) => {
    return !isStudentCatechismoPresent(currentDate, k.id);
  });

  // Aggiorna Badge Assenti nel pulsante Home
  const badgeTotaleAssenti = document.getElementById('badgeTotaleAssenti');
  if (badgeTotaleAssenti) {
    badgeTotaleAssenti.textContent = absentKidsToday.length;
    badgeTotaleAssenti.style.background = absentKidsToday.length > 0 ? '#dc2626' : 'rgba(0, 0, 0, 0.08)';
    badgeTotaleAssenti.style.color = absentKidsToday.length > 0 ? '#ffffff' : 'inherit';
  }

  // Render Pillole Classi nella barra superiore (visibili solo nella Home; nascoste quando una classe è selezionata)
  const navPillsContainer = document.getElementById('catNavPillsContainer');
  if (navPillsContainer) {
    navPillsContainer.style.display = currentSection === 'home' ? 'flex' : 'none';
  }
  renderClassPills(catechismoKids, currentDate);

  const viewHome = document.getElementById('viewHomeAssenti');
  const viewClass = document.getElementById('viewClassRegister');

  if (currentSection === 'home') {
    // Aggiorna Titolo Scheda Browser
    updateBrowserTitle('Assenti di Oggi • Catechismo');

    if (viewHome) viewHome.style.display = 'block';
    if (viewClass) viewClass.style.display = 'none';

    renderHomeAssenti(catechismoKids, absentKidsToday, currentDate);
  } else {
    // Modalità Registro della Classe Selezionata
    const classObj = CATECHISMO_CLASSES.find((c) => c.id === currentSection) || CATECHISMO_CLASSES[0];
    updateBrowserTitle(`Registro ${classObj.label} • Catechismo`);

    if (viewHome) viewHome.style.display = 'none';
    if (viewClass) viewClass.style.display = 'block';

    renderClassRegister(classObj, catechismoKids, dayAttendance, currentDate);
  }
}

// 3. RENDERING DELLA HOME ASSENTI DEL GIORNO
function renderHomeAssenti(allKids, absentKids, currentDate) {
  const dateTitle = document.getElementById('homeAssentiDateTitle');
  const statBig = document.getElementById('statBigAssenti');
  const cardsGrid = document.getElementById('homeClassCardsGrid');
  const listContainer = document.getElementById('homeAbsentListContainer');

  if (dateTitle) {
    dateTitle.textContent = `Assenti del Giorno: ${formatItalianDate(currentDate)}`;
  }
  if (statBig) {
    statBig.textContent = absentKids.length;
  }

  // Render Schede per ogni Classe di Catechismo
  if (cardsGrid) {
    cardsGrid.innerHTML = '';
    CATECHISMO_CLASSES.forEach((c) => {
      const kidsInClass = allKids.filter((k) => k.anno === c.id);
      const absentInClass = kidsInClass.filter((k) => !isStudentCatechismoPresent(currentDate, k.id));

      const card = document.createElement('div');
      card.className = 'class-summary-card';
      card.onclick = () => showCatechistaSection(c.id);

      card.innerHTML = `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h4 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
              ${c.label}
            </h4>
            <span style="background: ${absentInClass.length > 0 ? '#fee2e2' : '#f0fdf4'}; color: ${absentInClass.length > 0 ? '#b91c1c' : '#15803d'}; border: 1px solid ${absentInClass.length > 0 ? '#fca5a5' : '#bbf7d0'}; border-radius: 8px; font-size: 0.75rem; font-weight: 800; padding: 2px 7px;">
              ${absentInClass.length} ${absentInClass.length === 1 ? 'assente' : 'assenti'}
            </span>
          </div>
          <span style="font-size: 0.78rem; color: #64748b;">
            ${kidsInClass.length} iscritti totali
          </span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #f1f5f9;">
          <span style="font-size: 0.78rem; font-weight: 700; color: #4f46e5;">
            Apri Registro Classe →
          </span>
          <i class="fa-solid fa-arrow-right" style="color: #4f46e5; font-size: 0.85rem;"></i>
        </div>
      `;
      cardsGrid.appendChild(card);
    });
  }

  // Render Elenco Dettagliato degli Assenti con Chiamata ai Genitori
  if (listContainer) {
    listContainer.innerHTML = '';

    if (absentKids.length === 0) {
      listContainer.innerHTML = `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; text-align: center; color: #166534;">
          <i class="fa-solid fa-circle-check" style="font-size: 2rem; color: #16a34a; margin-bottom: 8px;"></i>
          <h4 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 4px;">Nessun Alunno Assente Oggi!</h4>
          <p style="font-size: 0.85rem; color: #15803d;">
            Tutti i ragazzi delle classi di catechismo risultano presenti alla lezione odierna.
          </p>
        </div>
      `;
      return;
    }

    const grid = document.createElement('div');
    grid.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    absentKids.forEach((k) => {
      const phones = getPersonPhones(k);
      const classLabel = ANNO_LABELS[k.anno] || k.anno;

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
              <span>${escapeHtml(p.etichetta)}: ${escapeHtml(p.numero)}</span>
            </a>
          `
          )
          .join('');
      } else {
        phonesHtml = `<span style="font-size: 0.78rem; color: #94a3b8; font-style: italic;">Nessun numero registrato</span>`;
      }

      const item = document.createElement('div');
      item.style.cssText = `
        background: #ffffff;
        border: 1px solid #fecaca;
        border-left: 5px solid #dc2626;
        border-radius: 12px;
        padding: 12px 16px;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.03);
      `;

      item.innerHTML = `
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1rem; font-weight: 800; color: #0f172a;">
              ${escapeHtml(k.cognome).toUpperCase()} ${escapeHtml(k.nome)}
            </span>
            <span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 700;">
              ${classLabel}
            </span>
            <span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 800;">
              Assente
            </span>
          </div>
          ${k.allergie ? `<span style="display: block; font-size: 0.74rem; color: #dc2626; margin-top: 3px;"><i class="fa-solid fa-triangle-exclamation"></i> Allergia: ${escapeHtml(k.allergie)}</span>` : ''}
          ${k.deleghe ? `<span style="display: block; font-size: 0.74rem; color: #b45309; margin-top: 2px;"><i class="fa-solid fa-clock"></i> ${escapeHtml(k.deleghe)}</span>` : ''}
        </div>

        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          ${phonesHtml}

          <button
            type="button"
            onclick="markKidPresentFromHome('${k.id}')"
            style="background: #f0fdf4; border: 1px solid #86efac; color: #15803d; padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;"
            title="Segna come arrivato a lezione"
          >
            <i class="fa-solid fa-check"></i>
            <span>Segna Arrivato</span>
          </button>
        </div>
      `;

      grid.appendChild(item);
    });

    listContainer.appendChild(grid);
  }
}

// 4. POPOLA IL MENU A TENDINA IN ALTO A DESTRA PER SPOSTARSI TRA LE CLASSI
function renderClassSwitcherDropdown(activeClassObj) {
  const select = document.getElementById('classSwitcherSelect');
  if (!select) return;

  select.innerHTML = '';

  CATECHISMO_CLASSES.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.id === activeClassObj.id ? `✓ ${c.label} (Attuale)` : c.label;
    if (c.id === activeClassObj.id) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });

  const homeOpt = document.createElement('option');
  homeOpt.value = 'home';
  homeOpt.textContent = '🏠 Assenti del Giorno';
  select.appendChild(homeOpt);
}

// 5. RENDERING DEL REGISTRO DI UNA SINGOLA CLASSE
function renderClassRegister(classObj, allKids, dayAttendance, currentDate) {
  renderClassSwitcherDropdown(classObj);

  const classKids = allKids
    .filter((k) => k.anno === classObj.id)
    .sort((a, b) => (a.cognome || '').localeCompare(b.cognome || ''));

  const titleEl = document.getElementById('classRegisterTitle');
  const subtitleEl = document.getElementById('classRegisterSubtitle');
  if (titleEl) titleEl.textContent = `📖 ${classObj.label}`;
  if (subtitleEl) subtitleEl.textContent = `Registro Appello • ${formatItalianDate(currentDate)}`;

  // Statistiche Classe
  // NOTA: TUTTI PRESENTI DI DEFAULT
  const total = classKids.length;
  let countPresent = 0;
  let countMessa = 0;
  let countOratorio = 0;

  classKids.forEach((k) => {
    if (isStudentCatechismoPresent(currentDate, k.id)) {
      countPresent++;
    }
    const att = dayAttendance[k.id];
    if (att && att.messa) countMessa++;
    if (att && att.oratorio) countOratorio++;
  });

  const countAbsent = Math.max(0, total - countPresent);
  const perc = total > 0 ? Math.round((countPresent / total) * 100) : 100;

  document.getElementById('classCountTotal').textContent = total;
  document.getElementById('classCountPresent').textContent = countPresent;
  document.getElementById('classCountAbsent').textContent = countAbsent;
  document.getElementById('classCountMessa').textContent = countMessa;
  document.getElementById('classCountOratorio').textContent = countOratorio;

  const elPerc = document.getElementById('classAttendancePerc');
  const elFill = document.getElementById('classProgressBarFill');
  if (elPerc) elPerc.textContent = `${perc}% (${countPresent}/${total})`;
  if (elFill) elFill.style.width = `${perc}%`;

  // Tabella Alunni
  const tableBody = document.getElementById('registerClassTableBody');
  const emptyState = document.getElementById('classEmptyState');
  const tableEl = document.getElementById('registerClassTable');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  // Filtra con eventuale ricerca
  const filtered = classKids.filter((k) => {
    if (!classSearchQuery.trim()) return true;
    const att = dayAttendance[k.id] || {};
    const daily = parseDailyNoteAndExit(att.noteGiorno || '');
    const q = classSearchQuery.toLowerCase().trim();
    return `${k.cognome} ${k.nome} ${k.allergie || ''} ${k.deleghe || ''} ${k.note || ''} ${daily.uscita} ${daily.note}`.toLowerCase().includes(q);
  });

  if (filtered.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (tableEl) tableEl.style.display = 'none';
    return;
  } else {
    if (emptyState) emptyState.style.display = 'none';
    if (tableEl) tableEl.style.display = 'table';
  }

  filtered.forEach((k, idx) => {
    const isPresent = isStudentCatechismoPresent(currentDate, k.id);
    const att = dayAttendance[k.id] || {};
    const daily = parseDailyNoteAndExit(att.noteGiorno || '');
    const initials = `${(k.nome || 'A').charAt(0)}${(k.cognome || 'B').charAt(0)}`.toUpperCase();
    const phones = getPersonPhones(k);

    const tr = document.createElement('tr');
    tr.className = isPresent ? 'row-presente' : 'row-assente';

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

    // Stato Uscita (allineato con Appello Oratorio)
    let uscitaCellHtml = '';
    if (att.oratorio) {
      if (att.uscito) {
        uscitaCellHtml = `
          <strong style="color: #b91c1c; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 4px;">
            <i class="fa-solid fa-person-walking-arrow-right"></i>
            Uscito ${escapeHtml(att.oraUscita || '--:--')}
          </strong>
        `;
      } else {
        uscitaCellHtml = `
          <span style="color: #15803d; font-size: 0.78rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
            <i class="fa-solid fa-circle-check"></i>
            In Cortile
          </span>
        `;
      }
    } else {
      uscitaCellHtml = `<span style="color: #94a3b8; font-size: 0.78rem;">—</span>`;
    }

    // Colonna Note (Uscite/Deleghe + Note annuali e giornaliere)
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

    tr.innerHTML = `
      <!-- N° Progressivo -->
      <td class="col-num" style="font-weight: 800; color: #64748b;">
        ${idx + 1}
      </td>

      <!-- Ragazzo -->
      <td class="col-ragazzo">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 34px; height: 34px; border-radius: 8px; background: ${isPresent ? '#dcfce7' : '#fee2e2'}; color: ${isPresent ? '#15803d' : '#b91c1c'}; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; border: 1px solid ${isPresent ? '#86efac' : '#fca5a5'}; flex-shrink: 0;">
            ${initials}
          </div>
          <div>
            <div style="font-size: 0.95rem; font-weight: 800; color: #0f172a; line-height: 1.2;">
              ${escapeHtml(k.cognome).toUpperCase()} ${escapeHtml(k.nome)}
            </div>
            ${allergyHtml}
          </div>
        </div>
      </td>

      <!-- Appello P / A -->
      <td class="col-appello">
        <div class="pa-group">
          <button
            type="button"
            class="btn-pa btn-p ${isPresent ? 'active' : ''}"
            title="Presente (P)"
            onclick="setStudentCatechismoPresence('${k.id}', true)"
          >
            P
          </button>
          <button
            type="button"
            class="btn-pa btn-a ${!isPresent ? 'active' : ''}"
            title="Assente (A)"
            onclick="setStudentCatechismoPresence('${k.id}', false)"
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
          ${(typeof canToggleMessa === 'function' && !canToggleMessa()) ? 'disabled style="cursor: not-allowed; opacity: 0.75;" title="Non autorizzato"' : `onclick="toggleCatechismoAttribute('${k.id}', 'messa')" title="Partecipazione alla S. Messa"`}
        >
          <i class="fa-solid fa-cross"></i>
          <span>${att.messa ? 'Sì' : 'No'}</span>
        </button>
      </td>

      <!-- Oratorio (Zona Catechiste) -->
      <td class="col-oratorio">
        <button
          type="button"
          class="btn-reg-toggle ${att.oratorio ? 'active-oratorio' : ''}"
          ${(typeof canToggleOratorioFromCatechismo === 'function' && !canToggleOratorioFromCatechismo()) ? 'disabled style="cursor: not-allowed; opacity: 0.75;" title="Non autorizzato"' : `onclick="toggleCatechismoAttribute('${k.id}', 'oratorio')" title="Fermato per i giochi in cortile"`}
        >
          <i class="fa-solid fa-volleyball"></i>
          <span>${att.oratorio ? 'Sì' : 'No'}</span>
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

      <!-- Note -->
      <td class="col-note">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${noteBadges.length > 0 ? noteBadges.join('') : '<span style="color: #94a3b8; font-size: 0.75rem;">—</span>'}
          </div>
          ${(typeof canEditPeopleInfo === 'function' && canEditPeopleInfo()) ? `
          <button
            type="button"
            class="btn-icon-edit"
            title="Modifica scheda alunno"
            onclick="editPerson('${k.id}')"
          >
            <i class="fa-solid fa-pen-to-square"></i>
          </button>` : ''}
        </div>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

// 6. PILLOLE DELLE CLASSI DI CATECHISMO
function renderClassPills(allKids, currentDate) {
  const container = document.getElementById('catClassPills');
  const pillHome = document.getElementById('pillHomeAssenti');
  if (!container) return;

  if (pillHome) {
    if (currentSection === 'home') {
      pillHome.classList.add('active');
    } else {
      pillHome.classList.remove('active');
    }
  }

  container.innerHTML = '';

  CATECHISMO_CLASSES.forEach((c) => {
    const kidsInClass = allKids.filter((k) => k.anno === c.id);
    const absentInClass = kidsInClass.filter((k) => !isStudentCatechismoPresent(currentDate, k.id));
    const isActive = currentSection === c.id;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `cat-pill-btn ${isActive ? 'active' : ''}`;
    btn.onclick = () => showCatechistaSection(c.id);

    btn.innerHTML = `
      <span>${c.label}</span>
      <span class="cat-pill-count">${kidsInClass.length}</span>
      ${absentInClass.length > 0 ? `<span style="background: #dc2626; color: #fff; border-radius: 8px; font-size: 0.68rem; padding: 1px 5px; font-weight: 800;">${absentInClass.length} A</span>` : ''}
    `;

    container.appendChild(btn);
  });

  // Popola anche il selettore classi nella barra laterale mobile
  const sidebarClasses = document.getElementById('mobileSidebarClasses');
  if (sidebarClasses) {
    const absentTot = allKids.filter((k) => !isStudentCatechismoPresent(currentDate, k.id)).length;
    sidebarClasses.innerHTML = `
      <div class="mobile-sidebar-classes-title">
        <i class="fa-solid fa-graduation-cap" style="color: #4f46e5;"></i>
        <span>Classi Catechismo</span>
      </div>
      <div class="mobile-sidebar-class-list" id="mobileSidebarClassList"></div>
    `;
    const listEl = sidebarClasses.querySelector('#mobileSidebarClassList');

    const homeBtn = document.createElement('button');
    homeBtn.type = 'button';
    homeBtn.className = `mobile-sidebar-class-btn ${currentSection === 'home' ? 'active' : ''}`;
    homeBtn.innerHTML = `
      <span>🏠 Assenti del Giorno</span>
      <span class="mobile-sidebar-class-count">${absentTot}</span>
    `;
    homeBtn.onclick = () => {
      if (typeof window.closeMobileSidebar === 'function') window.closeMobileSidebar();
      showCatechistaSection('home');
    };
    listEl.appendChild(homeBtn);

    CATECHISMO_CLASSES.forEach((c) => {
      const kidsInClass = allKids.filter((k) => k.anno === c.id);
      const isActive = currentSection === c.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `mobile-sidebar-class-btn ${isActive ? 'active' : ''}`;
      btn.innerHTML = `
        <span>${c.label}</span>
        <span class="mobile-sidebar-class-count">${kidsInClass.length}</span>
      `;
      btn.onclick = () => {
        if (typeof window.closeMobileSidebar === 'function') window.closeMobileSidebar();
        showCatechistaSection(c.id);
      };
      listEl.appendChild(btn);
    });
  }
}

// 7. TOGGLE PRESENZA P / A (Tutti presenti di default, se clicco A diventa assente!)
window.setStudentCatechismoPresence = function (personId, isPresent) {
  const currentDate = getCurrentDate();
  const dayAtt = getDayAttendance(currentDate);
  const currentRecord = dayAtt[personId] || {
    catechismo: true,
    oratorio: false,
    messa: false,
    uscito: false,
    oraUscita: '',
  };

  const updatedRecord = {
    ...currentRecord,
    catechismo: isPresent,
    assente: !isPresent,
  };

  savePersonAttendance(currentDate, personId, updatedRecord);
  renderCatechista();
};

window.markKidPresentFromHome = function (personId) {
  setStudentCatechismoPresence(personId, true);
  showToast('Alunno segnato presente a lezione!');
};

// 8. TOGGLE ATTRIBUTI (Messa / Oratorio)
window.toggleCatechismoAttribute = function (personId, attr) {
  const canToggleAttr = attr === 'messa'
    ? (typeof canToggleMessa !== 'function' || canToggleMessa())
    : attr === 'oratorio'
      ? (typeof canToggleOratorioFromCatechismo !== 'function' || canToggleOratorioFromCatechismo())
      : (typeof canToggleExtraAttributes !== 'function' || canToggleExtraAttributes());
  if (!canToggleAttr) {
    showToast('Solo l\'amministratore può modificare questo campo.');
    return;
  }
  const currentDate = getCurrentDate();
  const dayAtt = getDayAttendance(currentDate);
  const currentRecord = dayAtt[personId] || {
    catechismo: true,
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
  renderCatechista();
};

// 9. AZIONI RAPIDE CLASSE
function markAllClassPresent() {
  const currentDate = getCurrentDate();
  const people = getPeople();
  const classKids = people.filter((p) => isCatechismoStudent(p) && p.anno === currentSection);
  const updates = [];

  classKids.forEach((k) => {
    const dayAtt = getDayAttendance(currentDate);
    const att = dayAtt[k.id] || { catechismo: true, oratorio: false, messa: false, uscito: false, oraUscita: '' };
    updates.push({
      personId: k.id,
      record: { ...att, catechismo: true, assente: false },
    });
  });

  if (updates.length > 0) {
    batchSaveAttendance(currentDate, updates);
    renderCatechista();
    showToast(`Tutti gli alunni di questa classe risultano PRESENTI!`);
  }
}

function passClassToOratorio() {
  if (typeof canToggleOratorioFromCatechismo === 'function' && !canToggleOratorioFromCatechismo()) {
    showToast('Solo l\'amministratore può usare questa funzione.');
    return;
  }
  const currentDate = getCurrentDate();
  const people = getPeople();
  const classKids = people.filter((p) => isCatechismoStudent(p) && p.anno === currentSection);
  const updates = [];
  let count = 0;

  classKids.forEach((k) => {
    if (isStudentCatechismoPresent(currentDate, k.id)) {
      const dayAtt = getDayAttendance(currentDate);
      const att = dayAtt[k.id] || { catechismo: true, oratorio: false, messa: false, uscito: false, oraUscita: '' };
      if (!att.oratorio) {
        updates.push({
          personId: k.id,
          record: { ...att, oratorio: true },
        });
        count++;
      }
    }
  });

  if (count > 0) {
    batchSaveAttendance(currentDate, updates);
    renderCatechista();
    showToast(`${count} alunni segnati presenti in Oratorio per i giochi!`);
  } else {
    showToast('Nessun alunno da passare (tutti già segnati o assenti).');
  }
}

// 10. UTILITY DATA IN ITALIANO
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

// 11. INIZIALIZZAZIONE EVENTI
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.whenAuthReady === 'function') {
    const session = await window.whenAuthReady();
    if (!session) return;
  }
  const btnMarkAll = document.getElementById('btnMarkAllPresent');
  const btnPassOra = document.getElementById('btnPassToOratorio');
  const btnNewKid = document.getElementById('btnNewKidClass');
  const btnEmptyNewKid = document.getElementById('btnEmptyNewKid');
  const btnPrint = document.getElementById('btnPrintClass');
  const searchInput = document.getElementById('classSearchInput');
  const classSwitcher = document.getElementById('classSwitcherSelect');

  if (classSwitcher) {
    classSwitcher.addEventListener('change', (e) => {
      if (e.target.value) {
        showCatechistaSection(e.target.value);
      }
    });
  }

  if (btnMarkAll) btnMarkAll.addEventListener('click', markAllClassPresent);
  if (btnPassOra) {
    if (typeof canToggleOratorioFromCatechismo === 'function' && !canToggleOratorioFromCatechismo()) {
      btnPassOra.style.display = 'none';
    } else {
      btnPassOra.addEventListener('click', passClassToOratorio);
    }
  }

  if (btnNewKid) {
    if (typeof canAddOrDeletePeople === 'function' && !canAddOrDeletePeople()) {
      btnNewKid.style.display = 'none';
    } else {
      btnNewKid.addEventListener('click', () => {
        const prefill = currentSection !== 'home' ? currentSection : 'terza';
        openPersonModal(null, prefill);
      });
    }
  }

  if (btnEmptyNewKid) {
    if (typeof canAddOrDeletePeople === 'function' && !canAddOrDeletePeople()) {
      btnEmptyNewKid.style.display = 'none';
    } else {
      btnEmptyNewKid.addEventListener('click', () => {
        const prefill = currentSection !== 'home' ? currentSection : 'terza';
        openPersonModal(null, prefill);
      });
    }
  }

  if (btnPrint) {
    btnPrint.addEventListener('click', () => window.print());
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      classSearchQuery = e.target.value;
      renderCatechista();
    });
  }

  renderCatechista();
});

// Callback quando cambia la data o i dati dal modale
window.onDateUpdated = function () {
  renderCatechista();
};

window.onDataUpdated = function () {
  renderCatechista();
};
