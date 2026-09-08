'use client';

import { useEffect, useMemo, useState } from 'react';
import { Info, MousePointer2, Rewind, RotateCcw, Sparkles } from 'lucide-react';
import { SpaceScene } from '@/components/space/SpaceScene';
import { MissionControls } from '@/components/space/MissionControls';
import { Telemetry } from '@/components/space/Telemetry';
import { DAY_S, getBody } from '@/lib/physics/bodies';
import { analyzeFlyby, simulate } from '@/lib/physics/simulator';
import type { SimulationConfig } from '@/lib/physics/types';
import { simulateVoyager2, VOYAGER_2_ENCOUNTERS, VOYAGER_2_LAUNCH, voyagerFocusBody } from '@/lib/physics/voyager2';

const FREE_CONFIG: SimulationConfig = { departureId: 'earth', targetId: 'jupiter', assistId: 'mars', departureDate: '2028-09-18', deltaV: 8.8 };
const VOYAGER_CONFIG: SimulationConfig = { departureId: 'earth', targetId: 'neptune', assistId: 'jupiter', departureDate: VOYAGER_2_LAUNCH, deltaV: 10.4 };

export default function Home() {
  const [missionMode, setMissionMode] = useState<'voyager2' | 'free'>('voyager2');
  const [config, setConfig] = useState(VOYAGER_CONFIG);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(true);
  const [speed, setSpeed] = useState(10);
  const [follow, setFollow] = useState(true);
  const [localView, setLocalView] = useState(false);
  const samples = useMemo(() => missionMode === 'voyager2' ? simulateVoyager2() : simulate(config), [config, missionMode]);
  const current = samples[Math.min(index, samples.length - 1)];
  const activeAssistId = missionMode === 'voyager2' ? voyagerFocusBody(current.t) : config.assistId;
  const flyby = useMemo(() => analyzeFlyby(samples, activeAssistId), [samples, activeAssistId]);

  useEffect(() => setIndex(0), [samples]);
  useEffect(() => {
    if (paused) return;
    let frame = 0;
    let last = performance.now();
    let carry = 0;
    const samplesPerDay = missionMode === 'voyager2' ? 1 : 24;
    const tick = (now: number) => {
      const elapsed = (now - last) / 1000;
      last = now;
      carry += elapsed * speed * .25 * samplesPerDay;
      const steps = Math.floor(carry);
      if (steps > 0) {
        carry -= steps;
        setIndex((value) => Math.min(samples.length - 1, value + steps));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused, speed, samples.length, missionMode]);

  const elapsedDays = current.t / DAY_S;
  const progress = index / Math.max(samples.length - 1, 1) * 100;
  const closeToFlyby = Math.abs(current.t - samples[flyby.closestIndex].t) < 5 * DAY_S;
  const findIndexAt = (time: number) => samples.findIndex((sample) => sample.t >= Math.max(0, time));
  const reset = () => { setConfig(missionMode === 'voyager2' ? VOYAGER_CONFIG : FREE_CONFIG); setIndex(0); setPaused(true); setSpeed(10); setFollow(missionMode === 'voyager2'); setLocalView(false); };
  const changeMissionMode = (mode: 'voyager2' | 'free') => {
    setMissionMode(mode); setConfig(mode === 'voyager2' ? VOYAGER_CONFIG : FREE_CONFIG); setIndex(0); setPaused(true); setFollow(mode === 'voyager2'); setLocalView(false);
  };
  const replayFlyby = () => {
    setIndex(Math.max(0, findIndexAt(samples[flyby.closestIndex].t - 4 * DAY_S)));
    setSpeed(10);
    setLocalView(true);
    setPaused(false);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Sparkles /></div><div><strong>ORBITA</strong><span>Laboratoire de mécanique spatiale</span></div></div>
        <div className="mission-title"><span>{missionMode === 'voyager2' ? 'Mission historique · Grand Tour' : 'Simulation libre'}</span><h1>{missionMode === 'voyager2' ? <>Voyager 2 · Terre <b>→</b> Jupiter <b>→</b> Saturne <b>→</b> Uranus <b>→</b> Neptune</> : <>{getBody(config.departureId).name} <b>→</b> {getBody(config.assistId).name} <b>→</b> {getBody(config.targetId).name}</>}</h1></div>
        <div className="status"><i className={paused ? '' : 'running'} />{paused ? 'Simulation en pause' : 'Simulation active'}</div>
      </header>

      <section className="workspace">
        <MissionControls config={missionMode === 'voyager2' ? { ...config, assistId: activeAssistId } : config} onConfig={setConfig} paused={paused} onPaused={setPaused} speed={speed} onSpeed={setSpeed} follow={follow} onFollow={setFollow} localView={localView} onLocalView={setLocalView} onReset={reset} missionMode={missionMode} onMissionMode={changeMissionMode} />
        <div className="viewport-wrap">
          <SpaceScene samples={samples} index={Math.min(index, samples.length - 1)} flyby={flyby} assistId={activeAssistId} follow={follow} localView={localView} />
          <div className="viewport-topline"><span>Vue héliocentrique 3D</span><span><MousePointer2 /> Glisser pour tourner · molette pour zoomer</span></div>
          <div className="legend"><span><i className="probe-dot" />Sonde</span><span><i className="in-vector" />Vitesse avant</span><span><i className="out-vector" />Vitesse après</span></div>
          {closeToFlyby && !localView && <button className="flyby-callout" onClick={() => setLocalView(true)}><span className="focus-icon">◎</span><span><strong>Rencontre planétaire</strong>Ouvrir la vue locale de {getBody(activeAssistId).name}</span></button>}
          <div className="time-card"><span>Temps de mission</span><strong>J + {elapsedDays.toFixed(1)}</strong><small>{new Date(new Date(config.departureDate).getTime() + elapsedDays * 86400000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</small></div>
        </div>
        <aside className="data-panel">
          <div className="panel-heading"><span>Télémétrie en direct</span><i className={paused ? '' : 'live'}>LIVE</i></div>
          <Telemetry current={current} flyby={flyby} assistId={activeAssistId} />
          <div className="explain-card"><Info /><div><strong>{missionMode === 'voyager2' ? 'Reconstitution Voyager 2' : 'Comment lire le fly-by ?'}</strong><p>{missionMode === 'voyager2' ? 'La courbe suit les dates historiques NASA/JPL dans notre système d’orbites simplifiées. Les rencontres sont fidèles à la chronologie, pas aux éphémérides exactes.' : 'La planète courbe la vitesse relative de la sonde. Comme elle se déplace autour du Soleil, cette rotation peut modifier la vitesse héliocentrique sans moteur.'}</p></div></div>
          <div className="vector-key"><span><i className="vector-line before" />Vecteur entrant</span><span><i className="vector-line after" />Vecteur sortant</span></div>
        </aside>
      </section>
      <footer className="timeline">
        <div className="timeline-label"><span>Progression</span><strong>{progress.toFixed(0)} %</strong></div>
        <div className="timeline-actions">
          <button onClick={() => { setPaused(true); setIndex(Math.max(0, findIndexAt(current.t - 10 * DAY_S))); }}><Rewind />−10 jours</button>
          <button className="replay" onClick={replayFlyby}><RotateCcw />Rejouer le survol</button>
        </div>
        <div className="track">
          <div style={{ width: `${progress}%` }} />
          <span className="track-thumb" style={{ left: `${progress}%` }} />
          <input aria-label="Position dans la mission" type="range" min={0} max={samples.length - 1} value={index} onPointerDown={() => setPaused(true)} onChange={(event) => setIndex(Number(event.target.value))} />
        </div>
        <div className={missionMode === 'voyager2' ? 'milestones voyager' : 'milestones'}>
          {missionMode === 'voyager2' ? VOYAGER_2_ENCOUNTERS.map((encounter) => <span key={encounter.bodyId} style={{ left: `${encounter.day / VOYAGER_2_ENCOUNTERS.at(-1)!.day * 100}%` }}>{encounter.label}</span>) : <><span>Départ</span><span style={{ left: `${flyby.closestIndex / samples.length * 100}%` }}>Assistance · {getBody(config.assistId).name}</span><span>Arrivée théorique</span></>}
        </div>
      </footer>
    </main>
  );
}
