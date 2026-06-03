import { test, expect } from '@/fixtures/base.fixture';
import { CustomerFactory, uniqueEmail, uniqueName } from '@/shared/utils/factories';
import { CustomersNewPage } from '@/pages/ui/customers/CustomersNewPage';
import { CustomersAllPage } from '@/pages/ui/customers/CustomersAllPage';
import type { Page } from '@playwright/test';

test.describe('Customer Creation Scenario Suite', { tag: ['@customer', '@customer-new'] }, () => {
  const fillAllRequired = async (
    np: CustomersNewPage,
    nama: string,
    kode = '',
    email = '',
    telepon = '81234567890',
    mataUang = 'IDR',
    negara = 'Indonesia',
    provinsi = 'Jawa Barat',
    kabupaten = 'Kota Bandung',
    kecamatan = 'Coblong',
    desa = 'Dago',
  ) => {
    const finalKode = kode || `NEW-${Math.floor(Date.now() / 1000)}`;
    const finalEmail = email || uniqueEmail();

    await np.fillKode(finalKode);
    await np.fillNama(nama);
    await np.fillEmail(finalEmail);
    await np.fillTelepon(telepon);
    await np.selectMataUangPelanggan(mataUang);
    await np.selectNegaraPelanggan(negara);
    await np.selectProvinsiPelanggan(provinsi);
    await np.selectKabupatenPelanggan(kabupaten);
    await np.selectKecamatanPelanggan(kecamatan);
    await np.selectDesaPelanggan(desa);
  };

  const cleanupCustomers = async (page: Page, ...names: string[]) => {
    const cap = new CustomersAllPage(page);
    await cap.goto();
    for (const name of names) {
      await cap.ensureFilterPanelOpen();
      await cap.filterByNama(name);
      if (await cap.isCustomerVisible(name)) {
        await cap.clickDelete(name);
        await cap.confirmDelete();
        await cap.verifySuccessToastGeneric(name, 'delete');
      }
      await cap.clearFilterNama();
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  SMOKE / PAGE LOAD
  // ══════════════════════════════════════════════════════════════════

  test('TC-CNEW-001: should load new customer page successfully with all main fields visible', async ({
    customersNewPage,
  }) => {
    await customersNewPage.goto();
    await customersNewPage.expectUrlContains('/customers/all/new');

    await expect(customersNewPage.heading).toBeVisible();
    await expect(customersNewPage.breadcrumbBeranda).toBeVisible();
    await expect(customersNewPage.breadcrumbPelanggan).toBeVisible();

    // Tabs
    await expect(customersNewPage.tabDetail).toBeVisible();
    await expect(customersNewPage.tabPenagihan).toBeVisible();
    await expect(customersNewPage.tabBank).toBeVisible();
    await expect(customersNewPage.tabAgen).toBeVisible();

    // Section headings & text fields
    await expect(customersNewPage.sectionInfoUmum).toBeVisible();
    await expect(customersNewPage.sectionInfoAlamat).toBeVisible();
    await expect(customersNewPage.inputKode).toBeVisible();
    await expect(customersNewPage.inputNama).toBeVisible();
    await expect(customersNewPage.inputEmail).toBeVisible();
    await expect(customersNewPage.inputTelepon).toBeVisible();

    // Selects & Buttons
    await expect(customersNewPage.selectGrup).toBeVisible();
    await expect(customersNewPage.btnKelolaGrup).toBeVisible();
    await expect(customersNewPage.selectMataUang).toBeVisible();
    await expect(customersNewPage.selectStatus).toBeVisible();
    await expect(customersNewPage.selectNegara).toBeVisible();
    await expect(customersNewPage.inputKodePos).toBeVisible();
    await expect(customersNewPage.inputAlamat).toBeVisible();

    // Action Buttons
    await expect(customersNewPage.btnCancel).toBeVisible();
    await expect(customersNewPage.btnSave).toBeVisible();
  });

  test('TC-CNEW-002: should display correct heading title on creation page', async ({
    customersNewPage,
  }) => {
    await customersNewPage.goto();
    await expect(customersNewPage.heading).toBeVisible();
    const headingText = (await customersNewPage.heading.innerText()).trim();
    expect(headingText).toMatch(/(tambah|add|buat|new|pelanggan|customer)/i);
  });

  // ══════════════════════════════════════════════════════════════════
  //  POSITIVE — CREATE CUSTOMERS
  // ══════════════════════════════════════════════════════════════════

  test('TC-CNEW-003: should successfully create a customer when all required fields are filled', async ({
    page,
    customersNewPage,
  }) => {
    const customerName = uniqueName('New Customer Full');

    try {
      await customersNewPage.goto();
      await fillAllRequired(customersNewPage, customerName);
      await customersNewPage.clickSave();
      await customersNewPage.verifySuccessToastGeneric(customerName, 'add');
    } finally {
      await cleanupCustomers(page, customerName);
    }
  });

  test('TC-CNEW-004: should list the newly created customer in the customer all list', async ({
    page,
    customersNewPage,
    customersAllPage,
  }) => {
    const customerName = uniqueName('Verify In List');

    try {
      await customersNewPage.goto();
      await fillAllRequired(customersNewPage, customerName);
      await customersNewPage.clickSave();
      await customersNewPage.verifySuccessToastGeneric(customerName, 'add');

      await customersAllPage.goto();
      await customersAllPage.ensureFilterPanelOpen();
      await customersAllPage.filterByNama(customerName);
      await expect(customersAllPage.row(customerName)).toBeVisible();
    } finally {
      await cleanupCustomers(page, customerName);
    }
  });

  test('TC-CNEW-005: should successfully create a customer with custom customer code', async ({
    page,
    customersNewPage,
  }) => {
    const customerName = uniqueName('Custom Code');
    const customCode = `CUSTOM-${Math.floor(Date.now() / 1000)}`;

    try {
      await customersNewPage.goto();
      await fillAllRequired(customersNewPage, customerName, customCode);
      await customersNewPage.clickSave();
      await customersNewPage.verifySuccessToastGeneric(customerName, 'add');
    } finally {
      await cleanupCustomers(page, customerName);
    }
  });

  test('TC-CNEW-008: should successfully create a customer with selected customer group', async ({
    page,
    customersNewPage,
  }) => {
    const customerName = uniqueName('With Group');

    try {
      await customersNewPage.goto();
      await fillAllRequired(customersNewPage, customerName);
      await customersNewPage.selectGrupPelanggan('FTP');
      await customersNewPage.clickSave();
      await customersNewPage.verifySuccessToastGeneric(customerName, 'add');
    } finally {
      await cleanupCustomers(page, customerName);
    }
  });

  test('TC-CNEW-009: should successfully create a customer with Inactive status', async ({
    page,
    customersNewPage,
  }) => {
    const customerName = uniqueName('Status Inactive');

    try {
      await customersNewPage.goto();
      await fillAllRequired(customersNewPage, customerName);
      await customersNewPage.selectStatusPelanggan('Tidak Aktif');
      await customersNewPage.clickSave();
      await customersNewPage.verifySuccessToastGeneric(customerName, 'add');
    } finally {
      await cleanupCustomers(page, customerName);
    }
  });

  test('TC-CNEW-011: should successfully create a customer with complete address fields', async ({
    page,
    customersNewPage,
  }) => {
    const customerName = uniqueName('Full Address');

    try {
      await customersNewPage.goto();
      await fillAllRequired(customersNewPage, customerName);
      await customersNewPage.fillKodePos('40123');
      await customersNewPage.fillAlamat('Jl. Merdeka No. 123, RT 01/RW 02');
      await customersNewPage.clickSave();
      await customersNewPage.verifySuccessToastGeneric(customerName, 'add');
    } finally {
      await cleanupCustomers(page, customerName);
    }
  });

  test('TC-CNEW-013: should successfully create a customer using factory details', async ({
    page,
    customersNewPage,
  }) => {
    const mockData = CustomerFactory.customerData();
    const customerName = uniqueName(mockData.name.slice(0, 20));

    try {
      await customersNewPage.goto();
      await fillAllRequired(customersNewPage, customerName, '', mockData.email, '81234567890');
      await customersNewPage.clickSave();
      await customersNewPage.verifySuccessToastGeneric(customerName, 'add');
    } finally {
      await cleanupCustomers(page, customerName);
    }
  });

  // ══════════════════════════════════════════════════════════════════
  //  CANCEL FLOWS
  // ══════════════════════════════════════════════════════════════════

  test('TC-CNEW-015: should discard creation and return to list when cancelled', async ({
    customersNewPage,
    customersAllPage,
  }) => {
    const customerName = uniqueName('Cancel New');

    await customersNewPage.goto();
    await customersNewPage.fillNama(customerName);
    await customersNewPage.clickCancel();

    await customersNewPage.expectUrlContains('/customers');

    await customersAllPage.goto();
    await customersAllPage.ensureFilterPanelOpen();
    await customersAllPage.filterByNama(customerName);
    await expect(customersAllPage.row(customerName)).toBeHidden();
  });

  // ══════════════════════════════════════════════════════════════════
  //  TAB NAVIGATION & CASCADING SELECTS
  // ══════════════════════════════════════════════════════════════════

  test('TC-CNEW-019: should support tab navigation back and forth', async ({
    customersNewPage,
  }) => {
    await customersNewPage.goto();

    await customersNewPage.goToTabPenagihan();
    await expect(customersNewPage.tabpanelPenagihan).toBeVisible();

    await customersNewPage.goToTabBank();
    await expect(customersNewPage.tabpanelBank).toBeVisible();

    await customersNewPage.goToTabDetail();
    await expect(customersNewPage.tabpanelDetail).toBeVisible();
  });

  test('TC-CNEW-020: should keep Agent tab disabled on new customer creation page', async ({
    customersNewPage,
  }) => {
    await customersNewPage.goto();
    await expect(customersNewPage.tabAgen).toBeDisabled();
  });

  test('TC-CNEW-021: should cascadingly populate address dropdown selections', async ({
    customersNewPage,
  }) => {
    await customersNewPage.goto();

    await customersNewPage.selectNegaraPelanggan('Indonesia');
    await expect(customersNewPage.selectProvinsi).toBeVisible();

    await customersNewPage.selectProvinsiPelanggan('Jawa Barat');
    await expect(customersNewPage.selectKabupaten).toBeVisible();

    await customersNewPage.selectKabupatenPelanggan('Kota Bandung');
    await expect(customersNewPage.selectKecamatan).toBeVisible();
  });

  // ══════════════════════════════════════════════════════════════════
  //  NEGATIVE FORM VALIDATION SCENARIOS
  // ══════════════════════════════════════════════════════════════════

  test('TC-CNEW-022: should reject empty form submission', async ({ customersNewPage }) => {
    await customersNewPage.goto();
    await customersNewPage.clickSave();
    await customersNewPage.verifyErrorToast();
  });

  test('TC-CNEW-023: should reject customer creation when Name field is empty', async ({
    customersNewPage,
  }) => {
    await customersNewPage.goto();

    await customersNewPage.fillKode(`NONAME-${Math.floor(Date.now() / 1000)}`);
    await customersNewPage.fillEmail(uniqueEmail());
    await customersNewPage.fillTelepon('81234567890');
    await customersNewPage.selectMataUangPelanggan('IDR');
    await customersNewPage.fillInfoAlamat(
      'Indonesia',
      'Jawa Barat',
      'Kota Bandung',
      'Coblong',
      'Dago',
    );

    await customersNewPage.clickSave();
    await customersNewPage.verifyErrorToast(
      /(gagal|error|failed|invalid|nama|name|wajib|required|harus)/i,
    );
  });

  test('TC-CNEW-024: should reject customer creation when Email field is empty', async ({
    customersNewPage,
  }) => {
    const customerName = uniqueName('No Email');
    await customersNewPage.goto();

    await customersNewPage.fillKode(`NOEMAIL-${Math.floor(Date.now() / 1000)}`);
    await customersNewPage.fillNama(customerName);
    await customersNewPage.fillTelepon('81234567890');
    await customersNewPage.selectMataUangPelanggan('IDR');
    await customersNewPage.fillInfoAlamat(
      'Indonesia',
      'Jawa Barat',
      'Kota Bandung',
      'Coblong',
      'Dago',
    );

    await customersNewPage.clickSave();
    await customersNewPage.verifyErrorToast(
      /(gagal|error|failed|invalid|email|wajib|required|harus)/i,
    );
  });

  test('TC-CNEW-025: should reject customer creation when Phone field is empty', async ({
    customersNewPage,
  }) => {
    const customerName = uniqueName('No Phone');
    await customersNewPage.goto();

    await customersNewPage.fillKode(`NOPHONE-${Math.floor(Date.now() / 1000)}`);
    await customersNewPage.fillNama(customerName);
    await customersNewPage.fillEmail(uniqueEmail());
    await customersNewPage.selectMataUangPelanggan('IDR');
    await customersNewPage.fillInfoAlamat(
      'Indonesia',
      'Jawa Barat',
      'Kota Bandung',
      'Coblong',
      'Dago',
    );

    await customersNewPage.clickSave();
    await customersNewPage.verifyErrorToast(
      /(gagal|error|failed|invalid|telepon|phone|wajib|required|harus)/i,
    );
  });

  test('TC-CNEW-026: should reject customer creation when Currency field is empty', async ({
    customersNewPage,
  }) => {
    const customerName = uniqueName('No Currency');
    await customersNewPage.goto();

    await customersNewPage.fillKode(`NOCURR-${Math.floor(Date.now() / 1000)}`);
    await customersNewPage.fillNama(customerName);
    await customersNewPage.fillEmail(uniqueEmail());
    await customersNewPage.fillTelepon('81234567890');
    await customersNewPage.fillInfoAlamat(
      'Indonesia',
      'Jawa Barat',
      'Kota Bandung',
      'Coblong',
      'Dago',
    );

    await customersNewPage.clickSave();
    await customersNewPage.verifyErrorToast(
      /(gagal|error|failed|invalid|mata uang|currency|wajib|required|harus)/i,
    );
  });

  test('TC-CNEW-027: should reject customer creation when Country address is empty', async ({
    customersNewPage,
  }) => {
    const customerName = uniqueName('No Country');
    await customersNewPage.goto();

    await customersNewPage.fillKode(`NOCOUNTRY-${Math.floor(Date.now() / 1000)}`);
    await customersNewPage.fillNama(customerName);
    await customersNewPage.fillEmail(uniqueEmail());
    await customersNewPage.fillTelepon('81234567890');
    await customersNewPage.selectMataUangPelanggan('IDR');

    await customersNewPage.clickSave();
    await customersNewPage.verifyErrorToast(
      /(gagal|error|failed|invalid|alamat|negara|country|wajib|required|harus)/i,
    );
  });

  // ══════════════════════════════════════════════════════════════════
  //  VALIDATION FORMAT ERRORS
  // ══════════════════════════════════════════════════════════════════

  test('TC-CNEW-032: should validate incorrect email formats', async ({ customersNewPage }) => {
    const invalidEmails = ['invalid-email', 'email@double@at.com', 'email with spaces@domain.com'];
    await customersNewPage.goto();

    for (const email of invalidEmails) {
      await customersNewPage.fillEmail(email);
      await customersNewPage.clickSave();
      await customersNewPage.verifyErrorToast(/(gagal|error|failed|invalid|email)/i);
    }
  });

  test('TC-CNEW-035: should validate non-numeric phone values', async ({ customersNewPage }) => {
    const invalidPhones = ['abc123456789', '812-3456-7890'];
    await customersNewPage.goto();

    for (const phone of invalidPhones) {
      await customersNewPage.fillTelepon(phone);
      await customersNewPage.clickSave();
      await customersNewPage.verifyErrorToast(/(gagal|error|failed|invalid|telepon|phone)/i);
    }
  });

  test('TC-CNEW-040: should prevent duplicate customer code creation', async ({
    page,
    customersNewPage,
  }) => {
    const firstCustomer = uniqueName('Duplicate Code A');
    const secondCustomer = uniqueName('Duplicate Code B');
    const sharedCode = `SHARED-${Math.floor(Date.now() / 1000)}`;

    try {
      // 1. Create first customer
      await customersNewPage.goto();
      await fillAllRequired(customersNewPage, firstCustomer, sharedCode);
      await customersNewPage.clickSave();
      await customersNewPage.verifySuccessToastGeneric(firstCustomer, 'add');

      // 2. Try to create second customer with the same code
      await customersNewPage.goto();
      await fillAllRequired(customersNewPage, secondCustomer, sharedCode);
      await customersNewPage.clickSave();
      await customersNewPage.verifyErrorToast(
        /(gagal|error|failed|invalid|sudah ada|already exists|duplikat|duplicate)/i,
      );
      await customersNewPage.clickCancel();
    } finally {
      await cleanupCustomers(page, firstCustomer);
    }
  });

  // ══════════════════════════════════════════════════════════════════
  //  SECURITY INJECTION VALIDATIONS
  // ══════════════════════════════════════════════════════════════════

  test('TC-CNEW-041: should validate or safely escape XSS script injection vectors in text inputs', async ({
    page,
    customersNewPage,
  }) => {
    const customerName = uniqueName("XSS <script>alert('xss')</script>");

    try {
      await customersNewPage.goto();
      await fillAllRequired(customersNewPage, customerName);
      await customersNewPage.clickSave();
      await customersNewPage.verifySuccessToastGeneric(customerName, 'add');
    } finally {
      await cleanupCustomers(page, customerName);
    }
  });

  test('TC-CNEW-042: should validate or safely escape SQL injection inputs', async ({
    page,
    customersNewPage,
  }) => {
    const customerName = uniqueName("SQL ' OR '1'='1");

    try {
      await customersNewPage.goto();
      await fillAllRequired(customersNewPage, customerName);
      await customersNewPage.clickSave();
      await customersNewPage.verifySuccessToastGeneric(customerName, 'add');
    } finally {
      await cleanupCustomers(page, customerName);
    }
  });
});
