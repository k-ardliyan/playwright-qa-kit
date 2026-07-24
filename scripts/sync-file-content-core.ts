/// <reference types="node" />
/**
 * Copy pure file-content-core into mcp-server package (MCP cannot import root TS).
 * Source of truth: src/support/pw/file-content-core.ts
 * Run automatically as part of `npm run mcp:build`.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const root = process.cwd();
const src = path.join(root, 'src', 'support', 'pw', 'file-content-core.ts');
const dest = path.join(root, 'mcp-server', 'src', 'utils', 'file-content-core.ts');

if (!fs.existsSync(src)) {
  console.error(`Source missing: ${src}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
const body = fs.readFileSync(src, 'utf8');
const banner =
  '/**\n' +
  ' * AUTO-SYNCED from src/support/pw/file-content-core.ts — do not edit by hand.\n' +
  ' * Run: npm run sync:file-core  (also runs inside npm run mcp:build)\n' +
  ' */\n\n';
// Strip existing auto banner if re-syncing from a previously bannered copy used as source by mistake
const stripped = body.replace(
  /^\/\*\*\n \* AUTO-SYNCED from src\/support\/pw\/file-content-core\.ts[\s\S]*?\*\/\n\n/,
  '',
);
fs.writeFileSync(dest, banner + stripped, 'utf8');
console.log(`✓ Synced file-content-core → mcp-server/src/utils/file-content-core.ts`);
