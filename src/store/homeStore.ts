// ============================================================
// Smart Home 3D Energy Manager — Zustand Store
// Integrates Persistent Database (File data/database.json & LocalStorage)
// ============================================================

import { create } from 'zustand';
import type {
  Room,
  Appliance,
  ApplianceType,
  RoomType,
  ViewMode,
  ActivePanel,
  PlacementIntent,
} from '../types';
import {
  APPLIANCE_WATTAGE,
  APPLIANCE_HOURS,
  ROOM_COLORS,
  ROOM_DIMENSIONS,
} from '../utils/constants';
import { playSwitchSound, playEcoSound } from '../utils/soundEffects';
import { fetchDatabase, saveDatabase, clearDatabase } from '../services/database';

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export type DbSyncStatus = 'synced' | 'saving' | 'error' | 'idle';

interface HomeState {
  rooms: Room[];
  appliances: Appliance[];
  selectedRoomId: string | null;
  selectedApplianceId: string | null;
  hoveredApplianceId: string | null;
  viewMode: ViewMode;
  activePanel: ActivePanel;
  placementIntent: PlacementIntent | null;
  fpvRoomId: string | null;

  // Database Persistence State
  isDbLoaded: boolean;
  dbSyncStatus: DbSyncStatus;
  lastSavedAt: string | null;

  // Actions
  addRoom: (type: RoomType, name?: string, customProps?: Partial<Room>) => Room;
  removeRoom: (id: string) => void;
  updateRoom: (id: string, patch: Partial<Room>) => void;
  selectRoom: (id: string | null) => void;

  addAppliance: (roomId: string, type: ApplianceType, customProps?: Partial<Appliance>) => Appliance;
  removeAppliance: (id: string) => void;
  updateAppliance: (id: string, patch: Partial<Appliance>) => void;
  toggleAppliance: (id: string) => void;
  toggleAllAppliances: (isOn: boolean) => void;
  setEcoMode: () => void;
  selectAppliance: (id: string | null) => void;
  setHoveredAppliance: (id: string | null) => void;

  setViewMode: (mode: ViewMode) => void;
  setActivePanel: (panel: ActivePanel) => void;
  setPlacementIntent: (intent: PlacementIntent | null) => void;
  setFpvRoom: (roomId: string | null) => void;
  resetHome: () => void;

  // Database Synchronization Actions
  loadDatabase: () => Promise<boolean>;
  persistCurrentState: () => Promise<void>;
  resetToDemoHome: (seedFn: () => void) => Promise<void>;
}

let autoSaveTimer: any = null;

function triggerAutoSave(
  get: () => HomeState,
  set: (fn: (s: HomeState) => Partial<HomeState>) => void,
  immediate = false
) {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }

  const executeSave = async () => {
    const { rooms, appliances } = get();
    set(() => ({ dbSyncStatus: 'saving' }));
    try {
      const ok = await saveDatabase(rooms, appliances);
      if (ok) {
        const timeStr = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        set(() => ({ dbSyncStatus: 'synced', lastSavedAt: timeStr }));
      } else {
        set(() => ({ dbSyncStatus: 'error' }));
      }
    } catch (err) {
      console.error('[DB] Auto-save error:', err);
      set(() => ({ dbSyncStatus: 'error' }));
    }
  };

  if (immediate) {
    executeSave();
  } else {
    set(() => ({ dbSyncStatus: 'saving' }));
    autoSaveTimer = setTimeout(executeSave, 300);
  }
}

