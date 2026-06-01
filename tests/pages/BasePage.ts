import { type Locator, type Page, expect } from '@playwright/test';

/**
 * BasePage — Fondasi tangguh untuk semua Page Object.
 * 
 * Sesuai dengan Playwright Best Practices:
 * 1. Tidak membungkus API native sederhana (click, fill, dll) secara redundan.
 * 2. Memfokuskan diri pada utilities tingkat tinggi yang menyelesaikan gotchas nyata di Playwright:
 *    - Navigasi & Load State (networkidle, domcontentloaded)
 *    - Penanganan Dynamic Dialogs (alert, confirm, prompt)
 *    - Penanganan Skenario Multi-Tab / New Windows
 *    - File Upload & Download dengan penanganan event-promise
 *    - Penanganan elemen async global (loading spinner)
 */
export class BasePage {
  constructor(public readonly page: Page) {}

  // ── NAVIGASI & LOAD STATE ──────────────────────────────────────────────────

  /** Buka URL dan tunggu DOM konten ter-load penuh. */
  async navigate(url: string): Promise<void> {
    await this.page.goto(url);
    await this.waitForLoad();
  }

  /** Tunggu halaman visual-ready secara tangguh. */
  async waitForLoad(timeout = 10_000): Promise<void> {
    try {
      // Prioritaskan domcontentloaded untuk kecepatan, lalu coba networkidle secara aman
      await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 });
      await this.page.waitForLoadState('networkidle', { timeout: timeout - 5000 });
    } catch {
      // Long-polling/SSE sering menahan status networkidle — abaikan jika timeout
      // karena halaman sudah visual-ready bagi pengguna.
    }
  }

  /** Refresh halaman dan tunggu selesai dimuat. */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForLoad();
  }

  /** Kembali ke halaman sebelumnya (browser back). */
  async goBack(): Promise<void> {
    await this.page.goBack();
    await this.waitForLoad();
  }

  // ── DIALOGS (JS ALERT/CONFIRM/PROMPT) ──────────────────────────────────────

  /** 
   * Menyiapkan handler untuk Dialog browser berikutnya.
   * @param action 'accept' | 'dismiss'
   * @param expectedText Teks pesan opsional yang ingin diverifikasi di dalam dialog
   */
  async handleNextDialog(action: 'accept' | 'dismiss', expectedText?: string): Promise<void> {
    this.page.once('dialog', async (dialog) => {
      if (expectedText) {
        expect(dialog.message()).toContain(expectedText);
      }
      if (action === 'accept') {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });
  }

  // ── MULTI-TAB / NEW WINDOWS ────────────────────────────────────────────────

  /** 
   * Mengeksekusi aksi yang membuka tab baru dan mengembalikan Page dari tab baru tersebut.
   * @param triggerAction Aksi (seperti klik tombol) yang memicu pembukaan tab baru.
   */
  async waitForNewTab(triggerAction: () => Promise<void>): Promise<Page> {
    const pagePromise = this.page.context().waitForEvent('page');
    await triggerAction();
    const newPage = await pagePromise;
    await newPage.waitForLoadState('domcontentloaded');
    return newPage;
  }

  // ── ADVANCED INTERACTION: UPLOAD & DOWNLOAD ───────────────────────────────

  /** Menangani download file dan mengembalikan absolute path file yang terunduh. */
  async downloadFile(locator: Locator): Promise<string> {
    const downloadPromise = this.page.waitForEvent('download');
    await locator.click();
    const download = await downloadPromise;
    
    // Simpan di folder sementara di dalam workspace
    const path = `./test-results/downloads/${download.suggestedFilename()}`;
    await download.saveAs(path);
    return path;
  }

  /** Mengunggah file ke input secara aman. */
  async uploadFile(locator: Locator, filePath: string): Promise<void> {
    await locator.setInputFiles(filePath);
  }

  // ── MENUNGGU ELEMEN ASYNC GLOBAL ───────────────────────────────────────────

  /** Tunggu MUI CircularProgress spinner hilang. */
  async waitForSpinnerGone(timeout = 15_000): Promise<void> {
    const spinner = this.page.locator('.MuiCircularProgress-root');
    if ((await spinner.count()) > 0) {
      await spinner.first().waitFor({ state: 'hidden', timeout });
    }
  }

  // ── BACA & VERIFIKASI HALAMAN ──────────────────────────────────────────────

  /** Assert URL saat ini mengandung teks tertentu. */
  async expectUrlContains(partial: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(partial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  /** Assert <title> tab mengandung teks tertentu. */
  async expectTitleContains(partial: string): Promise<void> {
    await expect(this.page).toHaveTitle(new RegExp(partial, 'i'));
  }
}
