import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';
import { env } from '@/shared/utils/env';

/**
 * Domain: Customers
 * Page: /customers/all/{id}/edit
 *
 * Page Object Model (POM) untuk mempresentasikan interaksi dengan Form Ubah/Edit Data Pelanggan (Customers Edit).
 */
export class CustomersEditPage extends BasePage {
  // ── HEADER & BREADCRUMB ────────────────────────────────────────────────────
  public readonly heading: Locator;
  public readonly breadcrumbBeranda: Locator;
  public readonly breadcrumbPelanggan: Locator;

  // ── TABS ───────────────────────────────────────────────────────────────────
  public readonly tabDetail: Locator;
  public readonly tabPenagihan: Locator;
  public readonly tabBank: Locator;
  public readonly tabAgen: Locator;

  public readonly tabpanel: Locator;
  public readonly tabpanelDetail: Locator;
  public readonly tabpanelPenagihan: Locator;
  public readonly tabpanelBank: Locator;
  public readonly tabpanelAgen: Locator;

  // ── TAB 0 — DETAIL PELANGGAN — INFORMASI UMUM ──────────────────────────────
  public readonly sectionInfoUmum: Locator;
  public readonly inputKode: Locator;
  public readonly inputNama: Locator;
  public readonly inputEmail: Locator;
  public readonly inputTelepon: Locator;
  public readonly selectKodeTelepon: Locator;
  public readonly selectGrup: Locator;
  public readonly btnKelolaGrup: Locator;
  public readonly selectMataUang: Locator;
  public readonly selectStatus: Locator;

  // ── TAB 0 — DETAIL PELANGGAN — INFORMASI ALAMAT ─────────────────────────────
  public readonly sectionInfoAlamat: Locator;
  public readonly selectNegara: Locator;
  public readonly selectProvinsi: Locator;
  public readonly selectKabupaten: Locator;
  public readonly selectKecamatan: Locator;
  public readonly selectDesa: Locator;
  public readonly inputKodePos: Locator;
  public readonly inputAlamat: Locator;

  // ── TAB 1 — PENAGIHAN & PENGIRIMAN — ALAMAT PENAGIHAN ───────────────────────
  public readonly sectionAlamatPenagihan: Locator;
  public readonly checkboxBillingSameAsCustomer: Locator;
  public readonly selectBillingNegara: Locator;
  public readonly selectBillingProvinsi: Locator;
  public readonly selectBillingKabupaten: Locator;
  public readonly selectBillingKecamatan: Locator;
  public readonly selectBillingDesa: Locator;
  public readonly inputBillingKodePos: Locator;
  public readonly inputBillingAlamat: Locator;

  public readonly billingGeoContainer: Locator;
  public readonly btnBillingGeoDetect: Locator;
  public readonly btnBillingGeoCopy: Locator;
  public readonly inputBillingGeoSearch: Locator;
  public readonly inputBillingGeoLatitude: Locator;
  public readonly inputBillingGeoLongitude: Locator;
  public readonly inputBillingGeoLocationName: Locator;
  public readonly inputBillingGeoDescription: Locator;
  public readonly billingMapContainer: Locator;

  // ── TAB 1 — PENAGIHAN & PENGIRIMAN — ALAMAT PENGIRIMAN ──────────────────────
  public readonly sectionAlamatPengiriman: Locator;
  public readonly checkboxShippingSameAsBilling: Locator;
  public readonly selectShippingNegara: Locator;
  public readonly selectShippingProvinsi: Locator;
  public readonly selectShippingKabupaten: Locator;
  public readonly selectShippingKecamatan: Locator;
  public readonly selectShippingDesa: Locator;
  public readonly inputShippingKodePos: Locator;
  public readonly inputShippingAlamat: Locator;

