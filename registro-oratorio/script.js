/**
 * REGISTRO PRESENZE • CATECHISMO & ORATORIO
 * Integrazione Supabase Cloud + Modalità Locale Offline
 */

// Configurazione Supabase
let SUPABASE_URL = "https://qxevcfjtjbrlewagorju.supabase.co";
let SUPABASE_ANON_KEY = localStorage.getItem("supabase_anon_key") || "";

async function loadEnvConfig() {
    if (window.ENV) {
        if (window.ENV.SUPABASE_URL) SUPABASE_URL = window.ENV.SUPABASE_URL;
        if (window.ENV.SUPABASE_ANON_KEY) SUPABASE_ANON_KEY = window.ENV.SUPABASE_ANON_KEY;
    }

    if (window.location && window.location.protocol.startsWith("http")) {
        try {
            const res = await fetch("/api/config");
            if (res.ok) {
                const cfg = await res.json();
                if (cfg.SUPABASE_URL) SUPABASE_URL = cfg.SUPABASE_URL;
                if (cfg.SUPABASE_ANON_KEY) SUPABASE_ANON_KEY = cfg.SUPABASE_ANON_KEY;
            }
        } catch (e) {
            try {
                const resEnv = await fetch("/.env");
                if (resEnv.ok) {
                    const text = await resEnv.text();
                    text.split("\n").forEach(line => {
                        const trimmed = line.trim();
                        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
                            const parts = trimmed.split("=");
                            const k = parts[0].trim();
                            const v = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, "");
                            if (k === "SUPABASE_URL" && v) SUPABASE_URL = v;
                            if (k === "SUPABASE_ANON_KEY" && v) SUPABASE_ANON_KEY = v;
                        }
                    });
                }
            } catch (err) {}
        }
    }

    if (!SUPABASE_ANON_KEY) {
        SUPABASE_ANON_KEY = localStorage.getItem("supabase_anon_key") || "";
    }
}

// Client Supabase (usiamo supabaseClient per evitare conflitti con la variabile globale supabase)
let supabaseClient = null;
let isCloudConnected = false;

function initSupabaseClient() {
    if (window.supabase && typeof window.supabase.createClient === "function" && SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            return true;
        } catch (e) {
            console.error("Errore inizializzazione Supabase:", e);
        }
    }
    supabaseClient = null;
    return false;
}

const ANNO_LABELS = {
    prima: "1ª Elementare",
    seconda: "2ª Elementare",
    terza: "3ª Elementare",
    quarta: "4ª Elementare",
    quinta: "5ª Elementare",
    primaMedia: "1ª Media",
    secondaMedia: "2ª Media",
    terzaMedia: "3ª Media",
    animatore: "Animatore / Staff"
};

const INITIAL_PEOPLE = [
    {
        id: "p_1",
        nome: "Luca",
        cognome: "Rossi",
        ruolo: "Bambino",
        anno: "terza",
        iscrittoCatechismo: true,
        allergie: "Intolleranza al Lattosio",
        deleghe: "Esce alle 16:30 con la nonna Maria",
        note: "Molto vivace nei giochi a squadre"
    },
    {
        id: "p_2",
        nome: "Giulia",
        cognome: "Bianchi",
        ruolo: "Bambino",
        anno: "terza",
        iscrittoCatechismo: false,
        allergie: "",
        deleghe: "Ritiro papà Marco",
        note: "Partecipa solo al doposcuola e oratorio"
    },
    {
        id: "p_3",
        nome: "Matteo",
        cognome: "Verdi",
        ruolo: "Bambino",
        anno: "quarta",
        iscrittoCatechismo: true,
        allergie: "Frutta a guscio (Arachidi) - Grave!",
        deleghe: "",
        note: "Chierichetto alla Messa domenicale"
    },
    {
        id: "p_4",
        nome: "Sara",
        cognome: "Neri",
        ruolo: "Bambino",
        anno: "prima",
        iscrittoCatechismo: true,
        allergie: "",
        deleghe: "Delega a zia Elena",
        note: "Primo anno di catechismo"
    },
    {
        id: "p_5",
        nome: "Lorenzo",
        cognome: "Ferrari",
        ruolo: "Bambino",
        anno: "quinta",
        iscrittoCatechismo: true,
        allergie: "",
        deleghe: "Torna a casa da solo (autorizzazione firmata)",
        note: "Preparazione per la Prima Comunione"
    },
    {
        id: "p_6",
        nome: "Elena",
        cognome: "Romano",
        ruolo: "Bambino",
        anno: "secondaMedia",
        iscrittoCatechismo: true,
        allergie: "Glutine (Celiachia) - Merenda dedicata",
        deleghe: "Va via con la sorella maggiore",
        note: "Aiuta gli animatori con i più piccoli"
    },
    {
        id: "p_7",
        nome: "Federico",
        cognome: "Gallo",
        ruolo: "Bambino",
        anno: "primaMedia",
        iscrittoCatechismo: true,
        allergie: "",
        deleghe: "",
        note: "Appassionato di calcetto in oratorio"
    },
    {
        id: "p_8",
        nome: "Sofia",
        cognome: "Costa",
        ruolo: "Bambino",
        anno: "seconda",
        iscrittoCatechismo: true,
        allergie: "Uovo",
        deleghe: "Ritiro mamma",
        note: ""
    },
    {
        id: "p_9",
        nome: "Chiara",
        cognome: "Moretti",
        ruolo: "Animatore",
        anno: "animatore",
        iscrittoCatechismo: false,
        allergie: "",
        deleghe: "",
        note: "Coordinatrice giochi cortile e merenda"
    },
    {
        id: "p_10",
        nome: "Davide",
        cognome: "Galli",
        ruolo: "Animatore",
        anno: "animatore",
        iscrittoCatechismo: false,
        allergie: "",
        deleghe: "",
        note: "Educatore gruppo medie e tornei"
    }
];

let people = [];
let attendance = {};
let currentDate = getTodayString();
let currentTab = "presenze";

