import { DAY_S } from './bodies';
import { bodyPositionsFromEphemeris, samplesFromEphemeris, type RawEphemeris } from './ephemeris';
import juiceData from './data/juice.json';
import type { ProbeSample } from './types';
import type { MissionEncounter } from './voyager2';

export const JUICE_LAUNCH = '2023-04-14';
export const JUICE_ACTUAL_THROUGH = '2026-09-09';

const missionDay = (date: string) =>
  Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${JUICE_LAUNCH}T00:00:00Z`)) / (DAY_S * 1000));

// Calendrier de croisière ESA. La rencontre Lune–Terre est représentée par
// la Terre, la Lune n'étant pas un corps séparé dans cette vue héliocentrique.
export const JUICE_ENCOUNTERS: MissionEncounter[] = [
  { bodyId: 'earth', label: 'Lancement', date: JUICE_LAUNCH, day: 0, kind: 'launch' },
  { bodyId: 'earth', label: 'Lune–Terre', date: '2024-08-20', day: missionDay('2024-08-20'), kind: 'assist' },
  { bodyId: 'venus', label: 'Vénus', date: '2025-08-31', day: missionDay('2025-08-31'), kind: 'assist' },
  { bodyId: 'earth', label: 'Terre 2026', date: '2026-09-28', day: missionDay('2026-09-28'), kind: 'assist' },
  { bodyId: 'earth', label: 'Terre 2029', date: '2029-01-17', day: missionDay('2029-01-17'), kind: 'assist' },
  { bodyId: 'jupiter', label: 'Jupiter', date: '2031-07-21', day: missionDay('2031-07-21'), kind: 'arrival' },
];

const ephemeris = juiceData as RawEphemeris;

export const JUICE_BODY_POSITIONS = bodyPositionsFromEphemeris(ephemeris);

export function simulateJuice(): ProbeSample[] {
  return samplesFromEphemeris(ephemeris);
}

export function juiceFocusEncounter(tSeconds: number) {
  const day = tSeconds / DAY_S;
  return JUICE_ENCOUNTERS.slice(1).find((encounter) => encounter.day >= day) ?? JUICE_ENCOUNTERS.at(-1)!;
}

export function juiceFocusBody(tSeconds: number) {
  return juiceFocusEncounter(tSeconds).bodyId;
}
