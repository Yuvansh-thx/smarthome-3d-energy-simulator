// ============================================================
// Room Inspector & Editor Panel — Live Room Customization
// ============================================================

import React, { useState } from 'react';
import {
  X,
  Sliders,
  Palette,
  Layers,
  Plus,
  Trash2,
  Power,
  Eye,
  Sparkles,
  Zap,
  Grid,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { useHomeStore } from '../store/homeStore';
import type { RoomType, ApplianceType } from '../types';
import {
  ROOM_LABELS,
  ROOM_ICONS,
  APPLIANCE_LABELS,
  APPLIANCE_ICONS,
  APPLIANCE_WATTAGE,
  ROOM_APPLIANCES,
} from '../utils/constants';
import { formatWatts } from '../utils/energyCalculator';
import { playSwitchSound, playEcoSound } from '../utils/soundEffects';

const ROOM_TYPES: RoomType[] = ['bedroom', 'living-room', 'kitchen', 'bathroom', 'study'];

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

interface RoomPanelProps {
  onClose: () => void;
  onEnterFPV: (roomId: string) => void;
  onSelectAppliance?: (id: string) => void;
}

const RoomPanel: React.FC<RoomPanelProps> = ({ onClose, onEnterFPV, onSelectAppliance }) => {
  const {
    rooms,
    appliances,
    selectedRoomId,
    updateRoom,
    removeRoom,
    addAppliance,
    removeAppliance,
    toggleAppliance,
    selectRoom,
    selectAppliance,
  } = useHomeStore();

  const [showAddAppliance, setShowAddAppliance] = useState(false);
  const [selectedAppType, setSelectedAppType] = useState<ApplianceType>('light-bulb');

  const room = rooms.find((r) => r.id === selectedRoomId);
  if (!room) return null;

  const roomAppliances = appliances.filter((a) => a.roomId === room.id);
  const activeAppliances = roomAppliances.filter((a) => a.isOn);
  const roomWatts = activeAppliances.reduce((sum, a) => sum + a.wattage, 0);
  const roomDailyKwh = roomAppliances.reduce(
    (sum, a) => (a.isOn ? sum + (a.wattage * a.hoursPerDay) / 1000 : sum),
    0
  );
  const roomMonthlyCost = roomDailyKwh * 30 * 0.12;

  const handleNameChange = (name: string) => {
    updateRoom(room.id, { name });
  };

  const handleTypeChange = (type: RoomType) => {
    updateRoom(room.id, { type });
  };

  const handleWidthChange = (width: number) => {
    updateRoom(room.id, { width });
  };

  const handleDepthChange = (depth: number) => {
    updateRoom(room.id, { depth });
  };

  const handleWallColor = (wallColor: string) => {
    updateRoom(room.id, { wallColor });
  };

  const handleFloorColor = (floorColor: string) => {
    updateRoom(room.id, { floorColor });
  };

  const handleAddAppliance = () => {
    // Place randomly within room bounds
    const maxBound = Math.min(room.width, room.depth) / 2 - 0.8;
    const localX = parseFloat(((Math.random() * 2 - 1) * maxBound).toFixed(2));
    const localZ = parseFloat(((Math.random() * 2 - 1) * maxBound).toFixed(2));

    const newApp = addAppliance(room.id, selectedAppType, {
      localX,
      localZ,
      label: APPLIANCE_LABELS[selectedAppType],
      wattage: APPLIANCE_WATTAGE[selectedAppType],
      isOn: true,
    });
    setShowAddAppliance(false);
    selectAppliance(newApp.id);
  };

  const handleToggleAll = (turnOn: boolean) => {
    playSwitchSound(turnOn);
    roomAppliances.forEach((a) => {
      if (a.isOn !== turnOn) toggleAppliance(a.id);
    });
  };

  const handleDeleteRoom = () => {
    if (window.confirm(`Delete "${room.name}" and all its ${roomAppliances.length} appliances?`)) {
      removeRoom(room.id);
      selectRoom(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-x-2 bottom-2 top-16 md:inset-auto md:right-6 md:top-20 md:bottom-8 md:w-[420px] max-w-full bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl flex flex-col overflow-hidden z-40 shadow-2xl shadow-black/70 animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/15 via-slate-900/40 to-transparent shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center text-2xl shadow-md shadow-cyan-400/10">
            {ROOM_ICONS[room.type] || '🏠'}
          </div>
          <div>
            <div className="text-white text-sm font-bold truncate max-w-[170px]">{room.name}</div>
            <div className="text-cyan-400 text-xs font-mono tracking-wide uppercase">
              {ROOM_LABELS[room.type]} · {room.width}m × {room.depth}m
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

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
        {/* Quick Action Buttons */}
        <div>
          <button
            onClick={() => onEnterFPV(room.id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-600/25 transition-all hover:scale-[1.01]"
          >
            <Eye className="w-4 h-4" />
            Walk Inside Room (FPV)
          </button>
        </div>

        {/* Live Energy Draw Card */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/10 p-3.5 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Room Power Draw
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {activeAppliances.length} of {roomAppliances.length} Active
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-amber-300">
              {formatWatts(roomWatts)}
            </div>
            <div className="text-right text-xs font-mono text-emerald-400">
              ${roomMonthlyCost.toFixed(2)}
              <span className="text-[10px] text-slate-400"> /mo</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
            <button
              onClick={() => handleToggleAll(false)}
              className="flex-1 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/20 rounded-lg text-xs font-medium transition-all"
            >
              Turn Room Off
            </button>
            <button
              onClick={() => handleToggleAll(true)}
              className="flex-1 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/20 rounded-lg text-xs font-medium transition-all"
            >
              Turn Room On
            </button>
          </div>
        </div>

        {/* Room Name & Identification */}
        <div className="bg-slate-800/40 border border-white/5 p-3.5 rounded-2xl space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Room Name</span>
            <span className="text-[10px] text-slate-500 font-mono">LIVE UPDATE</span>
          </div>
          <input
            type="text"
            className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
            value={room.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Room Name"
          />

          {/* Room Type Selector */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-semibold text-slate-400">Room Category</div>
            <div className="grid grid-cols-5 gap-1.5">
              {ROOM_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all border ${
                    room.type === t
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={ROOM_LABELS[t]}
                >
                  <span className="text-base">{ROOM_ICONS[t]}</span>
                  <span className="text-[9px] font-medium mt-0.5 truncate w-full text-center">
                    {ROOM_LABELS[t].split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Room Dimensions Sliders */}
        <div className="bg-slate-800/40 border border-white/5 p-3.5 rounded-2xl space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Room Dimensions</span>
            <span className="text-[11px] text-cyan-300 font-mono font-bold">
              {room.width}m × {room.depth}m ({(room.width * room.depth).toFixed(0)} m²)
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Width (East ↔ West)</span>
                <span className="font-mono text-white">{room.width}m</span>
              </div>
              <input
                type="range"
                min="4"
                max="12"
                step="0.5"
                value={room.width}
                onChange={(e) => handleWidthChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Depth (North ↔ South)</span>
                <span className="font-mono text-white">{room.depth}m</span>
              </div>
              <input
                type="range"
                min="4"
                max="12"
                step="0.5"
                value={room.depth}
                onChange={(e) => handleDepthChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Aesthetic Customization: Wall & Floor */}
        <div className="bg-slate-800/40 border border-white/5 p-3.5 rounded-2xl space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            Wall Paint &amp; Aesthetics
          </div>

          {/* Wall Color Swatches */}
          <div className="flex items-center gap-2">
            {WALL_THEMES.map((theme) => (
              <button
                key={theme.color}
                onClick={() => handleWallColor(theme.color)}
                style={{ backgroundColor: theme.color }}
                className={`w-7 h-7 rounded-xl transition-all relative shadow-sm ${
                  room.wallColor.toLowerCase() === theme.color.toLowerCase()
                    ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 scale-110'
                    : 'hover:scale-105 opacity-80 hover:opacity-100'
                }`}
                title={theme.name}
              >
                {room.wallColor.toLowerCase() === theme.color.toLowerCase() && (
                  <Check className="w-3.5 h-3.5 text-slate-900 mx-auto" />
                )}
              </button>
            ))}
          </div>

          {/* Floor Finish Swatches */}
          <div className="pt-2 border-t border-white/5 space-y-2">
            <div className="text-xs font-semibold text-slate-300">Floor Finish</div>
            <div className="flex items-center gap-2">
              {FLOOR_THEMES.map((theme) => (
                <button
                  key={theme.color}
                  onClick={() => handleFloorColor(theme.color)}
                  style={{ backgroundColor: theme.color }}
                  className={`w-7 h-7 rounded-xl transition-all relative shadow-sm ${
                    room.floorColor.toLowerCase() === theme.color.toLowerCase()
                      ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  title={theme.name}
                >
                  {room.floorColor.toLowerCase() === theme.color.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Appliances in this Room */}
        <div className="bg-slate-800/40 border border-white/5 p-3.5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Appliances in Room ({roomAppliances.length})
            </span>
            <button
              onClick={() => setShowAddAppliance((v) => !v)}
              className="text-xs font-semibold text-cyan-300 hover:text-white flex items-center gap-1 bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/30 transition-all"
            >
              <Plus className="w-3 h-3" />
              Add Appliance
            </button>
          </div>

          {/* Add Appliance Picker Dropdown */}
          {showAddAppliance && (
            <div className="bg-slate-900 border border-cyan-500/30 p-3 rounded-xl space-y-2.5 animate-in fade-in duration-150">
              <div className="text-[11px] font-semibold text-slate-300">Choose Appliance:</div>
              <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                {ROOM_APPLIANCES[room.type].map((appType) => (
                  <button
                    key={appType}
                    onClick={() => setSelectedAppType(appType)}
                    className={`p-1.5 rounded-lg text-center border text-xs transition-all ${
                      selectedAppType === appType
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-base">{APPLIANCE_ICONS[appType]}</div>
                    <div className="text-[10px] truncate">{APPLIANCE_LABELS[appType].split(' ')[0]}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleAddAppliance}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-cyan-600/30 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Attach {APPLIANCE_LABELS[selectedAppType]}
              </button>
            </div>
          )}

          {/* Appliances List */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
            {roomAppliances.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500 font-mono">
                No appliances installed yet
              </div>
            ) : (
              roomAppliances.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5 hover:border-white/10 transition-all group"
                >
                  <div
                    onClick={() => {
                      selectAppliance(app.id);
                      onSelectAppliance?.(app.id);
                    }}
                    className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                  >
                    <span className="text-base">{APPLIANCE_ICONS[app.type]}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {app.label ?? APPLIANCE_LABELS[app.type]}
                      </div>
                      <div className="text-[10px] font-mono text-amber-300">
                        {app.wattage} W · {app.hoursPerDay}h/day
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={() => toggleAppliance(app.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                        app.isOn
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500 border border-white/5'
                      }`}
                    >
                      {app.isOn ? 'ON' : 'OFF'}
                    </button>

                    <button
                      onClick={() => removeAppliance(app.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-all"
                      title="Remove appliance"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Delete Room Danger Zone */}
        <div className="pt-2">
          <button
            onClick={handleDeleteRoom}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomPanel;

