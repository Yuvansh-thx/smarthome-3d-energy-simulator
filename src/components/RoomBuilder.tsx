// ============================================================
// Room Designer — Architecture, Aesthetics & Appliance Studio
// ============================================================

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  LogIn,
  Palette,
  Layers,
  Sparkles,
  RotateCw,
  Power,
  Sliders,
  Check,
  ChevronLeft,
  Zap,
  Eye,
  SlidersHorizontal,
  Database,
} from 'lucide-react';
import { useHomeStore } from '../store/homeStore';
import { seedDemoHome } from '../utils/homeHelpers';
import type { RoomType, ApplianceType } from '../types';
import {
  ROOM_LABELS,
  ROOM_ICONS,
  APPLIANCE_LABELS,
  APPLIANCE_ICONS,
  APPLIANCE_WATTAGE,
  APPLIANCE_HOURS,
  ROOM_APPLIANCES,
} from '../utils/constants';
import { formatWatts } from '../utils/energyCalculator';
import { playSwitchSound, playEcoSound } from '../utils/soundEffects';

const ROOM_TYPES: RoomType[] = ['bedroom', 'living-room', 'kitchen', 'bathroom', 'study'];

const ALL_APPLIANCES: ApplianceType[] = [
  'light-bulb',
  'ceiling-fan',
  'ac',
  'tv',
  'refrigerator',
  'computer',
  'oven',
  'microwave',
  'washing-machine',
  'heater',
  'dishwasher',
  'water-heater',
];

const WALL_THEMES = [
  { name: 'Warm Cream', color: '#F5E6D3' },
  { name: 'Nordic Slate', color: '#1E293B' },
  { name: 'Modern White', color: '#F8FAFC' },
  { name: 'Sage Green', color: '#D1FAE5' },
  { name: 'Deep Navy', color: '#0F172A' },
  { name: 'Terracotta', color: '#9A3412' },
];

const FLOOR_THEMES = [
  { name: 'Rich Walnut', color: '#78350F' },
  { name: 'Light Birch', color: '#D97706' },
  { name: 'White Marble', color: '#E2E8F0' },
  { name: 'Dark Slate', color: '#1E293B' },
  { name: 'Cozy Carpet', color: '#64748B' },
];

interface StagedAppliance {
  tempId: string;
  type: ApplianceType;
  label: string;
  wattage: number;
  hoursPerDay: number;
  rotation: 0 | 90 | 180 | 270;
  isOn: boolean;
}

interface RoomBuilderProps {
  onClose: () => void;
  onEnterFPV: (roomId: string) => void;
}

