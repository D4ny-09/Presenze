/**
 * ==========================================================================
 * REGISTRO PRESENZE ORATORIO - js/auth.js
 * Gestione Login, Sessione, Ruoli e Controllo Accessi / Permessi
 * ==========================================================================
 */

(function () {
  const AUTH_STORAGE_KEY = 'oratorio_auth_session';

  /**
   * Configurazione credenziali di accesso.
   * Modifica le password qui sotto in base alle tue esigenze.
   */
  const AUTH_USERS = {
    catechista: {
      role: 'catechista',
      label: 'Catechista',
      password: 'catechista2026',
      homePage: 'catechista.html',
      allowedPages: ['catechista.html'],
    },
    animatore: {
      role: 'animatore',
      label: 'Animatore',
      password: 'animatore2026',
      homePage: 'index.html',
      allowedPages: ['index.html', 'appello-parrocchia.html', 'squadre.html'],
    },
    admin: {
      role: 'admin',
      label: 'Amministratore',
      password: 'admin2026',
      homePage: 'index.html',
      allowedPages: ['index.html', 'appello-parrocchia.html', 'squadre.html', 'catechista.html'],
    },
  };

  function getCurrentPageName() {
    const path = window.location.pathname || '';
    const file = path.split('/').pop();
    if (!file || file === '') return 'index.html';
    return file;
  }

  function getAuthSession() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.role || !AUTH_USERS[parsed.role]) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function getCurrentRole() {
    const session = getAuthSession();
    return session ? session.role : null;
  }

  function isAdmin() {
    return getCurrentRole() === 'admin';
  }

  function isCatechista() {
    return getCurrentRole() === 'catechista';
  }

  function isAnimatore() {
    return getCurrentRole() === 'animatore';
  }

  function canEditPeopleInfo() {
    return isAdmin();
  }

  function canAddOrDeletePeople() {
    return isAdmin();
  }

  function canEditNotes() {
    return isAdmin() || isAnimatore();
  }

  function canToggleMessa() {
    return isAdmin() || isAnimatore() || isCatechista();
  }

  function canToggleOratorioFromCatechismo() {
    return isAdmin() || isCatechista();
  }

  function canToggleUscitaFamiglia() {
    return isAdmin();
  }

  function canToggleExtraAttributes() {
    // Messa, Oratorio (da catechismo), Uscita Famiglia
    return isAdmin();
  }

  function loginWithCredentials(usernameOrRole, password) {
    const raw = String(usernameOrRole || '').trim().toLowerCase();
    const aliases = {
      catechiste: 'catechista',
      animatori: 'animatore',
    };
    const key = aliases[raw] || raw;
    const user = AUTH_USERS[key];
    if (!user || String(password || '') !== user.password) {
      return { ok: false, error: 'Nome utente o password non corretti. Riprova.' };
    }

    const session = {
      role: user.role,
      label: user.label,
      loginAt: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    return { ok: true, session, homePage: user.homePage };
  }

  function logoutUser() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.replace('login.html');
  }

  function enforceRouteAccess() {
    const page = getCurrentPageName();
    const session = getAuthSession();

    if (page === 'login.html') {
      if (session && AUTH_USERS[session.role]) {
        window.location.replace(AUTH_USERS[session.role].homePage);
      }
      return;
    }

    if (!session) {
      window.location.replace('login.html');
      return;
    }

    const userCfg = AUTH_USERS[session.role];
    if (!userCfg.allowedPages.includes(page)) {
      window.location.replace(userCfg.homePage);
      return;
    }
  }

  function applyAuthHeaderAndNav() {
    const session = getAuthSession();
    if (!session) return;

    const role = session.role;

    // Nascondi link cambio sezione per chi non e' admin
    const tabCatechista = document.getElementById('tabCatechista');
    const tabParrocchia = document.getElementById('tabParrocchia');

    if (role === 'animatore' && tabCatechista) {
      tabCatechista.style.display = 'none';
    }
    if (role === 'catechista' && tabParrocchia) {
      tabParrocchia.style.display = 'none';
    }

    // Nascondi stato Database Connesso per Catechiste e Animatori (visibile solo ad Admin)
    const btnSyncDb = document.getElementById('btnSyncDatabase');
    if (btnSyncDb && role !== 'admin') {
      btnSyncDb.style.display = 'none';
    }

    // Aggiungi badge utente e pulsante Esci nell'header
    const headerControls = document.querySelector('.header-controls');
    if (headerControls && !document.getElementById('btnLogoutAuth')) {
      const roleColors = {
        admin: { bg: 'rgba(16, 185, 129, 0.22)', border: 'rgba(167, 243, 208, 0.5)', icon: 'fa-shield-halved' },
        catechista: { bg: 'rgba(255, 255, 255, 0.18)', border: 'rgba(255, 255, 255, 0.35)', icon: 'fa-chalkboard-user' },
        animatore: { bg: 'rgba(245, 158, 11, 0.24)', border: 'rgba(253, 230, 138, 0.5)', icon: 'fa-hands-holding-child' },
      };
      const styleCfg = roleColors[role] || roleColors.catechista;

      const userBadge = document.createElement('span');
      userBadge.id = 'authUserBadge';
      userBadge.className = 'date-btn';
      userBadge.style.cssText = `background: ${styleCfg.bg}; border: 1px solid ${styleCfg.border}; cursor: default; font-weight: 700;`;
      userBadge.innerHTML = `<i class="fa-solid ${styleCfg.icon}"></i> <span>${session.label}</span>`;

      const logoutBtn = document.createElement('button');
      logoutBtn.type = 'button';
      logoutBtn.id = 'btnLogoutAuth';
      logoutBtn.className = 'date-btn';
      logoutBtn.title = 'Esci e cambia account';
      logoutBtn.style.cssText = 'background: rgba(220, 38, 38, 0.25); border: 1px solid rgba(254, 202, 202, 0.45);';
      logoutBtn.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> <span>Esci</span>`;
      logoutBtn.addEventListener('click', logoutUser);

      headerControls.appendChild(userBadge);
      headerControls.appendChild(logoutBtn);
    }
  }

  // Esponi API globali
  window.AUTH_USERS = AUTH_USERS;
  window.getAuthSession = getAuthSession;
  window.getCurrentRole = getCurrentRole;
  window.isAdmin = isAdmin;
  window.isCatechista = isCatechista;
  window.isAnimatore = isAnimatore;
  window.canEditPeopleInfo = canEditPeopleInfo;
  window.canAddOrDeletePeople = canAddOrDeletePeople;
  window.canEditNotes = canEditNotes;
  window.canToggleMessa = canToggleMessa;
  window.canToggleOratorioFromCatechismo = canToggleOratorioFromCatechismo;
  window.canToggleUscitaFamiglia = canToggleUscitaFamiglia;
  window.canToggleExtraAttributes = canToggleExtraAttributes;
  window.loginWithCredentials = loginWithCredentials;
  window.logoutUser = logoutUser;

  // Controllo immediato prima del rendering completo
  enforceRouteAccess();

  document.addEventListener('DOMContentLoaded', () => {
    enforceRouteAccess();
    applyAuthHeaderAndNav();
  });
})();
