/**
 * ==========================================================================
 * REGISTRO PRESENZE ORATORIO - js/data.js
 * Modello Dati, Classi, LocalStorage, Telefoni Multipli e Attività
 * ==========================================================================
 */

// 1. ELENCO CLASSI PER CATECHISMO (Dalla 3ª Elementare alla 2ª Media)
const CATECHISMO_CLASSES = [
  { id: 'terza', label: '3ª Elementare' },
  { id: 'quarta', label: '4ª Elementare' },
  { id: 'quinta', label: '5ª Elementare' },
  { id: 'primaMedia', label: '1ª Media' },
  { id: 'secondaMedia', label: '2ª Media' },
];

// 2. ELENCO CLASSI PER ORATORIO (Dalla 1ª Elementare alla 3ª Media + Staff)
const ORATORIO_CLASSES = [
  { id: 'prima', label: '1ª Elementare' },
  { id: 'seconda', label: '2ª Elementare' },
  { id: 'terza', label: '3ª Elementare' },
  { id: 'quarta', label: '4ª Elementare' },
  { id: 'quinta', label: '5ª Elementare' },
  { id: 'primaMedia', label: '1ª Media' },
  { id: 'secondaMedia', label: '2ª Media' },
  { id: 'terzaMedia', label: '3ª Media' },
  { id: 'animatore', label: 'Animatore / Staff' },
];

// Mapping globale Anni
const ANNO_LABELS = {
  prima: '1ª Elementare',
  seconda: '2ª Elementare',
  terza: '3ª Elementare',
  quarta: '4ª Elementare',
  quinta: '5ª Elementare',
  primaMedia: '1ª Media',
  secondaMedia: '2ª Media',
  terzaMedia: '3ª Media',
  animatore: 'Animatore / Staff',
};

const ANNO_WEIGHTS = {
  prima: 1,
  seconda: 2,
  terza: 3,
  quarta: 4,
  quinta: 5,
  primaMedia: 6,
  secondaMedia: 7,
  terzaMedia: 8,
  animatore: 9,
};

