'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls, Stars } from '@react-three/drei';
import { useMemo, useRef, type ElementRef } from 'react';
import * as THREE from 'three';
import { AU_KM, BODIES, bodyState, getBody } from '@/lib/physics/bodies';
import type { BodyPositionSeries, FlybyMetrics, ProbeSample, Vec3 } from '@/lib/physics/types';

const SCENE_PER_AU = 1.25;

function scenePoint(point: [number, number, number]): [number, number, number] {
  return [point[0] / AU_KM * SCENE_PER_AU, point[2] / AU_KM * SCENE_PER_AU, point[1] / AU_KM * SCENE_PER_AU];
}

function bodyPosition(bodyId: string, time: number, index: number, bodyPositions?: BodyPositionSeries): Vec3 {
  return bodyPositions?.[bodyId]?.[index] ?? bodyState(getBody(bodyId), time).position;
}

function PlanetSystem({ time, index, assistId, bodyPositions }: { time: number; index: number; assistId: string; bodyPositions?: BodyPositionSeries }) {
  return (
    <>
      {BODIES.map((body) => {
        const position = scenePoint(bodyPosition(body.id, time, index, bodyPositions));
        const orbitPoints: [number, number, number][] = Array.from({ length: 129 }, (_, i) => {
          const angle = i / 128 * Math.PI * 2;
          return [Math.cos(angle) * body.orbitRadiusKm / AU_KM * SCENE_PER_AU, 0, Math.sin(angle) * body.orbitRadiusKm / AU_KM * SCENE_PER_AU];
        });
        const visualRadius = Math.max(.026, Math.log10(body.radiusKm) * .018 - .045) * (body.id === assistId ? 1.18 : 1);
        return (
          <group key={body.id}>
            <Line points={orbitPoints} color={body.id === assistId ? '#ffb15a' : '#24334a'} transparent opacity={body.id === assistId ? .5 : .24} lineWidth={body.id === assistId ? 1.2 : .6} />
            <group position={position}>
              <mesh>
                <sphereGeometry args={[visualRadius, 24, 24]} />
                <meshStandardMaterial color={body.color} emissive={body.color} emissiveIntensity={.18} roughness={.75} />
              </mesh>
              {body.id === 'saturn' && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[visualRadius * 1.35, visualRadius * 2.05, 48]} />
                  <meshBasicMaterial color="#d9c38b" transparent opacity={.55} side={THREE.DoubleSide} />
                </mesh>
              )}
              <Html distanceFactor={4.5} position={[0, visualRadius + .04, 0]} center style={{ pointerEvents: 'none' }}>
                <span className={body.id === assistId ? 'planet-label assist' : 'planet-label'}>{body.name}</span>
              </Html>
            </group>
          </group>
        );
      })}
    </>
  );
}

function VelocityVectors({ samples, flyby, assistId, bodyPositions }: { samples: ProbeSample[]; flyby: FlybyMetrics; assistId: string; bodyPositions?: BodyPositionSeries }) {
  const helpers = useMemo(() => {
    const sample = samples[flyby.closestIndex];
    const origin = new THREE.Vector3(...scenePoint(bodyPosition(assistId, sample.t, flyby.closestIndex, bodyPositions)));
    const make = (v: [number, number, number], color: number) => {
      const mapped = new THREE.Vector3(v[0], v[2], v[1]).normalize();
      return new THREE.ArrowHelper(mapped, origin, .72, color, .12, .07);
    };
    return [make(flyby.incomingVelocity, 0x56d7ff), make(flyby.outgoingVelocity, 0xffad4f)];
  }, [assistId, bodyPositions, flyby, samples]);
  return <>{helpers.map((helper, index) => <primitive object={helper} key={index} />)}</>;
}

