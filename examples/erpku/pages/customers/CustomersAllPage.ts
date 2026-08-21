import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { env } from '@/shared/utils/env';

/**
 * Domain: Customers
 * Page: /customers/all
 *
 * Page Object Model (POM) untuk mempresentasikan interaksi dengan Halaman Daftar Lengkap Pelanggan (Customers All).
 */
export class CustomersAllPage extends BasePage {
  // ── HEADER & CARDS ─────────────────────────────────────────────────────────
  public readonly heading: Locator;
  public readonly cardTotal: Locator;
  public readonly cardAktif: Locator;
  public readonly cardTidakAktif: Locator;

  // ── TOMBOL AKSI UTAMA ─────────────────────────────────────────────────────
  public readonly btnNewCustomer: Locator;
  public readonly btnFilters: Locator;
  public readonly breadcrumbPelanggan: Locator;

  // ── FILTER PANEL ──────────────────────────────────────────────────────────
  public readonly inputSearchKode: Locator;
  public readonly inputSearchNama: Locator;
  public readonly selectStatus: Locator;
  public readonly selectGrup: Locator;
  public readonly selectNegara: Locator;
  public readonly selectProduk: Locator;
  public readonly btnClearStatus: Locator;
  public readonly btnClearGrup: Locator;
  public readonly btnClearNegara: Locator;
  public readonly btnClearProduk: Locator;
  public readonly btnResetFilter: Locator;

  // ── TABEL ──────────────────────────────────────────────────────────────────
  public readonly table: Locator;
  public readonly colNo: Locator;
  public readonly colKode: Locator;
  public readonly colNama: Locator;
  public readonly colEmail: Locator;
  public readonly colTelepon: Locator;
  public readonly colStatus: Locator;
  public readonly colNegara: Locator;
  public readonly colGrup: Locator;
  public readonly colMataUang: Locator;
  public readonly colWaktuDibuat: Locator;
  public readonly colAksi: Locator;

  // ── DIALOG KONFIRMASI HAPUS ───────────────────────────────────────────────
  public readonly deleteDialog: Locator;
  public readonly dialogHapus: Locator;
  public readonly btnConfirmDelete: Locator;
  public readonly btnCancelDelete: Locator;

  // ── PAGINATION ─────────────────────────────────────────────────────────────
  public readonly selectRowsPerPage: Locator;
  public readonly inputGoToPage: Locator;
  public readonly btnNextPage: Locator;
  public readonly btnPrevPage: Locator;
  public readonly btnLastPage: Locator;
  public readonly btnFirstPage: Locator;

