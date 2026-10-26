const newPersonBtn = document.getElementById('newPerson');
const personModal = document.getElementById('personModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');

function apriModale(){
    personModal.classList.remove('hidden');
}

function chiudiModale(){
    personModal.classList.add('hidden');
}

newPersonBtn.addEventListener('click', apriModale);
closeModalBtn.addEventListener('click', chiudiModale);
cancelModalBtn.addEventListener('click', chiudiModale);

let partecipandi = [
    {id: 1, nome: 'Mario', cognome: 'Rossi', ruolo: 'Bambino', gruppo: 'elementari', catechismo: true, oratorio: false, messa: true, note: ""},
    {id: 2, nome: 'Luigi', cognome: 'Verdi', ruolo: 'Bambino', gruppo: 'elementari', catechismo: true, oratorio: true, messa: false, note: ""},
    {id: 3, nome: 'Giulia', cognome: 'Bianchi', ruolo: 'Animatore', gruppo: 'elementari', catechismo: false, oratorio: true, messa: true, note: "Animatrice Grest"},
];

const tabAppelloBtn = document.getElementById('tabPresenze');
const tabSquadreBtn = document.getElementById('tabSquadre');
const appelloContainer = document.getElementById('appelloContainer');
const squadreContainer = document.getElementById('squadreContainer');
const filterSection = document.getElementById('filterSection');

function mostraAppello() {
    appelloContainer.classList.remove('hidden');
    if(filterSection) filterSection.classList.remove('hidden');
    squadreContainer.classList.add('hidden');

    tabAppelloBtn.classList.add('active');
    tabSquadreBtn.classList.remove('active');
}

function mostraSquadre() {
    appelloContainer.classList.add('hidden');
    if(filterSection) filterSection.classList.add('hidden');
    squadreContainer.classList.remove('hidden');

    tabAppelloBtn.classList.remove('active');
    tabSquadreBtn.classList.add('active');
}

if (tabAppelloBtn && tabSquadreBtn) {
    tabAppelloBtn.addEventListener('click', mostraAppello);
    tabSquadreBtn.addEventListener('click', mostraSquadre);
}