// 3. DATI INIZIALI ISCRITTI (Con telefoni multipli)
const INITIAL_PEOPLE = [
  {
    id: 'p_1',
    nome: 'Luca',
    cognome: 'Rossi',
    ruolo: 'Bambino',
    anno: 'terza',
    iscrittoCatechismo: true,
    allergie: 'Intolleranza al Lattosio',
    deleghe: 'Esce alle 16:30 con la nonna Maria',
    note: 'Molto vivace nei giochi a squadre',
    telefoni: [
      { etichetta: 'Mamma', numero: '3331112233' },
      { etichetta: 'Papà', numero: '3485556677' }
    ]
  },
  {
    id: 'p_2',
    nome: 'Giulia',
    cognome: 'Bianchi',
    ruolo: 'Bambino',
    anno: 'terza',
    iscrittoCatechismo: true,
    allergie: '',
    deleghe: 'Ritiro papà Marco',
    note: 'Partecipa sia a catechismo che doposcuola',
    telefoni: [
      { etichetta: 'Papà', numero: '3409988776' },
      { etichetta: 'Mamma', numero: '3391234567' }
    ]
  },
  {
    id: 'p_3',
    nome: 'Matteo',
    cognome: 'Verdi',
    ruolo: 'Bambino',
    anno: 'quarta',
    iscrittoCatechismo: true,
    allergie: 'Frutta a guscio (Arachidi) - Grave!',
    deleghe: '',
    note: 'Chierichetto alla Messa domenicale',
    telefoni: [
      { etichetta: 'Mamma', numero: '3281234567' },
      { etichetta: 'Casa', numero: '029876543' }
    ]
  },
  {
    id: 'p_4',
    nome: 'Sara',
    cognome: 'Neri',
    ruolo: 'Bambino',
    anno: 'prima',
    iscrittoCatechismo: false, // 1ª elem: solo oratorio
    allergie: '',
    deleghe: 'Delega a zia Elena',
    note: 'Doposcuola e cortile oratorio',
    telefoni: [
      { etichetta: 'Mamma', numero: '3310001122' }
    ]
  },
  {
    id: 'p_5',
    nome: 'Lorenzo',
    cognome: 'Ferrari',
    ruolo: 'Bambino',
    anno: 'quinta',
    iscrittoCatechismo: true,
    allergie: '',
    deleghe: 'Torna a casa da solo (autorizzazione firmata)',
    note: 'Preparazione per la Prima Comunione',
    telefoni: [
      { etichetta: 'Papà', numero: '3385554433' },
      { etichetta: 'Mamma', numero: '3338889900' }
    ]
  },
  {
    id: 'p_6',
    nome: 'Elena',
    cognome: 'Romano',
    ruolo: 'Bambino',
    anno: 'secondaMedia',
    iscrittoCatechismo: true,
    allergie: 'Glutine (Celiachia) - Merenda dedicata',
    deleghe: 'Va via con la sorella maggiore',
    note: 'Gruppo cresimandi medie',
    telefoni: [
      { etichetta: 'Mamma', numero: '3471122334' },
      { etichetta: 'Sorella', numero: '3459988112' }
    ]
  },
  {
    id: 'p_7',
    nome: 'Federico',
    cognome: 'Gallo',
    ruolo: 'Bambino',
    anno: 'primaMedia',
    iscrittoCatechismo: true,
    allergie: '',
    deleghe: '',
    note: 'Appassionato di calcetto in oratorio',
    telefoni: [
      { etichetta: 'Mamma', numero: '3395566778' }
    ]
  },
  {
    id: 'p_8',
    nome: 'Sofia',
    cognome: 'Costa',
    ruolo: 'Bambino',
    anno: 'seconda',
    iscrittoCatechismo: false, // 2ª elem: solo oratorio
    allergie: 'Uovo',
    deleghe: 'Ritiro mamma',
    note: 'Gioca nel cortile oratorio',
    telefoni: [
      { etichetta: 'Mamma', numero: '3487788990' },
      { etichetta: 'Nonna', numero: '3496655443' }
    ]
  },
  {
    id: 'p_9',
    nome: 'Tommaso',
    cognome: 'Ricci',
    ruolo: 'Bambino',
    anno: 'terzaMedia',
    iscrittoCatechismo: false, // 3ª media: oratorio
    allergie: '',
    deleghe: 'Rientro autonomo',
    note: 'Gruppo dopo-cresima & tornei cortile',
    telefoni: [
      { etichetta: 'Papà', numero: '3357788991' }
    ]
  },
  {
    id: 'p_10',
    nome: 'Chiara',
    cognome: 'Moretti',
    ruolo: 'Animatore',
    anno: 'animatore',
    iscrittoCatechismo: false,
    allergie: '',
    deleghe: '',
    note: 'Coordinatrice giochi cortile e merenda',
    telefoni: [
      { etichetta: 'Cellulare', numero: '3398877665' }
    ]
  },
  {
    id: 'p_11',
    nome: 'Davide',
    cognome: 'Galli',
    ruolo: 'Animatore',
    anno: 'animatore',
    iscrittoCatechismo: false,
    allergie: '',
    deleghe: '',
    note: 'Educatore gruppo medie e tornei oratorio',
    telefoni: [
      { etichetta: 'Cellulare', numero: '3354433221' }
    ]
  }
];

// 4. COLORI E DEFINIZIONI SQUADRE
const TEAM_DEFINITIONS = [
  {
    id: 'rossa',
    name: 'Squadra Rossa',
    colorName: 'Rosso',
    headerBg: '#ef4444',
    headerText: '#ffffff',
    badgeBg: 'rgba(255, 255, 255, 0.25)',
  },
  {
    id: 'blu',
    name: 'Squadra Blu',
    colorName: 'Blu',
    headerBg: '#3b82f6',
    headerText: '#ffffff',
    badgeBg: 'rgba(255, 255, 255, 0.25)',
  },
  {
    id: 'gialla',
    name: 'Squadra Gialla',
    colorName: 'Giallo',
    headerBg: '#eab308',
    headerText: '#713f12',
    badgeBg: 'rgba(0, 0, 0, 0.12)',
  },
  {
    id: 'verde',
    name: 'Squadra Verde',
    colorName: 'Verde',
    headerBg: '#10b981',
    headerText: '#ffffff',
    badgeBg: 'rgba(255, 255, 255, 0.25)',
  },
  {
    id: 'viola',
    name: 'Squadra Viola',
    colorName: 'Viola',
    headerBg: '#8b5cf6',
    headerText: '#ffffff',
    badgeBg: 'rgba(255, 255, 255, 0.25)',
  },
  {
    id: 'arancio',
    name: 'Squadra Arancione',
    colorName: 'Arancione',
    headerBg: '#f97316',
    headerText: '#ffffff',
    badgeBg: 'rgba(255, 255, 255, 0.25)',
  },
];

