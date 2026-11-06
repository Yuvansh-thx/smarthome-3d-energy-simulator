// ============================================================
// Smart Home 3D — Three.js Scene Engine
// ============================================================

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useHomeStore } from '../store/homeStore';
import type { Room, Appliance, ApplianceType } from '../types';
import {
  GRID_CELL_SIZE,
  APPLIANCE_LABELS,
  APPLIANCE_ICONS,
  ROOM_ICONS,
} from '../utils/constants';
import { getRoomOrigin, getHouseCenterAndRadius } from '../utils/homeHelpers';
import { buildApplianceMesh, APPLIANCE_COLOR } from '../utils/appliance3D';

function getApplianceLabelHeight(type: ApplianceType, roomHeight: number): number {
  switch (type) {
    case 'light-bulb': return roomHeight - 1.05;
    case 'ceiling-fan': return roomHeight - 0.65;
    case 'ac': return roomHeight - 0.95;
    case 'refrigerator': return 2.15;
    case 'tv': return 1.95;
    case 'computer': return 1.6;
    case 'oven': return 1.25;
    case 'microwave': return 1.45;
    case 'washing-machine': return 1.15;
    case 'heater': return 0.95;
    case 'dishwasher': return 1.15;
    case 'water-heater': return 1.45;
    default: return 1.5;
  }
}

