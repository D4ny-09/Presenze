# ⛪ Registro Elettronico Oratorio & Catechismo

Un sistema completo, moderno e reattivo per gestire le presenze dei ragazzi a **Catechismo**, monitorare chi si ferma in **Oratorio** per il doposcuola e i giochi, verificare la partecipazione alla **S. Messa**, salvaguardare le intolleranze per la **Merenda** e generare le **Squadre** per i giochi in cortile.

---

## 🚀 Due modalità di utilizzo

### 1. Modalità Standalone (Zero Installazione / 100% Offline)
Non serve installare nulla:
1. Apri direttamente il file **`index.html`** con un qualsiasi browser (Google Chrome, Safari, Edge, Firefox).
2. I dati vengono salvati automaticamente nella memoria del dispositivo (`localStorage`).
3. Funziona **senza connessione internet**, ideale per il cortile dell'oratorio o i locali parrocchiali.

### 2. Modalità Wi-Fi Oratorio (Multi-dispositivo in tempo reale)
Ideale se più catechisti e animatori vogliono prendere le presenze contemporaneamente dai propri smartphone:
1. Sul computer della parrocchia apri il terminale nella cartella e avvia:
   ```bash
   python3 server.py
   ```
2. Il server mostrerà l'indirizzo di rete, ad esempio:
   ```text
   ▶ Sul Wi-Fi dell'oratorio: http://192.168.1.45:8080
   ```
3. Tutti i catechisti e gli animatori connessi al Wi-Fi possono aprire quell'indirizzo dal cellulare e collaborare sullo stesso archivio SQLite in tempo reale!

---

## 🌟 Funzionalità Principali

### 1. 📋 Appello & Registro Presenze Giornaliero
* **Navigazione Data Rapida**: selettore data con pulsanti `Oggi`, `Ieri`, `Domani` e calendario.
* **3 Presenze Distinte**:
  * 📖 **Catechismo** (presente/assente)
  * ⚽ **Oratorio / Cortile** (chi si ferma a giocare dopo il catechismo o doposcuola)
  * ⛪ **Santa Messa**
* **Azione Rapida "Passaggio Catechismo ➔ Oratorio"**: con un clic segna tutti i ragazzi presenti a catechismo come fermati in oratorio per giocare!
* **Filtri istantanei**: per classe (1ª-5ª Elementare, Medie, Superiori, Staff), per iscrizione (Solo Catechismo / Solo Oratorio) e ricerca per nome/cognome.

### 2. 🥪 Sicurezza Merenda & Registro Uscite
* **Riepilogo Allergie & Intolleranze**: visualizza istantaneamente l'elenco dei ragazzi presenti che hanno allergie alimentari (es. celiachia, lattosio, frutta a guscio), utilissimo per chi prepara e distribuisce la merenda.
* **Monitoraggio Uscite & Deleghe**: verifica in ogni momento chi è ancora dentro l'oratorio e chi è già uscito/ritirato dai genitori (con registrazione dell'orario di uscita).

### 3. 🏆 Generatore Squadre per i Giochi
* Seleziona automaticamente solo i bambini effettivamente presenti oggi in oratorio.
* Permette di creare da **2 a 6 squadre** con colori distinti (Gialli, Rossi, Blu, Verdi, Viola, Arancioni).
* **Algoritmo di bilanciamento per età**: distribuisce equamente bambini delle elementari e ragazzi delle medie per evitare squadre squilibrate.
* **Tasto "Copia per WhatsApp"**: formatta l'elenco delle squadre con emoji pronto per essere incollato nella chat degli animatori.

### 4. 📊 Statistiche Presenze & Ammissioni Sacramenti
* Calcolo automatico della percentuale di frequenza a Catechismo e a Messa per ogni ragazzo.
* Utile per le catechiste e per il Parroco per la verifica dei requisiti di ammissione a **Prima Comunione** e **Cresima**.

### 5. 🖨️ Stampa & Esportazioni
* **Stampa / PDF**: genera un foglio firme pulito e professionale per la cartellina cartacea.
* **Esporta Excel / CSV**: download del foglio presenze giornaliero o storico.
* **Backup & Ripristino JSON**: salvataggio di sicurezza dell'intero database con un clic.

---

## 📁 Struttura dei File

```text
registro-oratorio/
├── index.html        # Struttura HTML del registro presenze (completa di modale e generatori)
├── style.css         # Stile grafico responsive, colori, badge allergie e stile stampa
├── script.js         # Motore JavaScript: presenze, filtri, squadre bilanciate e salvataggio
├── server.py         # Server Python opzionale per la condivisione Wi-Fi in parrocchia
├── registro_oratorio.db # Database SQLite (utilizzato se si avvia il server Python)
└── README.md         # Documentazione e guida d'uso
```