// 5. HELPER TELEFONI MULTIPLI
function getPersonPhones(person) {
  if (person.telefoni && Array.isArray(person.telefoni) && person.telefoni.length > 0) {
    return person.telefoni.filter((t) => t && t.numero && t.numero.trim());
  }
  // Retrocompatibilità con stringa singola 'telefono'
  if (person.telefono && person.telefono.trim()) {
    return [{ etichetta: 'Famiglia', numero: person.telefono.trim() }];
  }
  return [];
}

// 6. GESTIONE DATA CONDIVISA
function getTodayString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getCurrentDate() {
  return localStorage.getItem('registro_data_corrente') || getTodayString();
}

function setCurrentDate(dateStr) {
  localStorage.setItem('registro_data_corrente', dateStr);
}

// 7. GESTIONE ISCRITTI
function getPeople() {
  const saved = localStorage.getItem('registro_iscritti_v2');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Errore lettura iscritti:', e);
    }
  }

  // Se esiste la vecchia chiave v1, migra i dati
  const legacySaved = localStorage.getItem('registro_iscritti_v1');
  if (legacySaved) {
    try {
      const legacyParsed = JSON.parse(legacySaved);
      if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
        const migrated = legacyParsed.map((p) => {
          if (!p.telefoni && p.telefono) {
            p.telefoni = [{ etichetta: 'Famiglia', numero: p.telefono }];
          }
          return p;
        });
        localStorage.setItem('registro_iscritti_v2', JSON.stringify(migrated));
        return migrated;
      }
    } catch (e) {}
  }

  localStorage.setItem('registro_iscritti_v2', JSON.stringify(INITIAL_PEOPLE));
  return [...INITIAL_PEOPLE];
}

function savePeople(peopleList) {
  localStorage.setItem('registro_iscritti_v2', JSON.stringify(peopleList));
}

function saveSinglePerson(person) {
  const people = getPeople();
  const index = people.findIndex((p) => p.id === person.id);
  if (index >= 0) {
    people[index] = person;
  } else {
    people.push(person);
  }
  savePeople(people);

  // Sync Supabase se connesso
  const client = getSupabaseClient();
  if (client) {
    client.from('iscritti').upsert({
      id: person.id,
      nome: person.nome,
      cognome: person.cognome,
      ruolo: person.ruolo,
      anno: person.anno,
      iscritto_catechismo: Boolean(person.iscrittoCatechismo),
      allergie: person.allergie || '',
      deleghe: person.deleghe || '',
      note: person.note || '',
      telefono: JSON.stringify(getPersonPhones(person)),
    }).then(({ error }) => {
      if (error) console.warn('Supabase upsert error:', error.message);
    });
  }
}

function deleteSinglePerson(personId) {
  const people = getPeople().filter((p) => p.id !== personId);
  savePeople(people);

  const client = getSupabaseClient();
  if (client) {
    client.from('iscritti').delete().eq('id', personId).then(({ error }) => {
      if (error) console.warn('Supabase delete error:', error.message);
    });
  }
}

// 8. GESTIONE PRESENZE
function getAllAttendance() {
  const saved = localStorage.getItem('registro_presenze_v1');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Errore lettura presenze:', e);
    }
  }
  return {};
}

function saveAllAttendance(attendanceMap) {
  localStorage.setItem('registro_presenze_v1', JSON.stringify(attendanceMap));
}

function getDayAttendance(dateStr) {
  const all = getAllAttendance();
  return all[dateStr] || {};
}

