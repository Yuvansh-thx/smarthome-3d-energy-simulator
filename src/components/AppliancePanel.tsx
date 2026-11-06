// ============================================================
// Appliance Inspector Panel — Rotation, Placement, Wattage, Controls
// ============================================================

import React from 'react';
import { X, Power, RotateCw, Trash2, Zap, Clock, Move, Compass } from 'lucide-react';
import { useHomeStore } from '../store/homeStore';
import { APPLIANCE_ICONS, APPLIANCE_LABELS, ROOM_ICONS } from '../utils/constants';
import { formatWatts } from '../utils/energyCalculator';

const ROTATIONS: Array<{ angle: 0 | 90 | 180 | 270; label: string; desc: string }> = [
  { angle: 0, label: 'Front', desc: 'Facing South (0°)' },
  { angle: 90, label: 'Right', desc: 'Facing East (90°)' },
  { angle: 180, label: 'Back', desc: 'Facing North (180°)' },
  { angle: 270, label: 'Left', desc: 'Facing West (270°)' },
];

const AppliancePanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    appliances,
    rooms,
    selectedApplianceId,
    toggleAppliance,
    updateAppliance,
    removeAppliance,
    selectAppliance,
  } = useHomeStore();

  const appliance = appliances.find((a) => a.id === selectedApplianceId);
  const room = rooms.find((r) => r.id === appliance?.roomId);

  if (!appliance) return null;

  const handleRotate = () => {
    const nextRot = ((appliance.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    updateAppliance(appliance.id, { rotation: nextRot });
  };

  const handleHoursChange = (val: number) => {
    updateAppliance(appliance.id, { hoursPerDay: val });
  };

  const handleWattageChange = (val: number) => {
    updateAppliance(appliance.id, { wattage: val });
  };

  const handlePosX = (val: number) => {
    updateAppliance(appliance.id, { localX: parseFloat(val.toFixed(2)) });
  };

  const handlePosZ = (val: number) => {
    updateAppliance(appliance.id, { localZ: parseFloat(val.toFixed(2)) });
  };

  const handleRemove = () => {
    removeAppliance(appliance.id);
    selectAppliance(null);
    onClose();
  };

  const dailyKwh = (appliance.wattage * appliance.hoursPerDay) / 1000;
  const monthlyKwh = dailyKwh * 30;
  const monthlyCost = monthlyKwh * 0.12;

  const maxBound = room ? Math.floor(Math.min(room.width, room.depth) / 2) - 0.5 : 3.5;

  return (
    <div className="fixed inset-x-2 bottom-2 md:inset-auto md:right-6 md:top-20 md:w-84 max-w-full bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden z-40 shadow-2xl shadow-black/60 animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-slate-900/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-2xl shadow-md shadow-amber-400/10">
            {APPLIANCE_ICONS[appliance.type]}
          </div>
          <div>
            <div className="text-white text-sm font-bold">{APPLIANCE_LABELS[appliance.type]}</div>
            {room && (
              <div className="text-slate-400 text-xs flex items-center gap-1">
                <span>{ROOM_ICONS[room.type]}</span>
                <span>{room.name}</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto scrollbar-thin">
        {/* Power Status & Primary Switch */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
            appliance.isOn
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-slate-800/40 border-white/10'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                appliance.isOn
                  ? 'bg-emerald-400 shadow-md shadow-emerald-400/60 animate-pulse'
                  : 'bg-slate-600'
              }`}
            />
            <div>
              <div className="text-xs font-bold text-white">
                {appliance.isOn ? 'DEVICE ACTIVE' : 'DEVICE STANDBY / OFF'}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {appliance.isOn ? `${appliance.wattage} Watts Draw` : '0 Watts Draw'}
              </div>
            </div>
          </div>

          <button
            onClick={() => toggleAppliance(appliance.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              appliance.isOn
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {appliance.isOn ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Orientation & Rotation Controls (Front, Right, Back, Left) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Orientation &amp; Facing
            </span>
            <span className="text-xs font-mono text-amber-300 font-bold">{appliance.rotation}°</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {ROTATIONS.map((r) => (
              <button
                key={r.angle}
                onClick={() => updateAppliance(appliance.id, { rotation: r.angle })}
                className={`py-2 px-1 rounded-xl text-center text-xs font-semibold transition-all border ${
                  appliance.rotation === r.angle
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-md shadow-amber-400/10'
                    : 'bg-slate-800/60 text-slate-400 border-white/5 hover:text-white hover:bg-slate-800'
                }`}
                title={r.desc}
              >
                <div>{r.label}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{r.angle}°</div>
              </button>
            ))}
          </div>
        </div>

        {/* In-Room Position Sliders (X & Z) */}
        <div className="space-y-3 bg-slate-800/30 border border-white/5 p-3.5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-indigo-400" />
            Room Placement Coordinates
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Position X (West ↔ East)</span>
              <span className="font-mono text-slate-200">{appliance.localX.toFixed(1)}m</span>
            </div>
            <input
              type="range"
              min={-maxBound}
              max={maxBound}
              step={0.1}
              value={appliance.localX}
              onChange={(e) => handlePosX(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg accent-indigo-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Position Z (North ↔ South)</span>
              <span className="font-mono text-slate-200">{appliance.localZ.toFixed(1)}m</span>
            </div>
            <input
              type="range"
              min={-maxBound}
              max={maxBound}
              step={0.1}
              value={appliance.localZ}
              onChange={(e) => handlePosZ(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg accent-indigo-400"
            />
          </div>
        </div>

        {/* Wattage Tuning Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Power Rating
            </span>
            <span className="font-mono text-amber-300 font-bold">{appliance.wattage} W</span>
          </div>
          <input
            type="range"
            min={5}
            max={4000}
            step={5}
            value={appliance.wattage}
            onChange={(e) => handleWattageChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg accent-amber-400"
          />
        </div>

        {/* Daily Usage Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Daily Operating Time
            </span>
            <span className="font-mono text-cyan-300 font-bold">{appliance.hoursPerDay} hrs/day</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={24}
            step={0.5}
            value={appliance.hoursPerDay}
            onChange={(e) => handleHoursChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg accent-cyan-400"
          />
        </div>

        {/* Energy Projection Breakdown */}
        <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-3.5 space-y-2">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">PROJECTED CONSUMPTION</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/60 p-2 rounded-xl">
              <div className="text-slate-400 text-[10px]">Daily Energy</div>
              <div className="font-mono font-bold text-slate-200 mt-0.5">{dailyKwh.toFixed(2)} kWh</div>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-xl">
              <div className="text-slate-400 text-[10px]">Monthly Energy</div>
              <div className="font-mono font-bold text-slate-200 mt-0.5">{monthlyKwh.toFixed(1)} kWh</div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
            <span className="text-slate-400">Monthly Operating Cost:</span>
            <span className="font-mono font-bold text-emerald-400">${monthlyCost.toFixed(2)}</span>
          </div>
        </div>

        {/* Remove Appliance Button */}
        <button
          onClick={handleRemove}
          className="w-full py-2.5 rounded-2xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center justify-center gap-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove from Room
        </button>
      </div>
    </div>
  );
};

export default AppliancePanel;
