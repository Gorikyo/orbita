'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { BODIES } from '@/lib/physics/bodies';
import type { SimulationConfig } from '@/lib/physics/types';
import { Focus, Pause, Play, RotateCcw, Satellite } from 'lucide-react';

export function MissionControls({ config, onConfig, paused, onPaused, speed, onSpeed, follow, onFollow, localView, onLocalView, onReset, missionMode, onMissionMode }: {
  config: SimulationConfig; onConfig: (next: SimulationConfig) => void; paused: boolean; onPaused: (value: boolean) => void;
  speed: number; onSpeed: (value: number) => void; follow: boolean; onFollow: (value: boolean) => void;
  localView: boolean; onLocalView: (value: boolean) => void; onReset: () => void;
  missionMode: 'voyager2' | 'free'; onMissionMode: (value: 'voyager2' | 'free') => void;
}) {
  const locked = missionMode === 'voyager2';
  const planetSelect = (label: string, key: 'departureId' | 'targetId' | 'assistId') => (
    <label className="field"><span>{label}</span>
      <Select disabled={locked} value={config[key]} onValueChange={(value) => onConfig({ ...config, [key]: value as string })}>
        <SelectTrigger className="mission-select"><SelectValue /></SelectTrigger>
        <SelectContent>{BODIES.map((body) => <SelectItem key={body.id} value={body.id}>{body.name}</SelectItem>)}</SelectContent>
      </Select>
    </label>
  );
  return (
    <aside className="mission-panel">
      <div className="panel-heading"><span>Paramètres de mission</span><button onClick={onReset} aria-label="Réinitialiser le scénario"><RotateCcw /></button></div>
      <div className="scenario-tabs" aria-label="Choix du scénario">
        <button className={missionMode === 'voyager2' ? 'active' : ''} onClick={() => onMissionMode('voyager2')}>Voyager 2</button>
        <button className={missionMode === 'free' ? 'active' : ''} onClick={() => onMissionMode('free')}>Simulation libre</button>
      </div>
      {locked && <div className="historical-note"><strong>Grand Tour · 1977–1989</strong><span>Jupiter → Saturne → Uranus → Neptune</span></div>}
      <div className="select-grid">{planetSelect('Départ', 'departureId')}{planetSelect('Cible', 'targetId')}</div>
      {planetSelect('Assistance gravitationnelle', 'assistId')}
      <label className="field"><span>Date de départ</span><input disabled={locked} type="date" value={config.departureDate} onChange={(event) => onConfig({ ...config, departureDate: event.target.value })} /></label>
      <label className="field delta-field"><span>Impulsion initiale Δv <strong>{config.deltaV.toFixed(1)} km/s</strong></span>
        <Slider disabled={locked} min={1} max={15} step={.1} value={[config.deltaV]} onValueChange={(value) => onConfig({ ...config, deltaV: Array.isArray(value) ? value[0] : value })} />
      </label>
      <div className="panel-divider" />
      <div className="sim-row">
        <Button className="play-button" onClick={() => onPaused(!paused)}>{paused ? <Play /> : <Pause />}{paused ? 'Lancer' : 'Pause'}</Button>
        <div className="speed-buttons" aria-label="Vitesse de simulation">{[1, 10, 100, 1000].map((item) => <button className={speed === item ? 'active' : ''} onClick={() => onSpeed(item)} key={item}>×{item === 1000 ? '1k' : item}</button>)}</div>
      </div>
      <label className="toggle-row"><span><Satellite />Suivre la sonde</span><Switch checked={follow} onCheckedChange={onFollow} /></label>
      <label className="toggle-row"><span><Focus />Vue locale fly-by</span><Switch checked={localView} onCheckedChange={onLocalView} /></label>
      <p className="assumption">Modèle simplifié : orbites circulaires imposées, corps ponctuels et plan orbital quasi commun. Le rendu agrandit les planètes pour les rendre visibles.</p>
    </aside>
  );
}
