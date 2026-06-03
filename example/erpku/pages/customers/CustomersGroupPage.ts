import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';
import { env } from '@/shared/utils/env';

/**
 * Domain: Customers
 * Page: /customers/groups
 *
 * Page Object Model (POM) untuk mempresentasikan interaksi dengan Halaman Grup Pelanggan (Customer Groups).
 */
export class CustomersGroupPage extends BasePage {
  // ── HEADER & BREADCRUMB ────────────────────────────────────────────────────
  public readonly heading: Locator;
  public readonly breadcrumbGrup: Locator;

  // ── TOMBOL AKSI UTAMA ─────────────────────────────────────────────────────
  public readonly btnNewGroup: Locator;
  public readonly btnFilters: Locator;

  // ── FILTER PANEL ──────────────────────────────────────────────────────────
  public readonly inputSearch: Locator;
  public readonly inputSearchLabeled: Locator;
  public readonly inputSearchPlaceholder: Locator;
  public readonly btnClearSearch: Locator;
  public readonly btnResetFilter: Locator;

  // ── FORM MODAL (Tambah / Edit) ────────────────────────────────────────────
  public readonly inputGroupName: Locator;
  public readonly btnSave: Locator;
  public readonly btnCancel: Locator;

  // ── TABEL ──────────────────────────────────────────────────────────────────
  public readonly table: Locator;
  public readonly colNo: Locator;
  public readonly colNamaGrup: Locator;
  public readonly colAksi: Locator;

  // ── DIALOG KONFIRMASI HAPUS ───────────────────────────────────────────────
  public readonly deleteDialog: Locator;
  public readonly dialogHapusText: Locator;
  public readonly dialogHeading: Locator;
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

    // ── HEADER & BREADCRUMB ──────────────────────────────────────────────────
    this.heading = page
      .locator('h2')
      .filter({ hasText: /Customer Group|Grup Pelanggan/i })
      .first();
    this.breadcrumbGrup = page
      .getByLabel('breadcrumb')
      .getByText(/Grup Pelanggan|Customer Group/i)
      .first();

    // ── TOMBOL AKSI UTAMA ───────────────────────────────────────────────────
    this.btnNewGroup = page.getByRole('button', {
      name: /Grup Pelanggan Baru|New Customer Group/i,
    });
    this.btnFilters = page.getByRole('button', { name: /^Filters?$/i });

    // ── FILTER PANEL ────────────────────────────────────────────────────────
    this.inputSearch = page.getByTestId('debounced-search-input');
    this.inputSearchLabeled = page.getByRole('textbox', {
      name: /Cari Nama Grup Pelanggan|Cari Grup Pelanggan|Search Customer Group|Search Group/i,
    });
    this.inputSearchPlaceholder = page
      .getByPlaceholder(
        /Cari Nama Grup Pelanggan|Cari Grup Pelanggan|Search Customer Group|Search Group/i,
      )
      .last();
    this.btnClearSearch = page.getByRole('button', { name: /clear search/i });
    this.btnResetFilter = page
      .locator('button, [role="button"]')
      .filter({ hasText: /^Reset$|^Atur Ulang$|^Reset Filter$/i })
      .first();

    // ── FORM MODAL (Tambah / Edit) ──────────────────────────────────────────
    this.inputGroupName = page.getByRole('textbox', {
      name: /^Nama Grup Pelanggan$|^Customer Group Name$/i,
    });
    this.btnSave = page.getByRole('button', { name: /^Simpan$|^Save$/i });
    this.btnCancel = page.getByRole('button', { name: /^Batal$|^Cancel$/i });

