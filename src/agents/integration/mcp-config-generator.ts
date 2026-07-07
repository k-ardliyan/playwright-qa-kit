/**
 * Cross-Platform MCP Config Generator
 *
 * Reads the root `.mcp.json` (source of truth) and transforms server definitions
 * into platform-specific formats for Copilot, Claude, Cursor, and Kiro.
 *
 * Includes drift detection via SHA-256 hash comparison.
 *
 * @module agents/integration/mcp-config-generator
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * A single MCP server definition as declared in the source `.mcp.json`.
 */
export interface McpServerDefinition {
  name: string;
  command: string;
  args: string[];
}

/**
 * Supported AI client platforms.
 */
export type Platform = 'copilot' | 'claude' | 'cursor' | 'kiro';

/**
 * Options for the config generator.
 */
export interface ConfigGeneratorOptions {
  /** Target platform. If undefined, generates for all platforms (except copilot). */
  platform?: Platform;
  /** Path to the source `.mcp.json`. Defaults to `.mcp.json` at repo root. */
  sourceConfigPath?: string;
  /** Output directory root. Defaults to repo root (process.cwd()). */
  outputDir?: string;
}

/**
 * Result of drift detection across platform configs.
 */
export interface DriftResult {
  outdated: Platform[];
  upToDate: Platform[];
}

/**
 * All supported platforms.
 */
export const ALL_PLATFORMS: Platform[] = ['copilot', 'claude', 'cursor', 'kiro'];

/**
 * Platforms that get generated configs (excludes copilot since it IS the source).
 */
const GENERATED_PLATFORMS: Platform[] = ['claude', 'cursor', 'kiro'];

/**
 * Resolve the default source config path.
 */
function resolveSourcePath(sourceConfigPath?: string): string {
  return path.resolve(sourceConfigPath || '.mcp.json');
}

/**
 * Read and parse the source `.mcp.json` file.
 *
 * @param sourceConfigPath - Path to the source config. Defaults to `.mcp.json`.
 * @returns Array of MCP server definitions.
 * @throws If the file does not exist or is invalid JSON.
 */
export function readSourceConfig(sourceConfigPath?: string): McpServerDefinition[] {
  const filePath = resolveSourcePath(sourceConfigPath);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Source config not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(content);

  if (!parsed.servers || !Array.isArray(parsed.servers)) {
    throw new Error(`Invalid source config: expected "servers" array in ${filePath}`);
  }

  return parsed.servers as McpServerDefinition[];
}

/**
 * Compute SHA-256 hash of the source config file content.
 *
 * @param sourceConfigPath - Path to the source config. Defaults to `.mcp.json`.
 * @returns Hex-encoded SHA-256 hash string.
 */
