import * as THREE from 'three';

/**
 * Heart curve parametric equations.
 * Standard heart curve scaled for our scene.
 */
export function heartX(t) {
  return 16 * Math.pow(Math.sin(t), 3);
}

export function heartY(t) {
  return 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
}

/**
 * Generate target positions that form a volumetric 3D heart shape.
 * Uses concentric rings + depth layers to create a solid, recognizable heart.
 */
export function generateHeartTargetPositions(count) {
  const positions = [];
  const SCALE = 0.14;        // Overall heart size in scene units
  const DEPTH_LAYERS = 7;    // Number of z-layers for 3D volume
  const LAYER_SPACING = 0.35;
  const RINGS_PER_LAYER = 6; // Concentric rings from outline to center

  const pointsPerLayer = Math.ceil(count / DEPTH_LAYERS);
  const pointsPerRing = Math.ceil(pointsPerLayer / RINGS_PER_LAYER);

  for (let layer = 0; layer < DEPTH_LAYERS; layer++) {
    const zBase = (layer - (DEPTH_LAYERS - 1) / 2) * LAYER_SPACING;
    // Layers further from center are slightly smaller (spherical falloff)
    const layerDepthFactor = Math.sqrt(1 - Math.pow((layer - (DEPTH_LAYERS - 1) / 2) / ((DEPTH_LAYERS - 1) / 2 + 0.5), 2));

    for (let ring = 0; ring < RINGS_PER_LAYER; ring++) {
      // ringScale goes from 1.0 (outline) to 0.08 (near center)
      const ringScale = 1.0 - (ring / RINGS_PER_LAYER) * 0.92;
      const adjustedScale = SCALE * ringScale * layerDepthFactor;

      // More points on outer rings, fewer on inner
      const ringPoints = Math.max(3, Math.floor(pointsPerRing * ringScale));

      for (let i = 0; i < ringPoints; i++) {
        const t = (i / ringPoints) * Math.PI * 2 + (ring * 0.3) + (layer * 0.15); // Offset to avoid alignment
        const x = heartX(t) * adjustedScale;
        const y = heartY(t) * adjustedScale + 0.3; // Slight vertical offset to center visually
        const z = zBase + (Math.random() - 0.5) * 0.15;

        positions.push(new THREE.Vector3(x, y, z));
      }
    }
  }

  // Shuffle to randomize assignment (so gathering looks natural)
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Trim or pad to exact count
  while (positions.length < count) {
    const t = Math.random() * Math.PI * 2;
    const s = Math.random() * 0.8 + 0.1;
    positions.push(new THREE.Vector3(
      heartX(t) * SCALE * s,
      heartY(t) * SCALE * s + 0.3,
      (Math.random() - 0.5) * LAYER_SPACING * (DEPTH_LAYERS - 1)
    ));
  }

  return positions.slice(0, count);
}

/**
 * Generate random starting positions spread across 3D space.
 */
export function generateRandomPositions(count, spread = 25) {
  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push(new THREE.Vector3(
      (Math.random() - 0.5) * spread * 2,
      (Math.random() - 0.5) * spread * 2,
      (Math.random() - 0.5) * spread - 10
    ));
  }
  return positions;
}

/**
 * Create a small 3D heart geometry for instanced rendering.
 * Based on Three.js heart curve, scaled to ~0.2 units.
 */
export function createHeartGeometry() {
  const shape = new THREE.Shape();

  shape.moveTo(25, 25);
  shape.bezierCurveTo(25, 25, 20, 0, 0, 0);
  shape.bezierCurveTo(-30, 0, -30, 35, -30, 35);
  shape.bezierCurveTo(-30, 55, -10, 77, 25, 95);
  shape.bezierCurveTo(60, 77, 80, 55, 80, 35);
  shape.bezierCurveTo(80, 35, 80, 0, 50, 0);
  shape.bezierCurveTo(35, 0, 25, 25, 25, 25);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 12,
    bevelEnabled: true,
    bevelThickness: 3,
    bevelSize: 2,
    bevelSegments: 2,
    curveSegments: 10,
  });

  geometry.center();
  // Scale from ~110 units to ~0.2 units
  geometry.scale(0.0018, 0.0018, 0.0018);

  return geometry;
}

/**
 * Color palette for hearts.
 */
export const HEART_COLORS = [
  new THREE.Color('#B0003A'), // Ruby red
  new THREE.Color('#B0003A'), // Ruby red (weighted)
  new THREE.Color('#D4004A'), // Brighter ruby
  new THREE.Color('#FF7EB6'), // Rose pink
  new THREE.Color('#FF7EB6'), // Rose pink (weighted)
  new THREE.Color('#5B1027'), // Deep burgundy
  new THREE.Color('#F6D99B'), // Champagne gold (rare)
  new THREE.Color('#E8507A'), // Coral rose
];

/**
 * Easing functions.
 */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInCubic(t) {
  return t * t * t;
}

export function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Detect if device is low-power (mobile or small screen).
 */
export function isLowPowerDevice() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isSmallScreen = window.innerWidth < 768;
  return isMobile || isSmallScreen;
}

/**
 * Heart count based on device capability.
 */
export function getHeartCount() {
  return isLowPowerDevice() ? 350 : 600;
}
