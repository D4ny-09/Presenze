# ⛪ Registro Presenze Oratorio & Registro Elettronico Catechismo

Applicazione web professionale, completa, veloce e moderna realizzata in **puro HTML5, CSS3 e JavaScript Vanilla** (nessuna dipendenza, nessun bundler né installazione di Node.js/npm).

---

## 🌟 Architettura e Caratteristiche

### 1. Sezione Catechiste (`catechista.html`) — *Registro Elettronico*
- **Layout Registro di Classe**: numerazione progressiva, cognome, nome, avatar e badge informativi.
- **Logica P/A Intelligente**: **Tutti i ragazzi sono impostati come Presenti [ P ] per impostazione predefinita**. Basta un solo tocco sul pulsante rosso **[ A ]** per segnare l'assenza.
- **Home "Assenti del Giorno"**: cruscotto iniziale che elenca immediatamente tutti i ragazzi assenti nella giornata selezionata con schede riassuntive per ciascuna classe e pulsanti verdi di chiamata rapida (`📞 Chiama Mamma`, `📞 Chiama Papà`, ecc.).
- **Classi Catechismo Dedicate**: raggruppamento fedele da **3ª Elementare fino alla 2ª Media** (3ª Elem, 4ª Elem, 5ª Elem, 1ª Media, 2ª Media).
- **Semplicità e Pulizia**: rimossi il diario di bordo e il generatore di squadre da questa sezione per garantire alle catechiste la massima concentrazione sull'appello.
- **Pulsante di Uscita Discreto**: il link *"Torna a Parrocchia"* è posizionato all'estrema destra della barra di navigazione con grafica sobria per impedire tocchi accidentali.

### 2. Sezione Parrocchia (`index.html` & `appello-parrocchia.html`)
- **Home Parrocchia (`index.html`)**:
  - **Attività della Giornata**: cronoprogramma orario (accoglienza, compiti, catechismo, merenda, giochi, chiusura cortile) con possibilità di aggiungere nuovi eventi e avvisi personalizzati.
  - **Allerte Cucina & Merenda**: box dedicato con l'elenco immediato di tutti gli iscritti con allergie o intolleranze alimentari.
  - **Pulsante Discreto**: *"Area Catechiste"* situato a destra per non essere confuso con i menu oratorio.
- **Appello Oratorio (`appello-parrocchia.html`)**:
  - Registro presenze in stile elettronico per tutte le classi dell'oratorio: **dalla 1ª Elementare alla 3ª Media + Staff/Animatori**.
  - **Colonna "Oratorio" rimossa**: i ragazzi sono già in cortile; è presente invece la spunta con orario di **Uscita Famiglia** e deleghe di ritiro.
- **Generatore Squadre (`squadre.html`)**:
  - Bilanciamento automatico dei partecipanti per età (*Snake Draft*) con esportazione formattata pronta per WhatsApp.

### 3. Gestione Telefoni Multipli per Famiglia
- Nel profilo di ogni iscritto è possibile inserire **più numeri di telefono** con etichetta personalizzabile (es. *Mamma*, *Papà*, *Nonna*, *Casa*).
- I numeri generano automaticamente link `tel:` per chiamare direttamente con un click dal cellulare o tablet.

### 4. PWA (Progressive Web App) & Mobile-First
- Include `manifest.json`, icone vettoriali e `sw.js` (Service Worker).
- È installabile su **smartphone Android, iPhone, iPad e tablet** come se fosse un'app nativa.
- Il titolo della scheda del browser cambia dinamicamente in base alla pagina e alla classe selezionata.

### 5. Tag `<style>` Modificabile in Ogni File HTML
- Ogni pagina HTML (`index.html`, `catechista.html`, `appello-parrocchia.html`, `squadre.html`) dispone di un tag `<style>` dedicato e commentato nel tag `<head>`, permettendo modifiche grafiche rapide senza alterare gli altri file.

---

## ☁️ Connessione Database Supabase

L'applicazione è **già preconfigurata e collegata** al database cloud:
- **URL Supabase**: `https://smwqsfupiveykagibxac.supabase.co`
- **Anon Public Key**: preimpostata nel client (`js/data.js`).

### Funzionamento Ibrido (Offline-First + Cloud)
1. L'app funziona sempre, anche in assenza di rete internet, salvando ogni modifica in `localStorage`.
2. All'avvio, l'app tenta la sincronizzazione automatica con il database remoto e aggiorna l'indicatore in alto su **"Database Connesso"** (pallino verde).
3. **Nessun dato sensibile o chiave esposta**: la modale con URL e chiavi è stata rimossa dall'interfaccia grafica per garantire sicurezza e pulizia visiva per catechisti ed educatori. L'indicatore mostra semplicemente se il database è connesso o offline (cliccabile per forzare una risincronizzazione).
4. Ogni salvataggio di iscritto o presenza viene automaticamente inviato a Supabase in tempo reale.

### Inizializzazione Tabelle Supabase (`schema.sql`)
Se le tabelle non sono ancora state create nel progetto Supabase:
1. Apri la dashboard del tuo progetto: [https://supabase.com/dashboard/project/smwqsfupiveykagibxac](https://supabase.com/dashboard/project/smwqsfupiveykagibxac)
2. Clicca su **SQL Editor** nel menu a sinistra.
3. Apri il file **`schema.sql`** presente nella cartella del progetto, copiane il contenuto, incollalo nell'editor e clicca su **Run**.

---

## 📁 Struttura della Cartella

```
PresenzeFinito/
├── index.html               # Home Parrocchia: Attività della giornata & allerte merenda
├── appello-parrocchia.html  # Appello Oratorio (1ª Elem - 3ª Media + Staff)
├── catechista.html          # Registro Elettronico Catechismo (Home assenti + classi 3ª Elem - 2ª Media)
├── squadre.html             # Generatore Squadre Cortile
├── schema.sql               # Script SQL pronto per configurare Supabase
├── manifest.json            # Configurazione PWA per smartphone/tablet
├── sw.js                    # Service Worker per cache e funzionamento offline
├── README.md                # Questa guida completa
├── css/
│   └── style.css            # Stili comuni, layout responsive e design professionale
├── icons/
│   └── icon.svg             # Icona vettoriale PWA
└── js/
    ├── data.js              # Modello dati, telefoni multipli, classi, Supabase preconfigurato
    ├── app.js               # Inizializzatore comune, PWA, modali iscritto e cloud
    ├── parrocchia.js        # Timeline attività e contatori home parrocchia
    ├── appello-parrocchia.js# Registro appello oratorio
    ├── catechista.js        # Registro elettronico catechiste con P/A e home assenti
    └── squadre.js           # Algoritmo squadre e copia per WhatsApp
```

---

## 🚀 Come Avviare l'Applicazione

1. Fai doppio clic su `index.html` (o `catechista.html`) per aprirla subito nel tuo browser predefinito.
2. Su cellulare/tablet: apri il link dal browser e seleziona **"Aggiungi alla schermata Home"** o **"Installa applicazione"**.
