import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Renders HTML to PDF using a headless Chromium binary (installed in the API
 * image). Designed to degrade gracefully: when Chromium is absent or rendering
 * fails it returns `null`, so callers fall back to serving the HTML document —
 * no request ever breaks because PDF rendering is unavailable.
 *
 * Set CHROMIUM_PATH to override binary discovery.
 */
@Injectable()
export class PdfService {
  private readonly logger = new Logger('PdfService');

  private resolveBinary(): string | null {
    const candidates = [
      process.env.CHROMIUM_PATH,
      process.env.PUPPETEER_EXECUTABLE_PATH,
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome',
    ].filter((p): p is string => Boolean(p));
    return candidates.find((p) => existsSync(p)) ?? null;
  }

  get available(): boolean {
    return this.resolveBinary() !== null;
  }

  async fromHtml(html: string): Promise<Buffer | null> {
    const bin = this.resolveBinary();
    if (!bin) {
      this.logger.warn('Chromium not found — serving HTML instead of PDF.');
      return null;
    }
    let dir: string | undefined;
    try {
      dir = await mkdtemp(join(tmpdir(), 'travelos-pdf-'));
      const htmlPath = join(dir, 'doc.html');
      const pdfPath = join(dir, 'doc.pdf');
      await writeFile(htmlPath, html, 'utf8');

      await new Promise<void>((resolve, reject) => {
        const proc = spawn(
          bin,
          [
            '--headless',
            '--no-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            `--print-to-pdf=${pdfPath}`,
            `file://${htmlPath}`,
          ],
          { stdio: 'ignore' },
        );
        const timer = setTimeout(() => {
          proc.kill('SIGKILL');
          reject(new Error('PDF render timed out'));
        }, 20_000);
        proc.on('error', (e) => {
          clearTimeout(timer);
          reject(e);
        });
        proc.on('exit', (code) => {
          clearTimeout(timer);
          code === 0 ? resolve() : reject(new Error(`chromium exited with ${code}`));
        });
      });

      return await readFile(pdfPath);
    } catch (err) {
      this.logger.error(`PDF render failed: ${(err as Error).message}`);
      return null;
    } finally {
      if (dir) await rm(dir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
