// ============================================================
// Energy Dashboard — Per-appliance, Per-room, Household analytics
// ============================================================

import React, { useState, useMemo } from 'react';
import { X, Zap, Home, Layers, TrendingUp, AlertTriangle, CheckCircle2, Leaf, Sparkles, Sliders } from 'lucide-react';
import { useHomeStore } from '../store/homeStore';
import {
  calculateEnergyStats,
  calculateRoomEnergy,
  calculateHomeEnergy,
  formatWatts,
  formatKwh,
  formatCost,
} from '../utils/energyCalculator';
import { APPLIANCE_ICONS, APPLIANCE_LABELS, ROOM_ICONS } from '../utils/constants';

type Tab = 'overview' | 'rooms' | 'appliances';

const EnergyDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    rooms,
    appliances,
    toggleAppliance,
    selectAppliance,
    setEcoMode,
    selectRoom,
  } = useHomeStore();

  const [tab, setTab] = useState<Tab>('overview');
  const [filterRoomId, setFilterRoomId] = useState<string>('all');
  const [onlyActive, setOnlyActive] = useState<boolean>(false);

  const homeStats = calculateHomeEnergy(appliances);

  // Energy Efficiency Rating
  const efficiency = useMemo(() => {
    if (homeStats.totalWatts === 0) return { grade: 'A+', label: 'Zero Draw', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (homeStats.totalWatts < 1200) return { grade: 'A', label: 'Eco Efficient', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (homeStats.totalWatts < 2800) return { grade: 'B', label: 'Standard', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' };
    if (homeStats.totalWatts < 5000) return { grade: 'C', label: 'High Demand', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    return { grade: 'D', label: 'Heavy Load', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
  }, [homeStats.totalWatts]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const cats: Record<string, { label: string; icon: string; watts: number; count: number; color: string }> = {
      cooling: { label: 'Climate & AC', icon: '❄️', watts: 0, count: 0, color: 'bg-cyan-500' },
      kitchen: { label: 'Kitchen & Dining', icon: '🍳', watts: 0, count: 0, color: 'bg-amber-500' },
      entertainment: { label: 'Media & Tech', icon: '📺', watts: 0, count: 0, color: 'bg-indigo-500' },
      lighting: { label: 'Lighting', icon: '💡', watts: 0, count: 0, color: 'bg-yellow-400' },
      heating: { label: 'Heating & Water', icon: '♨️', watts: 0, count: 0, color: 'bg-rose-500' },
      other: { label: 'Appliances', icon: '⚡', watts: 0, count: 0, color: 'bg-emerald-500' },
    };

    appliances.forEach((a) => {
      let catKey = 'other';
      if (a.type === 'ac' || a.type === 'ceiling-fan') catKey = 'cooling';
      else if (['refrigerator', 'oven', 'microwave', 'dishwasher'].includes(a.type)) catKey = 'kitchen';
      else if (['tv', 'computer'].includes(a.type)) catKey = 'entertainment';
      else if (a.type === 'light-bulb') catKey = 'lighting';
      else if (['heater', 'water-heater'].includes(a.type)) catKey = 'heating';

      cats[catKey].count++;
      if (a.isOn) cats[catKey].watts += a.wattage;
    });

    return Object.entries(cats).filter(([_, c]) => c.count > 0);
  }, [appliances]);

  // Filtered appliances list
  const filteredAppliances = useMemo(() => {
    return appliances.filter((a) => {
      if (filterRoomId !== 'all' && a.roomId !== filterRoomId) return false;
      if (onlyActive && !a.isOn) return false;
      return true;
    }).sort((a, b) => (b.isOn ? b.wattage : 0) - (a.isOn ? a.wattage : 0));
  }, [appliances, filterRoomId, onlyActive]);

  const maxRoomWatts = Math.max(
    ...rooms.map((r) => calculateRoomEnergy(r, appliances).totalWatts),
    1
  );

  return (
    <div className="fixed inset-x-2 bottom-2 top-16 md:inset-auto md:right-6 md:top-20 md:bottom-8 md:w-[420px] max-w-full bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl flex flex-col overflow-hidden z-40 shadow-2xl shadow-black/60 animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-slate-900/40 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">Electricity Analytics</span>
            <div className="text-[11px] text-slate-400 font-mono">HOUSEHOLD METRICS &amp; AUDIT</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="px-5 py-3.5 bg-black/30 border-b border-white/5 grid grid-cols-3 gap-2.5">
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-2.5 text-center">
          <div className="text-amber-300 font-bold text-sm font-mono">{formatWatts(homeStats.totalWatts)}</div>
          <div className="text-slate-400 text-[10px] uppercase tracking-wider mt-0.5">Live Draw</div>
        </div>
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-2.5 text-center">
          <div className="text-cyan-300 font-bold text-sm font-mono">{formatKwh(homeStats.dailyKwh)}</div>
          <div className="text-slate-400 text-[10px] uppercase tracking-wider mt-0.5">Daily Est.</div>
        </div>
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-2.5 text-center">
          <div className="text-emerald-400 font-bold text-sm font-mono">{formatCost(homeStats.monthlyCost)}</div>
          <div className="text-slate-400 text-[10px] uppercase tracking-wider mt-0.5">Monthly $</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 px-5 pt-2 bg-slate-900/40">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'rooms', label: `Rooms (${rooms.length})` },
          { id: 'appliances', label: `Devices (${appliances.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-all relative ${
              tab === t.id
                ? 'text-amber-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
            {tab === t.id && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-400 rounded-full shadow-sm shadow-amber-400/50" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="space-y-4">
            {/* Efficiency Badge */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${efficiency.bg}`}>
              <div>
                <div className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">EFFICIENCY RATING</div>
                <div className={`text-base font-bold ${efficiency.color}`}>{efficiency.label}</div>
              </div>
              <div className={`text-3xl font-black font-mono ${efficiency.color} bg-black/30 px-3 py-1 rounded-xl`}>
                {efficiency.grade}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-slate-800/40 border border-white/5 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Load by Category</span>
                <span className="text-[11px] text-slate-500 font-mono">ACTIVE LOAD</span>
              </div>
              <div className="space-y-2.5">
                {categoryStats.map(([key, cat]) => {
                  const pct = homeStats.totalWatts > 0 ? (cat.watts / homeStats.totalWatts) * 100 : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </span>
                        <span className="font-mono text-amber-300 font-medium">
                          {formatWatts(cat.watts)}
                          <span className="text-slate-500 text-[10px] ml-1">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/40 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${cat.color} transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smart Energy Audit Tips */}
            <div className="bg-slate-800/40 border border-white/5 p-4 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Smart Home Advice
                </span>
                <button
                  onClick={setEcoMode}
                  className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <Leaf className="w-3 h-3" />
                  Auto-Optimize
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {homeStats.totalWatts > 3500 && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                    <span>Peak demand active! Air conditioners & heaters are consuming high wattage.</span>
                  </div>
                )}
                <div className="p-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                  <span>LED Light bulbs use just 10W each, consuming 85% less electricity than incandescent bulbs.</span>
                </div>
                <div className="p-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-300 flex items-start gap-2">
                  <Zap className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                  <span>Refrigerators run 24h/day. Keeping seals tight saves an estimated $4.50 monthly.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROOMS TAB */}
        {tab === 'rooms' && (
          <div className="space-y-3">
            {rooms.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-xs">
                No rooms added yet.
              </div>
            )}
            {rooms.map((room) => {
              const rAppliances = appliances.filter((a) => a.roomId === room.id);
              const rStats = calculateRoomEnergy(room, appliances);
              const activeCount = rAppliances.filter((a) => a.isOn).length;
              const pct = maxRoomWatts > 0 ? (rStats.totalWatts / maxRoomWatts) * 100 : 0;

              return (
                <div
                  key={room.id}
                  onClick={() => selectRoom(room.id)}
                  className="bg-slate-800/40 hover:bg-slate-800/70 border border-white/5 hover:border-amber-400/30 p-4 rounded-2xl transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{ROOM_ICONS[room.type]}</span>
                      <div>
                        <div className="font-bold text-white text-sm">{room.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {activeCount} of {rAppliances.length} devices active
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-300 font-mono">
                        {formatWatts(rStats.totalWatts)}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono">
                        ${rStats.monthlyCost.toFixed(2)}/mo
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-slate-700/40 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Device icon strip */}
                  <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                    {rAppliances.map((a) => (
                      <span
                        key={a.id}
                        className={`text-xs px-2 py-1 rounded-lg border flex items-center gap-1 ${
                          a.isOn
                            ? 'bg-amber-400/10 text-amber-200 border-amber-400/20'
                            : 'bg-white/5 text-slate-500 border-white/5 opacity-50'
                        }`}
                        title={`${APPLIANCE_LABELS[a.type]} (${a.wattage}W)`}
                      >
                        <span>{APPLIANCE_ICONS[a.type]}</span>
                        <span className="font-mono text-[10px]">{a.wattage}W</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* APPLIANCES TAB */}
        {tab === 'appliances' && (
          <div className="space-y-3">
            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <select
                value={filterRoomId}
                onChange={(e) => setFilterRoomId(e.target.value)}
                className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">All Rooms</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setOnlyActive((v) => !v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  onlyActive
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                Active Only
              </button>
            </div>

            {/* Appliance List */}
            <div className="space-y-2">
              {filteredAppliances.map((a) => {
                const room = rooms.find((r) => r.id === a.roomId);
                const dailyKwh = (a.wattage * a.hoursPerDay) / 1000;
                return (
                  <div
                    key={a.id}
                    onClick={() => selectAppliance(a.id)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      a.isOn
                        ? 'bg-slate-800/50 border-white/10 hover:border-amber-400/30'
                        : 'bg-slate-900/40 border-white/5 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                        {APPLIANCE_ICONS[a.type]}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-xs">{APPLIANCE_LABELS[a.type]}</div>
                        <div className="text-[10px] text-slate-400">
                          {room?.name} · {a.hoursPerDay}h/day
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`font-mono text-xs font-bold ${a.isOn ? 'text-amber-300' : 'text-slate-500'}`}>
                          {a.isOn ? formatWatts(a.wattage) : '0 W'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {dailyKwh.toFixed(2)} kWh/d
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAppliance(a.id);
                        }}
                        className={`w-10 h-5 rounded-full transition-all duration-200 relative ${
                          a.isOn ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                            a.isOn ? 'left-5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnergyDashboard;
