import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BURST_COUNT = 600;
const SHOCKWAVE_SEGMENTS = 64;

/**
 * ExplosionEffect — Burst particles and shockwave ring
 * that appear during the explosion stage.
 */
export default function ExplosionEffect({ active }) {
  const burstRef = useRef();
  const shockwaveRef = useRef();
  const timeRef = useRef(0);
  const initializedRef = useRef(false);

  // Store velocities for burst particles
  const velocities = useMemo(() => {
    const vels = [];
    for (let i = 0; i < BURST_COUNT; i++) {
      // Spherical distribution with some bias toward equator
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 3 + Math.random() * 12;
      vels.push(new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed + Math.random() * 3,
        Math.cos(phi) * speed * 0.7
      ));
    }
    return vels;
  }, []);

  // Burst particles geometry
  const burstGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(BURST_COUNT * 3);
    const colors = new Float32Array(BURST_COUNT * 3);
    const sizes = new Float32Array(BURST_COUNT);

    const palette = [
      new THREE.Color('#FF7EB6'),
      new THREE.Color('#F6D99B'),
      new THREE.Color('#B0003A'),
      new THREE.Color('#FFB3D4'),
      new THREE.Color('#FFFFFF'),
      new THREE.Color('#FFD4E8'),
    ];

    for (let i = 0; i < BURST_COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      sizes[i] = Math.random() * 3 + 1;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return geo;
  }, []);

  // Burst material
  const burstMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
  }, []);

  // Shockwave ring geometry
  const shockwaveGeometry = useMemo(() => {
    return new THREE.RingGeometry(0.1, 0.3, SHOCKWAVE_SEGMENTS);
  }, []);

  // Shockwave material
  const shockwaveMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#FF7EB6',
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);

  // Reset when activation changes
  useEffect(() => {
    if (active) {
      timeRef.current = 0;
      initializedRef.current = false;
    }
  }, [active]);

  useFrame((state, delta) => {
    if (!active) return;

    const dt = Math.min(delta, 0.05);
    timeRef.current += dt;
    const t = timeRef.current;

    // Wait for the explosion moment (after beating phase)
    const EXPLODE_DELAY = 2.6; // Match Hearts.jsx EXPLODE_AT
    if (t < EXPLODE_DELAY) return;

    const explodeT = t - EXPLODE_DELAY;

    // Initialize burst positions on first frame
    if (!initializedRef.current) {
      initializedRef.current = true;
      const positions = burstGeometry.attributes.position.array;
      for (let i = 0; i < BURST_COUNT; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0.3; // Center of heart
        positions[i * 3 + 2] = 0;
      }
      burstGeometry.attributes.position.needsUpdate = true;
    }

    // Animate burst particles
    if (burstRef.current) {
      const positions = burstGeometry.attributes.position.array;

      for (let i = 0; i < BURST_COUNT; i++) {
        const vel = velocities[i];
        const drag = Math.pow(0.97, explodeT * 60);
        positions[i * 3] += vel.x * dt * drag;
        positions[i * 3 + 1] += vel.y * dt * drag - dt * 2; // gravity
        positions[i * 3 + 2] += vel.z * dt * drag;
      }
      burstGeometry.attributes.position.needsUpdate = true;

      // Opacity: flash in, then fade
      const flashOpacity = explodeT < 0.2
        ? explodeT / 0.2
        : Math.max(0, 1 - (explodeT - 0.2) * 0.3);
      burstMaterial.opacity = flashOpacity * 0.8;
    }

    // Animate shockwave ring
    if (shockwaveRef.current) {
      const scale = 1 + explodeT * 15; // Expands quickly
      shockwaveRef.current.scale.set(scale, scale, 1);
      shockwaveRef.current.position.y = 0.3;
      shockwaveMaterial.opacity = Math.max(0, (1 - explodeT * 0.8) * 0.5);
    }
  });

  if (!active) return null;

  return (
    <group>
      <points ref={burstRef} geometry={burstGeometry} material={burstMaterial} />
      <mesh
        ref={shockwaveRef}
        geometry={shockwaveGeometry}
        material={shockwaveMaterial}
        position={[0, 0.3, 0]}
      />
    </group>
  );
}
