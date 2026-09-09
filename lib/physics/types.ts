export type Vec3 = [number, number, number];

export type MissionMode = 'voyager2' | 'juice' | 'free';

export type Body = {
  id: string;
  name: string;
  color: string;
  radiusKm: number;
  orbitRadiusKm: number;
  periodDays: number;
  mu: number;
  phase: number;
  inclination: number;
};

export type SimulationConfig = {
  departureId: string;
  targetId: string;
  assistId: string;
  departureDate: string;
  deltaV: number;
};

export type ProbeSample = {
  t: number;
  position: Vec3;
  velocity: Vec3;
};

export type FlybyMetrics = {
  closestIndex: number;
  distanceKm: number;
  deflectionDeg: number;
  heliocentricGain: number;
  incomingVelocity: Vec3;
  outgoingVelocity: Vec3;
};
