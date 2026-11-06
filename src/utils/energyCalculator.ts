// ============================================================
// Smart Home 3D Energy Manager — Energy Calculator
// ============================================================

import type { Appliance, EnergyStats, Room } from '../types';
import { KWH_RATE } from './constants';

/**
 * Calculate energy stats for a list of appliances.
 * Only `isOn` appliances contribute to live wattage.
 * All appliances contribute to daily/monthly projections proportionally.
 */
export function calculateEnergyStats(appliances: Appliance[]): EnergyStats {
  const activeAppliances = appliances.filter((a) => a.isOn);

  const totalWatts = activeAppliances.reduce((sum, a) => sum + a.wattage, 0);

  // Daily kWh: each appliance uses wattage * hoursPerDay / 1000
  const dailyKwh = appliances.reduce((sum, a) => {
    if (!a.isOn) return sum;
    return sum + (a.wattage * a.hoursPerDay) / 1000;
  }, 0);

  const monthlyKwh = dailyKwh * 30;
  const monthlyCost = monthlyKwh * KWH_RATE;

  return {
    totalWatts,
    dailyKwh: parseFloat(dailyKwh.toFixed(2)),
    monthlyKwh: parseFloat(monthlyKwh.toFixed(2)),
    monthlyCost: parseFloat(monthlyCost.toFixed(2)),
  };
}

/**
 * Calculate per-room energy stats.
 */
export function calculateRoomEnergy(
  room: Room,
  allAppliances: Appliance[]
): EnergyStats {
  const roomAppliances = allAppliances.filter((a) => a.roomId === room.id);
  return calculateEnergyStats(roomAppliances);
}

/**
 * Calculate overall home energy stats.
 */
export function calculateHomeEnergy(allAppliances: Appliance[]): EnergyStats {
  return calculateEnergyStats(allAppliances);
}

/**
 * Format watts for display (e.g., 1500W → "1.5 kW")
 */
export function formatWatts(watts: number): string {
  if (watts >= 1000) {
    return `${(watts / 1000).toFixed(1)} kW`;
  }
  return `${watts} W`;
}

/**
 * Format kWh for display
 */
export function formatKwh(kwh: number): string {
  return `${kwh.toFixed(2)} kWh`;
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  return `\$${cost.toFixed(2)}`;
}

