// Produce both browser deliverables from a built `dist/`:
//   - Chrome: a signed `.crx` and a store-upload `.zip`,
//   - Firefox: a Gecko-manifest `.xpi`.
// Everything lands in `artifacts/`. Expects `vite build` to have run first
// (the `package` npm script does that).
import { packCrx } from "./pack-crx.mjs";
import { packFirefox } from "./pack-firefox.mjs";
import { packXpi } from "./pack-xpi.mjs";

const { crxPath, zipPath } = await packCrx();
packFirefox();
const { xpiPath } = await packXpi();

console.log("\nPackaged:");
console.log(`  Chrome CRX:  ${crxPath}`);
console.log(`  Chrome ZIP:  ${zipPath} (Chrome Web Store upload)`);
console.log(`  Firefox XPI: ${xpiPath}`);