const RoomBuilder: React.FC<RoomBuilderProps> = ({ onClose, onEnterFPV }) => {
  const {
    rooms,
    appliances,
    addRoom,
    removeRoom,
    updateRoom,
    addAppliance,
    removeAppliance,
    updateAppliance,
    toggleAppliance,
    selectRoom,
    selectedRoomId,
    selectAppliance,
    dbSyncStatus,
    lastSavedAt,
    resetToDemoHome,
  } = useHomeStore();

  const [dbNotification, setDbNotification] = useState<string | null>(null);

  // Active top tab: 'create' or 'manage' (defaults to URL param if provided)
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam === 'manage' || tabParam === 'rooms') return 'manage';
    }
    return 'create';
  });

  // --- CREATE NEW ROOM STATE ---
  const [newType, setNewType] = useState<RoomType>('bedroom');
  const [newName, setNewName] = useState('');
  const [newWidth, setNewWidth] = useState<number>(8);
  const [newDepth, setNewDepth] = useState<number>(8);
  const [newWallColor, setNewWallColor] = useState<string>('#F5E6D3');
  const [newFloorColor, setNewFloorColor] = useState<string>('#78350F');

  // Staged initial appliances to pre-attach when building
  const [stagedApps, setStagedApps] = useState<StagedAppliance[]>([
    {
      tempId: 'stage-1',
      type: 'light-bulb',
      label: 'Main Pendant Light',
      wattage: 10,
      hoursPerDay: 6,
      rotation: 0,
      isOn: true,
    },
    {
      tempId: 'stage-2',
      type: 'ceiling-fan',
      label: 'Ceiling Fan',
      wattage: 75,
      hoursPerDay: 8,
      rotation: 0,
      isOn: true,
    },
  ]);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // --- ATTACH APPLIANCE MODAL / POPOVER FOR EXISTING ROOM ---
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [attachType, setAttachType] = useState<ApplianceType>('ac');
  const [attachLabel, setAttachLabel] = useState('Inverter AC');
  const [attachWatts, setAttachWatts] = useState(1400);
  const [attachHours, setAttachHours] = useState(5);
  const [attachRotation, setAttachRotation] = useState<0 | 90 | 180 | 270>(0);

  // Staged appliances energy calculation
  const stagedTotalWatts = stagedApps.reduce((sum, a) => (a.isOn ? sum + a.wattage : sum), 0);
  const stagedDailyKwh = stagedApps.reduce(
    (sum, a) => (a.isOn ? sum + (a.wattage * a.hoursPerDay) / 1000 : sum),
    0
  );
  const stagedMonthlyCost = stagedDailyKwh * 30 * 0.12;

  // Selected room details
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const roomAppliances = appliances.filter((a) => a.roomId === selectedRoomId);
  const activeAppliances = roomAppliances.filter((a) => a.isOn);
  const roomWatts = activeAppliances.reduce((sum, a) => sum + a.wattage, 0);

  // Filter appliances catalog
  const filteredAppliances = ALL_APPLIANCES.filter((type) => {
    if (categoryFilter === 'climate') return ['ac', 'ceiling-fan', 'heater'].includes(type);
    if (categoryFilter === 'kitchen')
      return ['refrigerator', 'oven', 'microwave', 'dishwasher'].includes(type);
    if (categoryFilter === 'tech') return ['tv', 'computer'].includes(type);
    if (categoryFilter === 'lighting') return ['light-bulb'].includes(type);
    return true;
  });

  // Add an appliance to the staging area for the new room
  const handleStageAppliance = (type: ApplianceType) => {
    const newStage: StagedAppliance = {
      tempId: `stage-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      label: APPLIANCE_LABELS[type],
      wattage: APPLIANCE_WATTAGE[type],
      hoursPerDay: APPLIANCE_HOURS[type],
      rotation: 0,
      isOn: true,
    };
    setStagedApps([...stagedApps, newStage]);
    playSwitchSound(true);
  };

  const handleRemoveStaged = (tempId: string) => {
    setStagedApps(stagedApps.filter((a) => a.tempId !== tempId));
  };

  // Build room and attach all staged appliances
  const handleBuildNewRoom = () => {
    const defaultName = newName.trim() || `${ROOM_LABELS[newType]} ${rooms.length + 1}`;
    const room = addRoom(newType, defaultName, {
      width: newWidth,
      depth: newDepth,
      wallColor: newWallColor,
      floorColor: newFloorColor,
    });

    // Attach all staged appliances with coordinates
    const maxBound = Math.min(newWidth, newDepth) / 2 - 0.8;
    stagedApps.forEach((sa, idx) => {
      // Deterministic layout spacing based on index
      const angle = (idx / Math.max(stagedApps.length, 1)) * Math.PI * 2;
      const radius = Math.min(idx * 0.8 + 0.5, maxBound);
      const localX = parseFloat((Math.cos(angle) * radius).toFixed(2));
      const localZ = parseFloat((Math.sin(angle) * radius).toFixed(2));

      addAppliance(room.id, sa.type, {
        label: sa.label,
        wattage: sa.wattage,
        hoursPerDay: sa.hoursPerDay,
        rotation: sa.rotation,
        isOn: sa.isOn,
        localX,
        localZ,
      });
    });

    playEcoSound();
    selectRoom(room.id);
    setActiveTab('manage');
    setNewName('');
    setDbNotification(`✓ "${defaultName}" created & saved to database!`);
    setTimeout(() => {
      setDbNotification(null);
    }, 4500);
  };

  // Open modal to attach appliance with custom information to existing room
  const handleOpenAttachModal = (type: ApplianceType) => {
    setAttachType(type);
    setAttachLabel(APPLIANCE_LABELS[type]);
    setAttachWatts(APPLIANCE_WATTAGE[type]);
    setAttachHours(APPLIANCE_HOURS[type]);
    setAttachRotation(0);
    setShowAttachModal(true);
  };

  const handleConfirmAttachAppliance = () => {
    if (!selectedRoom) return;
    const maxBound = Math.min(selectedRoom.width, selectedRoom.depth) / 2 - 0.8;
    const localX = parseFloat(((Math.random() * 2 - 1) * maxBound).toFixed(2));
    const localZ = parseFloat(((Math.random() * 2 - 1) * maxBound).toFixed(2));

    const newApp = addAppliance(selectedRoom.id, attachType, {
      label: attachLabel.trim() || APPLIANCE_LABELS[attachType],
      wattage: attachWatts,
      hoursPerDay: attachHours,
      rotation: attachRotation,
      isOn: true,
      localX,
      localZ,
    });

    setShowAttachModal(false);
    playSwitchSound(true);
    selectAppliance(newApp.id);
  };

  return (
    <div className="fixed inset-x-2 bottom-2 top-16 md:inset-auto md:left-6 md:top-20 md:bottom-8 md:w-[420px] max-w-full bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl flex flex-col overflow-hidden z-40 shadow-2xl shadow-black/70 animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-left-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-blue-500/15 via-slate-900/40 to-transparent shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-wide">Room Designer</span>
            <div className="text-[10px] text-slate-400 font-mono">
              ARCHITECTURE &amp; APPLIANCE STUDIO
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Top Mode Tabs */}
      <div className="flex p-2 bg-slate-950/60 border-b border-white/5 shrink-0 gap-1.5">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'create'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Build New Room
        </button>

        <button
          onClick={() => setActiveTab('manage')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'manage'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          My Rooms ({rooms.length})
        </button>
      </div>

      {/* Database notification banner */}
      {dbNotification && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200 shrink-0">
          <Database className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span>{dbNotification}</span>
        </div>
      )}

      {/* Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
        {/* ======================================================== */}
        {/* TAB 1: BUILD NEW ROOM                                    */}
        {/* ======================================================== */}
        {activeTab === 'create' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Step 1: Room Category */}
            <div className="bg-slate-800/40 border border-white/5 p-4 rounded-2xl space-y-3">
              <div className="text-xs font-semibold text-slate-300">1. Room Category</div>
              <div className="grid grid-cols-5 gap-1.5">
                {ROOM_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    className={`p-2 rounded-xl text-center transition-all border flex flex-col items-center justify-center ${
                      newType === t
                        ? 'bg-blue-600/30 border-blue-400/60 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xl mb-0.5">{ROOM_ICONS[t]}</div>
                    <div className="text-[10px] font-semibold truncate w-full">
                      {ROOM_LABELS[t].split(' ')[0]}
                    </div>
                  </button>
                ))}
              </div>

              <input
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-400 font-medium"
                placeholder={`Room Name (e.g. Master ${ROOM_LABELS[newType]})`}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            {/* Step 2: Dimensions */}
            <div className="bg-slate-800/40 border border-white/5 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>2. Dimensions &amp; Area</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {newWidth}m × {newDepth}m ({(newWidth * newDepth).toFixed(0)} m²)
                </span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Width (East ↔ West)</span>
                    <span className="font-mono text-white">{newWidth}m</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="12"
                    step="0.5"
                    value={newWidth}
                    onChange={(e) => setNewWidth(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Depth (North ↔ South)</span>
                    <span className="font-mono text-white">{newDepth}m</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="12"
                    step="0.5"
                    value={newDepth}
                    onChange={(e) => setNewDepth(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Aesthetics (Wall & Flooring) */}
            <div className="bg-slate-800/40 border border-white/5 p-4 rounded-2xl space-y-3">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                3. Wall Paint &amp; Flooring
              </div>

              <div className="space-y-2">
                <div className="text-[11px] text-slate-400">Wall Color</div>
                <div className="flex items-center gap-2">
                  {WALL_THEMES.map((theme) => (
                    <button
                      key={theme.color}
                      onClick={() => setNewWallColor(theme.color)}
                      style={{ backgroundColor: theme.color }}
                      className={`w-7 h-7 rounded-xl transition-all shadow-sm ${
                        newWallColor === theme.color
                          ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 scale-110'
                          : 'opacity-75 hover:opacity-100 hover:scale-105'
                      }`}
                      title={theme.name}
                    >
                      {newWallColor === theme.color && (
                        <Check className="w-3.5 h-3.5 text-slate-900 mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="text-[11px] text-slate-400">Floor Material</div>
                <div className="flex items-center gap-2">
                  {FLOOR_THEMES.map((theme) => (
                    <button
                      key={theme.color}
                      onClick={() => setNewFloorColor(theme.color)}
                      style={{ backgroundColor: theme.color }}
                      className={`w-7 h-7 rounded-xl transition-all shadow-sm ${
                        newFloorColor === theme.color
                          ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-110'
                          : 'opacity-75 hover:opacity-100 hover:scale-105'
                      }`}
                      title={theme.name}
                    >
                      {newFloorColor === theme.color && (
                        <Check className="w-3.5 h-3.5 text-white mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 4: Attach Appliances with Information */}
            <div className="bg-slate-800/40 border border-white/5 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-300">
                  4. Attach Initial Appliances ({stagedApps.length})
                </div>
                <span className="text-[10px] font-mono text-amber-300">
                  {formatWatts(stagedTotalWatts)}
                </span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
                {['all', 'climate', 'kitchen', 'tech', 'lighting'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all ${
                      categoryFilter === cat
                        ? 'bg-blue-500 text-white font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Appliances Quick Palette */}
              <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                {filteredAppliances.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleStageAppliance(type)}
                    className="p-1.5 rounded-xl bg-slate-900/70 hover:bg-blue-600/20 border border-white/5 hover:border-blue-400/30 text-center transition-all group"
                    title={`Add ${APPLIANCE_LABELS[type]} (${APPLIANCE_WATTAGE[type]}W)`}
                  >
                    <div className="text-lg group-hover:scale-110 transition-transform">
                      {APPLIANCE_ICONS[type]}
                    </div>
                    <div className="text-[9px] text-slate-300 truncate font-medium">
                      {APPLIANCE_LABELS[type].split(' ')[0]}
                    </div>
                  </button>
                ))}
              </div>

              {/* Staged Appliances List */}
              {stagedApps.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-white/5 max-h-36 overflow-y-auto scrollbar-thin">
                  {stagedApps.map((sa) => (
                    <div
                      key={sa.tempId}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-200"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-base">{APPLIANCE_ICONS[sa.type]}</span>
                        <div className="min-w-0">
                          <div className="font-semibold text-[11px] truncate">{sa.label}</div>
                          <div className="text-[10px] font-mono text-amber-300">
                            {sa.wattage}W · {sa.hoursPerDay}h/day
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveStaged(sa.tempId)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Room Energy Summary & Action */}
            <div className="bg-gradient-to-r from-blue-950/40 to-slate-900/60 border border-blue-500/30 p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-mono">ESTIMATED DRAW</div>
                <div className="text-base font-bold font-mono text-amber-300">
                  {formatWatts(stagedTotalWatts)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-mono">EST. MONTHLY</div>
                <div className="text-base font-bold font-mono text-emerald-400">
                  ${stagedMonthlyCost.toFixed(2)}
                </div>
              </div>
            </div>

            <button
              onClick={handleBuildNewRoom}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-2xl text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <Sparkles className="w-4 h-4" />
              Build &amp; Place Room in House
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: MY ROOMS & CUSTOMIZE SELECTED ROOM               */}
        {/* ======================================================== */}
        {activeTab === 'manage' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* If a room is actively selected: Show full room customizer */}
            {selectedRoom ? (
              <div className="space-y-4">
                {/* Back to all rooms header */}
                <button
                  onClick={() => selectRoom(null)}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  All Household Rooms
                </button>

                {/* Selected Room Header Card */}
                <div className="bg-gradient-to-r from-cyan-950/40 to-slate-900/70 border border-cyan-500/30 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl">{ROOM_ICONS[selectedRoom.type]}</span>
                      <div>
                        <div className="text-white text-sm font-bold">{selectedRoom.name}</div>
                        <div className="text-[10px] text-cyan-300 font-mono uppercase">
                          {ROOM_LABELS[selectedRoom.type]} · {selectedRoom.width}m × {selectedRoom.depth}m
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onEnterFPV(selectedRoom.id)}
                      className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Walk (FPV)
                    </button>
                  </div>

                  {/* Power Draw Gauge */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">ACTIVE DRAW</div>
                      <div className="text-lg font-bold font-mono text-amber-300">
                        {formatWatts(roomWatts)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          playSwitchSound(false);
                          roomAppliances.forEach((a) => a.isOn && toggleAppliance(a.id));
                        }}
                        className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-semibold transition-all"
                      >
                        All Off
                      </button>
                      <button
                        onClick={() => {
                          playSwitchSound(true);
                          roomAppliances.forEach((a) => !a.isOn && toggleAppliance(a.id));
                        }}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-semibold transition-all"
                      >
                        All On
                      </button>
                    </div>
                  </div>
                </div>

                {/* Edit Room Name & Category */}
                <div className="bg-slate-800/40 border border-white/5 p-4 rounded-2xl space-y-3">
                  <div className="text-xs font-semibold text-slate-300">Room Name</div>
                  <input
                    type="text"
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs font-semibold focus:outline-none focus:border-cyan-400 transition-all"
                    value={selectedRoom.name}
                    onChange={(e) => updateRoom(selectedRoom.id, { name: e.target.value })}
                  />

                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] text-slate-400">Category</div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {ROOM_TYPES.map((t) => (
                        <button
                          key={t}
                          onClick={() => updateRoom(selectedRoom.id, { type: t })}
                          className={`p-1.5 rounded-xl flex flex-col items-center justify-center transition-all border ${
                            selectedRoom.type === t
                              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                              : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className="text-base">{ROOM_ICONS[t]}</span>
                          <span className="text-[9px] mt-0.5 truncate">{ROOM_LABELS[t].split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Dimensions Sliders */}
                <div className="bg-slate-800/40 border border-white/5 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>Dimensions (Live Resizing)</span>
                    <span className="font-mono text-cyan-300">
                      {selectedRoom.width}m × {selectedRoom.depth}m
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Width</span>
                        <span className="font-mono text-white">{selectedRoom.width}m</span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="12"
                        step="0.5"
                        value={selectedRoom.width}
                        onChange={(e) =>
                          updateRoom(selectedRoom.id, { width: parseFloat(e.target.value) })
                        }
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Depth</span>
                        <span className="font-mono text-white">{selectedRoom.depth}m</span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="12"
                        step="0.5"
                        value={selectedRoom.depth}
                        onChange={(e) =>
                          updateRoom(selectedRoom.id, { depth: parseFloat(e.target.value) })
                        }
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Wall & Floor Colors */}
                <div className="bg-slate-800/40 border border-white/5 p-4 rounded-2xl space-y-3">
                  <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-cyan-400" />
                    Wall &amp; Floor Finishes
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] text-slate-400">Wall Paint</div>
                    <div className="flex items-center gap-2">
                      {WALL_THEMES.map((theme) => (
                        <button
                          key={theme.color}
                          onClick={() => updateRoom(selectedRoom.id, { wallColor: theme.color })}
                          style={{ backgroundColor: theme.color }}
                          className={`w-7 h-7 rounded-xl transition-all shadow-sm ${
                            selectedRoom.wallColor.toLowerCase() === theme.color.toLowerCase()
                              ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 scale-110'
                              : 'opacity-75 hover:opacity-100 hover:scale-105'
                          }`}
                          title={theme.name}
                        >
                          {selectedRoom.wallColor.toLowerCase() === theme.color.toLowerCase() && (
                            <Check className="w-3.5 h-3.5 text-slate-900 mx-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <div className="text-[11px] text-slate-400">Flooring</div>
                    <div className="flex items-center gap-2">
                      {FLOOR_THEMES.map((theme) => (
                        <button
                          key={theme.color}
                          onClick={() => updateRoom(selectedRoom.id, { floorColor: theme.color })}
                          style={{ backgroundColor: theme.color }}
                          className={`w-7 h-7 rounded-xl transition-all shadow-sm ${
                            selectedRoom.floorColor.toLowerCase() === theme.color.toLowerCase()
                              ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-110'
                              : 'opacity-75 hover:opacity-100 hover:scale-105'
                          }`}
                          title={theme.name}
                        >
                          {selectedRoom.floorColor.toLowerCase() === theme.color.toLowerCase() && (
                            <Check className="w-3.5 h-3.5 text-white mx-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Attach Appliance with Information */}
                <div className="bg-slate-800/40 border border-white/5 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-300">
                      Attach Appliances ({roomAppliances.length})
                    </div>
                    <span className="text-[10px] text-cyan-300 font-mono">CLICK TO CONFIGURE</span>
                  </div>

                  {/* Appliance grid */}
                  <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                    {ALL_APPLIANCES.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleOpenAttachModal(type)}
                        className="p-1.5 rounded-xl bg-slate-900/70 hover:bg-cyan-600/20 border border-white/5 hover:border-cyan-400/30 text-center transition-all group"
                        title={`Configure & Attach ${APPLIANCE_LABELS[type]}`}
                      >
                        <div className="text-lg group-hover:scale-110 transition-transform">
                          {APPLIANCE_ICONS[type]}
                        </div>
                        <div className="text-[9px] text-slate-300 truncate font-medium">
                          {APPLIANCE_LABELS[type].split(' ')[0]}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Inline Configure & Attach Form */}
                  {showAttachModal && (
                    <div className="bg-slate-900 border border-cyan-500/40 p-3.5 rounded-2xl space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{APPLIANCE_ICONS[attachType]}</span>
                          <span className="text-xs font-bold text-white">
                            Attach {APPLIANCE_LABELS[attachType]}
                          </span>
                        </div>
                        <button
                          onClick={() => setShowAttachModal(false)}
                          className="text-slate-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] text-slate-400 font-semibold">Custom Label</label>
                          <input
                            type="text"
                            value={attachLabel}
                            onChange={(e) => setAttachLabel(e.target.value)}
                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>Power</span>
                              <span className="font-mono text-amber-300">{attachWatts}W</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="3500"
                              step="10"
                              value={attachWatts}
                              onChange={(e) => setAttachWatts(Number(e.target.value))}
                              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>Usage</span>
                              <span className="font-mono text-cyan-300">{attachHours}h/day</span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="24"
                              step="0.5"
                              value={attachHours}
                              onChange={(e) => setAttachHours(Number(e.target.value))}
                              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 font-semibold mb-1 block">
                            Orientation: {attachRotation}°
                          </label>
                          <div className="grid grid-cols-4 gap-1">
                            {([0, 90, 180, 270] as const).map((deg) => (
                              <button
                                key={deg}
                                onClick={() => setAttachRotation(deg)}
                                className={`py-1 text-[10px] font-mono rounded-lg border transition-all ${
                                  attachRotation === deg
                                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                                    : 'bg-slate-800 border-white/5 text-slate-400'
                                }`}
                              >
                                {deg}°
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleConfirmAttachAppliance}
                          className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-600/30 flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Place Appliance in Room
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Installed Appliances in Selected Room */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin pt-1">
                    {roomAppliances.length === 0 ? (
                      <div className="text-center py-3 text-[11px] text-slate-500 font-mono">
                        No appliances installed yet
                      </div>
                    ) : (
                      roomAppliances.map((app) => (
                        <div
                          key={app.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5 text-xs group"
                        >
                          <div
                            onClick={() => selectAppliance(app.id)}
                            className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                          >
                            <span className="text-base">{APPLIANCE_ICONS[app.type]}</span>
                            <div className="min-w-0">
                              <div className="font-semibold text-white text-[11px] truncate">
                                {app.label ?? APPLIANCE_LABELS[app.type]}
                              </div>
                              <div className="text-[10px] font-mono text-amber-300">
                                {app.wattage}W · {app.hoursPerDay}h · {app.rotation}°
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 ml-2">
                            {/* Rotate 90 deg */}
                            <button
                              onClick={() => {
                                const next = ((app.rotation + 90) % 360) as 0 | 90 | 180 | 270;
                                updateAppliance(app.id, { rotation: next });
                              }}
                              className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-white/5"
                              title="Rotate +90°"
                            >
                              <RotateCw className="w-3 h-3" />
                            </button>

                            {/* ON/OFF toggle */}
                            <button
                              onClick={() => toggleAppliance(app.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                                app.isOn
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-500 border border-white/5'
                              }`}
                            >
                              {app.isOn ? 'ON' : 'OFF'}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => removeAppliance(app.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Delete Room */}
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${selectedRoom.name}" and its appliances?`)) {
                      removeRoom(selectedRoom.id);
                      selectRoom(null);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Room
                </button>
              </div>
            ) : (
              /* If no room selected: Show room cards list */
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
                  <span className="uppercase tracking-wider">HOUSEHOLD ROOMS ({rooms.length})</span>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                    <Database className="w-3 h-3" />
                    <span>DB SAVED</span>
                  </div>
                </div>

                {/* Database Info & Reset Option */}
                <div className="flex items-center justify-between text-[11px] font-mono bg-slate-950/60 border border-white/5 px-3 py-2 rounded-xl text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        dbSyncStatus === 'saving'
                          ? 'bg-amber-400 animate-ping'
                          : dbSyncStatus === 'error'
                          ? 'bg-rose-500'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <span className="truncate max-w-[170px]">
                      {lastSavedAt ? `Saved at ${lastSavedAt}` : 'data/database.json'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Reset household layout back to initial demo rooms?')) {
                        resetToDemoHome(seedDemoHome);
                      }
                    }}
                    className="text-[10px] text-slate-400 hover:text-amber-300 transition-colors"
                    title="Reset to default 4-room layout"
                  >
                    ↺ Reset Demo
                  </button>
                </div>

                <div className="space-y-2">
                  {rooms.map((room) => {
                    const rApps = appliances.filter((a) => a.roomId === room.id);
                    const rWatts = rApps.reduce((s, a) => (a.isOn ? s + a.wattage : s), 0);
                    const activeCount = rApps.filter((a) => a.isOn).length;

                    return (
                      <div
                        key={room.id}
                        className="p-3.5 rounded-2xl border border-white/5 bg-slate-800/40 hover:bg-slate-800/70 hover:border-white/10 transition-all cursor-pointer group"
                        onClick={() => selectRoom(room.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{ROOM_ICONS[room.type]}</span>
                            <div>
                              <div className="text-white text-xs font-bold group-hover:text-cyan-300 transition-colors">
                                {room.name}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {room.width}m × {room.depth}m · {rApps.length} devices ({activeCount} on)
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-amber-300 font-semibold">
                              {formatWatts(rWatts)}
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEnterFPV(room.id);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-[11px] font-semibold transition-all flex items-center gap-1"
                              title="Walk inside in First-Person View"
                            >
                              <LogIn className="w-3 h-3" />
                              Walk
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomBuilder;