export const useHomeStore = create<HomeState>((set, get) => ({
  rooms: [],
  appliances: [],
  selectedRoomId: null,
  selectedApplianceId: null,
  hoveredApplianceId: null,
  viewMode: 'builder',
  activePanel: 'none',
  placementIntent: null,
  fpvRoomId: null,

  // Database status
  isDbLoaded: false,
  dbSyncStatus: 'idle',
  lastSavedAt: null,

  // ---- Database Synchronization Actions ----
  loadDatabase: async () => {
    try {
      const data = await fetchDatabase();
      if (data && Array.isArray(data.rooms) && data.rooms.length > 0) {
        const timeStr = data.updatedAt
          ? new Date(data.updatedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : 'Ready';
        set({
          rooms: data.rooms,
          appliances: data.appliances || [],
          isDbLoaded: true,
          dbSyncStatus: 'synced',
          lastSavedAt: timeStr,
        });
        return true;
      }
    } catch (err) {
      console.error('[DB] loadDatabase failed:', err);
    }
    set({ isDbLoaded: true, dbSyncStatus: 'idle' });
    return false;
  },

  persistCurrentState: async () => {
    triggerAutoSave(get, set, true);
  },

  resetToDemoHome: async (seedFn) => {
    await clearDatabase();
    set({
      rooms: [],
      appliances: [],
      selectedRoomId: null,
      selectedApplianceId: null,
      hoveredApplianceId: null,
      viewMode: 'builder',
      fpvRoomId: null,
      dbSyncStatus: 'saving',
    });
    seedFn();
    triggerAutoSave(get, set, true);
  },

  // ---- Rooms ----
  addRoom: (type, name, customProps) => {
    const existingRooms = get().rooms;
    const occupied = new Set(existingRooms.map((r) => `${r.gridX},${r.gridZ}`));

    let gx = 0;
    let gz = 0;
    for (let i = 0; i < 30; i++) {
      const testX = i % 2;
      const testZ = Math.floor(i / 2);
      if (!occupied.has(`${testX},${testZ}`)) {
        gx = testX;
        gz = testZ;
        break;
      }
    }

    const dims = ROOM_DIMENSIONS[type];
    const colors = ROOM_COLORS[type];
    const room: Room = {
      id: genId(),
      name: name ?? `${type.replace('-', ' ')} ${existingRooms.length + 1}`,
      type,
      gridX: customProps?.gridX ?? gx,
      gridZ: customProps?.gridZ ?? gz,
      width: customProps?.width ?? dims.width,
      depth: customProps?.depth ?? dims.depth,
      height: customProps?.height ?? dims.height,
      wallColor: customProps?.wallColor ?? colors.wall,
      floorColor: customProps?.floorColor ?? colors.floor,
      ceilingColor: customProps?.ceilingColor ?? colors.ceiling,
      ...customProps,
    };

    set((s) => ({ rooms: [...s.rooms, room] }));
    // Immediately persist new room to database
    triggerAutoSave(get, set, true);
    return room;
  },

  removeRoom: (id) => {
    set((s) => ({
      rooms: s.rooms.filter((r) => r.id !== id),
      appliances: s.appliances.filter((a) => a.roomId !== id),
      selectedRoomId: s.selectedRoomId === id ? null : s.selectedRoomId,
      fpvRoomId: s.fpvRoomId === id ? null : s.fpvRoomId,
      viewMode: s.fpvRoomId === id ? 'builder' : s.viewMode,
    }));
    // Immediately persist room removal to database
    triggerAutoSave(get, set, true);
  },

  updateRoom: (id, patch) => {
    set((s) => ({
      rooms: s.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
    // Debounce updates (dimensions sliders, color tweaks)
    triggerAutoSave(get, set, false);
  },

  selectRoom: (id) => set({ selectedRoomId: id }),

  // ---- Appliances ----
  addAppliance: (roomId, type, customProps) => {
    const appliance: Appliance = {
      id: genId(),
      type,
      roomId,
      localX: customProps?.localX ?? 0,
      localZ: customProps?.localZ ?? 0,
      rotation: customProps?.rotation ?? 0,
      isOn: customProps?.isOn ?? true,
      wattage: customProps?.wattage ?? APPLIANCE_WATTAGE[type],
      hoursPerDay: customProps?.hoursPerDay ?? APPLIANCE_HOURS[type],
      label: customProps?.label,
      ...customProps,
    };
    set((s) => ({ appliances: [...s.appliances, appliance] }));
    // Immediately persist new appliance to database
    triggerAutoSave(get, set, true);
    return appliance;
  },

  removeAppliance: (id) => {
    set((s) => ({
      appliances: s.appliances.filter((a) => a.id !== id),
      selectedApplianceId: s.selectedApplianceId === id ? null : s.selectedApplianceId,
      hoveredApplianceId: s.hoveredApplianceId === id ? null : s.hoveredApplianceId,
    }));
    // Immediately persist appliance removal to database
    triggerAutoSave(get, set, true);
  },

  updateAppliance: (id, patch) => {
    set((s) => ({
      appliances: s.appliances.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
    triggerAutoSave(get, set, false);
  },

  toggleAppliance: (id) => {
    const target = get().appliances.find((a) => a.id === id);
    if (target) {
      playSwitchSound(!target.isOn);
    }
    set((s) => ({
      appliances: s.appliances.map((a) =>
        a.id === id ? { ...a, isOn: !a.isOn } : a
      ),
    }));
    triggerAutoSave(get, set, true);
  },

  toggleAllAppliances: (isOn) => {
    playSwitchSound(isOn);
    set((s) => ({
      appliances: s.appliances.map((a) => ({ ...a, isOn })),
    }));
    triggerAutoSave(get, set, true);
  },

  setEcoMode: () => {
    playEcoSound();
    const heavyTypes = new Set(['ac', 'heater', 'oven', 'dishwasher', 'water-heater']);
    set((s) => ({
      appliances: s.appliances.map((a) => ({
        ...a,
        isOn: heavyTypes.has(a.type) ? false : a.isOn,
      })),
    }));
    triggerAutoSave(get, set, true);
  },

  selectAppliance: (id) => set({ selectedApplianceId: id }),
  setHoveredAppliance: (id) => set({ hoveredApplianceId: id }),

  // ---- View ----
  setViewMode: (mode) => set({ viewMode: mode }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setPlacementIntent: (intent) => set({ placementIntent: intent }),
  setFpvRoom: (roomId) => set({ fpvRoomId: roomId }),

  resetHome: () =>
    set({
      rooms: [],
      appliances: [],
      selectedRoomId: null,
      selectedApplianceId: null,
      hoveredApplianceId: null,
      viewMode: 'builder',
      fpvRoomId: null,
    }),
}));
