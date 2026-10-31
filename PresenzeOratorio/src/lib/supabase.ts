import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Person, AttendanceRecord } from '../types';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://qxevcfjtjbrlewagorju.supabase.co';

export function getStoredAnonKey(): string {
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envKey && envKey.trim()) return envKey.trim();
  return localStorage.getItem('supabase_anon_key') || '';
}

export function setStoredAnonKey(key: string): void {
  localStorage.setItem('supabase_anon_key', key.trim());
}

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const key = getStoredAnonKey();
  if (!SUPABASE_URL || !key) {
    clientInstance = null;
    return null;
  }
  if (!clientInstance) {
    try {
      clientInstance = createClient(SUPABASE_URL, key);
    } catch (e) {
      console.error('Inizializzazione Supabase fallita:', e);
      clientInstance = null;
    }
  }
  return clientInstance;
}

export function resetSupabaseClient(): void {
  clientInstance = null;
}

// -------------------------------------------------------------
// Operazioni Iscritti su Supabase
// -------------------------------------------------------------
export async function fetchRemotePeople(): Promise<Person[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('iscritti')
      .select('*')
      .order('cognome', { ascending: true });

    if (error) {
      console.warn('Errore lettura iscritti da Supabase:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((r: any) => ({
      id: r.id,
      nome: r.nome,
      cognome: r.cognome,
      ruolo: r.ruolo,
      anno: r.anno,
      iscrittoCatechismo: Boolean(r.iscritto_catechismo),
      allergie: r.allergie || '',
      deleghe: r.deleghe || '',
      note: r.note || '',
      telefono: r.telefono || '',
    }));
  } catch (err) {
    console.error('fetchRemotePeople:', err);
    return null;
  }
}

export async function upsertRemotePerson(person: Person): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client.from('iscritti').upsert({
      id: person.id,
      nome: person.nome,
      cognome: person.cognome,
      ruolo: person.ruolo,
      anno: person.anno,
      iscritto_catechismo: person.iscrittoCatechismo,
      allergie: person.allergie || '',
      deleghe: person.deleghe || '',
      note: person.note || '',
      telefono: person.telefono || '',
    });
    return !error;
  } catch (e) {
    console.error('upsertRemotePerson:', e);
    return false;
  }
}

export async function deleteRemotePerson(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client.from('iscritti').delete().eq('id', id);
    return !error;
  } catch (e) {
    console.error('deleteRemotePerson:', e);
    return false;
  }
}

// -------------------------------------------------------------
// Operazioni Presenze su Supabase
// -------------------------------------------------------------
export async function fetchRemoteAttendance(
  dateStr: string
): Promise<Record<string, AttendanceRecord> | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('presenze')
      .select('*')
      .eq('data', dateStr);

    if (error) {
      console.warn('Errore lettura presenze da Supabase:', error.message);
      return null;
    }

    const result: Record<string, AttendanceRecord> = {};
    if (data) {
      data.forEach((r: any) => {
        result[r.iscritto_id] = {
          catechismo: Boolean(r.catechismo),
          oratorio: Boolean(r.oratorio),
          messa: Boolean(r.messa),
          uscito: Boolean(r.uscito),
          oraUscita: r.ora_uscita || '',
          noteGiorno: r.note_giorno || '',
        };
      });
    }
    return result;
  } catch (e) {
    console.error('fetchRemoteAttendance:', e);
    return null;
  }
}

export async function upsertRemoteAttendance(
  dateStr: string,
  personId: string,
  att: AttendanceRecord
): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client.from('presenze').upsert(
      {
        data: dateStr,
        iscritto_id: personId,
        catechismo: att.catechismo,
        oratorio: att.oratorio,
        messa: att.messa,
        uscito: att.uscito,
        ora_uscita: att.oraUscita || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'data,iscritto_id' }
    );
    return !error;
  } catch (e) {
    console.error('upsertRemoteAttendance:', e);
    return false;
  }
}

export async function batchUpsertRemoteAttendance(
  records: Array<{ date: string; personId: string; att: AttendanceRecord }>
): Promise<boolean> {
  const client = getSupabase();
  if (!client || records.length === 0) return false;

  try {
    const payload = records.map((r) => ({
      data: r.date,
      iscritto_id: r.personId,
      catechismo: r.att.catechismo,
      oratorio: r.att.oratorio,
      messa: r.att.messa,
      uscito: r.att.uscito,
      ora_uscita: r.att.oraUscita || '',
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client
      .from('presenze')
      .upsert(payload, { onConflict: 'data,iscritto_id' });
    return !error;
  } catch (e) {
    console.error('batchUpsertRemoteAttendance:', e);
    return false;
  }
}
