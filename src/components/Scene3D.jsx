import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import Hearts from './Hearts';
import Particles from './Particles';
import ExplosionEffect from './ExplosionEffect';
import { isLowPowerDevice } from '../utils/heartMath';

/**
 * CameraController — Animates the camera based on the current stage.
 * Creates cinematic dolly-in and shake effects.
 */
function CameraController({ stage }) {
  const { camera } = useThree();
  const shakeRef = useRef(0);
  const stageTimeRef = useRef(0);
  const prevStageRef = useRef(stage);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const elapsed = state.clock.elapsedTime;

    // Reset stage timer on change
    if (prevStageRef.current !== stage) {
      stageTimeRef.current = 0;
      prevStageRef.current = stage;
    }
    stageTimeRef.current += dt;

    let targetZ, targetX, targetY;

    switch (stage) {
      case 'loading':
      case 'void':
        targetZ = 22;
        targetX = Math.sin(elapsed * 0.08) * 0.5;
        targetY = Math.cos(elapsed * 0.06) * 0.3;
        break;

      case 'gathering':
        targetZ = 16;
        targetX = Math.sin(elapsed * 0.1) * 0.3;
        targetY = Math.cos(elapsed * 0.08) * 0.2 + 0.2;
        break;

      case 'explosion': {
        targetZ = 14;
        const explodeT = stageTimeRef.current;
        // Camera shake during explosion (starts at 2.6s)
        if (explodeT > 2.6 && explodeT < 4) {
          const intensity = Math.max(0, 1 - (explodeT - 2.6) * 0.7) * 0.15;
          targetX = (Math.random() - 0.5) * intensity;
          targetY = (Math.random() - 0.5) * intensity + 0.2;
        } else {
          targetX = Math.sin(elapsed * 0.1) * 0.2;
          targetY = 0.2;
        }
        break;
      }

      case 'letter':
      case 'forever':
        targetZ = 22;
        targetX = Math.sin(elapsed * 0.06) * 0.3;
        targetY = Math.cos(elapsed * 0.04) * 0.2;
        break;

      default:
        targetZ = 22;
        targetX = 0;
        targetY = 0;
    }

    // Smooth interpolation
    camera.position.x += (targetX - camera.position.x) * 0.03;
    camera.position.y += (targetY - camera.position.y) * 0.03;
    camera.position.z += (targetZ - camera.position.z) * 0.015;
    camera.lookAt(0, 0.2, 0);
  });

  return null;
}

/**
 * SceneLighting — Dynamic lighting that changes with stages.
 */
function SceneLighting({ stage }) {
  const pointLightRef = useRef();
  const pointLight2Ref = useRef();

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;

    if (pointLightRef.current) {
      // Main light pulses gently
      let intensity;
      switch (stage) {
        case 'void':
        case 'loading':
          intensity = 0.5 + Math.sin(elapsed * 0.5) * 0.1;
          break;
        case 'gathering':
          intensity = 0.8 + Math.sin(elapsed * 0.8) * 0.15;
          break;
        case 'explosion':
          intensity = 1.2 + Math.sin(elapsed * 2) * 0.3;
          break;
        default:
          intensity = 0.6 + Math.sin(elapsed * 0.3) * 0.1;
      }
      pointLightRef.current.intensity = intensity;
      pointLightRef.current.position.x = Math.sin(elapsed * 0.2) * 3;
      pointLightRef.current.position.y = 2 + Math.cos(elapsed * 0.15) * 1;
    }

    if (pointLight2Ref.current) {
      pointLight2Ref.current.position.x = Math.cos(elapsed * 0.18) * 4;
      pointLight2Ref.current.position.z = Math.sin(elapsed * 0.12) * 3;
    }
  });

  return (
    <>
      <ambientLight intensity={0.08} color="#1A0510" />
      <pointLight
        ref={pointLightRef}
        position={[0, 2, 5]}
        color="#FF7EB6"
        intensity={0.6}
        distance={30}
        decay={2}
      />
      <pointLight
        ref={pointLight2Ref}
        position={[-3, -1, 3]}
        color="#B0003A"
        intensity={0.4}
        distance={25}
        decay={2}
      />
      <pointLight
        position={[3, 3, -2]}
        color="#F6D99B"
        intensity={0.2}
        distance={20}
        decay={2}
      />
    </>
  );
}

/**
 * Scene3D — Main Three.js canvas with all 3D elements.
 */
export default function Scene3D({ stage, onStageComplete, onReady }) {
  const lowPower = useMemo(() => isLowPowerDevice(), []);

  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 0, 22], fov: 50, near: 0.1, far: 100 }}
        gl={{
          antialias: !lowPower,
          alpha: false,
          powerPreference: lowPower ? 'low-power' : 'high-performance',
          stencil: false,
        }}
        dpr={lowPower ? [1, 1.5] : [1, 2]}
        onCreated={({ gl }) => {
          gl.setClearColor('#020105');
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
          // Signal ready after first frame
          if (onReady) {
            requestAnimationFrame(() => onReady());
          }
        }}
      >
        <CameraController stage={stage} />
        <SceneLighting stage={stage} />

        <Hearts stage={stage} onStageComplete={onStageComplete} />
        <Particles stage={stage} />
        <ExplosionEffect active={stage === 'explosion'} />

        <EffectComposer multisampling={lowPower ? 0 : 4}>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.6}
            intensity={stage === 'explosion' ? 1.2 : 0.6}
            mipmapBlur
            radius={0.7}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
