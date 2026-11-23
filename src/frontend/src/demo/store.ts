/**
 * In-browser database for demo builds.
 *
 * Holds every table the app reads as plain row arrays, persists them to
 * localStorage under one key per visitor, and broadcasts row changes so the
 * realtime stand-in can deliver them like Supabase's postgres_changes.
 */
import { buildSeed } from './seed';

export type Row = Record<string, unknown> & { id: string };
export type Tables = Record<string, Row[]>;

export interface DemoUser {
  id: string;
  email: string;
  password: string;
  user_metadata: Record<string, unknown>;
  created_at: string;
}

interface DemoState {
  version: number;
  tables: Tables;
  users: DemoUser[];
  sessionUserId: string | null;
  files: Record<string, string>;
}

export type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE';
export interface Change {
  table: string;
  eventType: ChangeEvent;
  new: Row | Record<string, never>;
  old: Row | Record<string, never>;
}

const STORAGE_KEY = 'amber-demo-v1';
const STATE_VERSION = 1;

let state: DemoState | null = null;
const listeners = new Set<(change: Change) => void>();

function freshState(): DemoState {
  return { version: STATE_VERSION, tables: buildSeed(), users: [], sessionUserId: null, files: {} };
}

function load(): DemoState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as DemoState) : null;
    state = parsed && parsed.version === STATE_VERSION ? parsed : freshState();
  } catch {
    // Private windows can throw on access; the demo still works for this tab
    state = freshState();
  }
  return state;
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(load()));
  } catch {
    // Quota or privacy mode: keep going in memory
  }
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function table(name: string): Row[] {
  const tables = load().tables;
  if (!tables[name]) tables[name] = [];
  return tables[name];
}

export function insertRow(name: string, row: Record<string, unknown>): Row {
  const now = new Date().toISOString();
  const full = { created_at: now, updated_at: now, ...row, id: (row.id as string) || newId() } as Row;
  table(name).push(full);
  persist();
  emit({ table: name, eventType: 'INSERT', new: full, old: {} });
  return full;
}

export function updateRow(name: string, id: string, patch: Record<string, unknown>): Row | null {
  const rows = table(name);
  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) return null;
  const old = rows[index];
  const next = { ...old, ...patch, id: old.id, updated_at: new Date().toISOString() } as Row;
  rows[index] = next;
  persist();
  emit({ table: name, eventType: 'UPDATE', new: next, old });
  return next;
}

export function deleteRow(name: string, id: string): Row | null {
  const rows = table(name);
  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) return null;
  const [old] = rows.splice(index, 1);
  persist();
  emit({ table: name, eventType: 'DELETE', new: {}, old });
  return old;
}

export function findOne(name: string, predicate: (row: Row) => boolean): Row | undefined {
  return table(name).find(predicate);
}

export function users(): DemoUser[] {
  return load().users;
}

export function addUser(user: DemoUser): void {
  load().users.push(user);
  persist();
}

export function sessionUserId(): string | null {
  return load().sessionUserId;
}

export function setSessionUserId(id: string | null): void {
  load().sessionUserId = id;
  persist();
}

export function saveFile(path: string, dataUrl: string): void {
  load().files[path] = dataUrl;
  persist();
}

export function fileUrl(path: string): string {
  return load().files[path] ?? '';
}

export function subscribe(listener: (change: Change) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(change: Change): void {
  // Deliver after the current call stack, like a network round trip would
  queueMicrotask(() => listeners.forEach((l) => l(change)));
}

/** Wipe everything this visitor did and start over from the seed. */
export function resetDemo(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  state = freshState();
}