// =========================================================
// AVVIO
// =========================================================
async function initApplication() {
    autoRepairDOM();
    await loadEnvConfig();
    initDatePicker();
    bindEvents();
    initSupabaseClient();

    // 1. Mostra subito i dati locali per un avvio istantaneo
    loadFromLocalStorage();
    renderApp();

    // 2. Tenta la sincronizzazione cloud con Supabase
    await syncWithSupabase();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApplication);
} else {
    initApplication();
}

// =========================================================
// SINCRONIZZAZIONE CON SUPABASE
// =========================================================
async function syncWithSupabase() {
    updateCloudStatusBadge();

    if (!supabaseClient) return;

    try {
        const { data: remotePeople, error: errPeople } = await supabaseClient
            .from("iscritti")
            .select("*")
            .order("cognome", { ascending: true });

        if (errPeople) {
            console.warn("Avviso Supabase (iscritti):", errPeople.message || errPeople);
            isCloudConnected = false;
            updateCloudStatusBadge();
            return;
        }

        isCloudConnected = true;
        updateCloudStatusBadge();

        if (remotePeople && remotePeople.length > 0) {
            people = remotePeople.map(r => ({
                id: r.id,
                nome: r.nome,
                cognome: r.cognome,
                ruolo: r.ruolo,
                anno: r.anno,
                iscrittoCatechismo: !!r.iscritto_catechismo,
                allergie: r.allergie || "",
                deleghe: r.deleghe || "",
                note: r.note || "",
                telefono: r.telefono || ""
            }));
            savePeopleToLocal();
        } else if (people.length > 0) {
            // Se la tabella su Supabase è vuota, carica i profili iniziali su Supabase
            uploadInitialPeopleToSupabase();
        }

        await fetchAttendanceForDate(currentDate);
        setupRealtimeSubscription();
        renderApp();
    } catch (e) {
        console.error("Errore sincronizzazione Supabase:", e);
        isCloudConnected = false;
        updateCloudStatusBadge();
    }
}

async function uploadInitialPeopleToSupabase() {
    if (!supabaseClient || people.length === 0) return;
    try {
        const records = people.map(p => ({
            id: p.id,
            nome: p.nome,
            cognome: p.cognome,
            ruolo: p.ruolo,
            anno: p.anno,
            iscritto_catechismo: p.iscrittoCatechismo,
            allergie: p.allergie || "",
            deleghe: p.deleghe || "",
            note: p.note || ""
        }));
        await supabaseClient.from("iscritti").upsert(records);
    } catch (e) {
        console.error("uploadInitialPeopleToSupabase:", e);
    }
}

async function fetchAttendanceForDate(dateStr) {
    if (!supabaseClient) return;

    try {
        const { data: remoteAtt, error } = await supabaseClient
            .from("presenze")
            .select("*")
            .eq("data", dateStr);

        if (error) {
            console.warn("Avviso Supabase (presenze):", error.message || error);
            return;
        }

        if (!attendance[dateStr]) attendance[dateStr] = {};

        if (remoteAtt) {
            remoteAtt.forEach(r => {
                attendance[dateStr][r.iscritto_id] = {
                    catechismo: !!r.catechismo,
                    oratorio: !!r.oratorio,
                    messa: !!r.messa,
                    uscito: !!r.uscito,
                    oraUscita: r.ora_uscita || "",
                    noteGiorno: r.note_giorno || ""
                };
            });
            saveAttendanceToLocal();
        }
    } catch (e) {
        console.error("fetchAttendanceForDate:", e);
    }
}

let realtimeChannel = null;
function setupRealtimeSubscription() {
    if (!supabaseClient || realtimeChannel) return;

    try {
        realtimeChannel = supabaseClient
            .channel("realtime_presenze_channel")
            .on("postgres_changes", { event: "*", schema: "public", table: "presenze" }, payload => {
                const rec = payload.new || payload.old;
                if (rec && rec.data === currentDate) {
                    if (payload.eventType === "DELETE") {
                        if (attendance[currentDate]) delete attendance[currentDate][rec.iscritto_id];
                    } else {
                        if (!attendance[currentDate]) attendance[currentDate] = {};
                        attendance[currentDate][rec.iscritto_id] = {
                            catechismo: !!rec.catechismo,
                            oratorio: !!rec.oratorio,
                            messa: !!rec.messa,
                            uscito: !!rec.uscito,
                            oraUscita: rec.ora_uscita || ""
                        };
                    }
                    saveAttendanceToLocal();
                    renderApp();
                }
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "iscritti" }, () => {
                syncWithSupabase();
            })
            .subscribe();
    } catch (e) {
        console.error("setupRealtimeSubscription:", e);
    }
}

function updateCloudStatusBadge() {
    const badge = document.getElementById("supabaseStatus");
    if (!badge) return;

    if (isCloudConnected) {
        badge.innerHTML = `<span style="color:#34d399; font-weight:700;">● Cloud Connesso</span>`;
    } else if (SUPABASE_ANON_KEY) {
        badge.innerHTML = `<span style="color:#fbbf24; font-weight:600;">● Connessione...</span>`;
    } else {
        badge.innerHTML = `<span style="color:#cbd5e1;">○ Inserisci Anon Key</span>`;
    }
}

window.openSupabaseConfig = function () {
    const current = localStorage.getItem("supabase_anon_key") || "";
    const key = prompt(
        "Inserisci la Anon Key pubblica di Supabase:\n\n" +
        "1. Vai su supabase.com -> Il tuo Progetto\n" +
        "2. Project Settings (ingranaggio) -> API\n" +
        "3. Copia 'anon public' (inizia con eyJhbGci...)\n\n" +
        "URL configurato: " + SUPABASE_URL,
        current
    );

    if (key !== null) {
        const cleanKey = key.trim();
        SUPABASE_ANON_KEY = cleanKey;
        localStorage.setItem("supabase_anon_key", cleanKey);
        initSupabaseClient();
        syncWithSupabase();
        showToast(cleanKey ? "Chiave salvata! Connessione in corso..." : "Chiave rimossa. Modalità locale.");
    }
};

