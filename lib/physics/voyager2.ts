import { bodyState, DAY_S, getBody } from './bodies';
import { add, magnitude, normalize, scale, sub } from './vector';
import type { ProbeSample, Vec3 } from './types';

export const VOYAGER_2_LAUNCH = '1977-08-20';

export type MissionEncounter = {
  bodyId: string;
  label: string;
  date: string;
  day: number;
  kind: 'launch' | 'assist' | 'arrival';
};

const missionDay = (date: string) =>
  Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${VOYAGER_2_LAUNCH}T00:00:00Z`)) / (DAY_S * 1000));

// Dates de rencontre NASA/JPL. La courbe relie ces jalons historiques avec
// les orbites circulaires simplifiées du laboratoire : ce n'est pas une
// reconstruction d'éphémérides mission-grade.
export const VOYAGER_2_ENCOUNTERS: MissionEncounter[] = [
  { bodyId: 'earth', label: 'Lancement', date: VOYAGER_2_LAUNCH, day: 0, kind: 'launch' },
  { bodyId: 'jupiter', label: 'Jupiter', date: '1979-07-09', day: missionDay('1979-07-09'), kind: 'assist' },
  { bodyId: 'saturn', label: 'Saturne', date: '1981-08-25', day: missionDay('1981-08-25'), kind: 'assist' },
  { bodyId: 'uranus', label: 'Uranus', date: '1986-01-24', day: missionDay('1986-01-24'), kind: 'assist' },
  { bodyId: 'neptune', label: 'Neptune', date: '1989-08-25', day: missionDay('1989-08-25'), kind: 'arrival' },
];

function hermite(p0: Vec3, p1: Vec3, tangent0: Vec3, tangent1: Vec3, u: number): Vec3 {
  const u2 = u * u;
  const u3 = u2 * u;
  return add(
    add(scale(p0, 2 * u3 - 3 * u2 + 1), scale(tangent0, u3 - 2 * u2 + u)),
    add(scale(p1, -2 * u3 + 3 * u2), scale(tangent1, u3 - u2)),
  );
}

function segmentPosition(index: number, day: number): Vec3 {
  const start = VOYAGER_2_ENCOUNTERS[index];
  const end = VOYAGER_2_ENCOUNTERS[index + 1];
  const t0 = start.day * DAY_S;
  const t1 = end.day * DAY_S;
  const startState = bodyState(getBody(start.bodyId), t0);
  const endState = bodyState(getBody(end.bodyId), t1);
  const chord = magnitude(sub(endState.position, startState.position));
  const tangentScale = chord * .62;
  const tangent0 = scale(normalize(startState.velocity), tangentScale);
  const tangent1 = scale(normalize(endState.velocity), tangentScale);
  return hermite(startState.position, endState.position, tangent0, tangent1, (day - start.day) / (end.day - start.day));
}

export function simulateVoyager2(): ProbeSample[] {
  const lastDay = VOYAGER_2_ENCOUNTERS.at(-1)!.day;
  const positions: Vec3[] = [];
  let segment = 0;
  for (let day = 0; day <= lastDay; day += 1) {
    while (segment < VOYAGER_2_ENCOUNTERS.length - 2 && day > VOYAGER_2_ENCOUNTERS[segment + 1].day) segment += 1;
    positions.push(segmentPosition(segment, day));
  }
  return positions.map((position, index) => {
    const before = positions[Math.max(0, index - 1)];
    const after = positions[Math.min(positions.length - 1, index + 1)];
    const seconds = (index === 0 || index === positions.length - 1) ? DAY_S : DAY_S * 2;
    return { t: index * DAY_S, position, velocity: scale(sub(after, before), 1 / seconds) };
  });
}

export function voyagerFocusBody(tSeconds: number) {
  const day = tSeconds / DAY_S;
  return VOYAGER_2_ENCOUNTERS.slice(1).find((encounter) => encounter.day >= day)?.bodyId ?? 'neptune';
}
