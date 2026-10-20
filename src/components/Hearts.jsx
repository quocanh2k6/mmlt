import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createHeartGeometry,
  generateHeartTargetPositions,
  generateRandomPositions,
  HEART_COLORS,
  easeInOutCubic,
  easeOutCubic,
  getHeartCount,
} from '../utils/heartMath';

// Temp objects to avoid GC pressure in the render loop
const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _scale = new THREE.Vector3();
const _color = new THREE.Color();
const _tempVec = new THREE.Vector3();

const HEART_COUNT = getHeartCount();

/**
 * Hearts — The main 3D instanced heart mesh.
 * Handles all stage animations: void float, gathering, beating, explosion.
 */
export default function Hearts({ stage, onStageComplete }) {
  const meshRef = useRef();
  const stageTimeRef = useRef(0);
  const stageCompletedRef = useRef(false);
  const prevStageRef = useRef(stage);

  // Create geometry once
  const geometry = useMemo(() => createHeartGeometry(), []);

  // Create material with emissive for bloom
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#B0003A',
      emissive: '#B0003A',
      emissiveIntensity: 0.4,
      roughness: 0.35,
      metalness: 0.2,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });
  }, []);

  // Pre-compute target positions and starting positions
  const targetPositions = useMemo(() => generateHeartTargetPositions(HEART_COUNT), []);
  const startPositions = useMemo(() => generateRandomPositions(HEART_COUNT, 25), []);

  // Per-heart data stored in a flat structure for performance
  const heartsData = useMemo(() => {
    const data = [];
    for (let i = 0; i < HEART_COUNT; i++) {
      data.push({
        // Position tracking
        pos: startPositions[i].clone(),
        vel: new THREE.Vector3(),
        // Random attributes
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.4
        ),
        rot: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        baseScale: 0.6 + Math.random() * 0.8,
        currentScale: 0,
        color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)].clone(),
        phase: Math.random() * Math.PI * 2,
        floatSpeed: 0.15 + Math.random() * 0.35,
        // Stagger delay for gathering (based on distance from center)
        gatherDelay: 0, // Will be computed
        // Explosion initialized flag
        explosionInit: false,
        alive: true,
      });
    }

    // Compute gather delays: hearts further from center start moving earlier
    // This creates a converging wave effect
    const maxDist = targetPositions.reduce((max, p) => Math.max(max, p.length()), 0);
    for (let i = 0; i < HEART_COUNT; i++) {
      const dist = targetPositions[i].length() / (maxDist || 1);
      // Outer hearts arrive slightly later for a nice wave
      data[i].gatherDelay = dist * 0.25 + Math.random() * 0.1;
    }

    return data;
  }, [startPositions, targetPositions]);

  // Reset stage timer on stage change
  useEffect(() => {
    if (prevStageRef.current !== stage) {
      stageTimeRef.current = 0;
      stageCompletedRef.current = false;
      prevStageRef.current = stage;

      // Reset explosion init flags when entering explosion
      if (stage === 'explosion') {
        heartsData.forEach((h) => {
          h.explosionInit = false;
          h.alive = true;
        });
      }
    }
  }, [stage, heartsData]);

  // Main animation loop
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const dt = Math.min(delta, 0.05); // Cap delta for tab-switch
    stageTimeRef.current += dt;
    const t = stageTimeRef.current;
    const elapsed = state.clock.elapsedTime;
    const mesh = meshRef.current;

    for (let i = 0; i < HEART_COUNT; i++) {
      const h = heartsData[i];

      switch (stage) {
        case 'loading':
        case 'void': {
          // Float at starting positions with gentle oscillation
          const fadeIn = Math.min(1, t * 0.3);
          h.pos.copy(startPositions[i]);
          h.pos.x += Math.sin(elapsed * h.floatSpeed + h.phase) * 0.6;
          h.pos.y += Math.cos(elapsed * h.floatSpeed * 0.7 + h.phase) * 0.4;
          h.pos.z += Math.sin(elapsed * h.floatSpeed * 0.5 + h.phase * 1.3) * 0.3;
          h.currentScale = h.baseScale * fadeIn * 0.7;
          h.rot.x += h.rotSpeed.x * dt;
          h.rot.y += h.rotSpeed.y * dt;
          break;
        }

        case 'gathering': {
          // Hearts converge to form the large heart shape
          const GATHER_DURATION = 6.5; // seconds to fully gather
          const rawProgress = Math.min(1, t / GATHER_DURATION);
          // Apply per-heart stagger
          const staggered = Math.max(0, (rawProgress - h.gatherDelay) / (1 - h.gatherDelay));
          const eased = easeInOutCubic(Math.min(1, staggered));

          // Interpolate position from start to target
          h.pos.lerpVectors(startPositions[i], targetPositions[i], eased);

          // Add subtle oscillation that diminishes as hearts settle
          const wobble = (1 - eased) * 0.5;
          h.pos.x += Math.sin(elapsed * 2 + h.phase) * wobble;
          h.pos.y += Math.cos(elapsed * 2.3 + h.phase) * wobble;

          // Scale up as they arrive
          h.currentScale = h.baseScale * (0.5 + eased * 0.5);

          // Slow down rotation as hearts settle
          h.rot.x += h.rotSpeed.x * dt * (1 - eased * 0.7);
          h.rot.y += h.rotSpeed.y * dt * (1 - eased * 0.7);

          // Check completion
          if (rawProgress >= 1 && !stageCompletedRef.current) {
            stageCompletedRef.current = true;
            onStageComplete('gathering');
          }
          break;
        }

        case 'explosion': {
          const BEAT_DURATION = 2.2;
          const PAUSE_AT = BEAT_DURATION;
          const PAUSE_DURATION = 0.4;
          const EXPLODE_AT = PAUSE_AT + PAUSE_DURATION;

          if (t < BEAT_DURATION) {
            // Beating phase — hearts pulse from center
            const beatT = t / BEAT_DURATION;
            // 3 beats with increasing intensity
            const beatFreq = 2.5;
            const beatAmp = 0.07 * (0.5 + beatT * 0.5);
            const beatScale = 1 + Math.sin(t * Math.PI * beatFreq) * beatAmp;

            h.pos.copy(targetPositions[i]).multiplyScalar(beatScale);
            // Slight wobble
            h.pos.x += Math.sin(elapsed * 3 + h.phase) * 0.015;
            h.pos.y += Math.cos(elapsed * 3 + h.phase) * 0.015;
            h.currentScale = h.baseScale;
            h.rot.x += h.rotSpeed.x * dt * 0.2;
            h.rot.y += h.rotSpeed.y * dt * 0.2;

            // Increase emissive during beats
            material.emissiveIntensity = 0.4 + beatT * 0.4;
          } else if (t < EXPLODE_AT) {
            // Brief pause — tension builds
            h.pos.copy(targetPositions[i]);
            h.currentScale = h.baseScale * 1.05;
            material.emissiveIntensity = 0.9;
          } else {
            // EXPLOSION!
            const explodeT = t - EXPLODE_AT;

            if (!h.explosionInit) {
              h.explosionInit = true;
              // Calculate explosion velocity: outward from center + randomness
              const dir = targetPositions[i].clone().normalize();
              const speed = 4 + Math.random() * 8;
              h.vel.copy(dir).multiplyScalar(speed);
              h.vel.x += (Math.random() - 0.5) * 6;
              h.vel.y += (Math.random() - 0.5) * 6 + 2; // Slight upward bias
              h.vel.z += (Math.random() - 0.5) * 4;

              // Flash emissive
              material.emissiveIntensity = 1.5;
            }

            // Apply velocity with drag and gravity
            _tempVec.copy(h.vel).multiplyScalar(dt);
            h.pos.add(_tempVec);
            h.vel.multiplyScalar(1 - dt * 1.2); // Drag
            h.vel.y -= dt * 2.5; // Gravity

            // Spin faster during explosion
            h.rot.x += h.rotSpeed.x * dt * 3;
            h.rot.y += h.rotSpeed.y * dt * 3;
            h.rot.z += h.rotSpeed.z * dt * 2;

            // Shrink and fade
            const fadeOut = Math.max(0, 1 - explodeT * 0.35);
            h.currentScale = h.baseScale * fadeOut;

            // Decrease emissive over time
            material.emissiveIntensity = Math.max(0.3, 1.5 - explodeT * 0.5);

            if (explodeT > 3.5 && !stageCompletedRef.current) {
              stageCompletedRef.current = true;
              onStageComplete('explosion');
            }
          }
          break;
        }

        case 'letter':
        case 'forever': {
          // Background floating hearts (fewer, slower, transparent)
          const bgFadeIn = Math.min(0.5, t * 0.2);
          // Only show a subset of hearts as background
          if (i % 3 === 0) {
            const spread = 18;
            const baseX = ((i * 7.13) % spread) - spread / 2;
            const baseY = ((i * 11.37) % spread) - spread / 2;
            const baseZ = ((i * 3.91) % 10) - 15;

            h.pos.set(
              baseX + Math.sin(elapsed * h.floatSpeed * 0.5 + h.phase) * 1.5,
              baseY + Math.cos(elapsed * h.floatSpeed * 0.3 + h.phase) * 1.0,
              baseZ + Math.sin(elapsed * h.floatSpeed * 0.2 + h.phase * 2) * 0.5
            );
            h.currentScale = h.baseScale * 0.4 * bgFadeIn;
            h.rot.x += h.rotSpeed.x * dt * 0.3;
            h.rot.y += h.rotSpeed.y * dt * 0.3;
          } else {
            h.currentScale = Math.max(0, h.currentScale - dt * 2);
          }
          break;
        }

        default:
          break;
      }

      // Apply transform to instance matrix
      _position.copy(h.pos);
      _euler.copy(h.rot);
      _quaternion.setFromEuler(_euler);
      const s = Math.max(0.001, h.currentScale); // Avoid zero scale
      _scale.set(s, s, s);
      _matrix.compose(_position, _quaternion, _scale);
      mesh.setMatrixAt(i, _matrix);

      // Set instance color
      mesh.setColorAt(i, h.color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, HEART_COUNT]}
      frustumCulled={false}
    />
  );
}
