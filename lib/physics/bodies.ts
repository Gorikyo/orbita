import type { Body, Vec3 } from './types';

export const AU_KM = 149_597_870.7;
export const DAY_S = 86_400;
export const SUN_MU = 1.32712440018e11;

// Orbites circulaires, coplanaires ou faiblement inclinées. Les phases sont
// choisies pour rendre le scénario Terre → Mars → Jupiter facile à observer.
export const BODIES: Body[] = [
  { id: 'mercury', name: 'Mercure', color: '#9f9288', radiusKm: 2439.7, orbitRadiusKm: .387 * AU_KM, periodDays: 87.97, mu: 22032, phase: 2.1, inclination: .02 },
  { id: 'venus', name: 'Vénus', color: '#e5b96f', radiusKm: 6051.8, orbitRadiusKm: .723 * AU_KM, periodDays: 224.7, mu: 324859, phase: 4.3, inclination: .01 },
  { id: 'earth', name: 'Terre', color: '#4f9df8', radiusKm: 6371, orbitRadiusKm: AU_KM, periodDays: 365.256, mu: 398600.4, phase: 0, inclination: 0 },
  { id: 'mars', name: 'Mars', color: '#d96c43', radiusKm: 3389.5, orbitRadiusKm: 1.524 * AU_KM, periodDays: 686.98, mu: 42828.4, phase: .61903, inclination: 0 },
  { id: 'jupiter', name: 'Jupiter', color: '#d8aa78', radiusKm: 69911, orbitRadiusKm: 5.203 * AU_KM, periodDays: 4332.6, mu: 126686534, phase: 1.7, inclination: .018 },
  { id: 'saturn', name: 'Saturne', color: '#e9d19a', radiusKm: 58232, orbitRadiusKm: 9.537 * AU_KM, periodDays: 10759, mu: 37931187, phase: 3.05, inclination: .035 },
  { id: 'uranus', name: 'Uranus', color: '#8bd6df', radiusKm: 25362, orbitRadiusKm: 19.19 * AU_KM, periodDays: 30687, mu: 5793939, phase: 5.05, inclination: .014 },
  { id: 'neptune', name: 'Neptune', color: '#5679ee', radiusKm: 24622, orbitRadiusKm: 30.07 * AU_KM, periodDays: 60190, mu: 6836529, phase: .28, inclination: .03 },
];

export function getBody(id: string) {
  return BODIES.find((body) => body.id === id) ?? BODIES[2];
}

export function bodyState(body: Body, tSeconds: number): { position: Vec3; velocity: Vec3 } {
  const omega = (Math.PI * 2) / (body.periodDays * DAY_S);
  const angle = body.phase + omega * tSeconds;
  const zFactor = Math.sin(body.inclination);
  const position: Vec3 = [
    body.orbitRadiusKm * Math.cos(angle),
    body.orbitRadiusKm * Math.sin(angle),
    body.orbitRadiusKm * zFactor * Math.sin(angle * .7),
  ];
  const velocity: Vec3 = [
    -body.orbitRadiusKm * omega * Math.sin(angle),
    body.orbitRadiusKm * omega * Math.cos(angle),
    body.orbitRadiusKm * zFactor * .7 * omega * Math.cos(angle * .7),
  ];
  return { position, velocity };
}
