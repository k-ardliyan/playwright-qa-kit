import { type Locator, type Page, expect } from '@playwright/test';

/**
 * BasePage — fondasi untuk semua Page Object.
 *
 * Port dari Python BasePage dengan subset essential:
 * - Navigasi: navigate, waitForLoad, reload, goBack
 * - Interaksi: clickElement, fillInput, clearAndFill, typeSlowly,
 *              selectOption, checkCheckbox, uncheckCheckbox, hover
 * - Baca: getText, getAttribute, getInputValue, isVisible, isEnabled
 * - Menunggu: waitForElement, waitForElementHidden, waitForSpinnerGone
 * - Verifikasi: expectUrlContains, expectTitleContains
 * - Keyboard: pressKey, pressShortcut
 *
 * Methods MUI-specific (select_mui_option, fill_and_select_autocomplete, dll.)
 * ditambahkan di phase selanjutnya sesuai kebutuhan domain page.
 */
export class BasePage {
  constructor(public readonly page: Page) {}

  // ── NAVIGASI ───────────────────────────────────────────────────────────────

  /** Buka URL dan tunggu network idle. */
  async navigate(url: string): Promise<void> {
    await this.page.goto(url);
    await this.waitForLoad();
  }

  /** Tunggu sampai tidak ada network call selama 500ms. Fallback jika timeout. */
  async waitForLoad(timeout = 10_000): Promise<void> {
    try {
      await this.page.waitForLoadState('networkidle', { timeout });
    } catch {
      // Long-polling atau SSE bisa bikin networkidle tidak pernah tercapai
      // — lanjut saja, halaman sudah visual-ready.
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

  // ── INTERAKSI ELEMEN ───────────────────────────────────────────────────────

  /** Klik dengan smart wait: visible + enabled + scroll into view. */
  async clickElement(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
    await expect(locator).toBeEnabled();
    await locator.scrollIntoViewIfNeeded();
    await locator.click();
  }

  /** Isi input field (clear dulu, lalu isi). */
  async fillInput(locator: Locator, text: string): Promise<void> {
    await expect(locator).toBeVisible();
    await expect(locator).toBeEditable();
    await locator.scrollIntoViewIfNeeded();
    await locator.fill(text);
  }

  /** Kosongkan input lalu isi ulang — untuk edit field yang sudah ada value. */
  async clearAndFill(locator: Locator, text: string): Promise<void> {
    await expect(locator).toBeVisible();
    await expect(locator).toBeEditable();
    await locator.scrollIntoViewIfNeeded();
    await locator.fill('');
    await locator.fill(text);
  }

  /** Ketik karakter per karakter (bypass fill guard, trigger autocomplete). */
  async typeSlowly(locator: Locator, text: string, delay = 50): Promise<void> {
    await expect(locator).toBeVisible();
    await expect(locator).toBeEditable();
    await locator.scrollIntoViewIfNeeded();
    await locator.pressSequentially(text, { delay });
  }

  /** Pilih opsi pada <select> HTML standar. */
  async selectOption(locator: Locator, value: string): Promise<void> {
    await expect(locator).toBeVisible();
    await locator.scrollIntoViewIfNeeded();
    await locator.selectOption(value);
  }

  /** Centang checkbox (idempotent). */
  async checkCheckbox(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
    await locator.scrollIntoViewIfNeeded();
    await locator.check();
  }

  /** Hapus centang checkbox (idempotent). */
  async uncheckCheckbox(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
    await locator.scrollIntoViewIfNeeded();
    await locator.uncheck();
  }

  /** Hover elemen untuk trigger dropdown/tooltip. */
  async hover(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
    await locator.scrollIntoViewIfNeeded();
    await locator.hover();
  }

  // ── KEYBOARD ───────────────────────────────────────────────────────────────

  /** Tekan satu tombol keyboard (e.g. "Enter", "Escape", "Tab"). */
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /** Tekan kombinasi tombol (e.g. pressShortcut("Control", "a")). */
  async pressShortcut(...keys: string[]): Promise<void> {
    await this.page.keyboard.press(keys.join('+'));
  }

  // ── BACA ELEMEN ────────────────────────────────────────────────────────────

  /** Ambil inner text dari elemen. */
  async getText(locator: Locator): Promise<string> {
    await expect(locator).toBeVisible();
    const text = await locator.innerText();
    return text.trim();
  }

  /** Ambil nilai attribute HTML dari elemen. */
  async getAttribute(locator: Locator, attribute: string): Promise<string> {
    await expect(locator).toBeVisible();
    return (await locator.getAttribute(attribute)) ?? '';
  }

  /** Ambil value dari input/textarea. */
  async getInputValue(locator: Locator): Promise<string> {
    await expect(locator).toBeVisible();
    const value = await locator.inputValue();
    return value.trim();
  }

  /** Cek visibilitas tanpa assertion — return boolean. */
  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  /** Cek apakah elemen enabled (bukan disabled). */
  async isEnabled(locator: Locator): Promise<boolean> {
    return locator.isEnabled();
  }

  // ── MENUNGGU ───────────────────────────────────────────────────────────────

  /** Tunggu elemen muncul dan visible. */
  async waitForElement(locator: Locator, timeout = 10_000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /** Tunggu elemen menghilang (hidden). */
  async waitForElementHidden(locator: Locator, timeout = 10_000): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  /** Tunggu MUI CircularProgress spinner hilang. */
  async waitForSpinnerGone(timeout = 15_000): Promise<void> {
    const spinner = this.page.locator('.MuiCircularProgress-root');
    if ((await spinner.count()) > 0) {
      await spinner.first().waitFor({ state: 'hidden', timeout });
    }
  }

  // ── VERIFIKASI HALAMAN ─────────────────────────────────────────────────────

  /** Assert URL saat ini mengandung teks tertentu. */
  async expectUrlContains(partial: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(partial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  /** Assert <title> tab mengandung teks tertentu. */
  async expectTitleContains(partial: string): Promise<void> {
    await expect(this.page).toHaveTitle(new RegExp(partial, 'i'));
  }
}
