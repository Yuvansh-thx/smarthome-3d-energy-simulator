// ============================================================
// HUD — Heads-Up Display overlay
// ============================================================

import React from 'react';
import { Hammer, Zap, ArrowLeft, Leaf, Power, Compass, Grid, Database } from 'lucide-react';
import { useHomeStore } from '../store/homeStore';
import { calculateHomeEnergy, formatWatts } from '../utils/energyCalculator';
import { APPLIANCE_ICONS, APPLIANCE_LABELS, ROOM_ICONS } from '../utils/constants';

interface HUDProps {
  onToggleEnergy: () => void;
  onToggleBuilder: () => void;
  onLoadDemo: () => void;
  showEnergy: boolean;
  showBuilder: boolean;
  onSelectRoom?: (roomId: string) => void;
}

const HUD: React.FC<HUDProps> = ({
  onToggleEnergy,
  onToggleBuilder,
  onLoadDemo,
  showEnergy,
  showBuilder,
  onSelectRoom,
}) => {
  const {
    viewMode,
    fpvRoomId,
    rooms,
    appliances,
    hoveredApplianceId,
    selectedRoomId,
    selectRoom,
    setViewMode,
    setFpvRoom,
    toggleAppliance,
    toggleAllAppliances,
    setEcoMode,
    selectAppliance,
    dbSyncStatus,
    lastSavedAt,
  } = useHomeStore();

  const homeStats = calculateHomeEnergy(appliances);
  const fpvRoom = rooms.find((r) => r.id === fpvRoomId);
  const hoveredAppliance = appliances.find((a) => a.id === hoveredApplianceId);

  const exitFPV = () => {
    setViewMode('builder');
    setFpvRoom(null);
  };

  const handleEnterRoom = (roomId: string) => {
    setFpvRoom(roomId);
    setViewMode('fpv');
  };

  return (
    <>
      {/* Top navigation bar — Responsive for Mobile Phone, Laptop, and Desktop PC */}
      <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none px-2 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Left: Branding & Mode Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 pointer-events-auto shrink-0">
          {/* Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/85 backdrop-blur-md px-2 sm:px-3 py-1.5 rounded-2xl border border-white/10 shadow-lg">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 fill-slate-950" />
            </div>
            <div className="hidden xs:block">
              <div className="font-bold text-white text-xs sm:text-sm tracking-wide flex items-center gap-1">
                SmartHome <span className="text-cyan-400">3D</span>
                <span className="hidden lg:inline-block text-[9px] px-1.5 py-0.2 bg-amber-400/20 text-amber-300 font-semibold rounded-md border border-amber-400/30">
                  ENERGY SIM
                </span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono hidden sm:block">
                {viewMode === 'builder' ? 'ARCHITECTURAL VIEW' : 'FIRST-PERSON WALK'}
              </div>
            </div>
          </div>

          {/* Builder Controls */}
          {viewMode === 'builder' && (
            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900/85 backdrop-blur-md rounded-2xl p-0.5 sm:p-1 border border-white/10 shadow-lg shrink-0">
              <button
                onClick={onToggleBuilder}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all ${
                  showBuilder
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                title="Open Room Designer"
              >
                <Hammer className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Room Designer</span>
                <span className="hidden sm:inline md:hidden text-[11px]">Designer</span>
              </button>

              <button
                onClick={onToggleEnergy}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all ${
                  showEnergy
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                title="Electricity Analytics"
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Analytics</span>
                <span className="hidden sm:inline md:hidden text-[11px]">Energy</span>
              </button>

              <div className="w-px h-4 bg-white/10 mx-0.5" />

              {/* Eco mode quick trigger */}
              <button
                onClick={setEcoMode}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition-all"
                title="Eco Mode: Turns off heavy appliances like AC, heaters and ovens"
              >
                <Leaf className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Eco</span>
              </button>
            </div>
          )}

          {/* FPV Mode Header Button */}
          {viewMode === 'fpv' && (
            <div className="flex items-center gap-2">
              <button
                onClick={exitFPV}
                className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-white/20 backdrop-blur-md text-slate-100 px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all shadow-lg hover:shadow-cyan-500/10"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-400" />
                <span>Return to 3D</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Live Household Energy Stats & Database Status */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 pointer-events-auto shrink-0">
          {viewMode === 'fpv' && fpvRoom && (
            <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 rounded-2xl px-2.5 sm:px-3.5 py-1.5 flex items-center gap-2 shadow-lg">
              <span className="text-sm sm:text-base">{ROOM_ICONS[fpvRoom.type]}</span>
              <div>
                <div className="text-xs font-bold text-white leading-tight">{fpvRoom.name}</div>
                <div className="text-[9px] text-cyan-300 font-mono">Exploring in FPV</div>
              </div>
            </div>
          )}

          {/* Database Persistent Status */}
          <div
            className="hidden md:flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-2xl px-2.5 py-1.5 shadow-lg group relative cursor-pointer"
            title="Auto-saved to data/database.json and LocalStorage"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                dbSyncStatus === 'saving'
                  ? 'bg-amber-400 animate-ping'
                  : dbSyncStatus === 'error'
                  ? 'bg-rose-500'
                  : 'bg-emerald-400'
              }`}
            />
            <Database className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            <div className="text-[11px] font-mono leading-tight">
              <span className="text-slate-300 font-medium">
                {dbSyncStatus === 'saving' ? 'Saving...' : 'DB Synced'}
              </span>
              {lastSavedAt && (
                <span className="text-[9px] text-slate-500 block">
                  {lastSavedAt}
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-2xl px-2.5 sm:px-3.5 py-1.5 flex items-center gap-2 sm:gap-3 shadow-lg">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  homeStats.totalWatts > 0 ? 'bg-amber-400 shadow-md shadow-amber-400/50 animate-pulse' : 'bg-slate-600'
                }`}
              />
              <div>
                <div className="text-xs sm:text-sm font-bold text-amber-300 font-mono leading-tight">
                  {formatWatts(homeStats.totalWatts)}
                </div>
                <div className="text-[9px] text-slate-400 font-mono hidden sm:block">LIVE DRAW</div>
              </div>
            </div>

            <div className="w-px h-4 sm:h-5 bg-white/10" />

            <div>
              <div className="text-xs sm:text-sm font-bold text-emerald-400 font-mono leading-tight">
                ${homeStats.monthlyCost.toFixed(2)}
              </div>
              <div className="text-[9px] text-slate-400 font-mono hidden sm:block">EST. / MO</div>
            </div>
          </div>
        </div>
      </div>

      {/* FPV Crosshair & Interactive Appliance Reticle */}
      {viewMode === 'fpv' && (
        <>
          {/* Center Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className={`relative transition-all duration-200 ${hoveredAppliance ? 'scale-125' : 'scale-100'}`}>
              <div className={`w-3 h-3 rounded-full border-2 transition-colors ${hoveredAppliance ? 'border-amber-400 bg-amber-400/30' : 'border-white/70'}`} />
            </div>
          </div>

          {/* Interactive Appliance Hover Banner */}
          {hoveredAppliance && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
              <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-400/50 rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl">
                  {APPLIANCE_ICONS[hoveredAppliance.type]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      {APPLIANCE_LABELS[hoveredAppliance.type]}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        hoveredAppliance.isOn
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {hoveredAppliance.isOn ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div className="text-xs text-amber-300 font-mono mt-0.5">
                    Draw: {hoveredAppliance.isOn ? formatWatts(hoveredAppliance.wattage) : '0 W'} · Daily: {(hoveredAppliance.wattage * hoveredAppliance.hoursPerDay / 1000).toFixed(2)} kWh
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => toggleAppliance(hoveredAppliance.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                      hoveredAppliance.isOn
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    [E] {hoveredAppliance.isOn ? 'Turn OFF' : 'Turn ON'}
                  </button>

                  <button
                    onClick={() => selectAppliance(hoveredAppliance.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/20 text-white rounded-xl text-xs font-semibold transition-all"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FPV Controls Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="bg-slate-900/85 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-2.5 text-slate-300 text-xs flex items-center gap-4 shadow-xl">
              <div className="flex items-center gap-1.5">
                <kbd className="bg-white/10 px-2 py-1 rounded text-white font-mono font-bold text-[11px] border border-white/10">W</kbd>
                <kbd className="bg-white/10 px-2 py-1 rounded text-white font-mono font-bold text-[11px] border border-white/10">A</kbd>
                <kbd className="bg-white/10 px-2 py-1 rounded text-white font-mono font-bold text-[11px] border border-white/10">S</kbd>
                <kbd className="bg-white/10 px-2 py-1 rounded text-white font-mono font-bold text-[11px] border border-white/10">D</kbd>
                <span className="text-slate-400 font-medium">Walk</span>
              </div>
              <div className="w-px h-4 bg-white/15" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Mouse Look</span>
              </div>
              <div className="w-px h-4 bg-white/15" />
              <div className="flex items-center gap-1.5">
                <kbd className="bg-amber-400/20 text-amber-300 px-2 py-1 rounded font-mono font-bold text-[11px] border border-amber-400/30">E</kbd>
                <span className="text-amber-200 font-medium">Toggle Appliance</span>
              </div>
              <div className="w-px h-4 bg-white/15" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Click on Canvas to Lock Cursor</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Builder Mode Quick Action Deck (Smoothly centers in visible viewport, horizontally scrollable on mobile) */}
      {viewMode === 'builder' && (
        <div
          className="absolute bottom-3 sm:bottom-6 z-30 pointer-events-auto transition-all duration-300 ease-out max-w-[96vw]"
          style={{
            left: selectedRoomId ? 'calc(50% - 12rem)' : '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-2.5 sm:px-4 py-2 sm:py-2.5 shadow-2xl flex items-center gap-2 sm:gap-3 max-w-full">
            <span className="text-xs font-semibold text-slate-400 hidden xs:flex items-center gap-1.5 shrink-0">
              <Compass className="w-4 h-4 text-cyan-400" />
              Rooms:
            </span>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-[55vw] sm:max-w-none">
              {rooms.map((room) => {
                const roomApps = appliances.filter((a) => a.roomId === room.id);
                const roomWatts = roomApps.reduce((s, a) => (a.isOn ? s + a.wattage : s), 0);
                const isSelected = selectedRoomId === room.id;

                return (
                  <button
                    key={room.id}
                    onClick={() => {
                      selectRoom(room.id);
                      onSelectRoom?.(room.id);
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 rounded-xl border transition-all shrink-0 ${
                      isSelected
                        ? 'bg-cyan-500/25 border-cyan-400/60 shadow-md shadow-cyan-500/20 text-white'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
                    }`}
                    title={`Inspect & customize ${room.name}`}
                  >
                    <span>{ROOM_ICONS[room.type]}</span>
                    <span className="truncate max-w-[90px] sm:max-w-none">{room.name}</span>
                    <span className="text-[10px] font-mono text-amber-300 ml-0.5">
                      {roomWatts > 0 ? `${roomWatts}W` : '0W'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="w-px h-5 bg-white/10 mx-0.5 sm:mx-1 shrink-0" />

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={() => toggleAllAppliances(false)}
                className="px-2 sm:px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-medium transition-all"
                title="Turn off all appliances"
              >
                All Off
              </button>
              <button
                onClick={() => toggleAllAppliances(true)}
                className="px-2 sm:px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/20 rounded-xl text-xs font-medium transition-all"
                title="Turn on all appliances"
              >
                All On
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HUD;
