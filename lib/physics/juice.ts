import { bodyState, DAY_S, getBody } from './bodies';
import { add, magnitude, normalize, scale, sub } from './vector';
import type { ProbeSample, Vec3 } from './types';
import type { MissionEncounter } from './voyager2';

export const JUICE_LAUNCH = '2023-04-14';

const missionDay = (date: string) =>
  Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${JUICE_LAUNCH}T00:00:00Z`)) / (DAY_S * 1000));

// Calendrier de croisière ESA. La rencontre Lune–Terre est représentée par
// la Terre, la Lune n'étant pas un corps séparé dans le modèle héliocentrique.
// La géométrie entre les jalons est une interpolation pédagogique, pas une
// restitution des éphémérides opérationnelles de JUICE.
export const JUICE_ENCOUNTERS: MissionEncounter[] = [
  { bodyId: 'earth', label: 'Lancement', date: JUICE_LAUNCH, day: 0, kind: 'launch' },
  { bodyId: 'earth', label: 'Lune–Terre', date: '2024-08-20', day: missionDay('2024-08-20'), kind: 'assist' },
  { bodyId: 'venus', label: 'Vénus', date: '2025-08-31', day: missionDay('2025-08-31'), kind: 'assist' },
  { bodyId: 'earth', label: 'Terre 2026', date: '2026-09-27', day: missionDay('2026-09-27'), kind: 'assist' },
  { bodyId: 'earth', label: 'Terre 2029', date: '2029-01-17', day: missionDay('2029-01-17'), kind: 'assist' },
  { bodyId: 'jupiter', label: 'Jupiter', date: '2031-07-21', day: missionDay('2031-07-21'), kind: 'arrival' },
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
  const start = JUICE_ENCOUNTERS[index];
  const end = JUICE_ENCOUNTERS[index + 1];
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

export function simulateJuice(): ProbeSample[] {
  const lastDay = JUICE_ENCOUNTERS.at(-1)!.day;
  const positions: Vec3[] = [];
  let segment = 0;
  for (let day = 0; day <= lastDay; day += 1) {
    while (segment < JUICE_ENCOUNTERS.length - 2 && day > JUICE_ENCOUNTERS[segment + 1].day) segment += 1;
    positions.push(segmentPosition(segment, day));
  }
  return positions.map((position, index) => {
    const before = positions[Math.max(0, index - 1)];
    const after = positions[Math.min(positions.length - 1, index + 1)];
    const seconds = (index === 0 || index === positions.length - 1) ? DAY_S : DAY_S * 2;
    return { t: index * DAY_S, position, velocity: scale(sub(after, before), 1 / seconds) };
  });
}

export function juiceFocusBody(tSeconds: number) {
  const day = tSeconds / DAY_S;
  return JUICE_ENCOUNTERS.slice(1).find((encounter) => encounter.day >= day)?.bodyId ?? 'jupiter';
}
