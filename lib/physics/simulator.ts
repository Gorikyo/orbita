import { BODIES, DAY_S, SUN_MU, bodyState, getBody } from './bodies';
import { add, dot, magnitude, normalize, scale, sub } from './vector';
import type { BodyPositionSeries, FlybyMetrics, ProbeSample, SimulationConfig, Vec3 } from './types';

type State = { position: Vec3; velocity: Vec3 };

function acceleration(position: Vec3, t: number): Vec3 {
  const r = magnitude(position);
  let result = scale(position, -SUN_MU / Math.max(r * r * r, 1));

  // Modèle N-corps pédagogique : les planètes suivent leurs orbites imposées
  // et attirent la sonde, mais ne se perturbent pas entre elles.
  for (const body of BODIES) {
    const delta = sub(bodyState(body, t).position, position);
    const d = magnitude(delta);
    // Rayon de lissage numérique : évite une singularité si un réglage envoie
    // la sonde exactement au centre d'une planète.
    const softened = Math.max(d, body.radiusKm * 1.05);
    result = add(result, scale(delta, body.mu / (softened ** 3)));
  }
  return result;
}

function rk4(state: State, t: number, dt: number): State {
  const derivative = (s: State, time: number): State => ({
    position: s.velocity,
    velocity: acceleration(s.position, time),
  });
  const k1 = derivative(state, t);
  const k2 = derivative({ position: add(state.position, scale(k1.position, dt / 2)), velocity: add(state.velocity, scale(k1.velocity, dt / 2)) }, t + dt / 2);
  const k3 = derivative({ position: add(state.position, scale(k2.position, dt / 2)), velocity: add(state.velocity, scale(k2.velocity, dt / 2)) }, t + dt / 2);
  const k4 = derivative({ position: add(state.position, scale(k3.position, dt)), velocity: add(state.velocity, scale(k3.velocity, dt)) }, t + dt);
  return {
    position: add(state.position, scale(add(add(k1.position, scale(k2.position, 2)), add(scale(k3.position, 2), k4.position)), dt / 6)),
    velocity: add(state.velocity, scale(add(add(k1.velocity, scale(k2.velocity, 2)), add(scale(k3.velocity, 2), k4.velocity)), dt / 6)),
  };
}

export function simulate(config: SimulationConfig): ProbeSample[] {
  const departure = getBody(config.departureId);
  const departureState = bodyState(departure, 0);
  const prograde = normalize(departureState.velocity);
  let state: State = {
    // Le lancement atmosphérique n'est pas modélisé : la sonde démarre à la
    // sortie approximative de la sphère d'influence de la planète de départ.
    position: add(departureState.position, scale(normalize(departureState.position), Math.max(departure.radiusKm + 300, 925_000))),
    velocity: add(departureState.velocity, scale(prograde, config.deltaV)),
  };
  const result: ProbeSample[] = [];
  const dt = DAY_S / 24;
  const duration = 1100 * DAY_S;
  for (let t = 0; t <= duration; t += dt) {
    result.push({ t, position: state.position, velocity: state.velocity });
    state = rk4(state, t, dt);
    if (!Number.isFinite(state.position[0]) || magnitude(state.position) > 60 * 149_597_870.7) break;
  }
  return result;
}

export function analyzeFlyby(samples: ProbeSample[], assistId: string, bodyPositions?: BodyPositionSeries, expectedTime?: number): FlybyMetrics {
  const assist = getBody(assistId);
  const planetPosition = (index: number) => bodyPositions?.[assistId]?.[index] ?? bodyState(assist, samples[index].t).position;
  let closestIndex = 0;
  let distanceKm = Infinity;
  samples.forEach((sample, index) => {
    if (expectedTime !== undefined && Math.abs(sample.t - expectedTime) > 45 * DAY_S) return;
    const distance = magnitude(sub(sample.position, planetPosition(index)));
    if (distance < distanceKm) { distanceKm = distance; closestIndex = index; }
  });
  // Mesure quelques jours avant/après : assez loin de la rencontre, sans que
  // la décélération solaire de plusieurs semaines domine le bilan du fly-by.
  const sampleStep = samples[1]?.t - samples[0]?.t || DAY_S / 24;
  const span = Math.min(Math.max(1, Math.round(3 * DAY_S / sampleStep)), closestIndex, samples.length - closestIndex - 1);
  const beforeIndex = Math.max(0, closestIndex - span);
  const afterIndex = Math.min(samples.length - 1, closestIndex + span);
  const before = samples[beforeIndex];
  const after = samples[afterIndex];
  const planetVelocity = (index: number) => {
    if (!bodyPositions?.[assistId]) return bodyState(assist, samples[index].t).velocity;
    const lower = Math.max(0, index - 1);
    const upper = Math.min(samples.length - 1, index + 1);
    const elapsed = Math.max(1, samples[upper].t - samples[lower].t);
    return scale(sub(planetPosition(upper), planetPosition(lower)), 1 / elapsed);
  };
  const incomingVelocity = sub(before.velocity, planetVelocity(beforeIndex));
  const outgoingVelocity = sub(after.velocity, planetVelocity(afterIndex));
  const cosine = dot(normalize(incomingVelocity), normalize(outgoingVelocity));
  return {
    closestIndex,
    distanceKm,
    deflectionDeg: Math.acos(Math.min(1, Math.max(-1, cosine))) * 180 / Math.PI,
    heliocentricGain: magnitude(after.velocity) - magnitude(before.velocity),
    incomingVelocity,
    outgoingVelocity,
  };
}
