const newPersonBtn = document.getElementById('newPerson');
const personModal = document.getElementById('personModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');

function apriModale() {
    personModal.classList.remove('hidden');
}

function chiudiModale() {
    personModal.classList.add('hidden');
}

newPersonBtn.addEventListener('click', apriModale);
closeModalBtn.addEventListener('click', chiudiModale);
cancelModalBtn.addEventListener('click', chiudiModale);

let partecipanti = [
    { id: 1, nome: 'Mario', cognome: 'Rossi', ruolo: 'Bambino', gruppo: 'elementari', catechismo: true, oratorio: false, messa: true, note: "" },
    { id: 2, nome: 'Luigi', cognome: 'Verdi', ruolo: 'Bambino', gruppo: 'elementari', catechismo: true, oratorio: true, messa: false, note: "" },
    { id: 3, nome: 'Giulia', cognome: 'Bianchi', ruolo: 'Animatore', gruppo: 'elementari', catechismo: false, oratorio: true, messa: true, note: "Animatrice Grest" },
];

const tabAppelloBtn = document.getElementById('tabPresenze');
const tabSquadreBtn = document.getElementById('tabSquadre');
const appelloContainer = document.getElementById('AppelloContainer');
const squadreContainer = document.getElementById('SquadreContainer');
const filterSection = document.getElementById('filterSection');

function mostraAppello() {
    appelloContainer.classList.remove('hidden');
    if (filterSection) filterSection.classList.remove('hidden');
    squadreContainer.classList.add('hidden');

    tabAppelloBtn.classList.add('active');
    tabSquadreBtn.classList.remove('active');
}

function mostraSquadre() {
    appelloContainer.classList.add('hidden');
    if (filterSection) filterSection.classList.add('hidden');
    squadreContainer.classList.remove('hidden');

    tabAppelloBtn.classList.remove('active');
    tabSquadreBtn.classList.add('active');
}

if (tabAppelloBtn && tabSquadreBtn) {
    tabAppelloBtn.addEventListener('click', mostraAppello);
    tabSquadreBtn.addEventListener('click', mostraSquadre);
}

function renderizzaAppello() {
    const container = document.getElementById('AppelloContainer');
    container.innerHTML = "";

    partecipanti.forEach(p => {
        const card = document.createElement('div');
        card.className = 'partecipant-card';


        card.innerHTML = `
    <div class="partecipant-info">
                <span class="partecipant-name">${p.nome} ${p.cognome}</span>
                <span class="partecipant-badge">${p.ruolo} - ${p.gruppo}</span>
            </div>
            <div class="attendance-controls">
                <label class="checkbox-label">
                    <input type="checkbox" class="attendance-checkbox" ${p.catechismo ? 'checked' : ''}> Catechismo
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" class="attendance-checkbox" ${p.oratorio ? 'checked' : ''}> Oratorio
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" class="attendance-checkbox" ${p.messa ? 'checked' : ''}> Messa
                </label>
            </div>
        `;
        container.appendChild(card);
    });
}
renderizzaAppello();

//funzione per creare i profili dei partecipanti
const personForm = document.getElementById('personForm');
personForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const nuovoIscritto = {
        id: partecipanti.length + 1,
        nome: document.getElementById('inputNome').value,
        cognome: document.getElementById('inputCognome').value,
        ruolo: document.getElementById('selectRuolo').value,
        gruppo: document.getElementById('selectAnno').value,
        catechismo: document.getElementById('inputCatechismo').checked,
        oratorio: false,
        messa: false,
        note: document.getElementById('inputNote').value
    };
    partecipanti.push(nuovoIscritto);
    renderizzaAppello();
    chiudiModale();
    personForm.reset();
});

//generatore squadre
const coloriSquadre = [
    { nome: "Squadra Rossa", classe: "squadra-rossa" },
    { nome: "Squadra Blu", classe: "squadra-blu" },
    { nome: "Squadra Verde", classe: "squadra-verde" },
    { nome: "Squadra Gialla", classe: "squadra-gialla" },
    { nome: "Squadra Viola", classe: "squadra-viola" },
    { nome: "Squadra Arancione", classe: "squadra-arancione" }
];

function mescolaArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function generaSquadre() {
    const numSquadre = parseInt(document.getElementById('numSquadre').value) || 2;
    const criterio = document.getElementById('criterioDivisorio').value;
    const squadreResultGrid = document.getElementById('squadreResultGrid');

    if (partecipanti.length === 0) {
        alert("Non ci sono partecipanti da dividere in squadre.");
        return;
    }

    let squadre = [];
    for (let i = 0; i < numSquadre; i++) {
        const infoColore = coloriSquadre[i % coloriSquadre.length];
        squadre.push({
            nome: infoColore.nome,
            classeCss: infoColore.classe,
            membri: []
        });
    }

    if (criterio === 'casuale') {
        const listaMescolata = mescolaArray(partecipanti);
        listaMescolata.forEach((p, index) => {
            squadre[index % numSquadre].membri.push(p);
        });
    } else if (criterio === 'genere') { // Corretto da 'ruolo' a 'genere' per corrispondere all'HTML
        const animatori = mescolaArray(partecipanti.filter(p => p.ruolo && p.ruolo.toLowerCase() === 'animatore'));
        const bambini = mescolaArray(partecipanti.filter(p => !p.ruolo || p.ruolo.toLowerCase() !== 'animatore'));

        let squadIndex = 0;
        animatori.forEach(p => {
            squadre[squadIndex % numSquadre].membri.push(p);
            squadIndex++;
        });
        bambini.forEach(p => {
            squadre[squadIndex % numSquadre].membri.push(p);
            squadIndex++;
        });
    } else if (criterio === 'eta') {
        const gruppi = {};
        partecipanti.forEach(p => {
            const gruppoKey = p.gruppo || 'Generico';
            if (!gruppi[gruppoKey]) gruppi[gruppoKey] = [];
            gruppi[gruppoKey].push(p);
        });

        let squadIndex = 0;
        Object.keys(gruppi).forEach(g => {
            const membriGruppo = mescolaArray(gruppi[g]);
            membriGruppo.forEach(p => {
                squadre[squadIndex % numSquadre].membri.push(p);
                squadIndex++;
            });
        });
    }

    squadreResultGrid.innerHTML = "";
    squadre.forEach(squadra => {
        const cardSquadra = document.createElement('div');
        cardSquadra.className = "squadra-card";

        let membriHTML = squadra.membri.map(m => `
            <li>
                ${m.nome} ${m.cognome} 
                <span class="badge-sub">${m.ruolo || ''}</span>
            </li>
        `).join('');

        cardSquadra.innerHTML = `
            <div class="squadra-header ${squadra.classeCss}">
                <h3>${squadra.nome}</h3>
                <span class="squadra-count">${squadra.membri.length} membri</span>
            </div>
            <ul class="squadra-members-list">
                ${membriHTML || '<li>Nessun membro</li>'}
            </ul>
        `;
        squadreResultGrid.appendChild(cardSquadra);
    });
}

const generaSquadreBtn = document.getElementById('generaSquadreBtn');
if (generaSquadreBtn) {
    generaSquadreBtn.addEventListener('click', generaSquadre);
}