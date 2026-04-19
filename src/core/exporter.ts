/**
 * Project. — ExportService (M5)
 *
 * Provides two export formats:
 *   - zip        : full vault archived as a .zip file
 *   - md-bundle  : all .md files concatenated with YAML front-matter separators
 *
 * Both methods write to an output path and return that path on success.
 *
 * Note: `archiver` is a CommonJS module resolved from the M5 deps directory.
 * We import it via createRequire since the project uses ESM (Node16).
 */

import { createWriteStream } from 'node:fs';
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { createRequire } from 'node:module';
import { VaultReader } from './vault-reader.js';

// ── Dynamic require for CommonJS archiver ──────────────────────────────────
const require = createRequire(import.meta.url);

// At runtime we resolve archiver from either:
//   1. node_modules (installed normally)
//   2. the M5 session-local deps (Shadow Cloud workaround)
function loadArchiver(): typeof import('archiver') {
  const candidates = [
    'archiver',
    '/sessions/zen-focused-keller/tmp/m5_deps/node_modules/archiver/index.js',
  ];
  for (const c of candidates) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return require(c) as typeof import('archiver');
    } catch {
      // try next
    }
  }
  throw new Error('archiver package not found — run: npm install archiver');
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Walk a directory recursively, skipping .project/ internals */
async function walkVault(dir: string, base: string = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    // Skip hidden / internal dirs
    if (e.name === '.project' || e.name === 'node_modules' || e.name.startsWith('.git')) continue;
    if (e.isDirectory()) {
      files.push(...(await walkVault(full, base)));
    } else {
      files.push(full);
    }
  }
  return files;
}

// ── ExportService ────────────────────────────────────────────────────────────

export class ExportService {
  private reader: VaultReader;

  constructor(private vaultRoot: string) {
    this.reader = new VaultReader(vaultRoot);
  }

  /**
   * Export the vault as a .zip archive.
   * Includes all files (except .project/ internals and node_modules).
   * Appends a generated `project-index.json` at the root of the archive.
   */
  async exportZip(outPath: string): Promise<string> {
    const archiver = loadArchiver();
    const graph = await this.reader.scan();
    const indexJson = JSON.stringify(
      {
        name: graph.name,
        exportedAt: new Date().toISOString(),
        nodeCount: graph.nodes.length,
        nodes: graph.nodes.map((n) => ({ path: n.path, type: n.metadata.type, gravity: n.metadata.gravity })),
      },
      null,
      2,
    );

    return new Promise<string>((resolve, reject) => {
      const output = createWriteStream(outPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve(outPath));
      archive.on('error', reject);

      archive.pipe(output);

      // Add vault files
      archive.glob('**/*', {
        cwd: this.vaultRoot,
        ignore: ['.project/**', 'node_modules/**', '.git/**', 'dist/**', 'dist-ui/**'],
      });

      // Add generated index
      archive.append(indexJson, { name: 'project-index.json' });

      archive.finalize();
    });
  }

  /**
   * Export all markdown files as a single concatenated bundle.
   * Each file is preceded by a fenced header with its relative path.
   */
  async exportMdBundle(outPath: string): Promise<string> {
    const files = await walkVault(this.vaultRoot);
    const mdFiles = files.filter((f) => extname(f).toLowerCase() === '.md');

    const chunks: string[] = [
      `# Project Bundle — ${new Date().toISOString()}\n\n`,
    ];

    for (const f of mdFiles) {
      const rel = relative(this.vaultRoot, f);
      const content = await readFile(f, 'utf-8');
      chunks.push(`\n\n---\n<!-- file: ${rel} -->\n\n${content}`);
    }

    const bundle = chunks.join('');
    await writeFile(outPath, bundle, 'utf-8');
    return outPath;
  }
}
