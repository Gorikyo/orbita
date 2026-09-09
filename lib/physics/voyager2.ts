import { DAY_S } from './bodies';
import { bodyPositionsFromEphemeris, samplesFromEphemeris, type RawEphemeris } from './ephemeris';
import voyagerData from './data/voyager2.json';
import type { ProbeSample } from './types';

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

// Dates de rencontre NASA/JPL, affichées sur la trajectoire SPICE officielle.
export const VOYAGER_2_ENCOUNTERS: MissionEncounter[] = [
  { bodyId: 'earth', label: 'Lancement', date: VOYAGER_2_LAUNCH, day: 0, kind: 'launch' },
  { bodyId: 'jupiter', label: 'Jupiter', date: '1979-07-09', day: missionDay('1979-07-09'), kind: 'assist' },
  { bodyId: 'saturn', label: 'Saturne', date: '1981-08-25', day: missionDay('1981-08-25'), kind: 'assist' },
  { bodyId: 'uranus', label: 'Uranus', date: '1986-01-24', day: missionDay('1986-01-24'), kind: 'assist' },
  { bodyId: 'neptune', label: 'Neptune', date: '1989-08-25', day: missionDay('1989-08-25'), kind: 'arrival' },
];

const ephemeris = voyagerData as RawEphemeris;

export const VOYAGER_2_BODY_POSITIONS = bodyPositionsFromEphemeris(ephemeris);

export function simulateVoyager2(): ProbeSample[] {
  return samplesFromEphemeris(ephemeris);
}

export function voyagerFocusEncounter(tSeconds: number) {
  const day = tSeconds / DAY_S;
  return VOYAGER_2_ENCOUNTERS.slice(1).find((encounter) => encounter.day >= day) ?? VOYAGER_2_ENCOUNTERS.at(-1)!;
}

export function voyagerFocusBody(tSeconds: number) {
  return voyagerFocusEncounter(tSeconds).bodyId;
}