// =========================================================
// SALVATAGGIO LOCALE
// =========================================================
function loadFromLocalStorage() {
    const savedPeople = localStorage.getItem("registro_iscritti_v1");
    if (savedPeople) {
        try {
            const parsed = JSON.parse(savedPeople);
            people = (Array.isArray(parsed) && parsed.length > 0) ? parsed : [...INITIAL_PEOPLE];
        } catch (e) {
            people = [...INITIAL_PEOPLE];
        }
    } else {
        people = [...INITIAL_PEOPLE];
        savePeopleToLocal();
    }

    const savedAttendance = localStorage.getItem("registro_presenze_v1");
    if (savedAttendance) {
        try {
            attendance = JSON.parse(savedAttendance);
        } catch (e) {
            attendance = {};
        }
    } else {
        attendance = {};
    }
}

function savePeopleToLocal() {
    localStorage.setItem("registro_iscritti_v1", JSON.stringify(people));
}

function saveAttendanceToLocal() {
    localStorage.setItem("registro_presenze_v1", JSON.stringify(attendance));
}

// =========================================================
// AUTORIPARAZIONE DOM
// =========================================================
function autoRepairDOM() {
    const filterRole = document.getElementById("filterRole");
    if (filterRole && (!filterRole.options || filterRole.options.length <= 1)) {
        filterRole.innerHTML = `
            <option value="">Tutti i ruoli</option>
            <option value="Bambino">Bambino</option>
            <option value="Animatore">Animatore</option>
        `;
    }

    const filterCatechismo = document.getElementById("filterCatechismo");
    if (filterCatechismo && (!filterCatechismo.options || filterCatechismo.options.length <= 1)) {
        filterCatechismo.innerHTML = `
            <option value="">Tutti gli Iscritti</option>
            <option value="si">Solo Iscritti a Catechismo</option>
            <option value="no">Solo Oratorio (No Catechismo)</option>
        `;
    }

    const filterAnno = document.getElementById("filterAnno");
    if (filterAnno && (!filterAnno.options || filterAnno.options.length <= 1)) {
        filterAnno.innerHTML = `
            <option value="">Tutti gli anni</option>
            <option value="prima">Prima Elementare</option>
            <option value="seconda">Seconda Elementare</option>
            <option value="terza">Terza Elementare</option>
            <option value="quarta">Quarta Elementare</option>
            <option value="quinta">Quinta Elementare</option>
            <option value="primaMedia">Prima Media</option>
            <option value="secondaMedia">Seconda Media</option>
            <option value="terzaMedia">Terza Media</option>
            <option value="animatore">Animatore</option>
        `;
    }

    let inputId = document.getElementById("inputId");
    if (!inputId) {
        const form = document.getElementById("personForm");
        if (form) {
            inputId = document.createElement("input");
            inputId.type = "hidden";
            inputId.id = "inputId";
            inputId.name = "id";
            inputId.value = "";
            form.prepend(inputId);
        }
    }

    const headerDate = document.querySelector(".header-date");
    if (headerDate && !document.getElementById("btnSupabaseConfig")) {
        const cloudBtn = document.createElement("button");
        cloudBtn.id = "btnSupabaseConfig";
        cloudBtn.className = "date-btn";
        cloudBtn.title = "Configura connessione Supabase Cloud";
        cloudBtn.onclick = window.openSupabaseConfig;
        cloudBtn.innerHTML = `<i class="fa-solid fa-cloud"></i> <span id="supabaseStatus">Cloud</span>`;
        headerDate.prepend(cloudBtn);
    }

    if (!document.querySelector(".quick-actions-bar")) {
        const countersGrid = document.querySelector(".counters-grid");
        if (countersGrid) {
            const bar = document.createElement("div");
            bar.className = "quick-actions-bar";
            bar.innerHTML = `
                <div class="quick-action-info">
                    <div class="quick-action-icon"><i class="fa-solid fa-arrow-right-arrow-left"></i></div>
                    <div class="quick-action-text">
                        <strong>Passaggio Catechismo ➔ Oratorio</strong>
                        <span>I ragazzi presenti a catechismo si fermano in cortile? Segnali con un clic:</span>
                    </div>
                </div>
                <div class="quick-action-buttons">
                    <button id="btnPassaggioOratorio" class="btn-action-oratorio">
                        <i class="fa-solid fa-check-double"></i> <span>Fermali tutti in Oratorio</span>
                    </button>
                    <button id="btnTuttiPresentiCatechismo" class="btn-action-catechismo">
                        <i class="fa-solid fa-clipboard-check"></i> <span>Tutti a Catechismo</span>
                    </button>
                    <button id="btnExportCSV" class="btn-action-secondary">
                        <i class="fa-solid fa-file-excel"></i> <span>Esporta CSV</span>
                    </button>
                    <button id="btnPrint" class="btn-action-secondary">
                        <i class="fa-solid fa-print"></i> <span>Stampa</span>
                    </button>
                </div>
            `;
            countersGrid.after(bar);
        }
    }

    let squadreContainer = document.getElementById("SquadreContainer");
    if (!squadreContainer) {
        const appelloContainer = document.getElementById("AppelloContainer");
        if (appelloContainer) {
            squadreContainer = document.createElement("section");
            squadreContainer.id = "SquadreContainer";
            squadreContainer.className = "main-content hidden";
            squadreContainer.innerHTML = `
                <div class="squadre-panel">
                    <div class="squadre-controls">
                        <div class="squadre-options">
                            <div class="control-item">
                                <label for="numSquadre">Numero di squadre:</label>
                                <select id="numSquadre" class="filter-select">
                                    <option value="2">2 Squadre</option>
                                    <option value="3">3 Squadre</option>
                                    <option value="4" selected>4 Squadre</option>
                                    <option value="5">5 Squadre</option>
                                    <option value="6">6 Squadre</option>
                                </select>
                            </div>
                            <div class="control-item">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="checkBilanciaEta" checked>
                                    <span>Bilancia per età (elementari & medie)</span>
                                </label>
                            </div>
                        </div>
                        <div class="quick-action-buttons">
                            <button id="btnGeneraSquadre" class="btn-action-oratorio">
                                <i class="fa-solid fa-dice"></i> <span>Genera Squadre</span>
                            </button>
                            <button id="btnCopiaSquadre" class="btn-action-secondary">
                                <i class="fa-brands fa-whatsapp"></i> <span>Copia per WhatsApp</span>
                            </button>
                        </div>
                    </div>
                    <div id="squadreOutput" class="teams-grid"></div>
                </div>
            `;
            appelloContainer.after(squadreContainer);
        }
    }
}

