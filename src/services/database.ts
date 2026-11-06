// ============================================================
// Database Service — Persistent Smart Home Storage
// Supports Project File Database (data/database.json) & LocalStorage
// ============================================================

import type { Room, Appliance } from '../types';

export interface DatabasePayload {
  rooms: Room[];
  appliances: Appliance[];
  updatedAt: string;
  version?: number;
}

const LOCAL_STORAGE_KEY = 'smarthome_database_v2';

/**
 * Loads the saved smart home database.
 * Priority:
 * 1. Project file database (/api/database -> data/database.json)
 * 2. Local browser storage (localStorage)
 */
export async function fetchDatabase(): Promise<DatabasePayload | null> {
  // 1. Try project backend API
  try {
    const res = await fetch('/api/database', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.exists && json.data && Array.isArray(json.data.rooms) && json.data.rooms.length > 0) {
        // Also sync to localStorage as hot backup
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(json.data));
        } catch {}
        return json.data as DatabasePayload;
      }
    }
  } catch (err) {
    console.warn('[DB] Could not query /api/database, checking localStorage fallback:', err);
  }

  // 2. Fallback to browser localStorage
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.rooms) && parsed.rooms.length > 0) {
        return parsed as DatabasePayload;
      }
    }
  } catch (err) {
    console.error('[DB] Failed reading from localStorage:', err);
  }

  return null;
}

/**
 * Saves rooms and appliances to both the project file database (data/database.json)
 * and the browser's localStorage.
 */
export async function saveDatabase(rooms: Room[], appliances: Appliance[]): Promise<boolean> {
  const payload: DatabasePayload = {
    rooms,
    appliances,
    updatedAt: new Date().toISOString(),
    version: 2,
  };

  // 1. Save synchronously to localStorage
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[DB] Failed writing to localStorage:', err);
  }

  // 2. Save asynchronously to project file database (/api/database)
  try {
    const res = await fetch('/api/database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn('[DB] Could not write to /api/database (operating in client-offline mode):', err);
    return true; // Still saved in localStorage
  }
}

/**
 * Clears the saved database to revert back to default state.
 */
export async function clearDatabase(): Promise<boolean> {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {}

  try {
    await fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rooms: [], appliances: [], updatedAt: new Date().toISOString() }),
    });
  } catch {}

  return true;
}

