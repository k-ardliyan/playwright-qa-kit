/**
 * AUTO-GENERATED POM SCAFFOLD — safe to edit.
 * Re-run will NOT overwrite unless force=true.
 *
 * Source: selector-catalog/login/login-form.json
 * Generated: 2026-07-21T08:46:39.576Z
 */

import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginForm extends BasePage {
  // ── BTN ──
  readonly btnTogglePasswordVisibility: Locator;
  readonly btnLogin: Locator;

  // ── CHECKBOX ──
  readonly checkboxRememberMe: Locator;

  // ── INPUT ──
  readonly inputEnterUsername: Locator;
  readonly inputEnterPassword: Locator;

  // ── LINK ──
  readonly linkForgotPassword: Locator;

  constructor(page: Page) {
    super(page);
    this.btnTogglePasswordVisibility = page.getByRole('button', {
      name: 'toggle password visibility',
      exact: true,
    });
    this.btnLogin = page.getByRole('button', { name: 'Login', exact: true });
    this.checkboxRememberMe = page.getByRole('checkbox', { name: 'Remember Me', exact: true });
    this.inputEnterUsername = page.getByRole('textbox', { name: 'Enter username', exact: true });
    this.inputEnterPassword = page.getByRole('textbox', { name: 'Enter password', exact: true });
    this.linkForgotPassword = page.getByRole('link', { name: 'Forgot Password?', exact: true });
  }

  // TODO: async goto() { await this.navigate('/your-url'); }
  // TODO: Add business action methods (doLogin, fillForm, etc.)
}