function getTodayString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function getDatePickerEl() {
    return document.getElementById("dataPicker") || document.getElementById("datePicker");
}

function initDatePicker() {
    const dp = getDatePickerEl();
    if (dp) dp.value = currentDate;
}

// =========================================================
// EVENTI
// =========================================================
function bindEvents() {
    const dp = getDatePickerEl();
    if (dp) {
        dp.addEventListener("change", async (e) => {
            currentDate = e.target.value || getTodayString();
            await fetchAttendanceForDate(currentDate);
            renderApp();
        });
    }

    const btnToday = document.getElementById("btnToday");
    if (btnToday) {
        btnToday.addEventListener("click", async () => {
            currentDate = getTodayString();
            const el = getDatePickerEl();
            if (el) el.value = currentDate;
            await fetchAttendanceForDate(currentDate);
            renderApp();
        });
    }

    const btnPrevDay = document.getElementById("btnPrevDay");
    if (btnPrevDay) btnPrevDay.addEventListener("click", () => shiftDate(-1));

    const btnNextDay = document.getElementById("btnNextDay");
    if (btnNextDay) btnNextDay.addEventListener("click", () => shiftDate(1));

    const tabPresenze = document.getElementById("tabPresenze");
    const tabSquadre = document.getElementById("tabSquadre");
    if (tabPresenze) tabPresenze.addEventListener("click", () => switchTab("presenze"));
    if (tabSquadre) tabSquadre.addEventListener("click", () => switchTab("squadre"));

    const searchInput = document.getElementById("searchInput");
    const filterRole = document.getElementById("filterRole");
    const filterCatechismo = document.getElementById("filterCatechismo");
    const filterAnno = document.getElementById("filterAnno");

    if (searchInput) searchInput.addEventListener("input", renderAppello);
    if (filterRole) filterRole.addEventListener("change", renderAppello);
    if (filterCatechismo) filterCatechismo.addEventListener("change", renderAppello);
    if (filterAnno) filterAnno.addEventListener("change", renderAppello);

    const btnPassaggioOratorio = document.getElementById("btnPassaggioOratorio");
    if (btnPassaggioOratorio) btnPassaggioOratorio.addEventListener("click", copyCatechismoToOratorio);

    const btnTuttiPresentiCatechismo = document.getElementById("btnTuttiPresentiCatechismo");
    if (btnTuttiPresentiCatechismo) btnTuttiPresentiCatechismo.addEventListener("click", markAllCatechismo);

    const btnExportCSV = document.getElementById("btnExportCSV");
    if (btnExportCSV) btnExportCSV.addEventListener("click", exportToCSV);

    const btnPrint = document.getElementById("btnPrint");
    if (btnPrint) btnPrint.addEventListener("click", () => window.print());

    const newPersonBtn = document.getElementById("newPerson");
    if (newPersonBtn) newPersonBtn.addEventListener("click", openNewPersonModal);

    const closeModalBtn = document.getElementById("closeModal");
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);

    const cancelModalBtn = document.getElementById("cancelModalBtn");
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

    const personModal = document.getElementById("personModal");
    if (personModal) {
        personModal.addEventListener("click", (e) => {
            if (e.target === personModal) closeModal();
        });
    }

    const personForm = document.getElementById("personForm");
    if (personForm) personForm.addEventListener("submit", handlePersonFormSubmit);

    const deletePersonBtn = document.getElementById("deletePersonBtn");
    if (deletePersonBtn) deletePersonBtn.addEventListener("click", handleDeletePerson);

    const btnGeneraSquadre = document.getElementById("btnGeneraSquadre");
    if (btnGeneraSquadre) btnGeneraSquadre.addEventListener("click", generateTeams);

    const btnCopiaSquadre = document.getElementById("btnCopiaSquadre");
    if (btnCopiaSquadre) btnCopiaSquadre.addEventListener("click", copyTeamsForWhatsApp);
}

window.openNewPersonModal = openNewPersonModal;
window.closeModal = closeModal;
window.switchTab = switchTab;
window.generateTeams = generateTeams;
window.copyTeamsForWhatsApp = copyTeamsForWhatsApp;
window.exportToCSV = exportToCSV;