// ============================================================
// Procedural Furniture Generator per Room Type
// ============================================================
function buildRoomFurniture(room: Room, group: THREE.Group) {
  const { width, depth } = room;
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
  const fabricMat = new THREE.MeshLambertMaterial({ color: 0x3B82F6 });
  const whiteMat = new THREE.MeshLambertMaterial({ color: 0xF8FAFC });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x1E293B });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x93C5FD, transparent: true, opacity: 0.6 });
  const plantMat = new THREE.MeshLambertMaterial({ color: 0x15803D });

  switch (room.type) {
    case 'bedroom': {
      // 1. Double Bed
      const bedGroup = new THREE.Group();
      bedGroup.position.set(0, 0, -depth / 2 + 2.2);

      const frameGeo = new THREE.BoxGeometry(2.4, 0.4, 2.6);
      const frame = new THREE.Mesh(frameGeo, woodMat);
      frame.position.y = 0.2;
      bedGroup.add(frame);

      const headboardGeo = new THREE.BoxGeometry(2.5, 1.4, 0.2);
      const headboard = new THREE.Mesh(headboardGeo, woodMat);
      headboard.position.set(0, 0.7, -1.25);
      bedGroup.add(headboard);

      const matGeo = new THREE.BoxGeometry(2.2, 0.45, 2.4);
      const matMesh = new THREE.Mesh(matGeo, whiteMat);
      matMesh.position.y = 0.55;
      bedGroup.add(matMesh);

      const pillowGeo = new THREE.BoxGeometry(0.7, 0.15, 0.45);
      const p1 = new THREE.Mesh(pillowGeo, whiteMat);
      p1.position.set(-0.55, 0.8, -0.85);
      const p2 = new THREE.Mesh(pillowGeo, whiteMat);
      p2.position.set(0.55, 0.8, -0.85);
      bedGroup.add(p1, p2);

      const blanketGeo = new THREE.BoxGeometry(2.22, 0.46, 1.6);
      const blanket = new THREE.Mesh(blanketGeo, fabricMat);
      blanket.position.set(0, 0.56, 0.35);
      bedGroup.add(blanket);

      group.add(bedGroup);

      // 2. Nightstands
      [-1.7, 1.7].forEach((xPos) => {
        const stand = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.6), woodMat);
        stand.position.set(xPos, 0.3, -depth / 2 + 1.2);
        group.add(stand);

        const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.3, 8), darkMat);
        lampBase.position.set(xPos, 0.75, -depth / 2 + 1.2);
        const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.25, 8), new THREE.MeshLambertMaterial({ color: 0xFEF08A }));
        lampShade.position.set(xPos, 0.95, -depth / 2 + 1.2);
        group.add(lampBase, lampShade);
      });

      // 3. Bedroom Rug
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.2), new THREE.MeshLambertMaterial({ color: 0xCBD5E1 }));
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(0, 0.015, 0.5);
      group.add(rug);

      // 4. Wardrobe
      const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.4, 0.7), woodMat);
      wardrobe.position.set(width / 2 - 0.5, 1.2, 0);
      wardrobe.rotation.y = -Math.PI / 2;
      group.add(wardrobe);
      break;
    }

    case 'living-room': {
      // 1. Modern Sectional / Sofa
      const sofaGroup = new THREE.Group();
      sofaGroup.position.set(0, 0, 1.5);

      const seat = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.45, 1.1), new THREE.MeshLambertMaterial({ color: 0x1E3A8A }));
      seat.position.y = 0.3;
      sofaGroup.add(seat);

      const back = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.75, 0.3), new THREE.MeshLambertMaterial({ color: 0x1E3A8A }));
      back.position.set(0, 0.75, 0.4);
      sofaGroup.add(back);

      [-1.65, 1.65].forEach((ax) => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.65, 1.1), new THREE.MeshLambertMaterial({ color: 0x1E3A8A }));
        arm.position.set(ax, 0.55, 0);
        sofaGroup.add(arm);
      });

      [-0.8, 0.8].forEach((cx) => {
        const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.15), new THREE.MeshLambertMaterial({ color: 0x38BDF8 }));
        cushion.position.set(cx, 0.65, 0.25);
        cushion.rotation.x = 0.2;
        sofaGroup.add(cushion);
      });
      group.add(sofaGroup);

      // 2. Coffee Table
      const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.9), woodMat);
      tableTop.position.set(0, 0.4, 0);
      const tableLegs = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.38, 8), darkMat);
      [-0.75, 0.75].forEach((lx) => {
        [-0.35, 0.35].forEach((lz) => {
          const leg = tableLegs.clone();
          leg.position.set(lx, 0.19, lz);
          group.add(leg);
        });
      });
      group.add(tableTop);

      // 3. Living Room Rug
      const livingRug = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.2), new THREE.MeshLambertMaterial({ color: 0x64748B }));
      livingRug.rotation.x = -Math.PI / 2;
      livingRug.position.set(0, 0.015, 0.6);
      group.add(livingRug);

      // 4. TV Stand / Media Console against North wall
      const tvStand = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.55, 0.55), darkMat);
      tvStand.position.set(0, 0.275, -depth / 2 + 0.4);
      group.add(tvStand);

      // 5. Houseplant
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.18, 0.5, 12), whiteMat);
      pot.position.set(-width / 2 + 0.9, 0.25, -depth / 2 + 0.9);
      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 1), plantMat);
      foliage.position.set(-width / 2 + 0.9, 0.75, -depth / 2 + 0.9);
      group.add(pot, foliage);
      break;
    }

    case 'kitchen': {
      // 1. Kitchen Counter
      const nCounter = new THREE.Mesh(new THREE.BoxGeometry(width - 1.2, 0.9, 0.75), darkMat);
      nCounter.position.set(0.4, 0.45, -depth / 2 + 0.45);
      const nTop = new THREE.Mesh(new THREE.BoxGeometry(width - 1.1, 0.08, 0.82), whiteMat);
      nTop.position.set(0.4, 0.92, -depth / 2 + 0.45);
      group.add(nCounter, nTop);

      // Sink basin on North counter
      const sink = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.45), new THREE.MeshLambertMaterial({ color: 0x94A3B8 }));
      sink.position.set(-0.8, 0.94, -depth / 2 + 0.45);
      const faucet = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8), new THREE.MeshLambertMaterial({ color: 0xE2E8F0 }));
      faucet.position.set(-0.8, 1.05, -depth / 2 + 0.25);
      group.add(sink, faucet);

      // 2. Dining / Island Table
      const island = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 0.9), woodMat);
      island.position.set(0, 0.45, 1.2);
      const islandTop = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.08, 1.05), whiteMat);
      islandTop.position.set(0, 0.92, 1.2);
      group.add(island, islandTop);

      // Bar stools
      [-0.6, 0.6].forEach((sx) => {
        const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 12), darkMat);
        stoolSeat.position.set(sx, 0.65, 2.0);
        const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 8), new THREE.MeshLambertMaterial({ color: 0x64748B }));
        stoolLeg.position.set(sx, 0.325, 2.0);
        group.add(stoolSeat, stoolLeg);
      });
      break;
    }

    case 'study': {
      // 1. Executive Desk
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.0), woodMat);
      deskTop.position.set(0, 0.74, -depth / 2 + 1.2);
      const deskSides = [
        new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.9), darkMat),
        new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.9), darkMat),
      ];
      deskSides[0].position.set(-1.0, 0.36, -depth / 2 + 1.2);
      deskSides[1].position.set(1.0, 0.36, -depth / 2 + 1.2);
      group.add(deskTop, deskSides[0], deskSides[1]);

      // 2. Office Chair
      const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.5), darkMat);
      chairSeat.position.set(0, 0.48, -depth / 2 + 2.0);
      const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.08), darkMat);
      chairBack.position.set(0, 0.8, -depth / 2 + 2.25);
      const chairStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), new THREE.MeshLambertMaterial({ color: 0x94A3B8 }));
      chairStem.position.set(0, 0.23, -depth / 2 + 2.0);
      group.add(chairSeat, chairBack, chairStem);

      // 3. Bookshelf along East wall
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 1.8), woodMat);
      shelf.position.set(width / 2 - 0.3, 1.1, 0);
      group.add(shelf);

      const bookColors = [0xEF4444, 0x3B82F6, 0x10B981, 0xF59E0B];
      for (let b = 0; b < 6; b++) {
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.3, 0.08),
          new THREE.MeshLambertMaterial({ color: bookColors[b % bookColors.length] })
        );
        book.position.set(width / 2 - 0.3, 0.8 + (b % 3) * 0.45, -0.6 + b * 0.18);
        group.add(book);
      }

      // 4. Study Rug
      const studyRug = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.4), new THREE.MeshLambertMaterial({ color: 0x475569 }));
      studyRug.rotation.x = -Math.PI / 2;
      studyRug.position.set(0, 0.015, -depth / 2 + 1.8);
      group.add(studyRug);
      break;
    }

    case 'bathroom': {
      const vanity = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.55), whiteMat);
      vanity.position.set(-width / 2 + 0.8, 0.4, -depth / 2 + 0.4);
      const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8), glassMat);
      mirror.position.set(-width / 2 + 0.8, 1.4, -depth / 2 + 0.15);
      group.add(vanity, mirror);

      const toiletBase = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 0.65), whiteMat);
      toiletBase.position.set(width / 2 - 0.6, 0.21, -depth / 2 + 0.5);
      const cistern = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.25), whiteMat);
      cistern.position.set(width / 2 - 0.6, 0.65, -depth / 2 + 0.2);
      group.add(toiletBase, cistern);

      const tub = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 0.75), whiteMat);
      tub.position.set(0, 0.275, depth / 2 - 0.6);
      group.add(tub);
      break;
    }
  }
}

