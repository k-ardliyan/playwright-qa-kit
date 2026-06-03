import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { env } from '@/shared/utils/env';

/**
 * Domain: Customers
 * Page: /customers/all/{id}
 *
 * Page Object Model (POM) untuk mempresentasikan interaksi dengan Halaman Detail Informasi Pelanggan (Customers Detail).
 */
export class CustomersDetailPage extends BasePage {
  // ── HEADER & BREADCRUMB ────────────────────────────────────────────────────
  public readonly heading: Locator;
  public readonly breadcrumbBeranda: Locator;
  public readonly breadcrumbPelanggan: Locator;

  // ── PROFIL CARD (Sidebar Kiri) ─────────────────────────────────────────────
  public readonly chipStatus: Locator;
  public readonly labelNama: Locator;
  public readonly labelKode: Locator;
  public readonly labelGrup: Locator;
  public readonly labelMataUang: Locator;
  public readonly labelEmail: Locator;
  public readonly labelTelepon: Locator;
  public readonly labelLokasi: Locator;

  // ── SECTION CARDS (Kanan) ──────────────────────────────────────────────────
  public readonly cardInfoAlamat: Locator;
  public readonly cardAlamatPenagihan: Locator;
  public readonly cardAlamatPengiriman: Locator;
  public readonly cardReferensiBank: Locator;
  public readonly labelNoBank: Locator;

  // ── TOMBOL AKSI ────────────────────────────────────────────────────────────
  public readonly btnBack: Locator;
  public readonly btnEdit: Locator;
  public readonly btnDelete: Locator;

  // ── DIALOG KONFIRMASI HAPUS ───────────────────────────────────────────────
  public readonly deleteDialog: Locator;
  public readonly dialogHapus: Locator;
  public readonly dialogHeading: Locator;
  public readonly btnConfirmDelete: Locator;
  public readonly btnCancelDelete: Locator;

  constructor(page: Page) {
    super(page);

    // ── HEADER & BREADCRUMB ──────────────────────────────────────────────────
    this.heading = page.getByRole('heading', { level: 2 }).first();
    this.breadcrumbBeranda = page
      .getByLabel('breadcrumb')
      .getByText(/Beranda|Home/i)
      .first();
    this.breadcrumbPelanggan = page
      .getByLabel('breadcrumb')
      .getByText(/Pelanggan|Customers/i)
      .first();

    // ── PROFIL CARD (Sidebar Kiri) ───────────────────────────────────────────
    this.chipStatus = page.locator('.MuiChip-label').first();
    this.labelNama = page.getByRole('heading', { level: 5 }).first();
    this.labelKode = page
      .getByRole('heading', { level: 5 })
      .first()
      .locator('xpath=following-sibling::p')
      .first();

    const sidebarList = page.locator('.MuiCardContent-root').first().getByRole('list').first();
    this.labelGrup = sidebarList.getByRole('listitem').nth(0).locator('p');
    this.labelMataUang = sidebarList.getByRole('listitem').nth(1).locator('p');
    this.labelEmail = sidebarList.getByRole('listitem').nth(2).locator('p');
    this.labelTelepon = sidebarList.getByRole('listitem').nth(3).locator('p');
    this.labelLokasi = sidebarList.getByRole('listitem').nth(4).locator('p');

    // ── SECTION CARDS (Kanan) ────────────────────────────────────────────────
    this.cardInfoAlamat = page.locator('.MuiCard-root').filter({
      has: page.locator('.MuiCardHeader-title', {
        hasText: /Informasi Alamat|Address Information/i,
      }),
    });
    this.cardAlamatPenagihan = page.locator('.MuiCard-root').filter({
      has: page.locator('.MuiCardHeader-title', { hasText: /Alamat Penagihan|Billing Address/i }),
    });
    this.cardAlamatPengiriman = page.locator('.MuiCard-root').filter({
      has: page.locator('.MuiCardHeader-title', { hasText: /Alamat Pengiriman|Shipping Address/i }),
    });
    this.cardReferensiBank = page.locator('.MuiCard-root').filter({
      has: page.locator('.MuiCardHeader-title', { hasText: /Referensi Bank|Bank Reference/i }),
    });
    this.labelNoBank = this.cardReferensiBank
      .locator('p')
      .filter({
        hasText: /Tidak ada referensi bank|No bank reference/i,
      })
      .first();

    // ── TOMBOL AKSI ──────────────────────────────────────────────────────────
    this.btnBack = page.getByRole('button', { name: /^Kembali$|^Back$/i });
    this.btnEdit = page.getByRole('button', { name: /^Ubah$|^Edit$/i });
    this.btnDelete = page.getByRole('button', { name: /^Hapus$|^Delete$/i });

    // ── DIALOG KONFIRMASI HAPUS ─────────────────────────────────────────────
    this.deleteDialog = page.locator(".MuiDialog-root[role='presentation']");
    this.dialogHapus = this.deleteDialog
      .locator('div')
      .filter({
        hasText: /Yakin ingin menghapus|Are you sure/i,
      })
      .first();
    this.dialogHeading = this.deleteDialog.getByRole('heading', { name: /Peringatan|Warning/i });
    this.btnConfirmDelete = this.deleteDialog.getByRole('button', { name: /^Hapus$|^Delete$/i });
    this.btnCancelDelete = this.deleteDialog.getByRole('button', { name: /^Batal$|^Cancel$/i });
  }

