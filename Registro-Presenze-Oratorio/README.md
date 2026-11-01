# ⛪ Registro Elettronico Oratorio & Catechismo

Pacchetto completo, indipendente e pronto all'uso con le interfacce collegate allo **stesso database condiviso**:
1. ⛪ **Interfaccia Parrocchia (`index.html`)**: la visualizzazione generale per la segreteria, il parroco e gli animatori.
2. 📖 **Portale Generale Catechiste (`catechiste.html`)**: la pagina generale dove le catechiste scelgono la propria classe.
3. 📝 **Registro di Classe (`registro_classe.html`)**: la pagina dedicata che si apre dopo aver scelto la classe, con l'elenco dei ragazzi e la gestione completa delle presenze (*Catechismo, Messa, Oratorio, allergie, deleghe, note*).

Tutte le pagine condividono lo **stesso database** (Supabase Cloud + memoria locale offline `localStorage`) e sincronizzano i dati in tempo reale tra tutti i dispositivi.

---

## 🚀 Avvio Rapido su Windows (Doppio Clic)

All'interno di questa cartella troverai i file di avvio rapido:
* 🖱️ Fai doppio clic su **`1_Apri_Parrocchia.bat`** ➔ Apre subito l'interfaccia generale per la Parrocchia nel browser.
* 🖱️ Fai doppio clic su **`2_Apri_Catechiste.bat`** ➔ Apre subito il **Portale Catechiste per la scelta della classe**.
* 🖱️ Fai doppio clic su **`3_Avvia_Server_WiFi.bat`** ➔ (Opzionale) Avvia il server Python locale per condividere il registro sulla rete Wi-Fi dell'oratorio.

---

## 📖 Il Flusso per le Catechiste (In Due Fasi)

### Fase 1: 🌟 Pagina Generale Scelta Classe (`catechiste.html`)
Quando una catechista accede dal proprio smartphone o PC:
* Viene accolta da una schermata accogliente con la data del giorno.
* Vede le **card grandi e colorate di tutte le classi**:
  * 🌟 **1ª Elementare**, **2ª Elementare**, **3ª Elementare**, **4ª Elementare**, **5ª Elementare**
  * 📘 **1ª Media**, **2ª Media**, **3ª Media**
* Ogni card mostra in tempo reale:
  * Il numero totale di alunni iscritti a quella classe.
  * Il numero di presenti registrati per la data selezionata.
* Se ha già usato l'app in precedenza, in cima trova il box rapido: *"La tua classe abituale: 3ª Elementare ➔ [Apri Subito]"*.
* **Basta un clic o un tocco sulla card della classe per aprire la pagina dedicata con l'elenco dei ragazzi!**

---

### Fase 2: 📝 Pagina Registro di Classe (`registro_classe.html?classe=...`)
Si apre la pagina dedicata e focalizzata esclusivamente sulla classe scelta:
* **Tasto "◀ Tutte le Classi"**: nell'header per tornare in qualsiasi momento alla pagina generale di scelta classe.
* **Tasto "⛪ Vista Parrocchia"**: per passare alla visualizzazione parrocchiale globale.
* **Dashboard & Statistiche della Classe**:
  * Nome della classe (es. *3ª Elementare*).
  * Contatori in tempo reale: Iscritti, Presenti Catechismo, Assenti, Fermati in Oratorio, Messa.
  * Tasto rapido **"Tutti Presenti a Catechismo"** (con un tocco segna tutta la classe presente!).
  * Tasto rapido **"Tutti in Oratorio"** (sposta tutti i presenti della classe direttamente ai giochi in cortile).
  * Tasto **"+ Nuovo Bambino"** (apre la modale con la classe già impostata).
  * Tasto **"Stampa Classe"** (stampa il foglio presenze per la cartellina cartacea).