  public readonly shippingGeoContainer: Locator;
  public readonly btnShippingGeoDetect: Locator;
  public readonly btnShippingGeoCopy: Locator;
  public readonly inputShippingGeoSearch: Locator;
  public readonly inputShippingGeoLatitude: Locator;
  public readonly inputShippingGeoLongitude: Locator;
  public readonly inputShippingGeoLocationName: Locator;
  public readonly inputShippingGeoDescription: Locator;
  public readonly shippingMapContainer: Locator;

  // ── TAB 2 — BANK ───────────────────────────────────────────────────────────
  public readonly bankRows: Locator;
  public readonly inputBankNama: Locator;
  public readonly inputBankAccountHolder: Locator;
  public readonly inputBankAccountNumber: Locator;
  public readonly inputsBankNama: Locator;
  public readonly inputsBankAccountHolder: Locator;
  public readonly inputsBankAccountNumber: Locator;
  public readonly btnTambahBank: Locator;
  public readonly btnHapusBank: Locator;

  // ── TAB 3 — AGEN ───────────────────────────────────────────────────────────
  public readonly inputSearchAgen: Locator;
  public readonly btnTambahAgen: Locator;
  public readonly tableAgen: Locator;
  public readonly agenNoRecords: Locator;

  // ── TOMBOL AKSI ────────────────────────────────────────────────────────────
  public readonly btnLogAktivitas: Locator;
  public readonly btnCancel: Locator;
  public readonly btnSave: Locator;

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

    // ── TABS ─────────────────────────────────────────────────────────────────
    this.tabDetail = page.getByRole('tab', { name: /Detail Pelanggan|Customer Detail/i });
    this.tabPenagihan = page.getByRole('tab', { name: /Penagihan.*Pengiriman|Billing.*Shipping/i });
    this.tabBank = page.getByRole('tab', { name: /^Bank$/i });
    this.tabAgen = page.getByRole('tab', { name: /^Agen$|^Agent$/i });

    this.tabpanel = page.getByRole('tabpanel');
    this.tabpanelDetail = page.locator('#custom-tabpanel-0');
    this.tabpanelPenagihan = page.locator('#custom-tabpanel-1');
    this.tabpanelBank = page.locator('#custom-tabpanel-2');
    this.tabpanelAgen = page.locator('#custom-tabpanel-3');

    // ── TAB 0 — DETAIL PELANGGAN — INFORMASI UMUM ────────────────────────────
    this.sectionInfoUmum = page.getByRole('heading', {
      name: /Informasi Umum|General Information/i,
    });
    this.inputKode = page.locator('#code');
    this.inputNama = page.locator('#name');
    this.inputEmail = page.locator('#email');
    this.inputTelepon = page.locator('#phone');

    const phoneArea = page.locator('.MuiGrid-item').filter({
      has: page.locator("label[for='phone']"),
    });
    this.selectKodeTelepon = phoneArea.getByRole('combobox').first();
    this.selectGrup = page.locator('#customer-group-autocomplete');
    this.btnKelolaGrup = page.getByRole('button', {
      name: /Kelola Grup Pelanggan|Manage Customer Group/i,
    });
    this.selectMataUang = page.locator('#currency-autocomplete');
    this.selectStatus = page.locator('#isActive');

    // ── TAB 0 — DETAIL PELANGGAN — INFORMASI ALAMAT ───────────────────────────
    this.sectionInfoAlamat = page.getByRole('heading', {
      name: /Informasi Alamat|Address Information/i,
    });
    this.selectNegara = page.locator('#country-autocomplete');
    this.selectProvinsi = page.locator('#province-autocomplete');
    this.selectKabupaten = page.locator('#regency-autocomplete');
    this.selectKecamatan = page.locator('#district-autocomplete');
    this.selectDesa = page.locator('#village-autocomplete');
    this.inputKodePos = page.locator('#zipCode');
    this.inputAlamat = page.locator('#address');