export function computeSourceHash(sourceConfigPath?: string): string {
  const filePath = resolveSourcePath(sourceConfigPath);
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Transform server definitions into Copilot format.
 * Copilot uses the same format as the source: `{ servers: [...] }`.
 *
 * Since `.mcp.json` IS the source, this returns the source format as-is
 * (for validation purposes). It does NOT overwrite the source file.
 */
export function transformCopilot(servers: McpServerDefinition[], hash: string): object {
  return {
    _sourceHash: hash,
    servers: servers.map((s) => ({
      name: s.name,
      command: s.command,
      args: [...s.args],
    })),
  };
}

/**
 * Transform server definitions into Claude format.
 * Claude uses: `{ mcpServers: { name: { command, args } } }`
 */
export function transformClaude(servers: McpServerDefinition[], hash: string): object {
  const mcpServers: Record<string, { command: string; args: string[] }> = {};
  for (const server of servers) {
    mcpServers[server.name] = {
      command: server.command,
      args: [...server.args],
    };
  }
  return { _sourceHash: hash, mcpServers };
}

/**
 * Transform server definitions into Cursor format.
 * Cursor uses: `{ mcpServers: { name: { command, args } } }` (same structure as Claude, different path).
 */
export function transformCursor(servers: McpServerDefinition[], hash: string): object {
  const mcpServers: Record<string, { command: string; args: string[] }> = {};
  for (const server of servers) {
    mcpServers[server.name] = {
      command: server.command,
      args: [...server.args],
    };
  }
  return { _sourceHash: hash, mcpServers };
}

/**
 * Transform server definitions into Kiro format.
 * Kiro uses: `{ mcpServers: { name: { command, args } } }` (same structure as Claude, different path).
 */
export function transformKiro(servers: McpServerDefinition[], hash: string): object {
  const mcpServers: Record<string, { command: string; args: string[] }> = {};
  for (const server of servers) {
    mcpServers[server.name] = {
      command: server.command,
      args: [...server.args],
    };
  }
  return { _sourceHash: hash, mcpServers };
}

/**
 * Get the output file path for a given platform, relative to the output directory.
 */
export function getOutputPath(platform: Platform, outputDir: string): string {
  switch (platform) {
    case 'copilot':
      return path.join(outputDir, '.mcp.json');
    case 'claude':
      return path.join(outputDir, 'claude_desktop_config.json');
    case 'cursor':
      return path.join(outputDir, '.cursor', 'mcp.json');
    case 'kiro':
      return path.join(outputDir, '.kiro', 'mcp.json');
  }
}

/**
 * Get the transformer function for a given platform.
 */
function getTransformer(
  platform: Platform,
): (servers: McpServerDefinition[], hash: string) => object {
  switch (platform) {
    case 'copilot':
      return transformCopilot;
    case 'claude':
      return transformClaude;
    case 'cursor':
      return transformCursor;
    case 'kiro':
      return transformKiro;
  }
}

/**
 * Generate platform-specific MCP configuration files.
 *
 * - If `platform` is specified, generates only for that platform.
 * - If `platform` is 'copilot', validates the source exists and returns it (no overwrite).
 * - If no platform is specified, generates for all platforms except copilot.
 *
 * @param options - Configuration options.
 */
export function generateConfig(options?: ConfigGeneratorOptions): void {
  const sourceConfigPath = options?.sourceConfigPath;
  const outputDir = path.resolve(options?.outputDir || '.');
  const platform = options?.platform;

  const servers = readSourceConfig(sourceConfigPath);
  const hash = computeSourceHash(sourceConfigPath);

  if (platform) {
    if (platform === 'copilot') {
      // For copilot, just validate the source exists — don't overwrite it
      // The source .mcp.json IS the copilot config
      return;
    }
    writePlatformConfig(platform, servers, hash, outputDir);
  } else {
    // Generate all platforms except copilot
    for (const p of GENERATED_PLATFORMS) {
      writePlatformConfig(p, servers, hash, outputDir);
    }
  }
}

/**
 * Write a single platform config to disk.
 */
function writePlatformConfig(
  platform: Platform,
  servers: McpServerDefinition[],
  hash: string,
  outputDir: string,
): void {
  const transformer = getTransformer(platform);
  const config = transformer(servers, hash);
  const outputPath = getOutputPath(platform, outputDir);

  // Ensure the output directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Detect configuration drift by comparing the `_sourceHash` in each platform config
 * against the current hash of the source `.mcp.json`.
 *
 * @param options - Configuration options.
 * @returns Object with `outdated` and `upToDate` platform arrays.
 */
export function detectDrift(options?: ConfigGeneratorOptions): DriftResult {
  const sourceConfigPath = options?.sourceConfigPath;
  const outputDir = path.resolve(options?.outputDir || '.');

  const currentHash = computeSourceHash(sourceConfigPath);

  const outdated: Platform[] = [];
  const upToDate: Platform[] = [];

  for (const platform of ALL_PLATFORMS) {
    const configPath = getOutputPath(platform, outputDir);

    if (platform === 'copilot') {
      // Copilot's config IS the source — always considered up-to-date
      upToDate.push(platform);
      continue;
    }

    if (!fs.existsSync(configPath)) {
      // Config doesn't exist yet — consider it outdated
      outdated.push(platform);
      continue;
    }

    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed._sourceHash === currentHash) {
        upToDate.push(platform);
      } else {
        outdated.push(platform);
      }
    } catch {
      // Can't parse the config — consider it outdated
      outdated.push(platform);
    }
  }

  return { outdated, upToDate };
}