/**
 * Logica Catechismo: TUTTI PRESENTI DI DEFAULT!
 * Ritorna false solo se è stato esplicitamente segnato assente (A)
 */
function isStudentCatechismoPresent(dateStr, personId) {
  const dayAtt = getDayAttendance(dateStr);
  const rec = dayAtt[personId];
  if (!rec) return true; // Default: PRESENTE
  if (rec.assente === true || rec.catechismo === false) return false;
  return true;
}

function savePersonAttendance(dateStr, personId, record) {
  const all = getAllAttendance();
  if (!all[dateStr]) {
    all[dateStr] = {};
  }
  all[dateStr][personId] = record;
  saveAllAttendance(all);

  const client = getSupabaseClient();
  if (client) {
    client.from('presenze').upsert(
      {
        data: dateStr,
        iscritto_id: personId,
        catechismo: Boolean(record.catechismo),
        oratorio: Boolean(record.oratorio),
        messa: Boolean(record.messa),
        uscito: Boolean(record.uscito),
        ora_uscita: record.oraUscita || '',
        note_giorno: record.noteGiorno || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'data,iscritto_id' }
    ).then(({ error }) => {
      if (error) console.warn('Supabase upsert attendance error:', error.message);
    });
  }
}

function batchSaveAttendance(dateStr, updates) {
  const all = getAllAttendance();
  if (!all[dateStr]) {
    all[dateStr] = {};
  }
  const payload = [];

  updates.forEach(({ personId, record }) => {
    all[dateStr][personId] = record;
    payload.push({
      data: dateStr,
      iscritto_id: personId,
      catechismo: Boolean(record.catechismo),
      oratorio: Boolean(record.oratorio),
      messa: Boolean(record.messa),
      uscito: Boolean(record.uscito),
      ora_uscita: record.oraUscita || '',
      note_giorno: record.noteGiorno || '',
      updated_at: new Date().toISOString(),
    });
  });

  saveAllAttendance(all);

  const client = getSupabaseClient();
  if (client && payload.length > 0) {
    client.from('presenze').upsert(payload, { onConflict: 'data,iscritto_id' }).then(({ error }) => {
      if (error) console.warn('Supabase batch upsert attendance error:', error.message);
    });
  }
}

// 9. ATTIVITÀ DELLA GIORNATA (Home Parrocchia)
const DEFAULT_ACTIVITIES = [
  {
    id: 'act_1',
    ora: '14:30',
    titolo: 'Apertura Cortile & Accoglienza',
    icona: 'fa-door-open',
    categoria: 'Accoglienza',
    desc: 'Apertura cancelli dell\'oratorio, ritrovo animatori e accoglienza ragazzi per il gioco libero.',
  },
  {
    id: 'act_2',
    ora: '15:15',
    titolo: 'Doposcuola & Spazio Compiti',
    icona: 'fa-book-open',
    categoria: 'Studio',
    desc: 'Spazio studio assistito e compiti insieme nelle aule interne con gli educatori.',
  },
  {
    id: 'act_3',
    ora: '16:00',
    titolo: 'Inizio Incontri di Catechismo',
    icona: 'fa-chalkboard-user',
    categoria: 'Catechismo',
    desc: 'Lezioni per i gruppi dalla 3ª Elementare alla 2ª Media con i catechisti nelle rispettive aule.',
  },
  {
    id: 'act_4',
    ora: '17:00',
    titolo: 'Merenda Comunitaria in Cortile',
    icona: 'fa-apple-whole',
    categoria: 'Merenda',
    desc: 'Merenda per tutti in cortile (prestare attenzione alle allergie alimentari segnalate!).',
  },
  {
    id: 'act_5',
    ora: '17:30',
    titolo: 'Torneo & Giochi a Squadre',
    icona: 'fa-trophy',
    categoria: 'Giochi',
    desc: 'Attività a squadre per ragazzi elementari e medie gestite dagli animatori.',
  },
  {
    id: 'act_6',
    ora: '18:30',
    titolo: 'Chiusura Cortile & Uscite Famiglia',
    icona: 'fa-clock',
    categoria: 'Chiusura',
    desc: 'Ritiro dei ragazzi da parte dei genitori e autorizzati; chiusura oratorio.',
  },
];

