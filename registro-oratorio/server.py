#!/usr/bin/env python3
"""
Registro Elettronico Oratorio & Catechismo - Local Server & API
Server HTTP leggero con SQLite (utilizza solo la libreria standard di Python).
Permette a catechisti e animatori di connettersi contemporaneamente tramite il Wi-Fi dell'oratorio.
"""

import sys
import os
import json
import sqlite3
import socket
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "registro_oratorio.db")

def load_env():
    env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ[k.strip()] = v.strip().strip('"').strip("'")

load_env()
PORT = int(os.environ.get("PORT", 8080))

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Tabella Persone / Iscritti
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS people (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL DEFAULT 'BAMBINO',
        fa_catechismo INTEGER NOT NULL DEFAULT 1,
        nome TEXT NOT NULL,
        cognome TEXT NOT NULL,
        gruppo TEXT NOT NULL,
        telefono TEXT DEFAULT '',
        allergie TEXT DEFAULT '',
        uscite TEXT DEFAULT '',
        note TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Tabella Presenze Giornaliere
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attendance (
        date TEXT NOT NULL,
        person_id TEXT NOT NULL,
        catechismo INTEGER DEFAULT 0,
        oratorio INTEGER DEFAULT 0,
        messa INTEGER DEFAULT 0,
        stato_oratorio TEXT DEFAULT '', -- 'presente', 'uscito', 'non_fermato'
        ora_uscita TEXT DEFAULT '',
        note_giorno TEXT DEFAULT '',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (date, person_id),
        FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
    )
    """)

    # Tabella Note Giornaliere (es. "Festa di Carnevale", "Ritiro genitori")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_notes (
        date TEXT PRIMARY KEY,
        note TEXT DEFAULT ''
    )
    """)

    # Popolamento iniziale se vuoto
    cursor.execute("SELECT COUNT(*) FROM people")
    count = cursor.fetchone()[0]
    if count == 0:
        initial_people = [
            ('1', 'BAMBINO', 1, 'Luca', 'Rossi', '3° Elementare', '3331112223', 'Lattosio', 'Esce alle 16:30 con la nonna', 'Molto attivo nei giochi'),
            ('2', 'BAMBINO', 0, 'Giulia', 'Bianchi', '3° Elementare', '3409988776', '', 'Ritiro papà', 'Partecipa solo al doposcuola/oratorio'),
            ('3', 'BAMBINO', 1, 'Matteo', 'Verdi', '4° Elementare', '3281234567', 'Noccioline / Frutta a guscio (grave)', '', 'Chierichetto alla Messa'),
            ('4', 'BAMBINO', 1, 'Sara', 'Neri', '1° Elementare', '3310001122', '', 'Delega a zia Elena', 'Gruppo primo anno catechismo'),
            ('5', 'BAMBINO', 1, 'Lorenzo', 'Ferrari', '5° Elementare', '3385554433', '', 'Torna a casa da solo (autorizzato)', 'Anno di preparazione Cresima'),
            ('6', 'BAMBINO', 1, 'Elena', 'Romano', '2° Media', '3471122334', 'Glutine (Celiachia)', '', 'Aiuta i più piccoli nei giochi'),
            ('7', 'ANIMATORE', 0, 'Chiara', 'Moretti', 'Staff', '3398877665', '', '', 'Responsabile giochi cortile'),
            ('8', 'ANIMATORE', 0, 'Davide', 'Galli', 'Staff', '3354433221', '', '', 'Animatore gruppo medie ed educatore')
        ]
        cursor.executemany("""
            INSERT INTO people (id, role, fa_catechismo, nome, cognome, gruppo, telefono, allergie, uscite, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_people)
    
    conn.commit()
    conn.close()

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

class OratorioHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # CORS & Cache control
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def read_json_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            body = self.rfile.read(content_length).decode('utf-8')
            return json.loads(body)
        return {}

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == '/api/status':
            return self.send_json({"status": "ok", "mode": "server", "ip": get_local_ip()})

        if path == '/api/config':
            return self.send_json({
                "SUPABASE_URL": os.environ.get("SUPABASE_URL", "https://qxevcfjtjbrlewagorju.supabase.co"),
                "SUPABASE_ANON_KEY": os.environ.get("SUPABASE_ANON_KEY", "")
            })

        if path == '/api/people':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM people ORDER BY cognome COLLATE NOCASE, nome COLLATE NOCASE")
            rows = cursor.fetchall()
            people = []
            for r in rows:
                people.append({
                    "id": r["id"],
                    "role": r["role"],
                    "faCatechismo": bool(r["fa_catechismo"]),
                    "nome": r["nome"],
                    "cognome": r["cognome"],
                    "gruppo": r["gruppo"],
                    "telefono": r["telefono"] or "",
                    "allergie": r["allergie"] or "",
                    "uscite": r["uscite"] or "",
                    "note": r["note"] or ""
                })
            conn.close()
            return self.send_json(people)

        if path == '/api/attendance':
            target_date = query.get('date', [None])[0]
            conn = get_db()
            cursor = conn.cursor()
            if target_date:
                cursor.execute("SELECT * FROM attendance WHERE date = ?", (target_date,))
                rows = cursor.fetchall()
                att_dict = {}
                for r in rows:
                    att_dict[r["person_id"]] = {
                        "catechismo": bool(r["catechismo"]),
                        "oratorio": bool(r["oratorio"]),
                        "messa": bool(r["messa"]),
                        "statoOratorio": r["stato_oratorio"] or ("presente" if r["oratorio"] else ""),
                        "oraUscita": r["ora_uscita"] or "",
                        "noteGiorno": r["note_giorno"] or ""
                    }
                cursor.execute("SELECT note FROM daily_notes WHERE date = ?", (target_date,))
                note_row = cursor.fetchone()
                daily_note = note_row["note"] if note_row else ""
                conn.close()
                return self.send_json({"date": target_date, "records": att_dict, "dailyNote": daily_note})
            else:
                # Restituisce tutte le presenze raggruppate per data
                cursor.execute("SELECT * FROM attendance ORDER BY date DESC")
                rows = cursor.fetchall()
                all_att = {}
                for r in rows:
                    d = r["date"]
                    if d not in all_att:
                        all_att[d] = {}
                    all_att[d][r["person_id"]] = {
                        "catechismo": bool(r["catechismo"]),
                        "oratorio": bool(r["oratorio"]),
                        "messa": bool(r["messa"]),
                        "statoOratorio": r["stato_oratorio"] or ("presente" if r["oratorio"] else ""),
                        "oraUscita": r["ora_uscita"] or ""
                    }
                conn.close()
                return self.send_json(all_att)

        if path == '/api/stats':
            # Statistiche presenze per persona
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT person_id,
                       COUNT(DISTINCT date) as total_days_recorded,
                       SUM(CASE WHEN catechismo = 1 THEN 1 ELSE 0 END) as count_catechismo,
                       SUM(CASE WHEN oratorio = 1 THEN 1 ELSE 0 END) as count_oratorio,
                       SUM(CASE WHEN messa = 1 THEN 1 ELSE 0 END) as count_messa
                FROM attendance
                GROUP BY person_id
            """)
            rows = cursor.fetchall()
            stats = {}
            for r in rows:
                stats[r["person_id"]] = {
                    "catechismo": r["count_catechismo"],
                    "oratorio": r["count_oratorio"],
                    "messa": r["count_messa"]
                }
            conn.close()
            return self.send_json(stats)

        if path == '/api/backup':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM people")
            people = [dict(r) for r in cursor.fetchall()]
            cursor.execute("SELECT * FROM attendance")
            attendance = [dict(r) for r in cursor.fetchall()]
            cursor.execute("SELECT * FROM daily_notes")
            daily_notes = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return self.send_json({
                "version": "1.0",
                "app": "registro-oratorio",
                "exported_at": str(os.getenv("CURRENT_TIME", "")),
                "people": people,
                "attendance": attendance,
                "daily_notes": daily_notes
            })

        # File statici
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self.read_json_body()

        if path == '/api/people':
            p_id = str(body.get('id') or os.urandom(4).hex())
            role = body.get('role', 'BAMBINO')
            fa_cat = 1 if body.get('faCatechismo', True) else 0
            nome = body.get('nome', '').strip()
            cognome = body.get('cognome', '').strip()
            gruppo = body.get('gruppo', '3° Elementare')
            telefono = body.get('telefono', '').strip()
            allergie = body.get('allergie', '').strip()
            uscite = body.get('uscite', '').strip()
            note = body.get('note', '').strip()

            if not nome or not cognome:
                return self.send_json({"error": "Nome e cognome obbligatori"}, 400)

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO people (id, role, fa_catechismo, nome, cognome, gruppo, telefono, allergie, uscite, note)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    role=excluded.role,
                    fa_catechismo=excluded.fa_catechismo,
                    nome=excluded.nome,
                    cognome=excluded.cognome,
                    gruppo=excluded.gruppo,
                    telefono=excluded.telefono,
                    allergie=excluded.allergie,
                    uscite=excluded.uscite,
                    note=excluded.note
            """, (p_id, role, fa_cat, nome, cognome, gruppo, telefono, allergie, uscite, note))
            conn.commit()
            conn.close()
            return self.send_json({"success": True, "id": p_id})

        if path == '/api/attendance':
            date = body.get('date')
            person_id = str(body.get('personId'))
            cat = 1 if body.get('catechismo') else 0
            ora = 1 if body.get('oratorio') else 0
            mes = 1 if body.get('messa') else 0
            stato = body.get('statoOratorio', 'presente' if ora else '')
            ora_uscita = body.get('oraUscita', '')
            note_g = body.get('noteGiorno', '')

            if not date or not person_id:
                return self.send_json({"error": "Date e personId obbligatori"}, 400)

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO attendance (date, person_id, catechismo, oratorio, messa, stato_oratorio, ora_uscita, note_giorno)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(date, person_id) DO UPDATE SET
                    catechismo=excluded.catechismo,
                    oratorio=excluded.oratorio,
                    messa=excluded.messa,
                    stato_oratorio=excluded.stato_oratorio,
                    ora_uscita=excluded.ora_uscita,
                    note_giorno=excluded.note_giorno,
                    updated_at=CURRENT_TIMESTAMP
            """, (date, person_id, cat, ora, mes, stato, ora_uscita, note_g))
            conn.commit()
            conn.close()
            return self.send_json({"success": True})

        if path == '/api/attendance/bulk':
            # Aggiornamento massivo (es. segna tutti presenti a catechismo o passa a oratorio)
            date = body.get('date')
            updates = body.get('updates', [])  # list of {personId, catechismo, oratorio, messa, ...}
            if not date:
                return self.send_json({"error": "Data obbligatoria"}, 400)

            conn = get_db()
            cursor = conn.cursor()
            for u in updates:
                pid = str(u['personId'])
                cat = 1 if u.get('catechismo') else 0
                ora = 1 if u.get('oratorio') else 0
                mes = 1 if u.get('messa') else 0
                stato = u.get('statoOratorio', 'presente' if ora else '')
                cursor.execute("""
                    INSERT INTO attendance (date, person_id, catechismo, oratorio, messa, stato_oratorio)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(date, person_id) DO UPDATE SET
                        catechismo=excluded.catechismo,
                        oratorio=excluded.oratorio,
                        messa=excluded.messa,
                        stato_oratorio=excluded.stato_oratorio,
                        updated_at=CURRENT_TIMESTAMP
                """, (date, pid, cat, ora, mes, stato))
            conn.commit()
            conn.close()
            return self.send_json({"success": True, "count": len(updates)})

        if path == '/api/daily_note':
            date = body.get('date')
            note = body.get('note', '')
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO daily_notes (date, note) VALUES (?, ?)
                ON CONFLICT(date) DO UPDATE SET note=excluded.note
            """, (date, note))
            conn.commit()
            conn.close()
            return self.send_json({"success": True})

        if path == '/api/restore':
            # Ripristino da backup JSON
            data = body
            conn = get_db()
            cursor = conn.cursor()
            if 'people' in data:
                cursor.execute("DELETE FROM people")
                for p in data['people']:
                    cursor.execute("""
                        INSERT OR REPLACE INTO people (id, role, fa_catechismo, nome, cognome, gruppo, telefono, allergie, uscite, note)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (p['id'], p['role'], p['fa_catechismo'], p['nome'], p['cognome'], p['gruppo'], p.get('telefono',''), p.get('allergie',''), p.get('uscite',''), p.get('note','')))
            if 'attendance' in data:
                cursor.execute("DELETE FROM attendance")
                for a in data['attendance']:
                    cursor.execute("""
                        INSERT OR REPLACE INTO attendance (date, person_id, catechismo, oratorio, messa, stato_oratorio, ora_uscita, note_giorno)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (a['date'], a['person_id'], a['catechismo'], a['oratorio'], a['messa'], a.get('stato_oratorio',''), a.get('ora_uscita',''), a.get('note_giorno','')))
            if 'daily_notes' in data:
                cursor.execute("DELETE FROM daily_notes")
                for dn in data['daily_notes']:
                    cursor.execute("INSERT OR REPLACE INTO daily_notes (date, note) VALUES (?, ?)", (dn['date'], dn['note']))
            conn.commit()
            conn.close()
            return self.send_json({"success": True})

        return self.send_json({"error": "Endpoint non trovato"}, 404)

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path
        if path.startswith('/api/people/'):
            pid = path.split('/')[-1]
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("DELETE FROM people WHERE id = ?", (pid,))
            cursor.execute("DELETE FROM attendance WHERE person_id = ?", (pid,))
            conn.commit()
            conn.close()
            return self.send_json({"success": True, "deleted": pid})
        return self.send_json({"error": "Endpoint non trovato"}, 404)

def run_server():
    init_db()
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server_address = ('0.0.0.0', PORT)
    httpd = HTTPServer(server_address, OratorioHandler)
    local_ip = get_local_ip()
    
    print("=" * 65)
    print(" ⛪ REGISTRO ELETTRONICO ORATORIO & CATECHISMO")
    print("=" * 65)
    print(f" ▶ Sul computer locale:   http://localhost:{PORT}")
    print(f" ▶ Sul Wi-Fi dell'oratorio: http://{local_ip}:{PORT}")
    print("   (Condividi questo indirizzo con catechisti e animatori)")
    print("=" * 65)
    print(" Premi Ctrl+C per fermare il server.")
    print("=" * 65)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nArresto del server in corso...")
        httpd.server_close()
        print("Server arrestato.")

if __name__ == '__main__':
    run_server()
