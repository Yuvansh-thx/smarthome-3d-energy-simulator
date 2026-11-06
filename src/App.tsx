// ============================================================
// SmartHome 3D Energy Manager — Root App
// Features Responsive Multi-Device Layout (PC, Laptop, Tablet, Phone)
// ============================================================

import React, { useCallback, useState, useEffect } from 'react';
import HomeScene from './components/HomeScene';
import HUD from './components/HUD';
import RoomBuilder from './components/RoomBuilder';
import EnergyDashboard from './components/EnergyDashboard';
import AppliancePanel from './components/AppliancePanel';
import RoomPanel from './components/RoomPanel';
import { useHomeStore } from './store/homeStore';
import { seedDemoHome } from './utils/homeHelpers';

export default function App() {
  const {
    selectAppliance,
    selectRoom,
    setViewMode,
    setFpvRoom,
    selectedApplianceId,
    selectedRoomId,
    viewMode,
    rooms,
    resetToDemoHome,
  } = useHomeStore();

  const [showBuilder, setShowBuilder] = useState(false);
  const [showEnergy, setShowEnergy] = useState(false);
  const [showAppliance, setShowAppliance] = useState(false);
  const [showRoom, setShowRoom] = useState(false);

  // Responsive display detection (PC, Laptop, Tablet, Mobile Phone)
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTabletOrLaptop = windowWidth >= 768 && windowWidth < 1200;
  const drawerWidth = isMobile ? 0 : isTabletOrLaptop ? 380 : 440;

  // Initialize and load database on mount
  useEffect(() => {
    let active = true;

    async function initializeDatabase() {
      const store = useHomeStore.getState();
      const hasDbRooms = await store.loadDatabase();
      if (!active) return;

      if (!hasDbRooms && store.rooms.length === 0) {
        // Initial first-time run: seed demo home and persist to data/database.json
        seedDemoHome();
        await store.persistCurrentState();
      }

      // Check URL query parameters for direct testing / preview
      const params = new URLSearchParams(window.location.search);
      if (params.get('panel') === 'energy') {
        setShowEnergy(true);
      } else if (params.get('panel') === 'builder') {
        setShowBuilder(true);
      } else if (params.get('panel') === 'appliance') {
        const firstApp = useHomeStore.getState().appliances[0];
        if (firstApp) {
          selectAppliance(firstApp.id);
          setShowAppliance(true);
        }
      } else if (params.get('panel') === 'room') {
        const firstRoom = useHomeStore.getState().rooms[0];
        if (firstRoom) {
          selectRoom(firstRoom.id);
          setShowRoom(true);
        }
      }

      // Guaranteed start in full 3D architectural overview
      store.setViewMode('builder');
      store.setFpvRoom(null);
      store.selectRoom(null);

      // Clean any legacy/stale query parameters that might have forced in-room FPV mode
      if (window.location.search.includes('mode=fpv') || window.location.search.includes('room=')) {
        const cleanParams = new URLSearchParams(window.location.search);
        cleanParams.delete('mode');
        cleanParams.delete('room');
        const cleanQuery = cleanParams.toString() ? `?${cleanParams.toString()}` : window.location.pathname;
        window.history.replaceState({}, '', cleanQuery);
      }
    }

    initializeDatabase();

    return () => {
      active = false;
    };
  }, [selectAppliance, selectRoom, setFpvRoom, setViewMode]);

  const handleApplianceClick = useCallback(
    (id: string) => {
      selectAppliance(id);
      setShowAppliance(true);
      setShowRoom(false);
      setShowEnergy(false);
      setShowBuilder(false);
    },
    [selectAppliance]
  );

  const handleRoomClick = useCallback(
    (id: string) => {
      selectRoom(id);
      setShowRoom(true);
      setShowAppliance(false);
      setShowEnergy(false);
      setShowBuilder(false);
    },
    [selectRoom]
  );

  const handleEnterFPV = useCallback(
    (roomId: string) => {
      setFpvRoom(roomId);
      setViewMode('fpv');
      setShowBuilder(false);
      setShowRoom(false);
      setShowAppliance(false);
      setShowEnergy(false);
    },
    [setFpvRoom, setViewMode]
  );

  const handleToggleEnergy = () => {
    setShowEnergy((prev) => !prev);
    setShowAppliance(false);
    setShowRoom(false);
    setShowBuilder(false);
  };

  const handleToggleBuilder = () => {
    setShowBuilder((prev) => !prev);
    setShowAppliance(false);
    setShowRoom(false);
    setShowEnergy(false);
  };

  const handleCloseAppliance = () => {
    setShowAppliance(false);
    selectAppliance(null);
  };

  const handleCloseRoom = () => {
    setShowRoom(false);
    selectRoom(null);
  };

  // Responsive 3D Canvas Offset:
  // On desktop / laptop, shifts the 3D home so open drawers don't block the rooms.
  // On mobile phone, 3D viewport remains full width with bottom-sheet drawers.
  const leftOffset = isMobile ? 0 : showBuilder && viewMode === 'builder' ? drawerWidth : 0;
  const rightOffset = isMobile
    ? 0
    : (showEnergy || (showRoom && selectedRoomId) || (showAppliance && selectedApplianceId)) &&
      viewMode === 'builder'
    ? drawerWidth
    : 0;

  // Render 3D Interactive Smart Home Environment
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D Scene Viewport with dynamic responsive bounds */}
      <div
        className="absolute top-0 bottom-0 transition-all duration-300 ease-out"
        style={{
          left: `${leftOffset}px`,
          right: `${rightOffset}px`,
        }}
      >
        <HomeScene
          onApplianceClick={handleApplianceClick}
          onRoomClick={handleRoomClick}
          onEnterFPV={handleEnterFPV}
        />
      </div>

      {/* Responsive HUD overlay */}
      <HUD
        onToggleEnergy={handleToggleEnergy}
        onToggleBuilder={handleToggleBuilder}
        onLoadDemo={() => resetToDemoHome(seedDemoHome)}
        showEnergy={showEnergy}
        showBuilder={showBuilder}
        onSelectRoom={handleRoomClick}
      />

      {/* Responsive side panels / bottom sheets */}
      {showBuilder && viewMode === 'builder' && (
        <RoomBuilder onClose={() => setShowBuilder(false)} onEnterFPV={handleEnterFPV} />
      )}

      {showEnergy && viewMode === 'builder' && (
        <EnergyDashboard onClose={() => setShowEnergy(false)} />
      )}

      {showAppliance && selectedApplianceId && (
        <AppliancePanel onClose={handleCloseAppliance} />
      )}

      {showRoom && selectedRoomId && (
        <RoomPanel
          onClose={handleCloseRoom}
          onSelectAppliance={handleApplianceClick}
          onEnterFPV={handleEnterFPV}
        />
      )}
    </div>
  );
}
