CREATE TABLE IF NOT EXISTS iscritti (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    ruolo TEXT NOT NULL DEFAULT 'Bambino',
    anno TEXT NOT NULL,
    iscritto_catechismo BOOLEAN NOT NULL DEFAULT TRUE,
    allergie TEXT DEFAULT '',
    deleghe TEXT DEFAULT '',
    note TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS presenze (
    data DATE NOT NULL,
    iscritto_id TEXT NOT NULL REFERENCES iscritti(id) ON DELETE CASCADE,
    catechismo BOOLEAN DEFAULT FALSE,
    oratorio BOOLEAN DEFAULT FALSE,
    messa BOOLEAN DEFAULT FALSE,
    uscito BOOLEAN DEFAULT FALSE,
    ora_uscita TEXT DEFAULT '',
    note_giorno TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (data, iscritto_id)
);

CREATE TABLE IF NOT EXISTS note_giornaliere (
    data DATE PRIMARY KEY,
    nota TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE iscritti ENABLE ROW LEVEL SECURITY;
ALTER TABLE presenze ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_giornaliere ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accesso completo iscritti" ON iscritti FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accesso completo presenze" ON presenze FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accesso completo note" ON note_giornaliere FOR ALL USING (true) WITH CHECK (true);