async function shiftDate(deltaDays) {
    const d = new Date(currentDate + "T12:00:00");
    d.setDate(d.getDate() + deltaDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    currentDate = `${yyyy}-${mm}-${dd}`;
    const dp = getDatePickerEl();
    if (dp) dp.value = currentDate;
    await fetchAttendanceForDate(currentDate);
    renderApp();
}

function switchTab(tab) {
    currentTab = tab;
    const tabPresenze = document.getElementById("tabPresenze");
    const tabSquadre = document.getElementById("tabSquadre");
    const appelloContainer = document.getElementById("AppelloContainer");
    const squadreContainer = document.getElementById("SquadreContainer");
    const filtersSection = document.querySelector(".filters-section");

    if (tab === "presenze") {
        if (tabPresenze) tabPresenze.classList.add("active");
        if (tabSquadre) tabSquadre.classList.remove("active");
        if (appelloContainer) appelloContainer.classList.remove("hidden");
        if (squadreContainer) squadreContainer.classList.add("hidden");
        if (filtersSection) filtersSection.classList.remove("hidden");
        renderAppello();
    } else {
        if (tabSquadre) tabSquadre.classList.add("active");
        if (tabPresenze) tabPresenze.classList.remove("active");
        if (appelloContainer) appelloContainer.classList.add("hidden");
        if (squadreContainer) squadreContainer.classList.remove("hidden");
        generateTeams();
    }
}

function renderApp() {
    updateCounters();
    if (currentTab === "presenze") {
        renderAppello();
    } else {
        generateTeams();
    }
}

function updateCounters() {
    const dayAttendance = attendance[currentDate] || {};
    let catCount = 0;
    let oraCount = 0;
    let mesCount = 0;

    for (const pId in dayAttendance) {
        const item = dayAttendance[pId];
        if (item.catechismo) catCount++;
        if (item.oratorio) oraCount++;
        if (item.messa) mesCount++;
    }

    const countCatEl = document.getElementById("countCatechismo");
    const countOraEl = document.getElementById("countOratorio");
    const countMesEl = document.getElementById("countMessa");

    if (countCatEl) countCatEl.textContent = catCount;
    if (countOraEl) countOraEl.textContent = oraCount;
    if (countMesEl) countMesEl.textContent = mesCount;
}

function getFilteredPeople() {
    const searchVal = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
    const roleVal = document.getElementById("filterRole")?.value || "";
    const catVal = document.getElementById("filterCatechismo")?.value || "";
    const annoVal = document.getElementById("filterAnno")?.value || "";

    return people.filter((person) => {
        if (roleVal && person.ruolo !== roleVal) return false;
        if (catVal === "si" && !person.iscrittoCatechismo) return false;
        if (catVal === "no" && person.iscrittoCatechismo) return false;
        if (annoVal && person.anno !== annoVal) return false;

        if (searchVal) {
            const matchName = (person.nome + " " + person.cognome).toLowerCase().includes(searchVal);
            const matchAllergie = (person.allergie || "").toLowerCase().includes(searchVal);
            const matchDeleghe = (person.deleghe || "").toLowerCase().includes(searchVal);
            const matchNote = (person.note || "").toLowerCase().includes(searchVal);
            if (!matchName && !matchAllergie && !matchDeleghe && !matchNote) {
                return false;
            }
        }
        return true;
    });
}

function renderAppello() {
    const container = document.getElementById("AppelloContainer");
    if (!container) return;

    const filtered = getFilteredPeople();
    const dayAttendance = attendance[currentDate] || {};

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fa-solid fa-users-slash"></i></div>
                <h3 style="font-weight:700; color:#334155; margin-bottom:4px;">Nessun iscritto trovato</h3>
                <p style="font-size:0.85rem;">Prova a modificare i filtri o premi il tasto <strong>+</strong> per aggiungere un iscritto.</p>
            </div>
        `;
        return;
    }

    let html = `<div class="people-grid">`;

    filtered.forEach((p) => {
        const pAtt = dayAttendance[p.id] || { catechismo: false, oratorio: false, messa: false, uscito: false, oraUscita: "" };
        const initials = `${(p.nome || "A").charAt(0)}${(p.cognome || "B").charAt(0)}`.toUpperCase();
        const annoLabel = ANNO_LABELS[p.anno] || p.anno || "Bambino";
        const isAnimatore = p.ruolo === "Animatore";

        const catActive = pAtt.catechismo ? "active-cat" : "";
        const oraActive = pAtt.oratorio ? "active-ora" : "";
        const mesActive = pAtt.messa ? "active-mes" : "";
        const presentOratorioClass = pAtt.oratorio ? "present-in-oratorio" : "";

        html += `
            <div class="person-card ${presentOratorioClass}" id="card-${p.id}">
                <div class="person-header">
                    <div class="person-info">
                        <div class="avatar-circle ${isAnimatore ? 'avatar-animatore' : ''}">
                            ${initials}
                        </div>
                        <div class="person-name-group">
                            <span class="person-fullname">${escapeHtml(p.nome)} ${escapeHtml(p.cognome)}</span>
                            <div class="person-meta">
                                <span class="badge ${isAnimatore ? 'badge-role' : 'badge-anno'}">
                                    ${escapeHtml(annoLabel)}
                                </span>
                                ${
                                    p.iscrittoCatechismo
                                        ? `<span class="badge badge-cat-yes"><i class="fa-solid fa-book-bible"></i> Catechismo</span>`
                                        : `<span class="badge badge-cat-no"><i class="fa-solid fa-house"></i> Solo Oratorio</span>`
                                }
                            </div>
                        </div>
                    </div>
                    <button class="btn-icon-edit" onclick="openEditPersonModal('${p.id}')" title="Modifica profilo e note">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                </div>

                ${
                    p.allergie || p.deleghe || p.note
                        ? `
                    <div class="person-alerts">
                        ${
                            p.allergie
                                ? `<div class="alert-allergy">
                                    <i class="fa-solid fa-triangle-exclamation"></i>
                                    <span><strong>Allergia:</strong> ${escapeHtml(p.allergie)}</span>
                                   </div>`
                                : ""
                        }
                        ${
                            p.deleghe
                                ? `<div class="alert-delega">
                                    <i class="fa-solid fa-id-badge"></i>
                                    <span><strong>Uscite/Deleghe:</strong> ${escapeHtml(p.deleghe)}</span>
                                   </div>`
                                : ""
                        }
                        ${
                            p.note
                                ? `<div class="person-note">
                                    <span>${escapeHtml(p.note)}</span>
                                   </div>`
                                : ""
                        }
                    </div>`
                        : ""
                }

                <div class="presence-buttons-row">
                    <button class="btn-presence ${catActive}" 
                            onclick="togglePresence('${p.id}', 'catechismo')"
                            ${!p.iscrittoCatechismo ? 'disabled title="Non frequenta il corso di catechismo"' : ''}>
                        <i class="fa-solid fa-book-open"></i>
                        <span>${pAtt.catechismo ? "Presente" : "Catechismo"}</span>
                    </button>

                    <button class="btn-presence ${oraActive}" 
                            onclick="togglePresence('${p.id}', 'oratorio')"
                            title="Segna se si ferma in oratorio per i giochi e doposcuola">
                        <i class="fa-solid fa-volleyball"></i>
                        <span>${pAtt.oratorio ? "In Oratorio" : "Oratorio"}</span>
                    </button>

                    <button class="btn-presence ${mesActive}" 
                            onclick="togglePresence('${p.id}', 'messa')"
                            title="Partecipazione alla S. Messa">
                        <i class="fa-solid fa-church"></i>
                        <span>${pAtt.messa ? "A Messa" : "Messa"}</span>
                    </button>
                </div>

                ${
                    pAtt.oratorio
                        ? `
                    <div class="uscita-row">
                        <span>
                            ${
                                pAtt.uscito
                                    ? `<strong style="color:#b91c1c;"><i class="fa-solid fa-person-walking-dashed-line-arrow-right"></i> Uscito alle ${pAtt.oraUscita || '--:--'}</strong>`
                                    : `<span style="color:#047857;"><i class="fa-solid fa-circle-check"></i> In cortile</span>`
                            }
                        </span>
                        <button class="btn-toggle-uscita ${pAtt.uscito ? 'uscito' : ''}" 
                                onclick="toggleUscita('${p.id}')">
                            ${pAtt.uscito ? "Annulla uscita" : "Segna uscita genitore"}
                        </button>
                    </div>`
                        : ""
                }
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

window.togglePresence = async function (personId, type) {
    if (!attendance[currentDate]) attendance[currentDate] = {};
    if (!attendance[currentDate][personId]) {
        attendance[currentDate][personId] = { catechismo: false, oratorio: false, messa: false, uscito: false, oraUscita: "" };
    }

    attendance[currentDate][personId][type] = !attendance[currentDate][personId][type];

    if (type === "oratorio" && !attendance[currentDate][personId].oratorio) {
        attendance[currentDate][personId].uscito = false;
        attendance[currentDate][personId].oraUscita = "";
    }

    saveAttendanceToLocal();
    renderApp();

    if (supabaseClient) {
        try {
            const p = attendance[currentDate][personId];
            await supabaseClient.from("presenze").upsert({
                data: currentDate,
                iscritto_id: personId,
                catechismo: p.catechismo,
                oratorio: p.oratorio,
                messa: p.messa,
                uscito: p.uscito,
                ora_uscita: p.ora_uscita || "",
                updated_at: new Date().toISOString()
            }, { onConflict: "data,iscritto_id" });
        } catch (e) {
            console.error("Errore salvataggio presenza su Supabase:", e);
        }
    }
};

window.toggleUscita = async function (personId) {
    if (!attendance[currentDate] || !attendance[currentDate][personId]) return;
    const pAtt = attendance[currentDate][personId];
    if (pAtt.uscito) {
        pAtt.uscito = false;
        pAtt.oraUscita = "";
    } else {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        pAtt.uscito = true;
        pAtt.oraUscita = `${hh}:${mm}`;
    }
    saveAttendanceToLocal();
    renderApp();

    if (supabaseClient) {
        try {
            await supabaseClient.from("presenze").upsert({
                data: currentDate,
                iscritto_id: personId,
                catechismo: pAtt.catechismo,
                oratorio: pAtt.oratorio,
                messa: pAtt.messa,
                uscito: pAtt.uscito,
                ora_uscita: pAtt.ora_uscita,
                updated_at: new Date().toISOString()
            }, { onConflict: "data,iscritto_id" });
        } catch (e) {
            console.error("Errore salvataggio uscita su Supabase:", e);
        }
    }
};

async function copyCatechismoToOratorio() {
    if (!attendance[currentDate]) attendance[currentDate] = {};
    let countCopied = 0;
    const upserts = [];

    people.forEach((p) => {
        const pAtt = attendance[currentDate][p.id];
        if (pAtt && pAtt.catechismo && !pAtt.oratorio) {
            pAtt.oratorio = true;
            countCopied++;
            if (supabaseClient) {
                upserts.push({
                    data: currentDate,
                    iscritto_id: p.id,
                    catechismo: pAtt.catechismo,
                    oratorio: true,
                    messa: pAtt.messa,
                    uscito: false,
                    ora_uscita: "",
                    updated_at: new Date().toISOString()
                });
            }
        }
    });

    saveAttendanceToLocal();
    renderApp();

    if (supabaseClient && upserts.length > 0) {
        try {
            await supabaseClient.from("presenze").upsert(upserts, { onConflict: "data,iscritto_id" });
        } catch (e) {
            console.error("copyCatechismoToOratorio Supabase:", e);
        }
    }

    if (countCopied > 0) {
        showToast(`✅ ${countCopied} ragazzi segnati come presenti in oratorio!`);
    } else {
        showToast("ℹ️ Nessun ragazzo da passare (segna prima chi è a catechismo)");
    }
}

async function markAllCatechismo() {
    if (!attendance[currentDate]) attendance[currentDate] = {};
    const visiblePeople = getFilteredPeople().filter(p => p.iscrittoCatechismo);
    let countMarked = 0;
    const upserts = [];

    visiblePeople.forEach((p) => {
        if (!attendance[currentDate][p.id]) {
            attendance[currentDate][p.id] = { catechismo: true, oratorio: false, messa: false, uscito: false, oraUscita: "" };
            countMarked++;
        } else if (!attendance[currentDate][p.id].catechismo) {
            attendance[currentDate][p.id].catechismo = true;
            countMarked++;
        }

        if (supabaseClient) {
            const pAtt = attendance[currentDate][p.id];
            upserts.push({
                data: currentDate,
                iscritto_id: p.id,
                catechismo: true,
                oratorio: pAtt.oratorio,
                messa: pAtt.messa,
                uscito: pAtt.uscito,
                ora_uscita: pAtt.ora_uscita || "",
                updated_at: new Date().toISOString()
            });
        }
    });

    saveAttendanceToLocal();
    renderApp();

    if (supabaseClient && upserts.length > 0) {
        try {
            await supabaseClient.from("presenze").upsert(upserts, { onConflict: "data,iscritto_id" });
        } catch (e) {
            console.error("markAllCatechismo Supabase:", e);
        }
    }

    showToast(`📖 ${countMarked} ragazzi segnati presenti a catechismo!`);
}

function showToast(msg) {
    const existing = document.getElementById("app-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "app-toast";
    toast.style.cssText = "position:fixed;bottom:24px;right:24px;background:#1e293b;color:#fff;padding:12px 20px;border-radius:12px;font-size:0.9rem;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.25);z-index:9999;transition:opacity 0.3s ease;";
    toast.textContent = msg;

    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

function openNewPersonModal() {
    const modal = document.getElementById("personModal");
    const form = document.getElementById("personForm");
    const title = document.getElementById("modalTitle");
    const deleteBtn = document.getElementById("deletePersonBtn");
    const inputId = document.getElementById("inputId");
    const inputCatechismo = document.getElementById("inputCatechismo");
    const inputNome = document.getElementById("inputNome");

    if (form) form.reset();
    if (inputId) inputId.value = "";
    if (inputCatechismo) inputCatechismo.checked = true;
    if (title) title.textContent = "Nuovo Iscritto";
    if (deleteBtn) deleteBtn.classList.add("hidden");

    if (modal) modal.classList.remove("hidden");
    if (inputNome) inputNome.focus();
}

window.openEditPersonModal = function (personId) {
    const person = people.find(p => p.id === personId);
    if (!person) return;

    const modal = document.getElementById("personModal");
    const title = document.getElementById("modalTitle");
    const deleteBtn = document.getElementById("deletePersonBtn");

    const inputId = document.getElementById("inputId");
    const inputNome = document.getElementById("inputNome");
    const inputCognome = document.getElementById("inputCognome");
    const selectRuolo = document.getElementById("selectRuolo");
    const selectAnno = document.getElementById("selectAnno");
    const inputCatechismo = document.getElementById("inputCatechismo");
    const inputAllergie = document.getElementById("inputAllergie");
    const inputDeleghe = document.getElementById("inputDeleghe");
    const inputNote = document.getElementById("inputNote");

    if (inputId) inputId.value = person.id;
    if (inputNome) inputNome.value = person.nome || "";
    if (inputCognome) inputCognome.value = person.cognome || "";
    if (selectRuolo) selectRuolo.value = person.ruolo || "Bambino";
    if (selectAnno) selectAnno.value = person.anno || "prima";
    if (inputCatechismo) inputCatechismo.checked = !!person.iscrittoCatechismo;
    if (inputAllergie) inputAllergie.value = person.allergie || "";
    if (inputDeleghe) inputDeleghe.value = person.deleghe || "";
    if (inputNote) inputNote.value = person.note || "";

    if (title) title.textContent = "Modifica Iscritto";
    if (deleteBtn) deleteBtn.classList.remove("hidden");
    if (modal) modal.classList.remove("hidden");
};

function closeModal() {
    const modal = document.getElementById("personModal");
    if (modal) modal.classList.add("hidden");
}

async function handlePersonFormSubmit(e) {
    e.preventDefault();

    const inputId = document.getElementById("inputId");
    const id = inputId ? inputId.value : "";
    const nome = (document.getElementById("inputNome")?.value || "").trim();
    const cognome = (document.getElementById("inputCognome")?.value || "").trim();
    const ruolo = document.getElementById("selectRuolo")?.value || "Bambino";
    const anno = document.getElementById("selectAnno")?.value || "prima";
    const iscrittoCatechismo = !!document.getElementById("inputCatechismo")?.checked;
    const allergie = (document.getElementById("inputAllergie")?.value || "").trim();
    const deleghe = (document.getElementById("inputDeleghe")?.value || "").trim();
    const note = (document.getElementById("inputNote")?.value || "").trim();

    if (!nome || !cognome) {
        alert("Inserisci sia il nome che il cognome!");
        return;
    }

    const personObj = {
        id: id || ("p_" + Date.now()),
        nome, cognome, ruolo, anno, iscrittoCatechismo, allergie, deleghe, note
    };

    if (id) {
        const index = people.findIndex(p => p.id === id);
        if (index !== -1) people[index] = personObj;
    } else {
        people.push(personObj);
    }

    savePeopleToLocal();
    closeModal();
    renderApp();

    if (supabaseClient) {
        try {
            await supabaseClient.from("iscritti").upsert({
                id: personObj.id,
                nome: personObj.nome,
                cognome: personObj.cognome,
                ruolo: personObj.ruolo,
                anno: personObj.anno,
                iscritto_catechismo: personObj.iscrittoCatechismo,
                allergie: personObj.allergie,
                deleghe: personObj.deleghe,
                note: personObj.note
            });
        } catch (e) {
            console.error("Errore salvataggio persona su Supabase:", e);
        }
    }

    showToast(id ? "Profilo aggiornato!" : "Nuovo iscritto salvato!");
}

async function handleDeletePerson() {
    const inputId = document.getElementById("inputId");
    const id = inputId ? inputId.value : "";
    if (!id) return;

    const person = people.find(p => p.id === id);
    if (!person) return;

    if (confirm(`Sei sicuro di voler eliminare ${person.nome} ${person.cognome}?`)) {
        people = people.filter(p => p.id !== id);
        for (const date in attendance) {
            delete attendance[date][id];
        }
        savePeopleToLocal();
        saveAttendanceToLocal();
        closeModal();
        renderApp();

        if (supabaseClient) {
            try {
                await supabaseClient.from("iscritti").delete().eq("id", id);
            } catch (e) {
                console.error("Errore cancellazione su Supabase:", e);
            }
        }

        showToast("Iscritto eliminato.");
    }
}

// Generatore Squadre
const TEAM_COLORS = [
    { name: "Squadra Rossa", class: "team-rosso", emoji: "🔴" },
    { name: "Squadra Blu", class: "team-blu", emoji: "🔵" },
    { name: "Squadra Gialla", class: "team-giallo", emoji: "🟡" },
    { name: "Squadra Verde", class: "team-verde", emoji: "🟢" },
    { name: "Squadra Viola", class: "team-viola", emoji: "🟣" },
    { name: "Squadra Arancione", class: "team-arancio", emoji: "🟠" }
];

let lastGeneratedTeams = [];

function generateTeams() {
    const outputContainer = document.getElementById("squadreOutput");
    if (!outputContainer) return;

    const numSquadre = parseInt(document.getElementById("numSquadre")?.value || "4", 10);
    const bilanciaEta = document.getElementById("checkBilanciaEta")?.checked ?? true;

    const dayAttendance = attendance[currentDate] || {};
    const presentInOratorio = people.filter(p => {
        const att = dayAttendance[p.id];
        return att && att.oratorio && p.ruolo === "Bambino";
    });

    if (presentInOratorio.length === 0) {
        outputContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon"><i class="fa-solid fa-person-running"></i></div>
                <h3 style="font-weight:700; color:#334155; margin-bottom:4px;">Nessun ragazzo in Oratorio oggi</h3>
                <p style="font-size:0.85rem;">
                    Segna prima i ragazzi presenti in Oratorio nella scheda <strong>Appello</strong>
                    (puoi usare il tasto <em>"Fermali tutti in Oratorio"</em>).
                </p>
            </div>
        `;
        lastGeneratedTeams = [];
        return;
    }

    const teams = Array.from({ length: numSquadre }, (_, i) => ({
        colorInfo: TEAM_COLORS[i % TEAM_COLORS.length],
        members: []
    }));

    if (bilanciaEta) {
        const ageWeight = { prima: 1, seconda: 2, terza: 3, quarta: 4, quinta: 5, primaMedia: 6, secondaMedia: 7, terzaMedia: 8 };
        const sorted = [...presentInOratorio].sort((a, b) => (ageWeight[b.anno] || 0) - (ageWeight[a.anno] || 0));

        let teamIndex = 0;
        let direction = 1;
        sorted.forEach(p => {
            teams[teamIndex].members.push(p);
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
        const shuffled = [...presentInOratorio].sort(() => Math.random() - 0.5);
        shuffled.forEach((p, idx) => {
            teams[idx % numSquadre].members.push(p);
        });
    }

    lastGeneratedTeams = teams;

    let html = "";
    teams.forEach(team => {
        html += `
            <div class="team-card">
                <div class="team-header ${team.colorInfo.class}">
                    <span>${team.colorInfo.emoji} ${team.colorInfo.name}</span>
                    <span class="team-count-badge">${team.members.length} giocatori</span>
                </div>
                <div class="team-members-list">
                    ${
                        team.members.length === 0
                            ? `<p style="font-size:0.8rem; color:#94a3b8; text-align:center; padding:10px;">Nessun componente</p>`
                            : team.members.map(m => `
                                <div class="team-member-item">
                                    <span>${escapeHtml(m.nome)} ${escapeHtml(m.cognome)}</span>
                                    <span class="team-member-class">${escapeHtml(ANNO_LABELS[m.anno] || m.anno)}</span>
                                </div>
                            `).join("")
                    }
                </div>
            </div>
        `;
    });

    outputContainer.innerHTML = html;
}

function copyTeamsForWhatsApp() {
    if (!lastGeneratedTeams || lastGeneratedTeams.length === 0) {
        showToast("⚠️ Nessuna squadra da copiare. Genera prima le squadre!");
        return;
    }

    let text = `🏆 *SQUADRE GIOCHI ORATORIO* (${currentDate})\n`;
    text += `Totale ragazzi in campo: ${lastGeneratedTeams.reduce((acc, t) => acc + t.members.length, 0)}\n\n`;

    lastGeneratedTeams.forEach(t => {
        text += `${t.colorInfo.emoji} *${t.colorInfo.name.toUpperCase()}* (${t.members.length})\n`;
        t.members.forEach(m => {
            const anno = ANNO_LABELS[m.anno] || m.anno;
            text += `  • ${m.nome} ${m.cognome} (${anno})\n`;
        });
        text += `\n`;
    });

    text += `Buon divertimento a tutti! ⚽🎉`;

    navigator.clipboard.writeText(text).then(() => {
        showToast("📋 Squadre copiate! Pronte da incollare su WhatsApp.");
    }).catch(() => {
        showToast("Seleziona e copia il testo manualmente.");
    });
}

function exportToCSV() {
    const dayAttendance = attendance[currentDate] || {};
    let csv = "\uFEFFData,Cognome,Nome,Ruolo,Classe,Catechismo,Presente Catechismo,In Oratorio,Messa,Uscito,Ora Uscita,Allergie,Deleghe,Note\n";

    people.forEach(p => {
        const att = dayAttendance[p.id] || { catechismo: false, oratorio: false, messa: false, uscito: false, oraUscita: "" };
        const row = [
            `"${currentDate}"`,
            `"${cleanCsv(p.cognome)}"`,
            `"${cleanCsv(p.nome)}"`,
            `"${cleanCsv(p.ruolo)}"`,
            `"${cleanCsv(ANNO_LABELS[p.anno] || p.anno)}"`,
            `"${p.iscrittoCatechismo ? 'Sì' : 'No'}"`,
            `"${att.catechismo ? 'Presente' : 'Assente'}"`,
            `"${att.oratorio ? 'Sì' : 'No'}"`,
            `"${att.messa ? 'Presente' : 'Assente'}"`,
            `"${att.uscito ? 'Sì' : 'No'}"`,
            `"${att.oraUscita || ''}"`,
            `"${cleanCsv(p.allergie || '')}"`,
            `"${cleanCsv(p.deleghe || '')}"`,
            `"${cleanCsv(p.note || '')}"`
        ];
        csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `registro_presenze_${currentDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("📊 File CSV scaricato!");
}

function cleanCsv(str) {
    return str ? String(str).replace(/"/g, '""') : "";
}

function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