// ============================================================
// Room Meshes (Walls, Floor, Cutaway in Builder view)
// ============================================================
function buildRoomStructure(room: Room, roomGroup: THREE.Group) {
  const { width, depth, height } = room;
  const wallColor = new THREE.Color(room.wallColor);
  const floorColor = new THREE.Color(room.floorColor);
  const ceilingColor = new THREE.Color(room.ceilingColor);

  // Floor
  const floorGeo = new THREE.PlaneGeometry(width, depth);
  const floorMat = new THREE.MeshLambertMaterial({ color: floorColor });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.userData = { type: 'floor', roomId: room.id };
  roomGroup.add(floor);

  // Ceiling
  const ceilGeo = new THREE.PlaneGeometry(width, depth);
  const ceilMat = new THREE.MeshLambertMaterial({ color: ceilingColor, side: THREE.BackSide });
  const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  ceiling.visible = false; // default builder mode: hidden
  ceiling.userData = { type: 'ceiling', roomId: room.id };
  roomGroup.add(ceiling);

  const wallMat = new THREE.MeshLambertMaterial({ color: wallColor, side: THREE.DoubleSide });

  // North Wall (Back) - always full height
  const northWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMat);
  northWall.position.set(0, height / 2, -depth / 2);
  northWall.userData = { type: 'wall', roomId: room.id };
  roomGroup.add(northWall);

  // West Wall (Left) - always full height
  const westWall = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), wallMat);
  westWall.position.set(-width / 2, height / 2, 0);
  westWall.rotation.y = Math.PI / 2;
  westWall.userData = { type: 'wall', roomId: room.id };
  roomGroup.add(westWall);

  // South Wall (Front)
  // Low cutaway for Builder mode
  const southWallCutaway = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.9), wallMat);
  southWallCutaway.position.set(0, 0.45, depth / 2);
  southWallCutaway.rotation.y = Math.PI;
  southWallCutaway.userData = { type: 'wall', roomId: room.id };
  roomGroup.add(southWallCutaway);

  // Full height with doorway for FPV mode
  const southWallFull = new THREE.Group();
  const sSideWidth = (width - 1.4) / 2;
  const sLeft = new THREE.Mesh(new THREE.PlaneGeometry(sSideWidth, height), wallMat);
  sLeft.position.set(-width / 2 + sSideWidth / 2, height / 2, depth / 2);
  sLeft.rotation.y = Math.PI;

  const sRight = new THREE.Mesh(new THREE.PlaneGeometry(sSideWidth, height), wallMat);
  sRight.position.set(width / 2 - sSideWidth / 2, height / 2, depth / 2);
  sRight.rotation.y = Math.PI;

  const sLintel = new THREE.Mesh(new THREE.PlaneGeometry(1.4, height - 2.3), wallMat);
  sLintel.position.set(0, height - (height - 2.3) / 2, depth / 2);
  sLintel.rotation.y = Math.PI;

  southWallFull.add(sLeft, sRight, sLintel);
  southWallFull.visible = false;
  roomGroup.add(southWallFull);

  // East Wall (Right)
  // Low cutaway for Builder mode
  const eastWallCutaway = new THREE.Mesh(new THREE.PlaneGeometry(depth, 0.9), wallMat);
  eastWallCutaway.position.set(width / 2, 0.45, 0);
  eastWallCutaway.rotation.y = -Math.PI / 2;
  eastWallCutaway.userData = { type: 'wall', roomId: room.id };
  roomGroup.add(eastWallCutaway);

  // Full height with doorway for FPV mode
  const eastWallFull = new THREE.Group();
  const eSideWidth = (depth - 1.4) / 2;
  const eLeft = new THREE.Mesh(new THREE.PlaneGeometry(eSideWidth, height), wallMat);
  eLeft.position.set(width / 2, height / 2, -depth / 2 + eSideWidth / 2);
  eLeft.rotation.y = -Math.PI / 2;

  const eRight = new THREE.Mesh(new THREE.PlaneGeometry(eSideWidth, height), wallMat);
  eRight.position.set(width / 2, height / 2, depth / 2 - eSideWidth / 2);
  eRight.rotation.y = -Math.PI / 2;

  const eLintel = new THREE.Mesh(new THREE.PlaneGeometry(1.4, height - 2.3), wallMat);
  eLintel.position.set(width / 2, height - (height - 2.3) / 2, 0);
  eLintel.rotation.y = -Math.PI / 2;

  eastWallFull.add(eLeft, eRight, eLintel);
  eastWallFull.visible = false;
  roomGroup.add(eastWallFull);

  // Room outline edges (Vibrant Cyan Architectural Frame)
  const outlineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth));
  const outlineMat = new THREE.LineBasicMaterial({ color: 0x38BDF8, linewidth: 2 });
  const outline = new THREE.LineSegments(outlineGeo, outlineMat);
  outline.position.y = height / 2;
  outline.userData = { type: 'outline', roomId: room.id };
  roomGroup.add(outline);

  // Architectural Room Foundation Plinth
  const plinthGeo = new THREE.BoxGeometry(width + 0.12, 0.12, depth + 0.12);
  const plinthMat = new THREE.MeshLambertMaterial({ color: 0x1E293B });
  const plinth = new THREE.Mesh(plinthGeo, plinthMat);
  plinth.position.y = -0.06;
  plinth.userData = { type: 'floor', roomId: room.id };
  roomGroup.add(plinth);

  // Furniture group
  const furnitureGroup = new THREE.Group();
  buildRoomFurniture(room, furnitureGroup);
  roomGroup.add(furnitureGroup);

  // Appliances container (DEDICATED group for appliances inside this room)
  const appliancesContainer = new THREE.Group();
  appliancesContainer.userData = { type: 'appliancesContainer' };
  roomGroup.add(appliancesContainer);

  // Save references on roomGroup.userData for dynamic toggles
  roomGroup.userData = {
    ...roomGroup.userData,
    ceiling,
    outline,
    southWallCutaway,
    southWallFull,
    eastWallCutaway,
    eastWallFull,
    furnitureGroup,
    appliancesContainer,
  };
}

