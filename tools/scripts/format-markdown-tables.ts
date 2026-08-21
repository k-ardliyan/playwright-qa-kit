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

function splitRow(line: string): string[] {
  const trimmed = line.trim();
  let content = trimmed;
  if (content.startsWith('|')) content = content.slice(1);
  if (content.endsWith('|')) content = content.slice(0, -1);

  // Split by | while ignoring escaped \|
  const cells: string[] = [];
  let current = '';
  let escaped = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === '\\') {
      current += char;
      escaped = true;
    } else if (char === '|') {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function isDelimiterRow(cells: string[]): boolean {
  if (cells.length === 0) return false;
  return cells.every((c) => /^:?-+:?$/.test(c.trim()) && c.trim().replace(/:/g, '').length >= 1);
}

type Alignment = 'left' | 'center' | 'right' | 'none';

function getAlignment(delimiterCell: string): Alignment {
  const t = delimiterCell.trim();
  const left = t.startsWith(':');
  const right = t.endsWith(':');
  if (left && right) return 'center';
  if (left) return 'left';
  if (right) return 'right';
  return 'none';
}

function padCell(text: string, width: number, align: Alignment): string {
  const spaceNeeded = Math.max(0, width - text.length);
  if (align === 'right') {
    return ' '.repeat(spaceNeeded) + text;
  }
  if (align === 'center') {
    const leftPad = Math.floor(spaceNeeded / 2);
    const rightPad = spaceNeeded - leftPad;
    return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
  }
  // left or none
  return text + ' '.repeat(spaceNeeded);
}

function formatDelimiterCell(width: number, align: Alignment): string {
  const totalDashes = Math.max(3, width);
  if (align === 'center') {
    return ':' + '-'.repeat(Math.max(1, totalDashes - 2)) + ':';
  }
  if (align === 'left') {
    return ':' + '-'.repeat(Math.max(2, totalDashes - 1));
  }
  if (align === 'right') {
    return '-'.repeat(Math.max(2, totalDashes - 1)) + ':';
  }
  return '-'.repeat(totalDashes);
}

function formatTableBlock(lines: string[]): string[] {
  if (lines.length < 2) return lines;

  const rows = lines.map((line) => ({ raw: line, cells: splitRow(line) }));
  if (rows.length < 2) return lines;

  // Check if second row is delimiter
  const delimiterCells = rows[1].cells;
  if (!isDelimiterRow(delimiterCells)) {
    return lines;
  }

  // Determine num columns
  const numCols = Math.max(...rows.map((r) => r.cells.length));
  if (numCols === 0) return lines;

  // Determine alignments
  const alignments: Alignment[] = [];
  for (let c = 0; c < numCols; c++) {
    const dCell = delimiterCells[c] || '---';
    alignments.push(getAlignment(dCell));
  }

  // Calculate max width per column
  const colWidths: number[] = new Array(numCols).fill(3);
  for (let r = 0; r < rows.length; r++) {
    if (r === 1) continue; // Skip delimiter row for text width calculation
    for (let c = 0; c < numCols; c++) {
      const cellText = rows[r].cells[c] || '';
      colWidths[c] = Math.max(colWidths[c], cellText.length);
    }
  }

  // Format rows
  const formatted: string[] = [];
  for (let r = 0; r < rows.length; r++) {
    const isDelim = r === 1;
    const rowCells = rows[r].cells;
    const formattedCells: string[] = [];

    for (let c = 0; c < numCols; c++) {
      const align = alignments[c];
      const width = colWidths[c];
      if (isDelim) {
        formattedCells.push(formatDelimiterCell(width, align));
      } else {
        const cellText = rowCells[c] || '';
        formattedCells.push(padCell(cellText, width, align));
      }
    }

    formatted.push(`| ${formattedCells.join(' | ')} |`);
  }

  return formatted;
}

export function formatMarkdownTablesInText(content: string): string {
  const lines = content.split(/\r?\n/);
  const result: string[] = [];
  let inCodeBlock = false;
  let currentTable: string[] = [];

  const flushTable = () => {
    if (currentTable.length > 0) {
      result.push(...formatTableBlock(currentTable));
      currentTable = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check fenced code block
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      flushTable();
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }

    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    // Check if line looks like a table row: starts with | and has at least one internal |
    if (trimmed.startsWith('|') && trimmed.slice(1).includes('|')) {
      currentTable.push(line);
    } else {
      flushTable();
      result.push(line);
    }
  }

  flushTable();
  return result.join('\n');
}

function processFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const formatted = formatMarkdownTablesInText(content);

  if (formatted !== content) {
    fs.writeFileSync(filePath, formatted, 'utf-8');
    console.log(`✓ Formatted tables in: ${path.relative(process.cwd(), filePath)}`);
  }
}

if (require.main === module) {
  const mdFiles = findMdFiles(process.cwd());
  console.log(`Found ${mdFiles.length} markdown files. Formatting tables...`);
  for (const file of mdFiles) {
    processFile(file);
  }
  console.log('✨ All markdown tables formatted successfully.');
}
