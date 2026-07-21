/**
 * Unit tests for wizard-auth-template backup behavior
 * Run: npx tsx scripts/__tests__/wizard-auth-template.test.ts
 */
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { writeAuthSetup } from '../wizard-auth-template';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-setup-'));
const out = path.join(tmp, 'auth.setup.ts');

// first write
writeAuthSetup(
  {
    roles: [{ name: 'user', authFile: '.auth/user.json' }],
    loginUrl: '/login',
    successUrlPath: '/dashboard',
  },
  out,
);
assert.ok(fs.existsSync(out));
const v1 = fs.readFileSync(out, 'utf-8');
assert.ok(v1.includes('authenticate:user'));
assert.equal(fs.existsSync(out + '.bak'), false);

// second write should create .bak
writeAuthSetup(
  {
    roles: [
      { name: 'user', authFile: '.auth/user.json' },
      { name: 'finance', authFile: '.auth/finance.json' },
    ],
    loginUrl: '/login',
    successUrlPath: '/home',
  },
  out,
);
assert.ok(fs.existsSync(out + '.bak'));
const bak = fs.readFileSync(out + '.bak', 'utf-8');
assert.equal(bak, v1);
const v2 = fs.readFileSync(out, 'utf-8');
assert.ok(v2.includes('authenticate:finance'));
assert.ok(v2.includes('/home'));

fs.rmSync(tmp, { recursive: true, force: true });
process.stdout.write('wizard-auth-template backup tests passed\n');