// ============================================================
// Appliance 3D Models (Delegated to appliance3D.ts)
// ============================================================
function createRoomApplianceMesh(appliance: Appliance, room: Room): THREE.Group {
  const group = buildApplianceMesh(appliance.type, appliance.isOn, room.height);
  group.userData = { type: "appliance", applianceId: appliance.id, roomId: room.id };
  group.position.set(appliance.localX, 0, appliance.localZ);
  group.rotation.y = THREE.MathUtils.degToRad(appliance.rotation);
  return group;
}

// ---- Canvas Floating Label Sprite ----// ---- Canvas Floating Label Sprite ----
function makeLabel(text: string, icon: string, isHovered: boolean, isOn: boolean): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 80;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = isHovered ? 'rgba(234, 179, 8, 0.88)' : 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = isOn ? 'rgba(34, 197, 94, 0.85)' : 'rgba(239, 68, 68, 0.85)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(4, 4, 312, 72, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isHovered ? '#0F172A' : '#FFFFFF';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${icon} ${text}`, 160, 40);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.6, 0.4, 1);
  return sprite;
}

// ---- Room Name Overhead Banner ----
function makeRoomLabel(
  name: string,
  icon: string,
  isSelected = false,
  watts = 0,
  count = 0
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 540;
  canvas.height = 110;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = isSelected ? '#F59E0B' : 'rgba(56, 189, 248, 0.75)';
  ctx.lineWidth = isSelected ? 6 : 4;
  ctx.beginPath();
  ctx.roundRect(6, 6, 528, 98, 20);
  ctx.fill();
  ctx.stroke();

  // Header: Icon + Room Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${icon}  ${name}`, 270, 16);

  // Subtitle: Power Draw & Device Count
  ctx.fillStyle = isSelected ? '#FBBF24' : '#38BDF8';
  ctx.font = '600 20px monospace';
  ctx.fillText(`⚡ ${watts}W · ${count} Devices · Click to Edit`, 270, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(4.0, 0.82, 1);
  return sprite;
}

// ============================================================
// Main HomeScene Component
// ============================================================

interface HomeSceneProps {
  onApplianceClick: (id: string) => void;
  onRoomClick: (id: string) => void;
  onEnterFPV: (roomId: string) => void;
}

const HomeScene: React.FC<HomeSceneProps> = ({ onApplianceClick, onRoomClick, onEnterFPV }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const roomGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const applianceGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const animFrameRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());

  const fpvControlsRef = useRef<{
    forward: boolean; back: boolean; left: boolean; right: boolean;
    yaw: number; pitch: number;
    enabled: boolean;
    isMouseDown: boolean;
    lastMouseX: number;
    lastMouseY: number;
  }>({
    forward: false, back: false, left: false, right: false,
    yaw: 0, pitch: 0, enabled: false,
    isMouseDown: false, lastMouseX: 0, lastMouseY: 0,
  });

  const raycasterRef = useRef(new THREE.Raycaster());

  const {
    rooms, appliances, viewMode, fpvRoomId,
    selectedRoomId, selectedApplianceId, hoveredApplianceId,
    setHoveredAppliance, toggleAppliance,
  } = useHomeStore();

  // ---- Scene Setup ----
  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0A0F1D);
    scene.fog = new THREE.FogExp2(0x0A0F1D, 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      55,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      300
    );
    cameraRef.current = camera;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff8e7, 1.4);
    sun.position.set(40, 60, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 150;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    scene.add(sun);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.4);
    fillLight.position.set(-30, 20, -30);
    scene.add(fillLight);

    // Ground Floor
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x0D1527 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    ground.userData = { type: 'ground' };
    scene.add(ground);

    // Architectural Grid
    const grid = new THREE.GridHelper(160, 40, 0x1E293B, 0x0F172A);
    grid.position.y = 0.005;
    grid.userData = { type: 'grid' };
    scene.add(grid);

    // Hallway Connector Floor between rooms
    const hallwayGeo = new THREE.PlaneGeometry(24, 24);
    const hallwayMat = new THREE.MeshLambertMaterial({ color: 0x1E293B });
    const hallway = new THREE.Mesh(hallwayGeo, hallwayMat);
    hallway.rotation.x = -Math.PI / 2;
    hallway.position.set(6, 0.005, 6);
    hallway.userData = { type: 'hallway' };
    scene.add(hallway);

    // Orbit State (Builder View — always starts in full 3D house overview)
    const initialBounds = getHouseCenterAndRadius(useHomeStore.getState().rooms);
    let orbitState = {
      isDragging: false,
      lastX: 0,
      lastY: 0,
      theta: Math.PI / 4,
      phi: Math.PI / 3.4,
      radius: initialBounds.radius,
      target: initialBounds.center,
    };

    const updateOrbitCamera = () => {
      const { theta, phi, radius, target } = orbitState;
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.sin(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(target);
    };
    updateOrbitCamera();

    const ro = new ResizeObserver(() => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(canvasRef.current);

    // Mouse handlers
    const onMouseDown = (e: MouseEvent) => {
      if (fpvControlsRef.current.enabled) {
        fpvControlsRef.current.isMouseDown = true;
        fpvControlsRef.current.lastMouseX = e.clientX;
        fpvControlsRef.current.lastMouseY = e.clientY;
        return;
      }
      orbitState.isDragging = true;
      orbitState.lastX = e.clientX;
      orbitState.lastY = e.clientY;
    };

    const onMouseUp = () => {
      orbitState.isDragging = false;
      fpvControlsRef.current.isMouseDown = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (fpvControlsRef.current.enabled) {
        // Supports both pointer lock (movementX) and drag look (clientX delta)
        const isPointerLocked = document.pointerLockElement === renderer.domElement;
        if (isPointerLocked) {
          fpvControlsRef.current.yaw -= e.movementX * 0.0024;
          fpvControlsRef.current.pitch = Math.max(
            -Math.PI / 2.5,
            Math.min(Math.PI / 2.5, fpvControlsRef.current.pitch - e.movementY * 0.0024)
          );
        } else if (fpvControlsRef.current.isMouseDown) {
          const dx = e.clientX - fpvControlsRef.current.lastMouseX;
          const dy = e.clientY - fpvControlsRef.current.lastMouseY;
          fpvControlsRef.current.yaw -= dx * 0.0035;
          fpvControlsRef.current.pitch = Math.max(
            -Math.PI / 2.5,
            Math.min(Math.PI / 2.5, fpvControlsRef.current.pitch - dy * 0.0035)
          );
          fpvControlsRef.current.lastMouseX = e.clientX;
          fpvControlsRef.current.lastMouseY = e.clientY;
        }
        return;
      }

      if (orbitState.isDragging) {
        const dx = e.clientX - orbitState.lastX;
        const dy = e.clientY - orbitState.lastY;
        orbitState.theta -= dx * 0.004;
        orbitState.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, orbitState.phi + dy * 0.004));
        orbitState.lastX = e.clientX;
        orbitState.lastY = e.clientY;
        updateOrbitCamera();
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (fpvControlsRef.current.enabled) return;
      orbitState.radius = Math.max(8, Math.min(80, orbitState.radius + e.deltaY * 0.04));
      updateOrbitCamera();
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel);

    // Keyboard (WASD & E key)
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') fpvControlsRef.current.forward = true;
      if (k === 's' || k === 'arrowdown') fpvControlsRef.current.back = true;
      if (k === 'a' || k === 'arrowleft') fpvControlsRef.current.left = true;
      if (k === 'd' || k === 'arrowright') fpvControlsRef.current.right = true;

      // Q and E keys can also turn camera in FPV
      if (fpvControlsRef.current.enabled) {
        if (k === 'q') fpvControlsRef.current.yaw += 0.06;
      }

      // E Key toggles hovered appliance in FPV!
      if (k === 'e') {
        const hovered = useHomeStore.getState().hoveredApplianceId;
        if (hovered) {
          toggleAppliance(hovered);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') fpvControlsRef.current.forward = false;
      if (k === 's' || k === 'arrowdown') fpvControlsRef.current.back = false;
      if (k === 'a' || k === 'arrowleft') fpvControlsRef.current.left = false;
      if (k === 'd' || k === 'arrowright') fpvControlsRef.current.right = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Click Raycast Handler
    const onClick = (e: MouseEvent) => {
      if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;

      if (fpvControlsRef.current.enabled && document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock?.();
      }

      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycasterRef.current.setFromCamera(mouse, cameraRef.current);
      const objects: THREE.Object3D[] = [];
      sceneRef.current.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite) objects.push(obj);
      });
      const hits = raycasterRef.current.intersectObjects(objects, true);
      for (const hit of hits) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          if (obj.userData.type === 'appliance') {
            onApplianceClick(obj.userData.applianceId);
            return;
          }
          if (
            obj.userData.type === 'floor' ||
            obj.userData.type === 'wall' ||
            obj.userData.type === 'roomLabel' ||
            obj.userData.type === 'room'
          ) {
            if (obj.userData.roomId) {
              onRoomClick(obj.userData.roomId);
              return;
            }
          }
          obj = obj.parent;
        }
      }
    };
    renderer.domElement.addEventListener('click', onClick);

    // Animation Loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();

      // 1. Animate Fan Blades
      sceneRef.current?.traverse((obj) => {
        if (obj.userData.isFanRotator) {
          const parentGroup = obj.parent;
          if (parentGroup?.userData.type === 'appliance') {
            const applianceId = parentGroup.userData.applianceId;
            const appliance = useHomeStore.getState().appliances.find((a) => a.id === applianceId);
            if (appliance?.isOn) {
              obj.rotation.y += delta * 7.5;
            }
          }
        }
      });

      // 2. FPV Movement & Reticle Raycast
      if (fpvControlsRef.current.enabled && cameraRef.current) {
        const speed = 4.2 * delta;
        const { yaw, pitch, forward, back, left, right } = fpvControlsRef.current;
        const dir = new THREE.Vector3(
          (right ? 1 : 0) - (left ? 1 : 0),
          0,
          (back ? 1 : 0) - (forward ? 1 : 0)
        );
        dir.applyEuler(new THREE.Euler(0, yaw, 0));
        dir.normalize().multiplyScalar(speed);
        cameraRef.current.position.add(dir);

        // Keep player at eye height
        cameraRef.current.position.y = 1.6;

        cameraRef.current.rotation.order = 'YXZ';
        cameraRef.current.rotation.y = yaw;
        cameraRef.current.rotation.x = pitch;

        // Reticle Raycast from center of screen (0, 0)
        raycasterRef.current.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);
        const meshes: THREE.Object3D[] = [];
        sceneRef.current?.traverse((o) => {
          if (o instanceof THREE.Mesh) meshes.push(o);
        });
        const centerHits = raycasterRef.current.intersectObjects(meshes, true);
        let foundHover: string | null = null;
        for (const ch of centerHits) {
          if (ch.distance > 5.5) break; // reach distance limit
          let p: THREE.Object3D | null = ch.object;
          while (p) {
            if (p.userData.type === 'appliance') {
              foundHover = p.userData.applianceId;
              break;
            }
            p = p.parent;
          }
          if (foundHover) break;
        }
        if (useHomeStore.getState().hoveredApplianceId !== foundHover) {
          setHoveredAppliance(foundHover);
        }
      }

      // Keep canvas synchronized with transition-based container resizing
      if (canvasRef.current) {
        const w = canvasRef.current.clientWidth;
        const h = canvasRef.current.clientHeight;
        if (w > 0 && h > 0) {
          const pixelRatio = renderer.getPixelRatio();
          if (
            renderer.domElement.width !== Math.floor(w * pixelRatio) ||
            renderer.domElement.height !== Math.floor(h * pixelRatio)
          ) {
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
          }
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.dispose();
      canvasRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // ---- Sync Rooms (Dynamic Creation & Live Updates) ----
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const existingIds = new Set(roomGroupsRef.current.keys());

    rooms.forEach((room) => {
      existingIds.delete(room.id);

      let group = roomGroupsRef.current.get(room.id);
      const isSelected = room.id === selectedRoomId;
      const roomApps = appliances.filter((a) => a.roomId === room.id);
      const roomWatts = roomApps.reduce((s, a) => (a.isOn ? s + a.wattage : s), 0);
      const roomConfigHash = `${room.name}_${room.type}_${room.width}_${room.depth}_${room.wallColor}_${room.floorColor}_${isSelected}_${roomWatts}_${roomApps.length}`;

      if (!group) {
        // Create new room structure
        group = new THREE.Group();
        group.userData = { type: 'room', roomId: room.id, lastHash: roomConfigHash, roomMeta: { ...room } };
        const origin = getRoomOrigin(room);
        group.position.copy(origin);

        buildRoomStructure(room, group);

        // Room name banner for builder view
        const label = makeRoomLabel(room.name, ROOM_ICONS[room.type] || '🏠', isSelected, roomWatts, roomApps.length);
        label.position.set(0, room.height + 0.95, 0);
        label.userData = { type: 'roomLabel', roomId: room.id };
        group.add(label);
        group.userData.roomLabel = label;

        scene.add(group);
        roomGroupsRef.current.set(room.id, group);
      } else if (group.userData.lastHash !== roomConfigHash) {
        // Update existing room
        group.userData.lastHash = roomConfigHash;
        const origin = getRoomOrigin(room);
        group.position.copy(origin);

        const oldRoom = group.userData.roomMeta as Room | undefined;
        const needsFullRebuild =
          !oldRoom ||
          oldRoom.width !== room.width ||
          oldRoom.depth !== room.depth ||
          oldRoom.type !== room.type;

        if (needsFullRebuild) {
          // Rebuild structure while preserving appliancesContainer
          const appliancesContainer = group.userData.appliancesContainer as THREE.Group | undefined;
          if (appliancesContainer) group.remove(appliancesContainer);

          // Clear previous children
          while (group.children.length > 0) {
            group.remove(group.children[0]);
          }

          buildRoomStructure(room, group);

          // Re-attach appliancesContainer
          if (appliancesContainer) {
            group.add(appliancesContainer);
            group.userData.appliancesContainer = appliancesContainer;
          }
        } else {
          // Live Material Updates (wallColor & floorColor)
          const wallCol = new THREE.Color(room.wallColor);
          const floorCol = new THREE.Color(room.floorColor);

          group.traverse((c) => {
            if (c instanceof THREE.Mesh) {
              if (c.userData.type === 'floor') {
                (c.material as THREE.MeshLambertMaterial).color.copy(floorCol);
              } else if (c.userData.type === 'wall') {
                (c.material as THREE.MeshLambertMaterial).color.copy(wallCol);
              }
            }
          });
        }

        // Update Outline Highlight
        const outline = group.userData.outline as THREE.LineSegments | undefined;
        if (outline && outline.material instanceof THREE.LineBasicMaterial) {
          outline.material.color.set(isSelected ? 0xF59E0B : 0x38BDF8);
        }

        // Recreate roomLabel banner
        if (group.userData.roomLabel) {
          group.remove(group.userData.roomLabel);
        }
        const label = makeRoomLabel(room.name, ROOM_ICONS[room.type] || '🏠', isSelected, roomWatts, roomApps.length);
        label.position.set(0, room.height + 0.95, 0);
        label.userData = { type: 'roomLabel', roomId: room.id };
        label.visible = viewMode === 'builder';
        group.add(label);
        group.userData.roomLabel = label;

        group.userData.roomMeta = { ...room };
      }
    });

    // Cleanup deleted rooms
    existingIds.forEach((id) => {
      const g = roomGroupsRef.current.get(id);
      if (g) {
        scene.remove(g);
        roomGroupsRef.current.delete(id);
      }
    });
  }, [rooms, appliances, selectedRoomId, viewMode]);

  // ---- Dynamic ViewMode Toggles (Ceilings, Walls, Labels without rebuilding rooms) ----
  useEffect(() => {
    const isFpv = viewMode === 'fpv';

    roomGroupsRef.current.forEach((roomGroup) => {
      const {
        ceiling,
        outline,
        roomLabel,
        southWallCutaway,
        southWallFull,
        eastWallCutaway,
        eastWallFull,
      } = roomGroup.userData;

      if (ceiling) ceiling.visible = isFpv;
      if (outline) outline.visible = !isFpv;
      if (roomLabel) roomLabel.visible = !isFpv;

      if (southWallCutaway) southWallCutaway.visible = !isFpv;
      if (southWallFull) southWallFull.visible = isFpv;

      if (eastWallCutaway) eastWallCutaway.visible = !isFpv;
      if (eastWallFull) eastWallFull.visible = isFpv;
    });

    // Toggle grid and hallway
    sceneRef.current?.traverse((obj) => {
      if (obj.userData.type === 'grid') obj.visible = !isFpv;
      if (obj.userData.type === 'hallway') obj.visible = isFpv;
    });
  }, [viewMode]);

  // ---- Sync Appliances (Always attached inside room's appliancesContainer) ----
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const existingIds = new Set(applianceGroupsRef.current.keys());

    appliances.forEach((appliance) => {
      existingIds.delete(appliance.id);

      const old = applianceGroupsRef.current.get(appliance.id);
      if (old) {
        old.parent?.remove(old);
      }

      const room = rooms.find((r) => r.id === appliance.roomId);
      if (!room) return;

      const appGroup = createRoomApplianceMesh(appliance, room);

      // Floating wattage badge
      const isSelected = appliance.id === selectedApplianceId;
      const isHovered = appliance.id === hoveredApplianceId;
      const labelText = `${APPLIANCE_LABELS[appliance.type]} · ${appliance.wattage}W`;
      const icon = APPLIANCE_ICONS[appliance.type] || '⚡';
      const label = makeLabel(labelText, icon, isHovered || isSelected, appliance.isOn);
      label.position.y = getApplianceLabelHeight(appliance.type, room.height);
      label.userData = { type: 'applianceLabel' };
      label.visible = viewMode === 'builder' || appliance.roomId === fpvRoomId;
      appGroup.add(label);

      // Gold highlight if selected or hovered
      if (isSelected || isHovered) {
        appGroup.traverse((c) => {
          if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshLambertMaterial) {
            c.material.emissive = new THREE.Color(0xF59E0B);
            c.material.emissiveIntensity = 0.55;
          }
        });
      }

      // Add to room's appliancesContainer (or directly to roomGroup)
      const roomGroup = roomGroupsRef.current.get(room.id);
      if (roomGroup) {
        const container = roomGroup.userData.appliancesContainer || roomGroup;
        container.add(appGroup);
      } else {
        scene.add(appGroup);
      }
      applianceGroupsRef.current.set(appliance.id, appGroup);
    });

    existingIds.forEach((id) => {
      const g = applianceGroupsRef.current.get(id);
      if (g) {
        g.parent?.remove(g);
        applianceGroupsRef.current.delete(id);
      }
    });
  }, [appliances, rooms, selectedApplianceId, hoveredApplianceId, viewMode, fpvRoomId]);

  // ---- FPV Camera Positioning ----
  useEffect(() => {
    if (!cameraRef.current) return;

    if (viewMode === 'fpv' && fpvRoomId) {
      const room = rooms.find((r) => r.id === fpvRoomId);
      if (room) {
        const origin = getRoomOrigin(room);

        // Intelligent camera placement tailored for each room type so all appliances are in view
        if (room.type === 'living-room') {
          // Standing behind sofa looking at TV and AC
          cameraRef.current.position.set(origin.x, 1.6, origin.z + 2.8);
          fpvControlsRef.current.yaw = 0;
          fpvControlsRef.current.pitch = -0.04;
        } else if (room.type === 'kitchen') {
          // Standing in front of island looking at fridge, oven, microwave
          cameraRef.current.position.set(origin.x, 1.6, origin.z + 2.4);
          fpvControlsRef.current.yaw = 0;
          fpvControlsRef.current.pitch = -0.04;
        } else if (room.type === 'study') {
          // Standing back looking at PC battle-station and heater
          cameraRef.current.position.set(origin.x, 1.6, origin.z + 2.0);
          fpvControlsRef.current.yaw = 0;
          fpvControlsRef.current.pitch = -0.04;
        } else if (room.type === 'bedroom') {
          // Standing in front of bed looking at bed, nightstands, and wall AC
          cameraRef.current.position.set(origin.x, 1.6, origin.z + 1.8);
          fpvControlsRef.current.yaw = 0;
          fpvControlsRef.current.pitch = -0.04;
        } else {
          cameraRef.current.position.set(origin.x, 1.6, origin.z + 1.5);
          fpvControlsRef.current.yaw = 0;
          fpvControlsRef.current.pitch = -0.04;
        }

        fpvControlsRef.current.enabled = true;
      }
    } else {
      fpvControlsRef.current.enabled = false;
      fpvControlsRef.current.forward = false;
      fpvControlsRef.current.back = false;
      fpvControlsRef.current.left = false;
      fpvControlsRef.current.right = false;
      fpvControlsRef.current.isMouseDown = false;

      // Reset camera to isometric view (Centers on selected room if active, or entire 3D home)
      if (cameraRef.current) {
        const selRoom = rooms.find((r) => r.id === selectedRoomId);
        const houseBounds = getHouseCenterAndRadius(rooms);
        const target = selRoom ? getRoomOrigin(selRoom) : houseBounds.center;
        const radius = selRoom ? 28 : houseBounds.radius;
        const theta = Math.PI / 4;
        const phi = Math.PI / 3.4;
        cameraRef.current.position.set(
          target.x + radius * Math.sin(phi) * Math.sin(theta),
          target.y + radius * Math.cos(phi),
          target.z + radius * Math.sin(phi) * Math.cos(theta)
        );
        cameraRef.current.lookAt(target);
      }
    }
  }, [viewMode, fpvRoomId, rooms, selectedRoomId]);

  return (
    <div
      ref={canvasRef}
      className="w-full h-full select-none"
      style={{ cursor: viewMode === 'fpv' ? 'crosshair' : 'grab' }}
    />
  );
};

export default HomeScene;
