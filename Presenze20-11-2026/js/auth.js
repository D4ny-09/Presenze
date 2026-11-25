/**
 * ==========================================================================
 * REGISTRO PRESENZE ORATORIO - js/auth.js
 * Gestione Login tramite Supabase Auth, Sessione (onAuthStateChange) e Ruoli
 * ==========================================================================
 */

(function () {
  const SUPABASE_URL = 'https://smwqsfupiveykagibxac.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtd3FzZnVwaXZleWthZ2lieGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyMDczMTEsImV4cCI6MjExMDc4MzMxMX0.36Ybgg0MWzKvNk8Leo1VNtb8q7ZJ8ovoIoaqrae6cvE';

  const LEGACY_AUTH_STORAGE_KEY = 'oratorio_auth_session';

  const ROLE_CONFIG = {
    catechista: {
      role: 'catechista',
      label: 'Catechista',
      homePage: 'catechista.html',
      allowedPages: ['catechista.html'],
    },
    animatore: {
      role: 'animatore',
      label: 'Animatore',
      homePage: 'index.html',
      allowedPages: ['index.html', 'appello-parrocchia.html', 'squadre.html'],
    },
    admin: {
      role: 'admin',
      label: 'Amministratore',
      homePage: 'index.html',
      allowedPages: ['index.html', 'appello-parrocchia.html', 'squadre.html', 'catechista.html'],
    },
  };

  let _supabaseClientInstance = null;
  let currentSession = null;
  let isRedirecting = false;
  let resolveAuthReady = null;

  const authReadyPromise = new Promise((resolve) => {
    resolveAuthReady = resolve;
  });

  function getSupabaseClient() {
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      _supabaseClientInstance = null;
      return null;
    }
    if (!_supabaseClientInstance) {
      try {
        _supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      } catch (e) {
        console.warn('Inizializzazione Supabase fallita:', e);
        _supabaseClientInstance = null;
      }
    }
    return _supabaseClientInstance;
  }

  function resetSupabaseClient() {
    _supabaseClientInstance = null;
  }

  function getCurrentPageName() {
    const path = window.location.pathname || '';
    const file = path.split('/').pop();
    if (!file || file === '') return 'index.html';
    return file;
  }

  function resolveUserRole(user) {
    if (!user) return null;
    const metaRole = (
      (user.user_metadata && user.user_metadata.role) ||
      (user.app_metadata && user.app_metadata.role) ||
      ''
    )
      .toString()
      .trim()
      .toLowerCase();

    if (ROLE_CONFIG[metaRole]) {
      return metaRole;
    }

    // Se i metadati ruolo sono vuoti, ricava il ruolo dall'email
    const email = (user.email || '').trim().toLowerCase();
    const localPart = email.split('@')[0] || '';
    if (localPart === 'catechista' || localPart.startsWith('catechista')) {
      return 'catechista';
    }
    if (localPart === 'animatore' || localPart.startsWith('animatore')) {
      return 'animatore';
    }
    if (localPart === 'admin' || localPart.startsWith('admin')) {
      return 'admin';
    }

    return 'admin';
  }

  function buildAuthSession(supabaseSession) {
    if (!supabaseSession || !supabaseSession.user) return null;
    const role = resolveUserRole(supabaseSession.user);
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.admin;
    return {
      userId: supabaseSession.user.id,
      email: supabaseSession.user.email || '',
      role: cfg.role,
      label: cfg.label,
      homePage: cfg.homePage,
      allowedPages: cfg.allowedPages,
      accessToken: supabaseSession.access_token || '',
      rawSession: supabaseSession,
    };
  }

  function getAuthSession() {
    return currentSession;
  }

  function getCurrentRole() {
    return currentSession ? currentSession.role : null;
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

  function formatAuthError(error) {
    if (!error) return 'Errore durante l\'accesso.';
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('invalid login credentials')) {
      return 'Nome utente o password non corretti. Riprova.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Account non confermato. Conferma l\'utente su Supabase Auth.';
    }
    if (msg.includes('too many requests')) {
      return 'Troppi tentativi. Attendi qualche istante e riprova.';
    }
    return error.message || 'Errore durante l\'accesso.';
  }

  function normalizeLoginEmail(usernameOrEmail) {
    const raw = String(usernameOrEmail || '').trim().toLowerCase();
    if (!raw) return '';
    return raw.includes('@') ? raw : `${raw}@oratorio.local`;
  }

  async function loginWithUsername(username, password) {
    const email = normalizeLoginEmail(username);
    const cleanPassword = String(password || '');

    if (!email || !cleanPassword) {
      return { ok: false, error: 'Inserisci nome utente e password.' };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { ok: false, error: 'Connessione a Supabase non disponibile. Ricarica la pagina.' };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password: cleanPassword,
      });

      if (error || !data || !data.session) {
        return { ok: false, error: formatAuthError(error) };
      }

      currentSession = buildAuthSession(data.session);
      return {
        ok: true,
        session: currentSession,
        homePage: currentSession.homePage,
      };
    } catch (e) {
      return { ok: false, error: 'Errore di rete durante l\'accesso. Riprova.' };
    }
  }

  async function logoutUser() {
    const client = getSupabaseClient();
    currentSession = null;
    try {
      localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
      if (client) {
        await client.auth.signOut();
      }
    } catch (e) {
      console.warn('Errore durante il logout:', e);
    }
    redirectTo('login.html');
  }

  function redirectTo(targetPage) {
    if (isRedirecting) return;
    isRedirecting = true;
    window.location.replace(targetPage);
  }

  function enforceRouteAccess() {
    const page = getCurrentPageName();

    if (page === 'login.html') {
      if (currentSession) {
        redirectTo(currentSession.homePage);
        return false;
      }
      return true;
    }

    if (!currentSession) {
      redirectTo('login.html');
      return false;
    }

    if (!currentSession.allowedPages.includes(page)) {
      redirectTo(currentSession.homePage);
      return false;
    }

    return true;
  }

  function applyAuthHeaderAndNav() {
    if (!currentSession) return;

    const role = currentSession.role;

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
    if (headerControls) {
      const roleColors = {
        admin: { bg: 'rgba(16, 185, 129, 0.22)', border: 'rgba(167, 243, 208, 0.5)', icon: 'fa-shield-halved' },
        catechista: { bg: 'rgba(255, 255, 255, 0.18)', border: 'rgba(255, 255, 255, 0.35)', icon: 'fa-chalkboard-user' },
        animatore: { bg: 'rgba(245, 158, 11, 0.24)', border: 'rgba(253, 230, 138, 0.5)', icon: 'fa-hands-holding-child' },
      };
      const styleCfg = roleColors[role] || roleColors.catechista;

      let userBadge = document.getElementById('authUserBadge');
      if (!userBadge) {
        userBadge = document.createElement('span');
        userBadge.id = 'authUserBadge';
        userBadge.className = 'date-btn';
        headerControls.appendChild(userBadge);
      }
      userBadge.style.cssText = `background: ${styleCfg.bg}; border: 1px solid ${styleCfg.border}; cursor: default; font-weight: 700;`;
      userBadge.title = currentSession.email || currentSession.label;
      userBadge.innerHTML = '';
      const iconEl = document.createElement('i');
      iconEl.className = `fa-solid ${styleCfg.icon}`;
      const labelEl = document.createElement('span');
      labelEl.textContent = currentSession.label;
      userBadge.appendChild(iconEl);
      userBadge.appendChild(document.createTextNode(' '));
      userBadge.appendChild(labelEl);

      if (!document.getElementById('btnLogoutAuth')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.type = 'button';
        logoutBtn.id = 'btnLogoutAuth';
        logoutBtn.className = 'date-btn';
        logoutBtn.title = 'Esci e cambia account';
        logoutBtn.style.cssText = 'background: rgba(220, 38, 38, 0.25); border: 1px solid rgba(254, 202, 202, 0.45);';
        logoutBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> <span>Esci</span>';
        logoutBtn.addEventListener('click', logoutUser);
        headerControls.appendChild(logoutBtn);
      }
    }
  }

  function revealPage() {
    document.documentElement.style.visibility = '';
  }

  async function initAuth() {
    // Rimuovi eventuali residui della vecchia sessione locale
    try {
      localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
    } catch (e) {}

    const page = getCurrentPageName();
    const client = getSupabaseClient();

    if (!client) {
      if (page !== 'login.html') {
        redirectTo('login.html');
        return;
      }
      resolveAuthReady(null);
      return;
    }

    // Gestione reattiva dello stato di autenticazione Supabase
    client.auth.onAuthStateChange((event, session) => {
      currentSession = buildAuthSession(session);

      if (event === 'SIGNED_OUT') {
        if (getCurrentPageName() !== 'login.html') {
          redirectTo('login.html');
        }
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (currentSession) {
          const allowed = enforceRouteAccess();
          if (allowed && getCurrentPageName() !== 'login.html' && document.readyState !== 'loading') {
            applyAuthHeaderAndNav();
          }
        }
      }
    });

    try {
      const { data, error } = await client.auth.getSession();
      if (error) {
        console.warn('Errore lettura sessione Supabase:', error.message);
      }
      currentSession = buildAuthSession(data && data.session);
    } catch (e) {
      console.warn('Errore verifica sessione Supabase:', e);
      currentSession = null;
    }

    const allowed = enforceRouteAccess();
    if (!allowed) {
      return;
    }

    if (page !== 'login.html') {
      revealPage();
      if (document.readyState !== 'loading') {
        applyAuthHeaderAndNav();
      }
    }

    resolveAuthReady(currentSession);
  }

  // Esponi API globali
  window.SUPABASE_URL = SUPABASE_URL;
  window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
  window.getSupabaseClient = getSupabaseClient;
  window.resetSupabaseClient = resetSupabaseClient;
  window.whenAuthReady = function () {
    return authReadyPromise;
  };
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
  window.loginWithUsername = loginWithUsername;
  window.logoutUser = logoutUser;

  // Nascondi subito il contenuto sulle pagine protette fino alla verifica della sessione
  if (getCurrentPageName() !== 'login.html') {
    document.documentElement.style.visibility = 'hidden';
  }

  initAuth();

  document.addEventListener('DOMContentLoaded', () => {
    if (currentSession) {
      applyAuthHeaderAndNav();
    }
  });
})();
