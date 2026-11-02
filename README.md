# Aetherway

A rune-chaining puzzle game for iPhone and iPad, built as a progressive web app. Inspired by the way
Big Fish's *4 Elements* plays, with its own name, art and code. No assets are copied from that game.

## How it plays
- Drag a line through 3 or more touching runes of one colour (diagonals count), then let go.
- Clearing a rune also removes the tile under it. Energy flows by itself through the open cells.
- Carve a channel from the source to every altar to win.
- Chains of 5 or more end in an explosion at the last rune. Longer chains make bigger explosions.
- Boulders block energy until an explosion, bomb or spade breaks them. Iron blocks are permanent.
- Frozen runes stay put until chained or blasted. Launchers fire beams when reached by energy or a blast.
- Power-ups charge from clearing one colour: spade (leaf), bomb (ember), swap (droplet), shuffle (wind).
- Four books (Earth, Water, Air, Fire) with 4 levels each. Boards are 12 x 16.
- Relaxed mode scores you on moves. Timed mode adds a countdown.

## Run it
```
node tools/serve.mjs
```
Open the address it prints (port 8090). No build step and no runtime dependencies.

Install and offline play on an iPhone need HTTPS. The game plays over plain Wi-Fi, but Safari only
enables the service worker on HTTPS, so upload these to an HTTPS host to test that part:
`index.html`, `manifest.webmanifest`, `sw.js`, `css/`, `js/`, `icons/`.

## Publish
No back end is needed: the game is static files, and progress is saved on each device.
`netlify.toml` builds with `node tools/build.mjs`, which copies only the game files into `dist/`.
Bump `VERSION` in `sw.js` before every release.

## Layout
| Path | Purpose |
|---|---|
| `js/engine.js` | Game rules. No DOM, seeded, and returns steps for the renderer to play. |
| `js/levels.js` | Books and level maps (legend at the top of the file). |
| `js/par.js` | 3-star move targets. Generated, do not edit. |
| `js/render.js` | Canvas drawing and animation. All art is drawn in code. |
| `js/audio.js` | Synthesised sound effects. |
| `js/game.js` | Screens, drag input, power-ups, saving, install tip. |
| `sw.js` | Offline cache. **Bump `VERSION` on every release.** |

## Checks
```
npm test                    # rules, plus "every shipped file is in the offline cache"
node tools/balance.mjs      # a bot plays every level; add --write to update par.js
node tools/e2e.mjs          # WebKit play-through at iPhone and iPad sizes, offline test in Chrome
```
Run `npm install` and `npx playwright install webkit` once before `e2e.mjs`.
Screenshots land in `tools/shots/`. Add `?debug` to the URL to expose `globalThis.aetherway`.
