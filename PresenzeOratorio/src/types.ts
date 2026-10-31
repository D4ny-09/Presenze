export type Ruolo = 'Bambino' | 'Animatore';

export type Anno =
  | 'prima'
  | 'seconda'
  | 'terza'
  | 'quarta'
  | 'quinta'
  | 'primaMedia'
  | 'secondaMedia'
  | 'terzaMedia'
  | 'animatore';

export interface Person {
  id: string;
  nome: string;
  cognome: string;
  ruolo: Ruolo;
  anno: Anno;
  iscrittoCatechismo: boolean;
  allergie?: string;
  deleghe?: string;
  note?: string;
  telefono?: string;
}

export interface AttendanceRecord {
  catechismo: boolean;
  oratorio: boolean;
  messa: boolean;
  uscito: boolean;
  oraUscita?: string;
  noteGiorno?: string;
}

export type DayAttendance = Record<string, AttendanceRecord>; // personId -> AttendanceRecord
export type FullAttendance = Record<string, DayAttendance>;   // date (YYYY-MM-DD) -> DayAttendance

export interface TeamDefinition {
  id: string;
  name: string;
  colorName: string;
  headerBg: string;
  headerText: string;
  badgeBg: string;
}

export interface GeneratedTeam {
  definition: TeamDefinition;
  members: Person[];
}