  constructor(page: Page) {
    super(page);

    // ── HEADER & CARDS ───────────────────────────────────────────────────────
    this.heading = page
      .locator('h1, h2, h3, h4, h5, h6, .MuiTypography-root')
      .filter({
        hasText: /Customers|Pelanggan/i,
      })
      .first();
    this.cardTotal = page.getByLabel(/Total Pelanggan|Total Customer/i);
    this.cardAktif = page.getByLabel(/Pelanggan Aktif|Active Customer/i);
    this.cardTidakAktif = page.getByLabel(/Pelanggan Tidak Aktif|Inactive Customer/i);

    // ── TOMBOL AKSI UTAMA ───────────────────────────────────────────────────
    this.btnNewCustomer = page
      .getByRole('button')
      .filter({
        hasText: /New Customer|Pelanggan Baru|Customer Baru/i,
      })
      .first();
    this.btnFilters = page.getByTestId('filter-button-toggle-btn');
    this.breadcrumbPelanggan = page
      .getByLabel('breadcrumb')
      .getByText(/Pelanggan|Customers/i)
      .first();

    // ── FILTER PANEL ────────────────────────────────────────────────────────
    this.inputSearchKode = page.getByPlaceholder(/Cari Kode Pelanggan|Search Customer Code/i);
    this.inputSearchNama = page.getByPlaceholder(/Cari Nama Pelanggan|Search Customer Name/i);
    this.selectStatus = page.getByPlaceholder(/Pilih Status|Select Status/i);
    this.selectGrup = page.getByPlaceholder(/Pilih Grup Pelanggan|Select Customer Group/i);
    this.selectNegara = page.getByPlaceholder(/Pilih Negara|Select Country/i);
    this.selectProduk = page.getByPlaceholder(/Pilih Product|Select Product/i);

    this.btnClearStatus = this.selectStatus
      .locator('xpath=ancestor::*[contains(@class,"MuiAutocomplete-root")]')
      .getByRole('button', { name: /Clear/i });
    this.btnClearGrup = this.selectGrup
      .locator('xpath=ancestor::*[contains(@class,"MuiAutocomplete-root")]')
      .getByRole('button', { name: /Clear/i });
    this.btnClearNegara = this.selectNegara
      .locator('xpath=ancestor::*[contains(@class,"MuiAutocomplete-root")]')
      .getByRole('button', { name: /Clear/i });
    this.btnClearProduk = this.selectProduk
      .locator('xpath=ancestor::*[contains(@class,"MuiAutocomplete-root")]')
      .getByRole('button', { name: /Clear/i });

    this.btnResetFilter = page.getByTestId('filter-button-reset-btn');

    // ── TABEL ────────────────────────────────────────────────────────────────
    this.table = page.getByRole('table');
    this.colNo = page.getByRole('columnheader', { name: /^No$|^#$/i });
    this.colKode = page.getByRole('columnheader', { name: /Kode Pelanggan|Customer Code/i });
    this.colNama = page.getByRole('columnheader', { name: /Nama Pelanggan|Customer Name/i });
    this.colEmail = page.getByRole('columnheader', { name: /^Email$/i });
    this.colTelepon = page.getByRole('columnheader', { name: /Telepon|Phone/i });
    this.colStatus = page.getByRole('columnheader', { name: /^Status$/i });
    this.colNegara = page.getByRole('columnheader', { name: /Negara|Country/i });
    this.colGrup = page.getByRole('columnheader', { name: /Grup Pelanggan|Customer Group/i });
    this.colMataUang = page.getByRole('columnheader', { name: /Mata Uang|Currency/i });
    this.colWaktuDibuat = page.getByRole('columnheader', { name: /Waktu Dibuat|Created|Date/i });
    this.colAksi = page.getByRole('columnheader', { name: /Aksi|Action/i });

    // ── DIALOG KONFIRMASI HAPUS ─────────────────────────────────────────────
    this.deleteDialog = page.locator('.MuiDialog-root:visible, div[role="dialog"]:visible').last();
    this.dialogHapus = this.deleteDialog
      .locator('div')
      .filter({
        hasText: /Yakin ingin menghapus|Are you sure/i,
      })
      .first();
    this.btnConfirmDelete = this.deleteDialog
      .getByText(/Ya,?\s*Hapus|Yes,?\s*Delete|Hapus|Delete/i)
      .last();
    this.btnCancelDelete = this.deleteDialog.getByText(/^Batal$|^Cancel$/i).last();

    // ── PAGINATION ───────────────────────────────────────────────────────────
    const paginationSelect = page.getByTestId('table-pagination-select');
    this.selectRowsPerPage = paginationSelect
      .locator('xpath=preceding-sibling::*[@role="combobox"][1]')
      .first();
    this.inputGoToPage = page.getByTestId('table-goto-page-input');
    this.btnNextPage = page.getByRole('button', { name: /Go to next page|Halaman berikutnya/i });
    this.btnPrevPage = page.getByRole('button', {
      name: /Go to previous page|Halaman sebelumnya/i,
    });
    this.btnLastPage = page.getByRole('button', { name: /Go to last page|Halaman terakhir/i });
    this.btnFirstPage = page.getByRole('button', { name: /Go to first page|Halaman pertama/i });
  }

  // ── NAVIGASI ──────────────────────────────────────────────────────────────

  /** Buka halaman Customers All */
  async goto(): Promise<void> {
    const targetUrl = `${env.BASE_URL.replace(/\/$/, '')}/customers/all`;
    await this.navigate(targetUrl);
  }

  /** Klik tombol + Pelanggan Baru */
  async clickNewCustomer(): Promise<void> {
    await this.btnNewCustomer.click();
  }

  /** Buka atau tutup panel filter */
  async openFilters(): Promise<void> {
    await this.btnFilters.click();
  }

  /** Cek apakah panel filter terbuka */
  private async isFilterPanelOpen(): Promise<boolean> {
    return (
      (await this.inputSearchKode.isVisible()) ||
      (await this.inputSearchNama.isVisible()) ||
      (await this.btnResetFilter.isVisible())
    );
  }

  /** Pastikan panel filter terbuka sebelum melakukan interaksi */
  async ensureFilterPanelOpen(): Promise<void> {
    if (await this.isFilterPanelOpen()) return;

    await this.openFilters();
    if ((await this.inputSearchKode.count()) > 0) {
      await this.inputSearchKode.waitFor({ state: 'visible', timeout: 5000 });
    } else if ((await this.inputSearchNama.count()) > 0) {
      await this.inputSearchNama.waitFor({ state: 'visible', timeout: 5000 });
    } else {
      await this.btnResetFilter.waitFor({ state: 'visible', timeout: 5000 });
    }
  }

  /** Kembali ke daftar pelanggan via breadcrumb */
  async clickBreadcrumb(): Promise<void> {
    await this.breadcrumbPelanggan.click();
  }

  // ── FILTER ACTIONS ─────────────────────────────────────────────────────────

  /** Filter berdasarkan Kode Pelanggan */
  async filterByKode(kode: string): Promise<void> {
    await this.ensureFilterPanelOpen();
    await this.inputSearchKode.fill(kode);
    await this.page.keyboard.press('Enter');
    await this.waitForLoad();
  }

  /** Bersihkan filter Kode Pelanggan */
  async clearFilterKode(): Promise<void> {
    await this.ensureFilterPanelOpen();
    await this.inputSearchKode.fill('');
    await this.page.keyboard.press('Enter');
    await this.waitForLoad();
  }

  /** Filter berdasarkan Nama Pelanggan */
  async filterByNama(nama: string): Promise<void> {
    await this.ensureFilterPanelOpen();
    await this.inputSearchNama.fill(nama);
    await this.page.keyboard.press('Enter');
    await this.waitForLoad();
  }

  /** Bersihkan filter Nama Pelanggan */
  async clearFilterNama(): Promise<void> {
    await this.ensureFilterPanelOpen();
    await this.inputSearchNama.fill('');
    await this.page.keyboard.press('Enter');
    await this.waitForLoad();
  }

  /** Filter berdasarkan Status (Aktif / Tidak Aktif) */
  async filterByStatus(status: 'Aktif' | 'Tidak Aktif' | string): Promise<void> {
    await this.ensureFilterPanelOpen();
    await this.fillAndSelectAutocomplete(this.selectStatus, status);
  }

  /** Bersihkan filter Status */
  async clearFilterStatus(): Promise<void> {
    await this.ensureFilterPanelOpen();
    await this.btnClearStatus.click();
  }

  /** Filter berdasarkan Grup Pelanggan */
  async filterByGrup(grup: string): Promise<void> {
    await this.ensureFilterPanelOpen();
    await this.fillAndSelectAutocomplete(this.selectGrup, grup);
  }

  /** Bersihkan filter Grup Pelanggan */
  async clearFilterGrup(): Promise<void> {
    await this.ensureFilterPanelOpen();
    await this.btnClearGrup.click();
  }

  /** Filter berdasarkan Negara */
  async filterByNegara(negara: string): Promise<void> {
    await this.ensureFilterPanelOpen();
    await this.fillAndSelectAutocomplete(this.selectNegara, negara);
  }

  /** Bersihkan filter Negara */
  async clearFilterNegara(): Promise<void> {
    await this.ensureFilterPanelOpen();
    await this.btnClearNegara.click();
  }

  /** Filter berdasarkan Produk */
  async filterByProduk(produk: string): Promise<void> {
    await this.ensureFilterPanelOpen();
    await this.fillAndSelectAutocomplete(this.selectProduk, produk);
  }

  /** Bersihkan filter Produk */
  async clearFilterProduk(): Promise<void> {
    await this.ensureFilterPanelOpen();
    await this.btnClearProduk.click();
  }

  /** Atur ulang semua filter sekaligus */
  async resetFilters(): Promise<void> {
    await this.ensureFilterPanelOpen();
    await this.btnResetFilter.click();
    await this.page.waitForTimeout(500);
    await this.waitForLoad();
  }

  /** Ambil locator cell 'Tidak ada hasil ditemukan' */
  getEmptyTableCell(): Locator {
    return this.page.getByRole('cell', {
      name: /Tidak ada hasil ditemukan|No results found/i,
    });
  }

  // ── ROW ACTIONS ────────────────────────────────────────────────────────────

  /** Ambil locator baris berdasarkan teks unik (misal nama customer) */
  row(name: string): Locator {
    return this.page.getByRole('row').filter({ hasText: name }).first();
  }

  /** Klik detail pada customer tertentu */
  async clickDetail(name: string): Promise<void> {
    const rowEl = this.row(name);
    await rowEl.waitFor({ state: 'visible' });
    const btnDetail = rowEl
      .locator('button[aria-label="Detail"], button[aria-label="detail"]')
      .first();
    await btnDetail.click();
  }

  /** Klik edit pada customer tertentu */
  async clickEdit(name: string): Promise<void> {
    const rowEl = this.row(name);
    await rowEl.waitFor({ state: 'visible' });
    const btnEdit = rowEl.locator('button[aria-label="Edit"], button[aria-label="Ubah"]').first();
    await btnEdit.click();
  }

  /** Klik delete pada customer tertentu */
  async clickDelete(name: string): Promise<void> {
    const rowEl = this.row(name);
    await rowEl.waitFor({ state: 'visible' });
    const btnDelete = rowEl
      .locator('button[aria-label="Delete"], button[aria-label="Hapus"]')
      .first();
    await btnDelete.click();
  }

  /** Konfirmasi hapus di dialog */
  async confirmDelete(): Promise<void> {
    await this.deleteDialog.waitFor({ state: 'visible' });
    await this.btnConfirmDelete.click();
  }

  /** Batalkan hapus di dialog */
  async cancelDelete(): Promise<void> {
    await this.deleteDialog.waitFor({ state: 'visible' });
    await this.btnCancelDelete.click();
  }

  /** Cek apakah customer visible di tabel */
  async isCustomerVisible(name: string): Promise<boolean> {
    return this.row(name).isVisible();
  }

  // ── PAGINATION ─────────────────────────────────────────────────────────────

  /** Set rows per page di tabel */
  async setRowsPerPage(value: string): Promise<void> {
    await this.selectOptionByDataValueFromListbox(this.selectRowsPerPage, value, 5000);
  }

  /** Navigasi ke halaman tertentu menggunakan Enter spinbutton */
  async goToPage(pageNumber: number): Promise<void> {
    await this.inputGoToPage.fill(pageNumber.toString());
    await this.page.keyboard.press('Enter');
    await this.waitForLoad();
  }

  /** Masukkan input text mentah ke pagination input */
  async goToPageRaw(value: string): Promise<void> {
    await this.inputGoToPage.fill(value);
    await this.page.keyboard.press('Enter');
    await this.waitForLoad();
  }

  /** Halaman berikutnya */
  async nextPage(): Promise<void> {
    await this.btnNextPage.click();
  }

  /** Halaman sebelumnya */
  async prevPage(): Promise<void> {
    await this.btnPrevPage.click();
  }

  /** Halaman terakhir */
  async lastPage(): Promise<void> {
    await this.btnLastPage.click();
  }

  /** Halaman pertama */
  async firstPage(): Promise<void> {
    await this.btnFirstPage.click();
  }

  /** Tunggu tabel load setelah navigasi pagination */
  async waitAfterPagination(): Promise<void> {
    await this.waitForLoad();
  }

  // ── TOAST NOTIFICATIONS VERIFICATION ───────────────────────────────────────

  /** Verifikasi toast sukses generic (tambah, edit, hapus) */
  async verifySuccessToastGeneric(
    itemName: string,
    action: 'add' | 'update' | 'delete',
  ): Promise<void> {
    const patterns = {
      add: new RegExp(
        `${itemName} (berhasil ditambahkan|successfully added|berhasil dibuat|created)`,
        'i',
      ),
      update: new RegExp(
        `${itemName} (berhasil diperbarui|successfully updated|berhasil diedit)`,
        'i',
      ),
      delete: new RegExp(
        `${itemName} (berhasil dihapus|successfully deleted|berhasil dibuang)`,
        'i',
      ),
    };
    const pattern = patterns[action] || new RegExp(itemName, 'i');

    const toast = this.page
      .locator('div[role="status"], div[role="alert"]')
      .getByText(pattern)
      .first();
    try {
      await toast.waitFor({ state: 'visible', timeout: 7000 });
      await toast.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      const genericToast = this.page
        .locator('div[role="status"], div[role="alert"]')
        .getByText(/berhasil|success|created|saved|ditambahkan|diperbarui|dihapus/i)
        .first();
      await genericToast.waitFor({ state: 'visible', timeout: 3000 });
      await genericToast.waitFor({ state: 'hidden', timeout: 10000 });
    }
  }
}
