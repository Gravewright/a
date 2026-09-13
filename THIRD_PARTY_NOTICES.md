# Third-party notices

Gravewright 3D Dice is a modified adaptation, distributed under GNU AGPL version 3.
Gravewright integration and renderer adapters: Copyright (C) 2026 Gravewright contributors.
No warranty. See LICENSE.md. Corresponding source: https://github.com/Gravewright/Gravewright-3D-Dice

## Dice So Nice

Reference: https://gitlab.com/riccisi/foundryvtt-dice-so-nice
Upstream revision: 68dfefaf63133c38e91a43758f2f6b9de498668c (package version 6.2.9).
Authors: Simone Ricciardi and JDW, with contributors including Aioros and Steve Barnett.
License: GNU Affero General Public License version 3 (LICENSE.md copied verbatim).

`src/vendor/shapes.js` extracts the unmodified `DICE_SHAPE` declarations from
`module/engine/DiceModels.js`. `src/physics.js` adapts the fixed-step Cannon
simulation, contact materials, sleeping and transform-buffer replay described
in `module/web-workers/PhysicsWorker.js` and `module/engine/ThrowEngine.js`.
`src/geometry.js` and the renderer adapt forced-result face mapping to the
Gravewright server's facts. These files are modified implementations, not the
upstream Foundry integration. No Foundry APIs, branding, theme/model presets,
textures, personalization UI, Proton effects, or sound recordings are included.

Upstream credits: Anton Natarov's Online 3D Dice Roller and MajorVictory's fork;
Greewi for d10 geometry (https://feerie.net); Steve Barnett for d14/d16/d24/d30.

## Libraries

- Three.js 0.184.0 — MIT, Copyright Three.js authors. https://github.com/mrdoob/three.js
- cannon-es 0.20.0 — MIT, Copyright cannon.js/cannon-es contributors. https://github.com/pmndrs/cannon-es

Unmodified dependency licenses are included in the built package under LICENSES.
`package-lock.json` pins the build inputs. Sound impacts are synthesized by this
module using Web Audio and contain no recordings from upstream or other sites.

## Fonts

Atkinson Hyperlegible, Noto Sans, Noto Serif, IBM Plex Mono and Montserrat are
bundled without modification from the Google Fonts repository. Each is under
SIL Open Font License 1.1, with its original copyright and reserved-font-name
notice in its individual LICENSES/*-OFL.txt file. No font is renamed or sold by
itself. The `gw3d-*` names are internal CSS aliases, not modified font names.
Exact upstream commit URLs are recorded in assets/fonts/sources.json.

- https://github.com/google/fonts/tree/main/ofl/atkinsonhyperlegible
- https://github.com/google/fonts/tree/main/ofl/notosans
- https://github.com/google/fonts/tree/main/ofl/notoserif
- https://github.com/google/fonts/tree/main/ofl/ibmplexmono
- https://github.com/google/fonts/tree/main/ofl/montserrat
