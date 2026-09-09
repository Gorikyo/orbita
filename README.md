# Orbita

Orbita est une application pédagogique interactive de mécanique spatiale en 3D. Elle permet d’explorer les trajectoires interplanétaires, les vitesses relatives et le principe de l’assistance gravitationnelle.

Les scénarios guidés rejouent le Grand Tour de Voyager 2 — Terre, Jupiter, Saturne, Uranus puis Neptune — et la croisière européenne JUICE vers Jupiter. Un mode libre propose également une simulation N-corps simplifiée intégrée avec RK4.

## Lancer le projet

```bash
npm install
npm run dev
```

Ouvrez ensuite l’adresse locale affichée dans le terminal.

## Modèle pédagogique

- distances en kilomètres ;
- temps en secondes ;
- vitesses en km/s ;
- trajectoires Voyager 2 et JUICE échantillonnées depuis les noyaux SPICE officiels NASA/JPL et ESA ;
- orbites planétaires circulaires simplifiées, gravitation newtonienne et intégration RK4 uniquement dans le mode libre ;
- tailles des planètes volontairement exagérées dans la vue 3D.

Pour JUICE, le trait plein distingue le trajet parcouru du trajet planifié en pointillé. Les données servent à la visualisation pédagogique et ne remplacent pas les produits de navigation des agences.

Les fichiers d’éphémérides intégrés peuvent être régénérés avec `scripts/generate_spice_ephemerides.py` à partir des noyaux SPICE téléchargés séparément.

## Publication

Le workflow GitHub Actions inclus construit automatiquement la version statique et la publie sur GitHub Pages après chaque modification de la branche `main`.