    // ── TAB 1 — PENAGIHAN & PENGIRIMAN — ALAMAT PENAGIHAN ─────────────────────
    this.sectionAlamatPenagihan = page.getByRole('heading', {
      name: /Alamat Penagihan|Billing Address/i,
    });
    this.checkboxBillingSameAsCustomer = this.tabpanelPenagihan.getByRole('checkbox').nth(0);
    this.selectBillingNegara = page.locator('#billing-country-autocomplete');
    this.selectBillingProvinsi = page.locator('#billing-province-autocomplete');
    this.selectBillingKabupaten = page.locator('#billing-regency-autocomplete');
    this.selectBillingKecamatan = page.locator('#billing-district-autocomplete');
    this.selectBillingDesa = page.locator('#billing-village-autocomplete');
    this.inputBillingKodePos = page.locator('#billingAddress\\.zipCode');
    this.inputBillingAlamat = page.locator('#billingAddress\\.address');

    this.billingGeoContainer = this.tabpanelPenagihan
      .locator('.MuiGrid-item')
      .filter({
        has: page.locator('#billingAddress-geolocation-latitude'),
      })
      .first();
    this.btnBillingGeoDetect = this.billingGeoContainer.getByRole('button').first();
    this.btnBillingGeoCopy = this.billingGeoContainer.getByRole('button').nth(1);
    this.inputBillingGeoSearch = this.billingGeoContainer.locator('#location-search');
    this.inputBillingGeoLatitude = page.locator('#billingAddress-geolocation-latitude');
    this.inputBillingGeoLongitude = page.locator('#billingAddress-geolocation-longitude');
    this.inputBillingGeoLocationName = page.locator('#billingAddress-geolocation-location-name');
    this.inputBillingGeoDescription = page.locator(
      '#billingAddress-geolocation-location-description',
    );
    this.billingMapContainer = this.billingGeoContainer.locator('.leaflet-container');

    // ── TAB 1 — PENAGIHAN & PENGIRIMAN — ALAMAT PENGIRIMAN ────────────────────
    this.sectionAlamatPengiriman = page.getByRole('heading', {
      name: /Alamat Pengiriman|Shipping Address/i,
    });
    this.checkboxShippingSameAsBilling = this.tabpanelPenagihan.getByRole('checkbox').nth(1);
    this.selectShippingNegara = page.locator('#shipping-country-autocomplete');
    this.selectShippingProvinsi = page.locator('#shipping-province-autocomplete');
    this.selectShippingKabupaten = page.locator('#shipping-regency-autocomplete');
    this.selectShippingKecamatan = page.locator('#shipping-district-autocomplete');
    this.selectShippingDesa = page.locator('#shipping-village-autocomplete');
    this.inputShippingKodePos = page.locator('#shippingAddress\\.zipCode');
    this.inputShippingAlamat = page.locator('#shippingAddress\\.address');

    this.shippingGeoContainer = this.tabpanelPenagihan
      .locator('.MuiGrid-item')
      .filter({
        has: page.locator('#shippingAddress-geolocation-latitude'),
      })
      .first();
    this.btnShippingGeoDetect = this.shippingGeoContainer.getByRole('button').first();
    this.btnShippingGeoCopy = this.shippingGeoContainer.getByRole('button').nth(1);
    this.inputShippingGeoSearch = this.shippingGeoContainer.locator('#location-search');
    this.inputShippingGeoLatitude = page.locator('#shippingAddress-geolocation-latitude');
    this.inputShippingGeoLongitude = page.locator('#shippingAddress-geolocation-longitude');
    this.inputShippingGeoLocationName = page.locator('#shippingAddress-geolocation-location-name');
    this.inputShippingGeoDescription = page.locator(
      '#shippingAddress-geolocation-location-description',
    );
    this.shippingMapContainer = this.shippingGeoContainer.locator('.leaflet-container');