function CameraRig({ current, index, assistId, bodyPositions, follow, localView }: { current: ProbeSample; index: number; assistId: string; bodyPositions?: BodyPositionSeries; follow: boolean; localView: boolean }) {
  const { camera } = useThree();
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  useFrame(() => {
    const probe = new THREE.Vector3(...scenePoint(current.position));
    const assist = new THREE.Vector3(...scenePoint(bodyPosition(assistId, current.t, index, bodyPositions)));
    const target = localView ? assist : follow ? probe : null;
    if (target && controls.current) {
      controls.current.target.lerp(target, .08);
      if (localView) {
        const desired = target.clone().add(new THREE.Vector3(.55, .42, .7));
        camera.position.lerp(desired, .05);
      } else if (follow) {
        const desired = target.clone().add(new THREE.Vector3(1.1, .8, 1.25));
        camera.position.lerp(desired, .04);
      }
      controls.current.update();
    }
  });
  return <OrbitControls ref={controls} enableDamping dampingFactor={.08} minDistance={.25} maxDistance={75} />;
}

export function SpaceScene({ samples, index, flyby, assistId, bodyPositions, predictionStartIndex, follow, localView }: { samples: ProbeSample[]; index: number; flyby: FlybyMetrics; assistId: string; bodyPositions?: BodyPositionSeries; predictionStartIndex?: number; follow: boolean; localView: boolean }) {
  const { actualPath, plannedPath } = useMemo(() => {
    const allVisibleSamples = samples.slice(0, Math.max(index + 1, 2));
    const actualEnd = predictionStartIndex === undefined ? allVisibleSamples.length : Math.min(allVisibleSamples.length, predictionStartIndex + 1);
    const actualSamples = allVisibleSamples.slice(0, actualEnd);
    const plannedSamples = predictionStartIndex === undefined || allVisibleSamples.length <= predictionStartIndex ? [] : allVisibleSamples.slice(Math.max(0, predictionStartIndex - 1));
    const decimate = (items: ProbeSample[]) => {
      const stride = Math.max(1, Math.ceil(items.length / 3500));
      return items.filter((_, sampleIndex) => sampleIndex % stride === 0 || sampleIndex === items.length - 1).map((sample) => scenePoint(sample.position));
    };
    return { actualPath: decimate(actualSamples), plannedPath: decimate(plannedSamples) };
  }, [index, predictionStartIndex, samples]);
  const current = samples[index] ?? samples[0];
  const probePosition = scenePoint(current.position);

  return (
    <Canvas camera={{ position: [3.8, 4.6, 9.5], fov: 48 }} dpr={[1, 1.75]} gl={{ antialias: true }}>
      <color attach="background" args={['#05080d']} />
      <fog attach="fog" args={['#05080d', 18, 58]} />
      <ambientLight intensity={.26} />
      <pointLight position={[0, 0, 0]} intensity={28} color="#fff1bd" distance={18} decay={1.35} />
      <Stars radius={70} depth={35} count={2200} factor={2.2} saturation={.25} fade speed={.2} />
      <mesh>
        <sphereGeometry args={[.14, 32, 32]} />
        <meshBasicMaterial color="#ffd36b" />
      </mesh>
      <pointLight intensity={5} color="#ffb72e" />
      <PlanetSystem time={current.t} index={index} assistId={assistId} bodyPositions={bodyPositions} />
      {actualPath.length > 1 && <Line points={actualPath} color="#a8f0ff" lineWidth={2.1} transparent opacity={.9} />}
      {plannedPath.length > 1 && <Line points={plannedPath} color="#7aa8bd" lineWidth={1.8} dashed dashSize={.06} gapSize={.035} transparent opacity={.82} />}
      <mesh position={probePosition}>
        <sphereGeometry args={[.035, 16, 16]} />
        <meshBasicMaterial color="#f5fbff" />
      </mesh>
      <pointLight position={probePosition} intensity={1.2} color="#a7e8ff" distance={.8} />
      <VelocityVectors samples={samples} flyby={flyby} assistId={assistId} bodyPositions={bodyPositions} />
      <CameraRig current={current} index={index} assistId={assistId} bodyPositions={bodyPositions} follow={follow} localView={localView} />
    </Canvas>
  );
}
