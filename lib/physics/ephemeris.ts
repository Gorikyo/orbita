import type { BodyPositionSeries, ProbeSample, Vec3 } from './types';

export type RawEphemeris = {
  source: string;
  frame: string;
  startUtc: string;
  endUtc: string;
  times: number[];
  positions: number[][];
  velocities: number[][];
  bodies: Record<string, number[][]>;
};

export function samplesFromEphemeris(data: RawEphemeris): ProbeSample[] {
  return data.times.map((t, index) => ({
    t,
    position: data.positions[index] as Vec3,
    velocity: data.velocities[index] as Vec3,
  }));
}

export function bodyPositionsFromEphemeris(data: RawEphemeris): BodyPositionSeries {
  return data.bodies as BodyPositionSeries;
}
