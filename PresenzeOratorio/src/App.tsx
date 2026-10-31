import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TabNav } from './components/TabNav';
import { FiltersAndCounters } from './components/FiltersAndCounters';
import { PersonCard } from './components/PersonCard';
import { PersonModal } from './components/PersonModal';
import { SquadreGenerator } from './components/SquadreGenerator';
import { SupabaseModal } from './components/SupabaseModal';
import type { Person, AttendanceRecord, FullAttendance } from './types';
import { INITIAL_PEOPLE, ANNO_LABELS } from './constants';
import {
  getSupabase,
  fetchRemotePeople,
  fetchRemoteAttendance,
  upsertRemotePerson,
  deleteRemotePerson,
  upsertRemoteAttendance,
  batchUpsertRemoteAttendance,
} from './lib/supabase';
import { FaUsersSlash } from 'react-icons/fa6';
import './App.css';

function getTodayString(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<string>(getTodayString());
  const [currentTab, setCurrentTab] = useState<'presenze' | 'squadre'>('presenze');

  // Stato Dati
  const [people, setPeople] = useState<Person[]>(() => {
    const saved = localStorage.getItem('registro_iscritti_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_PEOPLE;
  });

  const [attendance, setAttendance] = useState<FullAttendance>(() => {
    const saved = localStorage.getItem('registro_presenze_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  });

  // Filtri
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedCatechismo, setSelectedCatechismo] = useState('');
  const [selectedAnno, setSelectedAnno] = useState('');

  // Modali
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Stato Connessione Cloud
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Salvataggio locale automatico
  useEffect(() => {
    localStorage.setItem('registro_iscritti_v1', JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem('registro_presenze_v1', JSON.stringify(attendance));
  }, [attendance]);

  // Sincronizzazione iniziale con Supabase
  const syncSupabase = useCallback(async () => {
    const client = getSupabase();
    if (!client) {
      setIsCloudConnected(false);
      return;
    }

    const remotePeople = await fetchRemotePeople();
    if (remotePeople !== null) {
      setIsCloudConnected(true);
      if (remotePeople.length > 0) {
        setPeople(remotePeople);
      }
    } else {
      setIsCloudConnected(false);
    }

    const remoteAtt = await fetchRemoteAttendance(currentDate);
    if (remoteAtt !== null) {
      setAttendance((prev) => ({
        ...prev,
        [currentDate]: remoteAtt,
      }));
    }
  }, [currentDate]);

  useEffect(() => {
    syncSupabase();
  }, [syncSupabase]);

  // Gestione Date
  const handleShiftDate = (delta: number) => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setCurrentDate(`${yyyy}-${mm}-${dd}`);
  };

  const dayAttendance = attendance[currentDate] || {};

  // Calcolo Contatori
  let countCatechismo = 0;
  let countOratorio = 0;
  let countMessa = 0;

  Object.values(dayAttendance).forEach((item) => {
    if (item.catechismo) countCatechismo++;
    if (item.oratorio) countOratorio++;
    if (item.messa) countMessa++;
  });

  // Toggle Presenze
  const handleTogglePresence = async (
    personId: string,
    type: 'catechismo' | 'oratorio' | 'messa'
  ) => {
    const currentRecord: AttendanceRecord = dayAttendance[personId] || {
      catechismo: false,
      oratorio: false,
      messa: false,
      uscito: false,
      oraUscita: '',
    };

    const newRecord: AttendanceRecord = {
      ...currentRecord,
      [type]: !currentRecord[type],
    };

    // Se si toglie la presenza in oratorio, resetta anche lo stato di uscita
    if (type === 'oratorio' && !newRecord.oratorio) {
      newRecord.uscito = false;
      newRecord.oraUscita = '';
    }

    setAttendance((prev) => ({
      ...prev,
      [currentDate]: {
        ...(prev[currentDate] || {}),
        [personId]: newRecord,
      },
    }));

    await upsertRemoteAttendance(currentDate, personId, newRecord);
  };

  // Toggle Uscita Oratorio
  const handleToggleUscita = async (personId: string) => {
    const currentRecord: AttendanceRecord = dayAttendance[personId] || {
      catechismo: false,
      oratorio: false,
      messa: false,
      uscito: false,
      oraUscita: '',
    };

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    const newRecord: AttendanceRecord = {
      ...currentRecord,
      uscito: !currentRecord.uscito,
      oraUscita: !currentRecord.uscito ? `${hh}:${mm}` : '',
    };

    setAttendance((prev) => ({
      ...prev,
      [currentDate]: {
        ...(prev[currentDate] || {}),
        [personId]: newRecord,
      },
    }));

    await upsertRemoteAttendance(currentDate, personId, newRecord);
  };

  // Azione Rapida: Passaggio Catechismo ➔ Oratorio
  const handleCopyCatechismoToOratorio = async () => {
    let count = 0;
    const batchUpdates: Array<{ date: string; personId: string; att: AttendanceRecord }> = [];
    const updatedDay: Record<string, AttendanceRecord> = { ...dayAttendance };

    people.forEach((p) => {
      const pAtt = updatedDay[p.id];
      if (pAtt && pAtt.catechismo && !pAtt.oratorio) {
        const newRecord: AttendanceRecord = {
          ...pAtt,
          oratorio: true,
          uscito: false,
          oraUscita: '',
        };
        updatedDay[p.id] = newRecord;
        batchUpdates.push({ date: currentDate, personId: p.id, att: newRecord });
        count++;
      }
    });

    if (count > 0) {
      setAttendance((prev) => ({
        ...prev,
        [currentDate]: updatedDay,
      }));
      await batchUpsertRemoteAttendance(batchUpdates);
      showToast(`${count} ragazzi segnati come presenti in oratorio!`);
    } else {
      showToast('Nessun ragazzo da passare (segna prima chi e a catechismo)');
    }
  };

  // Azione Rapida: Tutti presenti a Catechismo
  const handleMarkAllCatechismo = async () => {
    const visiblePeople = filteredPeople.filter((p) => p.iscrittoCatechismo);
    let count = 0;
    const batchUpdates: Array<{ date: string; personId: string; att: AttendanceRecord }> = [];
    const updatedDay: Record<string, AttendanceRecord> = { ...dayAttendance };

    visiblePeople.forEach((p) => {
      const pAtt = updatedDay[p.id] || {
        catechismo: false,
        oratorio: false,
        messa: false,
        uscito: false,
        oraUscita: '',
      };

      if (!pAtt.catechismo) {
        const newRecord: AttendanceRecord = {
          ...pAtt,
          catechismo: true,
        };
        updatedDay[p.id] = newRecord;
        batchUpdates.push({ date: currentDate, personId: p.id, att: newRecord });
        count++;
      }
    });

    if (count > 0) {
      setAttendance((prev) => ({
        ...prev,
        [currentDate]: updatedDay,
      }));
      await batchUpsertRemoteAttendance(batchUpdates);
      showToast(`${count} ragazzi segnati presenti a catechismo!`);
    } else {
      showToast('Tutti i ragazzi visibili sono gia segnati a catechismo.');
    }
  };

  // Esportazione CSV (senza emoji)
  const handleExportCSV = () => {
    let csv = '\uFEFFData,Cognome,Nome,Ruolo,Classe,Catechismo,Presente Catechismo,In Oratorio,Messa,Uscito,Ora Uscita,Allergie,Deleghe,Note\n';

    people.forEach((p) => {
      const att = dayAttendance[p.id] || {
        catechismo: false,
        oratorio: false,
        messa: false,
        uscito: false,
        oraUscita: '',
      };

      const row = [
        `"${currentDate}"`,
        `"${(p.cognome || '').replace(/"/g, '""')}"`,
        `"${(p.nome || '').replace(/"/g, '""')}"`,
        `"${p.ruolo}"`,
        `"${ANNO_LABELS[p.anno] || p.anno}"`,
        `"${p.iscrittoCatechismo ? 'Si' : 'No'}"`,
        `"${att.catechismo ? 'Presente' : 'Assente'}"`,
        `"${att.oratorio ? 'Si' : 'No'}"`,
        `"${att.messa ? 'Presente' : 'Assente'}"`,
        `"${att.uscito ? 'Si' : 'No'}"`,
        `"${att.oraUscita || ''}"`,
        `"${(p.allergie || '').replace(/"/g, '""')}"`,
        `"${(p.deleghe || '').replace(/"/g, '""')}"`,
        `"${(p.note || '').replace(/"/g, '""')}"`,
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registro_presenze_${currentDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV scaricato con successo!');
  };

  // Gestione Modale Salvataggio / Eliminazione
  const handleSavePerson = async (saved: Person) => {
    const isEdit = people.some((p) => p.id === saved.id);
    if (isEdit) {
      setPeople((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
    } else {
      setPeople((prev) => [...prev, saved]);
    }

    setIsPersonModalOpen(false);
    setPersonToEdit(null);
    showToast(isEdit ? 'Profilo aggiornato!' : 'Nuovo iscritto salvato!');

    await upsertRemotePerson(saved);
  };

  const handleDeletePerson = async (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setIsPersonModalOpen(false);
    setPersonToEdit(null);
    showToast('Iscritto eliminato.');

    await deleteRemotePerson(id);
  };

  // Filtraggio Iscritti
  const filteredPeople = people.filter((p) => {
    if (selectedRole && p.ruolo !== selectedRole) return false;
    if (selectedCatechismo === 'si' && !p.iscrittoCatechismo) return false;
    if (selectedCatechismo === 'no' && p.iscrittoCatechismo) return false;
    if (selectedAnno && p.anno !== selectedAnno) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = `${p.nome} ${p.cognome}`.toLowerCase().includes(q);
      const matchAllergie = (p.allergie || '').toLowerCase().includes(q);
      const matchDeleghe = (p.deleghe || '').toLowerCase().includes(q);
      const matchNote = (p.note || '').toLowerCase().includes(q);
      if (!matchName && !matchAllergie && !matchDeleghe && !matchNote) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="app-root">
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onShiftDate={handleShiftDate}
        onSetToday={() => setCurrentDate(getTodayString())}
        isCloudConnected={isCloudConnected}
        onOpenCloudConfig={() => setIsSupabaseModalOpen(true)}
      />

      <TabNav currentTab={currentTab} onTabChange={setCurrentTab} />

      {currentTab === 'presenze' ? (
        <>
          <FiltersAndCounters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            selectedCatechismo={selectedCatechismo}
            onCatechismoChange={setSelectedCatechismo}
            selectedAnno={selectedAnno}
            onAnnoChange={setSelectedAnno}
            onOpenNewPersonModal={() => {
              setPersonToEdit(null);
              setIsPersonModalOpen(true);
            }}
            countCatechismo={countCatechismo}
            countOratorio={countOratorio}
            countMessa={countMessa}
            onCopyCatechismoToOratorio={handleCopyCatechismoToOratorio}
            onMarkAllCatechismo={handleMarkAllCatechismo}
            onExportCSV={handleExportCSV}
            onPrint={() => window.print()}
          />

          <main id="AppelloContainer" className="main-content">
            {filteredPeople.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FaUsersSlash />
                </div>
                <h3 style={{ fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Nessun iscritto trovato
                </h3>
                <p style={{ fontSize: '0.85rem' }}>
                  Prova a modificare i filtri o premi il tasto <strong>+</strong> per aggiungere un iscritto.
                </p>
              </div>
            ) : (
              <div className="people-grid">
                {filteredPeople.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    attendance={
                      dayAttendance[person.id] || {
                        catechismo: false,
                        oratorio: false,
                        messa: false,
                        uscito: false,
                        oraUscita: '',
                      }
                    }
                    onTogglePresence={handleTogglePresence}
                    onToggleUscita={handleToggleUscita}
                    onEdit={(p) => {
                      setPersonToEdit(p);
                      setIsPersonModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </main>
        </>
      ) : (
        <SquadreGenerator
          currentDate={currentDate}
          people={people}
          attendance={dayAttendance}
          onShowToast={showToast}
        />
      )}

      {/* Modale Profilo */}
      <PersonModal
        isOpen={isPersonModalOpen}
        personToEdit={personToEdit}
        onClose={() => {
          setIsPersonModalOpen(false);
          setPersonToEdit(null);
        }}
        onSave={handleSavePerson}
        onDelete={handleDeletePerson}
      />

      {/* Modale Configurazione Supabase */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigSaved={syncSupabase}
      />

      {/* Notifica Toast */}
      {toastMessage && <div id="app-toast">{toastMessage}</div>}
    </div>
  );
};

export default App;
