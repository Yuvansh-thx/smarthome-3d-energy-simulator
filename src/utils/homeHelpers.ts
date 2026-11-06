// ============================================================
// Smart Home 3D — Seeder & Layout Helpers
// ============================================================

import * as THREE from 'three';
import type { Room } from '../types';
import { GRID_CELL_SIZE } from './constants';
import { useHomeStore } from '../store/homeStore';

export function getRoomOrigin(room: Room): THREE.Vector3 {
  return new THREE.Vector3(
    room.gridX * GRID_CELL_SIZE,
    0,
    room.gridZ * GRID_CELL_SIZE
  );
}

/**
 * Calculates the bounding center and optimal camera distance
 * for the entire 3D smart home so all rooms are framed perfectly.
 */
export function getHouseCenterAndRadius(rooms: Room[]): { center: THREE.Vector3; radius: number } {
  if (rooms.length === 0) {
    return { center: new THREE.Vector3(6, 0, 6), radius: 36 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  rooms.forEach((r) => {
    const origin = getRoomOrigin(r);
    minX = Math.min(minX, origin.x - r.width / 2);
    maxX = Math.max(maxX, origin.x + r.width / 2);
    minZ = Math.min(minZ, origin.z - r.depth / 2);
    maxZ = Math.max(maxZ, origin.z + r.depth / 2);
  });

  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const spanX = maxX - minX;
  const spanZ = maxZ - minZ;
  const maxSpan = Math.max(spanX, spanZ, 20);
  const radius = Math.max(maxSpan * 1.45, 36);

  return {
    center: new THREE.Vector3(centerX, 0, centerZ),
    radius,
  };
}

export function seedDemoHome() {
  const store = useHomeStore.getState();
  store.resetHome();

  // 1. Living Room (0, 0)
  const living = store.addRoom('living-room', 'Living Room', {
    gridX: 0,
    gridZ: 0,
    width: 10,
    depth: 10,
  });
  store.addAppliance(living.id, 'light-bulb', { localX: 0, localZ: 0 });
  store.addAppliance(living.id, 'ceiling-fan', { localX: 0, localZ: 0 });
  store.addAppliance(living.id, 'tv', { localX: 0, localZ: -4.5, rotation: 0 });
  store.addAppliance(living.id, 'ac', { localX: 4.6, localZ: 0, rotation: 270 });

  // 2. Modern Kitchen (1, 0)
  const kitchen = store.addRoom('kitchen', 'Chef Kitchen', {
    gridX: 1,
    gridZ: 0,
    width: 8,
    depth: 8,
  });
  store.addAppliance(kitchen.id, 'light-bulb', { localX: 0, localZ: 0 });
  store.addAppliance(kitchen.id, 'refrigerator', { localX: -2.8, localZ: -3.0, rotation: 0 });
  store.addAppliance(kitchen.id, 'oven', { localX: 0.6, localZ: -3.2, rotation: 0 });
  store.addAppliance(kitchen.id, 'microwave', { localX: 2.2, localZ: -3.2, rotation: 0 });
  store.addAppliance(kitchen.id, 'dishwasher', { localX: -1.2, localZ: -3.2, rotation: 0 });

  // 3. Master Bedroom (0, 1)
  const bedroom = store.addRoom('bedroom', 'Master Suite', {
    gridX: 0,
    gridZ: 1,
    width: 8,
    depth: 8,
  });
  store.addAppliance(bedroom.id, 'light-bulb', { localX: 0, localZ: 0 });
  store.addAppliance(bedroom.id, 'ceiling-fan', { localX: 0, localZ: 0 });
  store.addAppliance(bedroom.id, 'ac', { localX: -3.6, localZ: 0, rotation: 90 });
  store.addAppliance(bedroom.id, 'tv', { localX: 0, localZ: 3.4, rotation: 180 });

  // 4. Tech Study (1, 1)
  const study = store.addRoom('study', 'Creative Studio', {
    gridX: 1,
    gridZ: 1,
    width: 8,
    depth: 8,
  });
  store.addAppliance(study.id, 'light-bulb', { localX: 0, localZ: 0 });
  store.addAppliance(study.id, 'computer', { localX: 0, localZ: -2.3, rotation: 0 });
  store.addAppliance(study.id, 'ceiling-fan', { localX: 0, localZ: 0 });
  store.addAppliance(study.id, 'heater', { localX: -3.2, localZ: -2.3, rotation: 90 });
}
