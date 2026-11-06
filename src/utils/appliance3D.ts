// ============================================================
// 3D Procedural Appliance Geometry Builder
// ============================================================

import * as THREE from 'three';
import type { ApplianceType } from '../types';

export const APPLIANCE_COLOR: Record<ApplianceType, number> = {
  'light-bulb': 0xFFFF88,
  'ceiling-fan': 0x4A5568,
  'ac': 0xE2E8F0,
  'refrigerator': 0xCBD5E1,
  'tv': 0x0F172A,
  'washing-machine': 0xF1F5F9,
  'oven': 0x334155,
  'microwave': 0x475569,
  'computer': 0x1E293B,
  'heater': 0xEA580C,
  'dishwasher': 0x94A3B8,
  'water-heater': 0x64748B,
};

export function buildApplianceMesh(
  type: ApplianceType,
  isOn: boolean,
  roomHeight = 3.5
): THREE.Group {
  const group = new THREE.Group();
  const color = APPLIANCE_COLOR[type];

  switch (type) {
    case 'light-bulb': {
      const cord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.8, 6),
        new THREE.MeshLambertMaterial({ color: 0x1E293B })
      );
      cord.position.y = roomHeight - 0.4;

      const fixture = new THREE.Mesh(
        new THREE.ConeGeometry(0.28, 0.2, 12, 1, true),
        new THREE.MeshLambertMaterial({ color: 0x334155, side: THREE.DoubleSide })
      );
      fixture.position.y = roomHeight - 0.75;

      const bulbGeo = new THREE.SphereGeometry(0.12, 12, 8);
      const bulbMat = new THREE.MeshLambertMaterial({
        color: isOn ? 0xFFFFAA : 0x64748B,
        emissive: isOn ? 0xFFEE66 : 0x000000,
        emissiveIntensity: isOn ? 1.8 : 0,
      });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.y = roomHeight - 0.82;

      group.add(cord, fixture, bulb);

      if (isOn) {
        const light = new THREE.PointLight(0xFFF3C4, 1.8, 10);
        light.position.y = roomHeight - 0.9;
        light.castShadow = true;
        group.add(light);
      }
      break;
    }

    case 'ceiling-fan': {
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6),
        new THREE.MeshLambertMaterial({ color: 0x334155 })
      );
      rod.position.y = roomHeight - 0.225;
      group.add(rod);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12),
        new THREE.MeshLambertMaterial({ color: 0x1E293B })
      );
      hub.position.y = roomHeight - 0.45;
      group.add(hub);

      const bladeContainer = new THREE.Group();
      bladeContainer.position.y = roomHeight - 0.45;
      bladeContainer.userData = { isFanRotator: true };

      const bladeMat = new THREE.MeshLambertMaterial({ color: 0x854D0E });
      for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.02, 0.18), bladeMat);
        blade.position.x = Math.cos((i * Math.PI) / 2) * 0.55;
        blade.position.z = Math.sin((i * Math.PI) / 2) * 0.55;
        blade.rotation.y = (i * Math.PI) / 2;
        blade.rotation.z = 0.08;
        bladeContainer.add(blade);
      }
      group.add(bladeContainer);
      break;
    }

    case 'tv': {
      const frameMat = new THREE.MeshLambertMaterial({ color: 0x0F172A });
      const tvBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.95, 0.06), frameMat);
      tvBody.position.y = 1.35;

      const screenMat = new THREE.MeshLambertMaterial({
        color: isOn ? 0x38BDF8 : 0x020617,
        emissive: isOn ? 0x0284C7 : 0x000000,
        emissiveIntensity: isOn ? 1.0 : 0,
      });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.52, 0.88), screenMat);
      screen.position.set(0, 1.35, 0.035);

      const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), frameMat);
      standPole.position.set(0, 0.75, 0);
      const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.4), frameMat);
      standBase.position.set(0, 0.52, 0);

      group.add(tvBody, screen, standPole, standBase);

      if (isOn) {
        const tvLight = new THREE.PointLight(0x38BDF8, 0.8, 4);
        tvLight.position.set(0, 1.35, 0.3);
        group.add(tvLight);
      }
      break;
    }

    case 'ac': {
      const acBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.35, 0.28),
        new THREE.MeshLambertMaterial({ color: 0xF8FAFC })
      );
      acBody.position.y = roomHeight - 0.65;

      const louver = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.04, 0.02),
        new THREE.MeshLambertMaterial({ color: 0x94A3B8 })
      );
      louver.position.set(0, roomHeight - 0.74, 0.14);

      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.05, 0.02),
        new THREE.MeshLambertMaterial({
          color: isOn ? 0x22C55E : 0xEF4444,
          emissive: isOn ? 0x22C55E : 0xEF4444,
          emissiveIntensity: 1.2,
        })
      );
      led.position.set(0.35, roomHeight - 0.62, 0.145);

      group.add(acBody, louver, led);

      if (isOn) {
        const acLight = new THREE.PointLight(0x93C5FD, 0.6, 3);
        acLight.position.set(0, roomHeight - 0.8, 0.3);
        group.add(acLight);
      }
      break;
    }

    case 'refrigerator': {
      const fridgeBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 1.9, 0.75),
        new THREE.MeshLambertMaterial({ color: 0xE2E8F0 })
      );
      fridgeBody.position.y = 0.95;

      const seam = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 1.9, 0.02),
        new THREE.MeshLambertMaterial({ color: 0x475569 })
      );
      seam.position.set(0, 0.95, 0.38);

      [-0.08, 0.08].forEach((hx) => {
        const handle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8),
          new THREE.MeshLambertMaterial({ color: 0x334155 })
        );
        handle.position.set(hx, 1.1, 0.41);
        group.add(handle);
      });

      const dispenser = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.32, 0.02),
        new THREE.MeshLambertMaterial({ color: 0x1E293B })
      );
      dispenser.position.set(-0.24, 1.25, 0.385);

      group.add(fridgeBody, seam, dispenser);
      break;
    }

    case 'washing-machine': {
      const washerBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.88, 0.7),
        new THREE.MeshLambertMaterial({ color: 0xF8FAFC })
      );
      washerBody.position.y = 0.44;

      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.035, 12, 24),
        new THREE.MeshLambertMaterial({ color: 0x64748B })
      );
      rim.position.set(0, 0.42, 0.36);

      const glass = new THREE.Mesh(
        new THREE.CircleGeometry(0.23, 20),
        new THREE.MeshLambertMaterial({
          color: isOn ? 0x60A5FA : 0x1E293B,
          emissive: isOn ? 0x2563EB : 0x000000,
          emissiveIntensity: isOn ? 0.6 : 0,
          transparent: true,
          opacity: 0.8,
        })
      );
      glass.position.set(0, 0.42, 0.365);

      const knob = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12),
        new THREE.MeshLambertMaterial({ color: 0x334155 })
      );
      knob.rotation.x = Math.PI / 2;
      knob.position.set(0.22, 0.74, 0.36);

      group.add(washerBody, rim, glass, knob);
      break;
    }

    case 'computer': {
      const monitorMat = new THREE.MeshLambertMaterial({
        color: isOn ? 0x38BDF8 : 0x020617,
        emissive: isOn ? 0x0369A1 : 0x000000,
        emissiveIntensity: isOn ? 0.9 : 0,
      });

      const mon1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.5, 0.04), monitorMat);
      mon1.position.set(-0.15, 1.15, 0);

      const mon2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, 0.04), monitorMat);
      mon2.position.set(0.5, 1.18, 0.05);
      mon2.rotation.y = -0.3;

      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8), new THREE.MeshLambertMaterial({ color: 0x334155 }));
      stand.position.set(-0.15, 0.9, -0.05);

      const pcTower = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.48, 0.46),
        new THREE.MeshLambertMaterial({
          color: 0x0F172A,
          emissive: isOn ? 0xA855F7 : 0x000000,
          emissiveIntensity: isOn ? 0.4 : 0,
        })
      );
      pcTower.position.set(0.9, 0.98, 0);

      const kb = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.02, 0.16), new THREE.MeshLambertMaterial({ color: 0x334155 }));
      kb.position.set(-0.15, 0.76, 0.22);
      const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 0.11), new THREE.MeshLambertMaterial({ color: 0x475569 }));
      mouse.position.set(0.22, 0.76, 0.22);

      group.add(mon1, mon2, stand, pcTower, kb, mouse);

      if (isOn) {
        const pcLight = new THREE.PointLight(0x38BDF8, 0.8, 2.5);
        pcLight.position.set(-0.15, 1.2, 0.3);
        group.add(pcLight);
      }
      break;
    }

    case 'oven': {
      const ovenBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.9, 0.7),
        new THREE.MeshLambertMaterial({ color: 0x334155 })
      );
      ovenBody.position.y = 0.45;

      const glassDoor = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.45, 0.02),
        new THREE.MeshLambertMaterial({
          color: isOn ? 0xEA580C : 0x0F172A,
          emissive: isOn ? 0x9A3412 : 0x000000,
          emissiveIntensity: isOn ? 0.8 : 0,
        })
      );
      glassDoor.position.set(0, 0.38, 0.36);

      [-0.2, 0.2].forEach((bx) => {
        [-0.15, 0.15].forEach((bz) => {
          const burner = new THREE.Mesh(
            new THREE.CylinderGeometry(0.11, 0.11, 0.02, 12),
            new THREE.MeshLambertMaterial({
              color: isOn ? 0xEF4444 : 0x1E293B,
              emissive: isOn ? 0xDC2626 : 0x000000,
              emissiveIntensity: isOn ? 1.0 : 0,
            })
          );
          burner.position.set(bx, 0.91, bz);
          group.add(burner);
        });
      });

      group.add(ovenBody, glassDoor);
      break;
    }

    case 'microwave': {
      const uwave = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.36, 0.4),
        new THREE.MeshLambertMaterial({ color: 0x475569 })
      );
      uwave.position.y = 1.1;

      const uglass = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.26, 0.02),
        new THREE.MeshLambertMaterial({
          color: isOn ? 0xFDE047 : 0x0F172A,
          emissive: isOn ? 0xCA8A04 : 0x000000,
          emissiveIntensity: isOn ? 0.7 : 0,
        })
      );
      uglass.position.set(-0.07, 1.1, 0.21);

      group.add(uwave, uglass);
      break;
    }

    case 'heater': {
      const heaterBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.65, 0.18),
        new THREE.MeshLambertMaterial({
          color: isOn ? 0xEA580C : 0x475569,
          emissive: isOn ? 0xC2410C : 0x000000,
          emissiveIntensity: isOn ? 0.7 : 0,
        })
      );
      heaterBody.position.y = 0.325;
      group.add(heaterBody);

      if (isOn) {
        const heatGlow = new THREE.PointLight(0xEA580C, 1.0, 3);
        heatGlow.position.set(0, 0.4, 0.2);
        group.add(heatGlow);
      }
      break;
    }

    case 'dishwasher': {
      const dw = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.88, 0.65),
        new THREE.MeshLambertMaterial({ color: 0x94A3B8 })
      );
      dw.position.y = 0.44;
      const dwHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8),
        new THREE.MeshLambertMaterial({ color: 0x334155 })
      );
      dwHandle.rotation.z = Math.PI / 2;
      dwHandle.position.set(0, 0.8, 0.34);
      group.add(dw, dwHandle);
      break;
    }

    case 'water-heater': {
      const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 1.2, 16),
        new THREE.MeshLambertMaterial({ color: 0xCBD5E1 })
      );
      tank.position.y = 0.6;
      group.add(tank);
      break;
    }

    default: {
      const def = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.4, 0.4),
        new THREE.MeshLambertMaterial({ color })
      );
      def.position.y = 0.2;
      group.add(def);
    }
  }

  return group;
}

