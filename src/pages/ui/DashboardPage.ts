import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Domain: Global
 * Page: /dashboard
 *
 * Page Object Model (POM) untuk interaksi dengan halaman dashboard.
 */
export class DashboardPage extends BasePage {
  // ── HEADER / VISUALS ───────────────────────────────────────────────────────
  public readonly heading: Locator;
  public readonly greetingText: Locator;

  // ── TOMBOL AKSI ────────────────────────────────────────────────────────────
  public readonly btnProfile: Locator;
  public readonly btnLogout: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByText(/Anda Login sebagai|Dashboard/i).first();
    this.greetingText = page.getByText(/Anda Login sebagai|h[ae]lo/i);
    this.btnProfile = page.getByRole('button', { name: 'open profile' });
    // .last() mengambil opsi logout dari dropdown list profile karena ada logout button lain di sidebar
    this.btnLogout = page.getByRole('button', { name: 'Logout' }).last();
  }

  /** Verifikasi halaman dashboard berhasil dimuat seutuhnya */
  async expectToBeLoaded(): Promise<void> {
    await this.expectUrlContains('dashboard');
    const toastSuccess = this.page.getByText('Berhasil Login', { exact: false });
    await expect(toastSuccess).toBeVisible({ timeout: 10_000 });
    await expect(this.greetingText).toBeVisible();
    await expect(this.heading).toBeVisible();
  }

  /** Aksi keluar log out dari profile saat ini */
  async doLogout(): Promise<void> {
    await this.btnProfile.click();
    await this.btnLogout.click();
  }
}
