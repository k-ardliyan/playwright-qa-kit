import fs from 'fs';
import path from 'path';

function findMdFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        [
          'node_modules',
          '.git',
          'dist',
          'artifacts',
          '.auth',
          'test-results',
          '.tmp',
          'brain',
        ].includes(entry.name)
      )
        continue;
      results.push(...findMdFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

function simplifyTableDelimiter(line: string): string {
  // Check if line is a table delimiter row like | --- | :---: | ------ |
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return line;

  const cells = trimmed.slice(1, -1).split('|');
  const isDelimiter = cells.every((c) => {
    const t = c.trim();
    return /^:?-+:?$/.test(t) && t.length >= 3;
  });

  if (!isDelimiter || cells.length === 0) return line;

  const simplifiedCells = cells.map((c) => {
    const t = c.trim();
    const leftColon = t.startsWith(':');
    const rightColon = t.endsWith(':');
    if (leftColon && rightColon) return ' :---: ';
    if (leftColon) return ' :--- ';
    if (rightColon) return ' ---: ';
    return ' --- ';
  });

  return `|${simplifiedCells.join('|')}|`;
}

function processFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  let changed = false;

  const newLines = lines.map((line) => {
    const simplified = simplifyTableDelimiter(line);
    if (simplified !== line) {
      changed = true;
      return simplified;
    }
    return line;
  });

  if (changed) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
    console.log(`Simplified tables in: ${path.relative(process.cwd(), filePath)}`);
  }
}

const mdFiles = findMdFiles(process.cwd());
console.log(`Found ${mdFiles.length} markdown files. Processing tables...`);
for (const file of mdFiles) {
  processFile(file);
}
console.log('Done.');
