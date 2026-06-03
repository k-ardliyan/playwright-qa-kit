/// <reference types="node" />

import path from 'node:path';
import fs from 'node:fs';

const REQUIRED_PACKAGE_PATH = path.resolve(process.cwd(), 'node_modules', '@playwright', 'mcp');

function main(): void {
  if (!fs.existsSync(REQUIRED_PACKAGE_PATH)) {
    process.stderr.write(
      'ERROR: @playwright/mcp is not installed. Run: npm install @playwright/mcp\n',
    );
    process.exit(1);
  }
}

main();
