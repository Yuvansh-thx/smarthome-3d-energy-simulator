// ============================================================
// Smart Home 3D Energy Manager — Constants
// ============================================================

import type { ApplianceType, RoomType } from '../types';

/** Default wattage for each appliance type (Watts) */
export const APPLIANCE_WATTAGE: Record<ApplianceType, number> = {
  'light-bulb': 10,
  'ceiling-fan': 75,
  'ac': 1500,
  'refrigerator': 150,
  'tv': 100,
  'washing-machine': 500,
  'oven': 2400,
  'microwave': 1000,
  'computer': 250,
  'heater': 1500,
  'dishwasher': 1200,
  'water-heater': 3000,
};

/** Default hours per day for each appliance type */
export const APPLIANCE_HOURS: Record<ApplianceType, number> = {
  'light-bulb': 6,
  'ceiling-fan': 8,
  'ac': 5,
  'refrigerator': 24,
  'tv': 4,
  'washing-machine': 1,
  'oven': 1,
  'microwave': 0.5,
  'computer': 6,
  'heater': 4,
  'dishwasher': 1,
  'water-heater': 2,
};

/** Human-readable labels */
export const APPLIANCE_LABELS: Record<ApplianceType, string> = {
  'light-bulb': 'Light Bulb',
  'ceiling-fan': 'Ceiling Fan',
  'ac': 'Air Conditioner',
  'refrigerator': 'Refrigerator',
  'tv': 'Television',
  'washing-machine': 'Washing Machine',
  'oven': 'Oven',
  'microwave': 'Microwave',
  'computer': 'Computer',
  'heater': 'Heater',
  'dishwasher': 'Dishwasher',
  'water-heater': 'Water Heater',
};

/** Emoji icons for appliances */
export const APPLIANCE_ICONS: Record<ApplianceType, string> = {
  'light-bulb': '💡',
  'ceiling-fan': '🌀',
  'ac': '❄️',
  'refrigerator': '🧊',
  'tv': '📺',
  'washing-machine': '🫧',
  'oven': '🔥',
  'microwave': '📡',
  'computer': '💻',
  'heater': '♨️',
  'dishwasher': '🍽️',
  'water-heater': '🚿',
};

/** Which appliances are available per room type */
export const ROOM_APPLIANCES: Record<RoomType, ApplianceType[]> = {
  'bedroom': ['light-bulb', 'ceiling-fan', 'ac', 'tv', 'computer', 'heater'],
  'living-room': ['light-bulb', 'ceiling-fan', 'ac', 'tv', 'heater'],
  'kitchen': ['light-bulb', 'refrigerator', 'oven', 'microwave', 'dishwasher'],
  'bathroom': ['light-bulb', 'water-heater', 'heater'],
  'study': ['light-bulb', 'ceiling-fan', 'ac', 'computer', 'tv', 'heater'],
};

/** Room display names */
export const ROOM_LABELS: Record<RoomType, string> = {
  'bedroom': 'Bedroom',
  'living-room': 'Living Room',
  'kitchen': 'Kitchen',
  'bathroom': 'Bathroom',
  'study': 'Study Room',
};

/** Room icons */
export const ROOM_ICONS: Record<RoomType, string> = {
  'bedroom': '🛏️',
  'living-room': '🛋️',
  'kitchen': '🍳',
  'bathroom': '🚿',
  'study': '📚',
};

/** Default room theme colors: [wall, floor, ceiling] */
export const ROOM_COLORS: Record<RoomType, { wall: string; floor: string; ceiling: string }> = {
  'bedroom': { wall: '#F5E6D3', floor: '#8B6914', ceiling: '#FFFAF0' },
  'living-room': { wall: '#E8F4FD', floor: '#5D4037', ceiling: '#FFFFFF' },
  'kitchen': { wall: '#FFFFFF', floor: '#B0BEC5', ceiling: '#FAFAFA' },
  'bathroom': { wall: '#E0F7FA', floor: '#90A4AE', ceiling: '#FFFFFF' },
  'study': { wall: '#EDE0D4', floor: '#4E342E', ceiling: '#FFF8F0' },
};

/** Room default dimensions (width, depth, height) in world units */
export const ROOM_DIMENSIONS: Record<RoomType, { width: number; depth: number; height: number }> = {
  'bedroom': { width: 8, depth: 8, height: 3.5 },
  'living-room': { width: 10, depth: 10, height: 3.5 },
  'kitchen': { width: 7, depth: 7, height: 3 },
  'bathroom': { width: 5, depth: 5, height: 2.8 },
  'study': { width: 7, depth: 7, height: 3.2 },
};

/** kWh electricity rate (USD) */
export const KWH_RATE = 0.12;

/** Grid cell size in world units */
export const GRID_CELL_SIZE = 12;

