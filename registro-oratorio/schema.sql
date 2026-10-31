CREATE TABLE IF NOT EXISTS iscritti (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    ruolo VARCHAR(20) NOT NULL DEFAULT 'Bambino',
    anno VARCHAR(30) NOT NULL,
    iscritto_catechismo INTEGER NOT NULL DEFAULT 1,
    allergie TEXT DEFAULT '',
    deleghe TEXT DEFAULT '',
    note TEXT DEFAULT '',
    telefono VARCHAR(30) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS presenze (
    data VARCHAR(10) NOT NULL,
    iscritto_id VARCHAR(50) NOT NULL,
    catechismo INTEGER DEFAULT 0,
    oratorio INTEGER DEFAULT 0,
    messa INTEGER DEFAULT 0,
    uscito INTEGER DEFAULT 0,
    ora_uscita VARCHAR(10) DEFAULT '',
    note_giorno TEXT DEFAULT '',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (data, iscritto_id),
    FOREIGN KEY (iscritto_id) REFERENCES iscritti(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS note_giornaliere (
    data VARCHAR(10) PRIMARY KEY,
    nota TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_presenze_data ON presenze(data);
CREATE INDEX IF NOT EXISTS idx_presenze_iscritto ON presenze(iscritto_id);
CREATE INDEX IF NOT EXISTS idx_iscritti_ruolo ON iscritti(ruolo);
CREATE INDEX IF NOT EXISTS idx_iscritti_anno ON iscritti(anno);
CREATE INDEX IF NOT EXISTS idx_iscritti_cognome ON iscritti(cognome);
CREATE INDEX IF NOT EXISTS idx_iscritti_catechismo ON iscritti(iscritto_catechismo);
