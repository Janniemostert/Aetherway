// Copies only the files players need into dist/, which is what gets published.
// Run: node tools/build.mjs
import { cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SHIPPED = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'icons'];
const root = new URL('..', import.meta.url);
const dist = new URL('dist/', root);

rmSync(dist, { recursive: true, force: true });
for (const item of SHIPPED) {
  cpSync(fileURLToPath(new URL(item, root)), fileURLToPath(new URL(item, dist)), { recursive: true });
}
console.log(`Copied ${SHIPPED.length} items to dist/`);