    // ── TABEL ────────────────────────────────────────────────────────────────
    this.table = page.getByRole('table');
    this.colNo = page.getByRole('columnheader', { name: /^No$|^#$/i });
    this.colNamaGrup = page.getByRole('columnheader', {
      name: /Nama Grup Pelanggan|Customer Group Name/i,
    });
    this.colAksi = page.getByRole('columnheader', { name: /^Aksi$|^Action$/i });

    // ── DIALOG KONFIRMASI HAPUS ─────────────────────────────────────────────
    this.deleteDialog = page.locator('.MuiDialog-root:visible, div[role="dialog"]:visible').last();
    this.dialogHapusText = this.deleteDialog
      .locator('div')
      .filter({
        hasText: /Yakin ingin menghapus|Are you sure/i,
      })
      .first();
    this.dialogHeading = this.deleteDialog.getByText(/Peringatan|Warning/i).first();
    this.btnConfirmDelete = this.deleteDialog.getByText(/^Hapus$|^Delete$/i).last();
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

  /** Buka halaman Customer Groups secara langsung */
  async goto(): Promise<void> {
    const targetUrl = `${env.BASE_URL.replace(/\/$/, '')}/customers/groups`;
    await this.navigate(targetUrl);
  }

  /** Klik breadcrumb untuk kembali ke halaman induk */
  async clickBreadcrumb(): Promise<void> {
    await this.breadcrumbGrup.click();
  }

  // ── FILTER & PENCARIAN ──────────────────────────────────────────────────────

  /** Buka atau tutup panel filter */
  async openFilters(): Promise<void> {
    await this.btnFilters.click();
  }

  /** Cari elemen input pencarian yang sedang visible */
  private async getActiveSearchInput(): Promise<Locator | null> {
    if (await this.inputSearch.isVisible()) return this.inputSearch;
    if (await this.inputSearchLabeled.isVisible()) return this.inputSearchLabeled;
    if (await this.inputSearchPlaceholder.isVisible()) return this.inputSearchPlaceholder;
    return null;
  }

  /** Pastikan panel filter terbuka sebelum melakukan interaksi */
  async ensureFilterPanelOpen(): Promise<void> {
    const activeInput = await this.getActiveSearchInput();
    if (activeInput) return;

    await this.openFilters();
    try {
      await this.inputSearch.waitFor({ state: 'visible', timeout: 3000 });
    } catch {
      try {
        await this.inputSearchLabeled.waitFor({ state: 'visible', timeout: 3000 });
      } catch {
        await this.openFilters(); // Coba klik kedua kali jika panel belum tersinkron
        if ((await this.inputSearch.count()) > 0) {
          await this.inputSearch.waitFor({ state: 'visible', timeout: 3000 });
        } else if ((await this.inputSearchLabeled.count()) > 0) {
          await this.inputSearchLabeled.waitFor({ state: 'visible', timeout: 3000 });
        } else {
          await this.inputSearchPlaceholder.waitFor({ state: 'visible', timeout: 3000 });
        }
      }
    }
  }

  /** Lakukan pencarian grup berdasarkan nama */
  async searchGroup(keyword: string): Promise<void> {
    await this.ensureFilterPanelOpen();
    let activeInput = await this.getActiveSearchInput();
    if (!activeInput) {
      if ((await this.inputSearch.count()) > 0) {
        activeInput = this.inputSearch;
      } else if ((await this.inputSearchLabeled.count()) > 0) {
        activeInput = this.inputSearchLabeled;
      } else {
        activeInput = this.inputSearchPlaceholder;
      }
    }
    await activeInput.fill(keyword);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500); // Debounce delay
    await this.waitForLoad();
  }

  /** Bersihkan pencarian yang aktif */
  async clearSearch(): Promise<void> {
    if (!(await this.btnClearSearch.isVisible())) return;
    await this.btnClearSearch.click();
    await this.page.waitForTimeout(500); // Debounce delay
    await this.waitAfterPagination();
  }

  /** Atur ulang semua filter pencarian */
  async resetFilters(): Promise<void> {
    if (!(await this.btnResetFilter.isVisible())) {
      await this.openFilters();
    }
    await this.btnResetFilter.click();
    await this.page.waitForTimeout(500); // Debounce delay
    await this.waitForLoad();
  }

  // ── FORM MODAL ─────────────────────────────────────────────────────────────

  /** Klik tombol buat grup baru */
  async clickNewGroup(): Promise<void> {
    await this.btnNewGroup.click();
  }

  /** Isi formulir nama grup pelanggan */
  async fillGroupForm(groupName: string): Promise<void> {
    await this.inputGroupName.fill(groupName);
  }

  /** Simpan formulir */
  async clickSave(): Promise<void> {
    await this.btnSave.click();
  }

  /** Batalkan pembuatan/pengeditan grup */
  async clickCancel(): Promise<void> {
    await this.btnCancel.click();
  }

  // ── AKSI BARIS TABEL ───────────────────────────────────────────────────────

  /** Ambil locator baris tabel berdasarkan nama */
  row(name: string): Locator {
    const prefix = name.length > 12 ? name.substring(0, 12) : name;
    const upperName = name.toUpperCase();
    const upperPrefix = prefix.toUpperCase();

    return this.page
      .getByRole('row')
      .filter({
        has: this.page.locator(`xpath=.//*[
        contains(text(), "${name}") or
        contains(text(), "${upperName}") or
        @title="${name}" or
        @title="${upperName}" or
        @aria-label="${name}" or
        @aria-label="${upperName}" or
        contains(text(), "${prefix}") or
        contains(text(), "${upperPrefix}")
      ]`),
      })
      .first();
  }

  /** Klik tombol edit pada baris tertentu */
  async clickEditGroup(groupName: string): Promise<void> {
    const rowEl = this.row(groupName);
    await rowEl.waitFor({ state: 'visible' });
    const btnEdit = rowEl
      .locator('span[aria-label="Edit"] button, span[aria-label="Ubah"] button')
      .first();
    await btnEdit.click();
  }

  /** Klik tombol hapus pada baris tertentu */
  async clickDeleteGroup(groupName: string): Promise<void> {
    const rowEl = this.row(groupName);
    await rowEl.waitFor({ state: 'visible' });
    const btnDelete = rowEl
      .locator('span[aria-label="Delete"] button, span[aria-label="Hapus"] button')
      .first();
    await btnDelete.click();
  }

  /** Konfirmasi penghapusan grup di dialog */
  async confirmDelete(): Promise<void> {
    await this.deleteDialog.waitFor({ state: 'visible' });
    await this.btnConfirmDelete.click();
  }

  /** Batalkan penghapusan grup di dialog */
  async cancelDelete(): Promise<void> {
    await this.deleteDialog.waitFor({ state: 'visible' });
    await this.btnCancelDelete.click();
  }

  /** Cek apakah grup tertentu visible di tabel */
  async isGroupVisible(groupName: string): Promise<boolean> {
    return this.row(groupName).isVisible();
  }

  // ── PAGINATION ─────────────────────────────────────────────────────────────

  /** Atur jumlah baris per halaman */
  async setRowsPerPage(value: string): Promise<void> {
    await this.selectOptionByDataValueFromListbox(this.selectRowsPerPage, value, 5000);
  }

  /** Pergi ke halaman tertentu menggunakan input text */
  async goToPage(pageNumber: number): Promise<void> {
    await this.inputGoToPage.fill(pageNumber.toString());
    await this.page.keyboard.press('Enter');
    await this.waitForLoad();
  }

  /** Pindah ke halaman berikutnya */
  async nextPage(): Promise<void> {
    await this.btnNextPage.click();
  }

  /** Pindah ke halaman sebelumnya */
  async prevPage(): Promise<void> {
    await this.btnPrevPage.click();
  }

  /** Lompat ke halaman terakhir */
  async lastPage(): Promise<void> {
    await this.btnLastPage.click();
  }

  /** Lompat ke halaman pertama */
  async firstPage(): Promise<void> {
    await this.btnFirstPage.click();
  }

  /** Tunggu data tabel selesai dimuat setelah aksi pagination */
  async waitAfterPagination(): Promise<void> {
    await this.waitForLoad();
  }

  // ── TOAST NOTIFICATIONS VERIFICATION ───────────────────────────────────────

  /** Verifikasi toast sukses standar (tambah, edit, hapus) */
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

    // React Hot Toast standard checks
    const toast = this.page
      .locator('div[role="status"], div[role="alert"]')
      .getByText(pattern)
      .first();
    try {
      await toast.waitFor({ state: 'visible', timeout: 5000 });
      // Di lingkungan cepat/padat, kita tidak perlu selalu menunggu toast benar-benar tersembunyi
      // jika kita bisa melanjutkannya, tetapi jika kita mau tunggu, mari kita toleransi atau biarkan cepat.
      await toast.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    } catch {
      const genericToast = this.page
        .locator('div[role="status"], div[role="alert"]')
        .getByText(/berhasil|success|created|saved|ditambahkan|diperbarui|dihapus/i)
        .first();
      await genericToast.waitFor({ state: 'visible', timeout: 3000 });
      await genericToast.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
  }

  /** Verifikasi toast error */
  async verifyErrorToast(pattern?: RegExp | string): Promise<void> {
    const finalPattern = pattern
      ? typeof pattern === 'string'
        ? new RegExp(pattern, 'i')
        : pattern
      : /gagal|error|failed|invalid/i;

    const toast = this.page
      .locator('div[role="alert"], div[role="status"]')
      .getByText(finalPattern)
      .first();
    await toast.waitFor({ state: 'visible', timeout: 5000 });
    await toast.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  /** Ambil locator cell 'Tidak ada hasil ditemukan' */
  getEmptyTableCell(): Locator {
    return this.page.getByRole('cell', {
      name: /Tidak ada hasil ditemukan|No results found/i,
    });
  }

  // ── CUSTOM MIXIN-STYLE ASSERTIONS ─────────────────────────────────────────

  /** Assert baris grup visible di tabel */
  async assertRowExists(rowLocator: Locator, itemName = ''): Promise<void> {
    const msg = itemName
      ? `Baris '${itemName}' seharusnya terlihat di tabel`
      : 'Baris seharusnya terlihat di tabel';
    await expect(rowLocator, msg).toBeVisible();
  }

  /** Assert baris grup tidak visible di tabel */
  async assertRowNotExists(rowLocator: Locator, itemName = ''): Promise<void> {
    const msg = itemName
      ? `Baris '${itemName}' seharusnya tidak ada di tabel`
      : 'Baris seharusnya tidak terlihat di tabel';
    await expect(rowLocator, msg).not.toBeVisible();
  }

  /** Assert tabel memiliki minimal N baris data */
  async assertTableHasRows(tableLocator: Locator, minCount = 1): Promise<void> {
    const count = await tableLocator.locator('tbody tr').count();
    expect(
      count,
      `Tabel seharusnya memiliki minimal ${minCount} baris, ditemukan ${count}`,
    ).toBeGreaterThanOrEqual(minCount);
  }

  /** Assert nilai input di form sesuai ekspektasi */
  async assertFieldValueIgnoreCase(locator: Locator, expected: string): Promise<void> {
    const actual = await locator.inputValue();
    expect(actual.toLowerCase(), `Nilai field '${actual}' tidak sesuai dengan '${expected}'`).toBe(
      expected.toLowerCase(),
    );
  }

  /** Ambil jumlah baris data dalam tabel */
  async getTableRowCount(tableLocator: Locator): Promise<number> {
    return await tableLocator.locator('tbody tr').count();
  }

  /** Ambil teks sel tertentu berdasarkan index baris (1-based) dan kolom (1-based) */
  async getTableCellText(tableLocator: Locator, rowIdx: number, colIdx: number): Promise<string> {
    const text = await tableLocator
      .locator('tbody tr')
      .nth(rowIdx - 1)
      .locator('td')
      .nth(colIdx - 1)
      .textContent();
    return text?.trim() || '';
  }
}