* **Elenco Alunni con Gestione Completa**:
  * 📖 **Presenza Catechismo**: grande tasto touch verde (*Presente a Catechismo*) o grigio (*Assente*).
  * ⛪ **Presenza Messa**: indicatore di partecipazione alla Santa Messa domenicale.
  * ⚽ **In Oratorio?**: indica se il bambino si ferma in cortile per giocare o per il doposcuola dopo la lezione.
  * ⚠️ **Allergie e Intolleranze**: badge rosso evidente per celiachia, lattosio, frutta a guscio, ecc. (essenziale per la merenda!).
  * ⏰ **Uscite Anticipate & Deleghe**: indicazione dell'orario e di chi ritira il bambino (es. *"Esce alle 16:30 con la nonna"*).
  * 📞 **Pulsante Chiama Genitore**: avvia subito la chiamata o WhatsApp dallo smartphone se il bambino manca o per urgenze.
  * ✏️ **Modifica Dati**: permette di aggiornare al volo telefono, note o allergie.
* **Appunti della Lezione di Oggi**:
  * Box per registrare il brano del Vangelo spiegato, i compiti assegnati e le comunicazioni alle famiglie, memorizzati nel database.

---

## ⛪ 3. Interfaccia Parrocchia (`index.html`)

La centrale operativa generale per l'oratorio:
* **Appello Presenze Globale**: visualizza tutti gli iscritti (bambini e animatori), con filtri per ruolo, classe, iscrizione a catechismo e ricerca testuale.
* **Pulsante "Area Catechiste"**: nell'header e nella barra di navigazione per accedere alla pagina di scelta classe.
* **Generatore Squadre per i Giochi**:
  * Prende automaticamente solo i bambini effettivamente presenti oggi in oratorio.
  * Da 2 a 6 squadre colorate con bilanciamento per età (elementari e medie).
  * Pulsante **Copia per WhatsApp** con emoji pronto da incollare nella chat animatori.
* **Riepilogo Merende & Uscite**: monitoraggio delle intolleranze e degli orari di uscita/ritiro.
* **Statistiche Sacramenti**: percentuali di frequenza per Prima Comunione e Cresima.
* **Esportazione & Stampa**: download foglio presenze in formato CSV (Excel) e foglio firme cartaceo.

---

## 🗄️ Database e Sincronizzazione in Tempo Reale

Tutte le pagine condividono lo **stesso database**:
1. **Supabase Cloud**:
   * Progetto: `https://qxevcfjtjbrlewagorju.supabase.co`
   * Tabelle utilizzate:
     * `iscritti`: archivio anagrafico completo.
     * `presenze`: storico presenze giornaliero (data, catechismo, oratorio, messa, uscite).
     * `note_giornaliere`: appunti e comunicazioni del giorno.
2. **Sincronizzazione in Tempo Reale (Supabase Realtime)**:
   * Le modifiche fatte dalla catechista nella pagina di classe compaiono **immediatamente** sullo schermo del computer della parrocchia.
   * I conteggi nel portale di scelta classe si aggiornano istantaneamente.
3. **Modalità Offline (`localStorage`)**:
   * Se manca internet, tutto continua a funzionare sul dispositivo e si sincronizza appena torna la connessione.

---

## 📁 Struttura dei File nella Cartella

```text
Registro-Presenze-Oratorio/
├── 1_Apri_Parrocchia.bat    # Avvio rapido interfaccia Parrocchia
├── 2_Apri_Catechiste.bat    # Avvio rapido Portale Scelta Classe
├── 3_Avvia_Server_WiFi.bat  # Avvio server Python Wi-Fi locale
├── catechiste.html          # Pagina generale: scelta della classe
├── registro_classe.html     # Pagina di classe: elenco ragazzi e gestione presenze
├── index.html               # Interfaccia generale per la Parrocchia
├── env.js                   # Configurazione credenziali Supabase Cloud
├── style.css                # Fogli di stile grafici responsive
├── script.js                # Motore logico JavaScript e sincronizzazione
├── server.py                # Server Python opzionale per la rete Wi-Fi dell'oratorio
├── registro_oratorio.db     # Database SQLite locale di backup
├── supabase_schema.sql      # Schema tabelle per Supabase Cloud
├── schema.sql               # Schema tabelle per SQLite locale
└── README.md                # Questa guida all'uso
```
