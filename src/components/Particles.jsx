import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 400;
const SPARKLE_COUNT = 200;

/**
 * Background particles — floating dust and sparkle particles.
 * Creates depth and atmosphere across all stages.
 */
export default function Particles({ stage }) {
  const dustRef = useRef();
  const sparkleRef = useRef();

  // Dust particles geometry (always present, subtle)
  const dustGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);

    const colorPalette = [
      new THREE.Color('#B0003A'),
      new THREE.Color('#FF7EB6'),
      new THREE.Color('#F6D99B'),
      new THREE.Color('#5B1027'),
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 5;

      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      sizes[i] = Math.random() * 2 + 0.5;
      phases[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    return geo;
  }, []);

  // Sparkle particles (brighter, appear during gathering and explosion)
  const sparkleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(SPARKLE_COUNT * 3);
    const colors = new Float32Array(SPARKLE_COUNT * 3);
    const sizes = new Float32Array(SPARKLE_COUNT);

    const gold = new THREE.Color('#F6D99B');
    const pink = new THREE.Color('#FF7EB6');

    for (let i = 0; i < SPARKLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;

      const col = Math.random() > 0.4 ? gold : pink;
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

  // Dust material
  const dustMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
  }, []);

  // Sparkle material
  const sparkleMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
  }, []);

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;

    // Animate dust particles — gentle floating
    if (dustRef.current) {
      const positions = dustRef.current.geometry.attributes.position.array;
      const phases = dustRef.current.geometry.attributes.phase.array;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const phase = phases[i];
        positions[i * 3] += Math.sin(elapsed * 0.1 + phase) * 0.003;
        positions[i * 3 + 1] += Math.cos(elapsed * 0.08 + phase * 1.3) * 0.002;
        positions[i * 3 + 2] += Math.sin(elapsed * 0.05 + phase * 0.7) * 0.001;
      }
      dustRef.current.geometry.attributes.position.needsUpdate = true;

      // Adjust dust opacity based on stage
      const targetOpacity = stage === 'void' || stage === 'loading'
        ? 0.35
        : stage === 'gathering'
        ? 0.5
        : stage === 'explosion'
        ? 0.6
        : 0.25;

      dustMaterial.opacity += (targetOpacity - dustMaterial.opacity) * 0.02;
    }

    // Animate sparkle particles — twinkle effect
    if (sparkleRef.current) {
      const positions = sparkleRef.current.geometry.attributes.position.array;

      for (let i = 0; i < SPARKLE_COUNT; i++) {
        positions[i * 3] += Math.sin(elapsed * 0.2 + i * 0.5) * 0.005;
        positions[i * 3 + 1] += Math.cos(elapsed * 0.15 + i * 0.7) * 0.004;
      }
      sparkleRef.current.geometry.attributes.position.needsUpdate = true;

      // Sparkles are more visible during gathering and explosion
      let targetOpacity = 0;
      if (stage === 'gathering') targetOpacity = 0.4 + Math.sin(elapsed * 2) * 0.1;
      else if (stage === 'explosion') targetOpacity = 0.7;
      else if (stage === 'letter' || stage === 'forever') targetOpacity = 0.15;

      sparkleMaterial.opacity += (targetOpacity - sparkleMaterial.opacity) * 0.03;
    }
  });

  return (
    <group>
      <points ref={dustRef} geometry={dustGeometry} material={dustMaterial} />
      <points ref={sparkleRef} geometry={sparkleGeometry} material={sparkleMaterial} />
    </group>
  );
}