  // ── NAVIGASI ──────────────────────────────────────────────────────────────

  /** Buka halaman detail customer berdasarkan ID */
  async goto(customerId: string): Promise<void> {
    const targetUrl = `${env.BASE_URL.replace(/\/$/, '')}/customers/all/${customerId}`;
    await this.navigate(targetUrl);
  }

  /** Klik breadcrumb Pelanggan */
  async clickBreadcrumb(): Promise<void> {
    await this.breadcrumbPelanggan.click();
  }

  /** Kembali ke halaman sebelumnya via tombol Kembali */
  async clickBack(): Promise<void> {
    await this.btnBack.click();
  }

  // ── AKSI UTAMA ─────────────────────────────────────────────────────

  /** Klik tombol edit/ubah */
  async clickEdit(): Promise<void> {
    await this.btnEdit.click();
  }

  /** Klik tombol hapus */
  async clickDelete(): Promise<void> {
    await this.btnDelete.click();
  }

  /** Konfirmasi hapus di dialog */
  async confirmDelete(): Promise<void> {
    await this.btnConfirmDelete.click();
  }

  /** Batalkan hapus di dialog */
  async cancelDelete(): Promise<void> {
    await this.btnCancelDelete.click();
  }

  // ── GETTER / HELPER VALUE ──────────────────────────────────────────────────

  /** Ambil locator nilai field tertentu di dalam card */
  getFieldValue(card: Locator, label: string): Locator {
    const stack = card.locator('.MuiStack-root').filter({
      has: this.page.locator('p').filter({ hasText: new RegExp(`^${label}$`, 'i') }),
    });
    return stack.locator('p').nth(1);
  }

  /** Ambil jumlah referensi bank */
  async getBankCount(): Promise<number> {
    return this.cardReferensiBank.getByRole('listitem').count();
  }

  /** Ambil locator entri bank ke-N (0-indexed) */
  getBankEntry(index: number): Locator {
    return this.cardReferensiBank.getByRole('listitem').nth(index);
  }

  /** Ambil nilai field bank tertentu di entri ke-N (0-indexed) */
  getBankFieldValue(index: number, label: string): Locator {
    const entry = this.getBankEntry(index);
    const labelEl = entry
      .locator('p')
      .filter({
        hasText: new RegExp(`^${label}$`, 'i'),
      })
      .first();
    return labelEl.locator('xpath=following-sibling::p[1]');
  }

  /** Cek apakah referensi bank kosong */
  async isBankEmpty(): Promise<boolean> {
    return this.labelNoBank.isVisible();
  }
}