    // ── TAB 2 — BANK ─────────────────────────────────────────────────────────
    this.bankRows = this.tabpanelBank.locator("input[name^='bankReferences['][name$='].bankName']");
    this.inputBankNama = page.locator("[name='bankReferences[0].bankName']");
    this.inputBankAccountHolder = page.locator("[name='bankReferences[0].accountHolderName']");
    this.inputBankAccountNumber = page.locator("[name='bankReferences[0].accountNumber']");

    this.inputsBankNama = page.locator("input[name$='.bankName'][name^='bankReferences[']");
    this.inputsBankAccountHolder = page.locator(
      "input[name$='.accountHolderName'][name^='bankReferences[']",
    );
    this.inputsBankAccountNumber = page.locator(
      "input[name$='.accountNumber'][name^='bankReferences[']",
    );

    this.btnTambahBank = page.getByRole('button', { name: /Tambah Bank|Add Bank/i });
    this.btnHapusBank = this.tabpanelBank.getByRole('button', { name: /Hapus Bank|Delete Bank/i });

    // ── TAB 3 — AGEN ─────────────────────────────────────────────────────────
    this.inputSearchAgen = this.tabpanelAgen.getByTestId('debounced-search-input');
    this.btnTambahAgen = this.tabpanelAgen.getByRole('button', { name: /^Tambah$|^Add$/i });
    this.tableAgen = this.tabpanelAgen.getByRole('table');
    this.agenNoRecords = this.tabpanelAgen.getByText(/No records to display|Tidak ada data/i);

