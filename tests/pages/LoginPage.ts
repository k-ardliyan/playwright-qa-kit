import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { env } from '@/utils/env';

/**
 * Domain: Auth
 * Page: / (root)
 *
 * Page Object Model (POM) untuk mempresentasikan interaksi dengan Halaman Login ERPku.
 */
export class LoginPage extends BasePage {
  // ── FORM INPUT ─────────────────────────────────────────────────────────────
  public readonly inputUsername: Locator;
  public readonly inputPassword: Locator;
  public readonly inputRemember: Locator;

  // ── TOMBOL AKSI ────────────────────────────────────────────────────────────
  public readonly btnLogin: Locator;

  constructor(page: Page) {
    super(page);

    // Selector multi-fallback untuk kompatibilitas antar environment
    this.inputUsername = page.locator(
      "input[name='username'], input[name='email'], input[type='email'], input[type='text']",
    );
    this.inputPassword = page.locator("input[name='password'], input[type='password']");
    this.inputRemember = page.getByLabel(/Remember me|Ingat saya/i).first();

    this.btnLogin = page.getByRole('button', { name: /Login|Masuk|Sign In/i });
  }

  /** Buka halaman login ERPku */
  async goto(): Promise<void> {
    await this.navigate(env.BASE_URL);
  }

  /** Aksi utama login: isi formulir lalu submit */
  async doLogin(username?: string, password?: string, rememberMe = false): Promise<void> {
    if (username !== undefined && username !== '') {
      await this.inputUsername.first().fill(username);
    } else if (username === '') {
      // Intentional clear untuk testing input kosong
      await this.inputUsername.first().fill('');
    }

    if (password !== undefined && password !== '') {
      await this.inputPassword.first().fill(password);
    } else if (password === '') {
      // Intentional clear untuk testing input kosong
      await this.inputPassword.first().fill('');
    }

    if (rememberMe) {
      await this.inputRemember.first().check();
    }
    await this.btnLogin.click();
  }
}
