# Orbita

Orbita est une application pédagogique interactive de mécanique spatiale en 3D. Elle permet d’explorer les trajectoires interplanétaires, les vitesses relatives et le principe de l’assistance gravitationnelle.

Le scénario principal rejoue le Grand Tour de Voyager 2 : Terre, Jupiter, Saturne, Uranus puis Neptune. Un mode libre propose également une simulation N-corps simplifiée intégrée avec RK4.

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
- orbites planétaires circulaires simplifiées ;
- gravitation newtonienne et intégration RK4 dans le mode libre ;
- tailles des planètes volontairement exagérées dans la vue 3D.

La reconstitution de Voyager 2 respecte les dates historiques NASA/JPL, mais ne constitue pas une reproduction d’éphémérides mission-grade.

## Publication

Le workflow GitHub Actions inclus construit automatiquement la version statique et la publie sur GitHub Pages après chaque modification de la branche `main`.