function getDailyActivities(dateStr) {
  const key = `registro_attivita_${dateStr}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  return DEFAULT_ACTIVITIES;
}

function saveDailyActivities(dateStr, activities) {
  const key = `registro_attivita_${dateStr}`;
  localStorage.setItem(key, JSON.stringify(activities));
}

// 10. SUPABASE CLOUD (Collegamento Diretto e Sicuro al Database)
const SUPABASE_URL = 'https://smwqsfupiveykagibxac.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtd3FzZnVwaXZleWthZ2lieGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyMDczMTEsImV4cCI6MjExMDc4MzMxMX0.36Ybgg0MWzKvNk8Leo1VNtb8q7ZJ8ovoIoaqrae6cvE';

let _supabaseClientInstance = null;

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

// Funzione di retrocompatibilità
function getStoredAnonKey() {
  return SUPABASE_ANON_KEY;
}

function resetSupabaseClient() {
  _supabaseClientInstance = null;
}

async function syncRemoteSupabase(dateStr, onSyncedCallback) {
  const client = getSupabaseClient();
  if (!client) {
    if (onSyncedCallback) onSyncedCallback(false);
    return;
  }

  try {
    const { data: remotePeople, error: peopleErr } = await client
      .from('iscritti')
      .select('*')
      .order('cognome', { ascending: true });

    if (!peopleErr && remotePeople) {
      if (remotePeople.length > 0) {
        const normalizedPeople = remotePeople.map((r) => {
          let phones = [];
          try {
            if (r.telefono && r.telefono.startsWith('[')) {
              phones = JSON.parse(r.telefono);
            } else if (r.telefono) {
              phones = [{ etichetta: 'Famiglia', numero: r.telefono }];
            }
          } catch (e) {
            phones = r.telefono ? [{ etichetta: 'Famiglia', numero: r.telefono }] : [];
          }
          return {
            id: r.id,
            nome: r.nome,
            cognome: r.cognome,
            ruolo: r.ruolo,
            anno: r.anno,
            iscrittoCatechismo: Boolean(r.iscritto_catechismo),
            allergie: r.allergie || '',
            deleghe: r.deleghe || '',
            note: r.note || '',
            telefoni: phones,
          };
        });
        savePeople(normalizedPeople);
      } else {
        // Tabella remota vuota: carichiamo automaticamente gli iscritti locali per inizializzare il cloud
        const localPeople = getPeople();
        if (localPeople && localPeople.length > 0) {
          const payload = localPeople.map((p) => ({
            id: p.id,
            nome: p.nome,
            cognome: p.cognome,
            ruolo: p.ruolo,
            anno: p.anno,
            iscritto_catechismo: Boolean(p.iscrittoCatechismo),
            allergie: p.allergie || '',
            deleghe: p.deleghe || '',
            note: p.note || '',
            telefono: JSON.stringify(getPersonPhones(p)),
          }));
          await client.from('iscritti').upsert(payload);
        }
      }
    } else if (peopleErr) {
      console.warn('Avviso lettura tabella iscritti da Supabase:', peopleErr.message);
    }

    const { data: remoteAtt, error: attErr } = await client
      .from('presenze')
      .select('*')
      .eq('data', dateStr);

    if (!attErr && remoteAtt) {
      const all = getAllAttendance();
      all[dateStr] = all[dateStr] || {};
      remoteAtt.forEach((r) => {
        all[dateStr][r.iscritto_id] = {
          catechismo: Boolean(r.catechismo),
          oratorio: Boolean(r.oratorio),
          messa: Boolean(r.messa),
          uscito: Boolean(r.uscito),
          oraUscita: r.ora_uscita || '',
          noteGiorno: r.note_giorno || '',
        };
      });
      saveAllAttendance(all);
    } else if (attErr) {
      console.warn('Avviso lettura presenze da Supabase:', attErr.message);
    }

    const isConnected = !peopleErr && !attErr;
    if (onSyncedCallback) onSyncedCallback(isConnected);
  } catch (e) {
    console.error('Errore sincronizzazione Supabase:', e);
    if (onSyncedCallback) onSyncedCallback(false);
  }
}