    // ── TOMBOL AKSI ──────────────────────────────────────────────────────────
    this.btnLogAktivitas = page.getByRole('button', { name: /Log Aktivitas|Activity Log/i });
    this.btnCancel = page.getByRole('button', { name: /^Batal$|^Cancel$/i });
    this.btnSave = page.getByRole('button', { name: /^Simpan$|^Save$/i });
  }

  // ── NAVIGASI & TAB SWITCHING ───────────────────────────────────────────────

  /** Buka halaman edit customer berdasarkan ID */
  async goto(customerId: string): Promise<void> {
    const targetUrl = `${env.BASE_URL.replace(/\/$/, '')}/customers/all/${customerId}/edit`;
    await this.navigate(targetUrl);
  }

  /** Kembali ke list customer via breadcrumb */
  async clickBreadcrumb(): Promise<void> {
    await this.breadcrumbPelanggan.click();
  }

  /** Pindah ke tab Detail Pelanggan */
  async goToTabDetail(): Promise<void> {
    await this.tabDetail.click();
    await this.page.waitForTimeout(300);
  }

  /** Pindah ke tab Penagihan & Pengiriman */
  async goToTabPenagihan(): Promise<void> {
    await this.tabPenagihan.click();
    await this.page.waitForTimeout(300);
  }

  /** Pindah ke tab Bank */
  async goToTabBank(): Promise<void> {
    await this.tabBank.click();
    await this.page.waitForTimeout(300);
  }

  /** Pindah ke tab Agen */
  async goToTabAgen(): Promise<void> {
    await this.tabAgen.click();
    await this.page.waitForTimeout(300);
  }

  // ── EDIT FIELD — INFORMASI UMUM ───────────────────────────────────────────

  async editKode(kode: string): Promise<void> {
    await this.inputKode.fill(kode);
  }

  async editNama(nama: string): Promise<void> {
    await this.inputNama.fill(nama);
  }

  async editEmail(email: string): Promise<void> {
    await this.inputEmail.fill(email);
  }

  async editTelepon(telepon: string): Promise<void> {
    await this.inputTelepon.fill(telepon);
  }

  // ── SELECTION — INFORMASI UMUM ──────────────────────────────────────────────

  /** Pilih Kode Telepon Negara */
  async selectKodeTeleponNegara(kode: string): Promise<void> {
    await this.fillAndSelectAutocomplete(this.selectKodeTelepon, kode);
  }

  /** Pilih Grup Pelanggan */
  async selectGrupPelanggan(grup: string): Promise<void> {
    await this.fillAndSelectAutocomplete(this.selectGrup, grup);
  }

  /** Klik kelola grup */
  async clickKelolaGrup(): Promise<void> {
    await this.btnKelolaGrup.click();
  }

  /** Pilih Mata Uang Pelanggan */
  async selectMataUangPelanggan(mataUang: string): Promise<void> {
    const currencyAlias: Record<string, string> = {
      IDR: 'Rupiah Indonesia',
      USD: 'US Dollar',
    };
    const keyword = currencyAlias[mataUang.trim().toUpperCase()] || mataUang;
    await this.fillAndSelectAutocomplete(this.selectMataUang, keyword);
  }

  /** Pilih Status dari Select MUI (Aktif / Tidak Aktif) */
  async selectStatusPelanggan(status: string): Promise<void> {
    await this.selectOptionFromListbox(this.selectStatus, status, 5000);
  }

  // ── SELECTION — INFORMASI ALAMAT ───────────────────────────────────────────

  async selectNegaraPelanggan(negara: string): Promise<void> {
    await this.fillAndSelectAutocomplete(this.selectNegara, negara);
  }

  async selectProvinsiPelanggan(provinsi: string): Promise<void> {
    await this.fillAndSelectAutocomplete(this.selectProvinsi, provinsi);
  }

  async selectKabupatenPelanggan(kabupaten: string): Promise<void> {
    await this.fillAndSelectAutocomplete(this.selectKabupaten, kabupaten);
  }

  async selectKecamatanPelanggan(kecamatan: string): Promise<void> {
    await this.fillAndSelectAutocomplete(this.selectKecamatan, kecamatan);
  }

  async selectDesaPelanggan(desa: string): Promise<void> {
    await this.fillAndSelectAutocomplete(this.selectDesa, desa);
  }

  async editKodePos(kodePos: string): Promise<void> {
    await this.inputKodePos.fill(kodePos);
  }

  async editAlamat(alamat: string): Promise<void> {
    await this.inputAlamat.fill(alamat);
  }

  // ── SUBMIT / BATAL ─────────────────────────────────────────────────────────

  async clickSave(): Promise<void> {
    await this.btnSave.click();
  }

  async clickCancel(): Promise<void> {
    await this.btnCancel.click();
  }

  async clickLogAktivitas(): Promise<void> {
    await this.btnLogAktivitas.click();
  }

  // ── TOAST VERIFICATION ────────────────────────────────────────────────────

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
    try {
      await this.waitForToast(pattern);
    } catch {
      await this.waitForToast(/berhasil|success|created|saved|ditambahkan|diperbarui|dihapus/i);
    }
  }

  async verifyErrorToast(pattern?: RegExp | string): Promise<void> {
    const finalPattern = pattern
      ? typeof pattern === 'string'
        ? new RegExp(pattern, 'i')
        : pattern
      : /gagal|error|failed|invalid/i;
    await this.waitForToast(finalPattern, 'error');
  }

  // ── CUSTOM MIXIN-STYLE ASSERTIONS ─────────────────────────────────────────

  async assertFieldValue(locator: Locator, expected: string): Promise<void> {
    const actual = await locator.inputValue();
    expect(actual, `Nilai field '${actual}' tidak sama dengan '${expected}'`).toBe(expected);
  }

  async assertFieldValueIgnoreCase(locator: Locator, expected: string): Promise<void> {
    const actual = await locator.inputValue();
    expect(
      actual.toLowerCase(),
      `Nilai field '${actual}' tidak sama dengan '${expected}' (case-insensitive)`,
    ).toBe(expected.toLowerCase());
  }

  async assertFieldNotEmpty(locator: Locator, fieldName = ''): Promise<void> {
    const actual = await locator.inputValue();
    const label = fieldName ? `Field '${fieldName}'` : 'Field';
    expect(actual, `${label} seharusnya tidak kosong`).not.toBe('');
  }
}
