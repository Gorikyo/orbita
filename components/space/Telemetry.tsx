import { bodyState, getBody } from '@/lib/physics/bodies';
import { magnitude, scale, sub } from '@/lib/physics/vector';
import type { BodyPositionSeries, FlybyMetrics, ProbeSample } from '@/lib/physics/types';
import { Gauge, Move3D, Orbit, Route } from 'lucide-react';

const formatDistance = (km: number) => km > 1e6 ? `${(km / 1e6).toFixed(2)} M km` : `${Math.round(km).toLocaleString('fr-FR')} km`;

export function Telemetry({ current, currentIndex, samples, flyby, assistId, bodyPositions }: { current: ProbeSample; currentIndex: number; samples: ProbeSample[]; flyby: FlybyMetrics; assistId: string; bodyPositions?: BodyPositionSeries }) {
  const calculatedState = bodyState(getBody(assistId), current.t);
  const planetPosition = bodyPositions?.[assistId]?.[currentIndex] ?? calculatedState.position;
  const lower = Math.max(0, currentIndex - 1);
  const upper = Math.min(samples.length - 1, currentIndex + 1);
  const elapsed = Math.max(1, samples[upper].t - samples[lower].t);
  const planetVelocity = bodyPositions?.[assistId]
    ? scale(sub(bodyPositions[assistId][upper], bodyPositions[assistId][lower]), 1 / elapsed)
    : calculatedState.velocity;
  const relative = sub(current.velocity, planetVelocity);
  const cards = [
    { label: 'Vitesse sonde', value: `${magnitude(current.velocity).toFixed(2)} km/s`, icon: Gauge },
    { label: `Distance · ${getBody(assistId).name}`, value: formatDistance(magnitude(sub(current.position, planetPosition))), icon: Route },
    { label: 'Vitesse relative', value: `${magnitude(relative).toFixed(2)} km/s`, icon: Move3D },
    { label: 'Vitesse héliocentrique', value: `${magnitude(current.velocity).toFixed(2)} km/s`, icon: Orbit },
  ];
  return (
    <div className="telemetry-grid">
      {cards.map(({ label, value, icon: Icon }) => (
        <div className="metric" key={label}>
          <Icon aria-hidden="true" />
          <div><span>{label}</span><strong>{value}</strong></div>
        </div>
      ))}
      <div className="flyby-summary">
        <div><span>Déflexion estimée</span><strong>{flyby.deflectionDeg.toFixed(1)}°</strong></div>
        <div><span>Effet héliocentrique</span><strong className={flyby.heliocentricGain >= 0 ? 'positive' : 'negative'}>{flyby.heliocentricGain >= 0 ? '+' : ''}{flyby.heliocentricGain.toFixed(2)} km/s</strong></div>
        <div><span>Passage minimal</span><strong>{formatDistance(flyby.distanceKm)}</strong></div>
      </div>
    </div>
  );
}
