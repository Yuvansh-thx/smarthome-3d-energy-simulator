// ============================================================
// Smart Home 3D Energy Manager — Type Definitions
// ============================================================

export type RoomType = 'bedroom' | 'living-room' | 'kitchen' | 'bathroom' | 'study';

export type ApplianceType =
  | 'light-bulb'
  | 'ceiling-fan'
  | 'ac'
  | 'refrigerator'
  | 'tv'
  | 'washing-machine'
  | 'oven'
  | 'microwave'
  | 'computer'
  | 'heater'
  | 'dishwasher'
  | 'water-heater';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  /** Grid position in the floor plan (x, z tile index) */
  gridX: number;
  gridZ: number;
  /** Width and depth in world units */
  width: number;
  depth: number;
  /** Wall height in world units */
  height: number;
  wallColor: string;
  floorColor: string;
  ceilingColor: string;
}

export interface Appliance {
  id: string;
  type: ApplianceType;
  roomId: string;
  /** Position relative to room origin (0,0 = room center floor) */
  localX: number;
  localZ: number;
  /** Rotation in degrees (0, 90, 180, 270) */
  rotation: 0 | 90 | 180 | 270;
  isOn: boolean;
  /** Rated wattage in Watts */
  wattage: number;
  /** Estimated hours of use per day */
  hoursPerDay: number;
  label?: string;
}

export interface EnergyStats {
  /** Active power draw in Watts */
  totalWatts: number;
  /** Energy consumed per day in kWh */
  dailyKwh: number;
  /** Estimated monthly energy in kWh */
  monthlyKwh: number;
  /** Estimated monthly cost in USD (at $0.12/kWh) */
  monthlyCost: number;
}

export type ViewMode = 'builder' | 'fpv';

export type ActivePanel = 'none' | 'energy' | 'room-builder' | 'appliance';

export interface PlacementIntent {
  applianceType: ApplianceType;
  targetRoomId: string | null;
}
