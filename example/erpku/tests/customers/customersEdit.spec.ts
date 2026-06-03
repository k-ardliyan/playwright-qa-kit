import { test, expect } from '@/fixtures/base.fixture';
import { uniqueEmail, uniqueName } from '@/shared/utils/factories';
import { CustomersNewPage } from '@/pages/ui/customers/CustomersNewPage';
import { CustomersAllPage } from '@/pages/ui/customers/CustomersAllPage';
import type { Page } from '@playwright/test';

test.describe(
  'Customer Modification Scenario Suite',
  { tag: ['@customer', '@customer-edit'] },
  () => {
    const createCustomer = async (page: Page, name: string): Promise<string> => {
      const np = new CustomersNewPage(page);
      const code = `AUTO-${Math.floor(Date.now() / 1000)}`;
      await np.goto();
      await np.fillKode(code);
      await np.fillNama(name);
      await np.fillEmail(uniqueEmail());
      await np.fillTelepon('81234567890');
      await np.selectAnyGrupPelanggan('FTP');
      await np.selectMataUangPelanggan('IDR');
      await np.fillInfoAlamat(
        'Indonesia',
        'Jawa Barat',
        'Kota Bandung',
        'Coblong',
        'Dago',
        '40135',
        'Jl. Test No. 123',
      );
      await np.clickSave();
      await np.verifySuccessToastGeneric(name, 'add');
      return code;
    };

    const navToEdit = async (page: Page, customerName: string): Promise<void> => {
      const cap = new CustomersAllPage(page);
      await cap.goto();
      await cap.ensureFilterPanelOpen();
      await cap.filterByNama(customerName);
      await cap.clickEdit(customerName);
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
    //  SMOKE / PAGE LOAD & PREFILLS
    // ══════════════════════════════════════════════════════════════════

    test('TC-CEDT-001: should load edit page successfully with all main fields visible', async ({
      page,
      customersEditPage,
    }) => {
      const customerName = uniqueName('Smoke Edit');
      await createCustomer(page, customerName);

      try {
        await navToEdit(page, customerName);
        await customersEditPage.expectUrlContains('/edit');

        await expect(customersEditPage.heading).toBeVisible();
        await expect(customersEditPage.breadcrumbBeranda).toBeVisible();
        await expect(customersEditPage.breadcrumbPelanggan).toBeVisible();

        // Tabs
        await expect(customersEditPage.tabDetail).toBeVisible();
        await expect(customersEditPage.tabPenagihan).toBeVisible();
        await expect(customersEditPage.tabBank).toBeVisible();
        await expect(customersEditPage.tabAgen).toBeVisible();

        // Text Fields & Dropdowns
        await expect(customersEditPage.inputKode).toBeVisible();
        await expect(customersEditPage.inputNama).toBeVisible();
        await expect(customersEditPage.inputEmail).toBeVisible();
        await expect(customersEditPage.inputTelepon).toBeVisible();
        await expect(customersEditPage.selectGrup).toBeVisible();
        await expect(customersEditPage.btnKelolaGrup).toBeVisible();
        await expect(customersEditPage.selectMataUang).toBeVisible();
        await expect(customersEditPage.selectStatus).toBeVisible();
        await expect(customersEditPage.selectNegara).toBeVisible();
        await expect(customersEditPage.inputKodePos).toBeVisible();
        await expect(customersEditPage.inputAlamat).toBeVisible();

        // Actions
        await expect(customersEditPage.btnLogAktivitas).toBeVisible();
        await expect(customersEditPage.btnCancel).toBeVisible();
        await expect(customersEditPage.btnSave).toBeVisible();
      } finally {
        await cleanupCustomers(page, customerName);
      }
    });

    test('TC-CEDT-002: should display correct heading title on edit page', async ({
      page,
      customersEditPage,
    }) => {
      const customerName = uniqueName('Heading Check');
      await createCustomer(page, customerName);

      try {
        await navToEdit(page, customerName);
        await expect(customersEditPage.heading).toBeVisible();
        const headingText = (await customersEditPage.heading.innerText()).trim();
        expect(headingText).toMatch(/(ubah|edit)/i);
      } finally {
        await cleanupCustomers(page, customerName);
      }
    });

    test('TC-CEDT-003: should prefill edit form correctly with existing customer details', async ({
      page,
      customersEditPage,
    }) => {
      const customerName = uniqueName('Prefill Check');
      const customEmail = uniqueEmail();
      const customCode = `PRE-${Math.floor(Date.now() / 1000)}`;

      // Custom setup
      const np = new CustomersNewPage(page);
      await np.goto();
      await np.fillKode(customCode);
      await np.fillNama(customerName);
      await np.fillEmail(customEmail);
      await np.fillTelepon('81234567890');
      await np.selectAnyGrupPelanggan('FTP');
      await np.selectMataUangPelanggan('IDR');
      await np.fillInfoAlamat('Indonesia', 'Jawa Barat', 'Kota Bandung', 'Coblong', 'Dago');
      await np.clickSave();
      await np.verifySuccessToastGeneric(customerName, 'add');

      try {
        await navToEdit(page, customerName);

        await customersEditPage.assertFieldValueIgnoreCase(
          customersEditPage.inputNama,
          customerName,
        );
        await customersEditPage.assertFieldNotEmpty(customersEditPage.inputNama, 'Nama');

        await customersEditPage.assertFieldValueIgnoreCase(customersEditPage.inputKode, customCode);
        await customersEditPage.assertFieldNotEmpty(customersEditPage.inputKode, 'Kode');

        await customersEditPage.assertFieldValueIgnoreCase(
          customersEditPage.inputEmail,
          customEmail,
        );
        await customersEditPage.assertFieldNotEmpty(customersEditPage.inputTelepon, 'Telepon');
      } finally {
        await cleanupCustomers(page, customerName);
      }
    });

    // ══════════════════════════════════════════════════════════════════
    //  CRUD — UPDATE DATA
    // ══════════════════════════════════════════════════════════════════

    test('TC-CEDT-004: should successfully update customer name', async ({
      page,
      customersEditPage,
      customersAllPage,
    }) => {
      const originalName = uniqueName('For Update Name');
      const updatedName = originalName + ' Updated';
      await createCustomer(page, originalName);

      try {
        await navToEdit(page, originalName);
        await customersEditPage.editNama(updatedName);
        await customersEditPage.clickSave();
        await customersEditPage.verifySuccessToastGeneric(updatedName, 'update');

        // Verify in list
        await customersAllPage.goto();
        await customersAllPage.ensureFilterPanelOpen();
        await customersAllPage.filterByNama(updatedName);
        await expect(customersAllPage.row(updatedName)).toBeVisible();
      } finally {
        await cleanupCustomers(page, updatedName, originalName);
      }
    });

    test('TC-CEDT-005: should successfully update customer email', async ({
      page,
      customersEditPage,
    }) => {
      const customerName = uniqueName('For Update Email');
      const newEmail = `updated_${Math.floor(Date.now() / 1000)}@test.erpku.com`;
      await createCustomer(page, customerName);

      try {
        await navToEdit(page, customerName);
        await customersEditPage.editEmail(newEmail);
        await customersEditPage.clickSave();
        await customersEditPage.verifySuccessToastGeneric(customerName, 'update');

        // Verify prefill on second load
        await navToEdit(page, customerName);
        await customersEditPage.assertFieldValueIgnoreCase(customersEditPage.inputEmail, newEmail);
      } finally {
        await cleanupCustomers(page, customerName);
      }
    });

    test('TC-CEDT-006: should successfully update customer phone number', async ({
      page,
      customersEditPage,
    }) => {
      const customerName = uniqueName('For Update Phone');
      const newPhone = '89876543210';
      await createCustomer(page, customerName);

      try {
        await navToEdit(page, customerName);
        await customersEditPage.editTelepon(newPhone);
        await customersEditPage.clickSave();
        await customersEditPage.verifySuccessToastGeneric(customerName, 'update');

        await navToEdit(page, customerName);
        await customersEditPage.assertFieldValue(customersEditPage.inputTelepon, newPhone);
      } finally {
        await cleanupCustomers(page, customerName);
      }
    });

    test('TC-CEDT-007: should successfully update customer custom code', async ({
      page,
      customersEditPage,
    }) => {
      const customerName = uniqueName('For Update Code');
      const newCode = `CUST-UPD-${Math.floor(Date.now() / 1000)}`;
      await createCustomer(page, customerName);

      try {
        await navToEdit(page, customerName);
        await customersEditPage.editKode(newCode);
        await customersEditPage.clickSave();
        await customersEditPage.verifySuccessToastGeneric(customerName, 'update');

        await navToEdit(page, customerName);
        await customersEditPage.assertFieldValueIgnoreCase(customersEditPage.inputKode, newCode);
      } finally {
        await cleanupCustomers(page, customerName);
      }
    });

    test('TC-CEDT-008: should successfully update multiple fields simultaneously', async ({
      page,
      customersEditPage,
    }) => {
      const originalName = uniqueName('Multi Update');
      const updatedName = originalName + ' Updated';
      const newEmail = `multi_${Math.floor(Date.now() / 1000)}@test.erpku.com`;
      const newPhone = '85551234567';

      await createCustomer(page, originalName);

      try {
        await navToEdit(page, originalName);
        await customersEditPage.editNama(updatedName);
        await customersEditPage.editEmail(newEmail);
        await customersEditPage.editTelepon(newPhone);
        await customersEditPage.clickSave();
        await customersEditPage.verifySuccessToastGeneric(updatedName, 'update');

        await navToEdit(page, updatedName);
        await customersEditPage.assertFieldValueIgnoreCase(
          customersEditPage.inputNama,
          updatedName,
        );
        await customersEditPage.assertFieldValueIgnoreCase(customersEditPage.inputEmail, newEmail);
        await customersEditPage.assertFieldValue(customersEditPage.inputTelepon, newPhone);
      } finally {
        await cleanupCustomers(page, updatedName, originalName);
      }
    });

    test('TC-CEDT-009: should successfully change customer status to Inactive', async ({
      page,
      customersEditPage,
    }) => {
      const customerName = uniqueName('Status Aktif');
      await createCustomer(page, customerName);

      try {
        await navToEdit(page, customerName);
        await customersEditPage.selectStatusPelanggan('Tidak Aktif');
        await customersEditPage.clickSave();
        await customersEditPage.verifySuccessToastGeneric(customerName, 'update');
      } finally {
        await cleanupCustomers(page, customerName);
      }
    });

    test('TC-CEDT-011: should successfully update customer group selection', async ({
      page,
      customersEditPage,
    }) => {
      const customerName = uniqueName('For Update Group');
      await createCustomer(page, customerName);

      try {
        await navToEdit(page, customerName);
        await customersEditPage.selectGrupPelanggan('FTP');
        await customersEditPage.clickSave();
        await customersEditPage.verifySuccessToastGeneric(customerName, 'update');
      } finally {
        await cleanupCustomers(page, customerName);
      }
    });

    test('TC-CEDT-014: should successfully update cascading address properties', async ({
      page,
      customersEditPage,
    }) => {
      const customerName = uniqueName('For Update Address');
      await createCustomer(page, customerName);

      try {
        await navToEdit(page, customerName);

        await customersEditPage.selectNegaraPelanggan('Indonesia');
        await customersEditPage.selectProvinsiPelanggan('Jawa Barat');
        await customersEditPage.selectKabupatenPelanggan('Kota Bandung');
        await customersEditPage.selectKecamatanPelanggan('Coblong');
        await customersEditPage.selectDesaPelanggan('Dago');
        await customersEditPage.editKodePos('40123');
        await customersEditPage.editAlamat('Jl. Test Automation No. 1');
        await customersEditPage.clickSave();
        await customersEditPage.verifySuccessToastGeneric(customerName, 'update');
      } finally {
        await cleanupCustomers(page, customerName);
      }
    });

    // ══════════════════════════════════════════════════════════════════
    //  CANCEL FLOWS
    // ══════════════════════════════════════════════════════════════════

    test('TC-CEDT-020: should close edit form without changes when Batal is clicked', async ({
      page,
      customersEditPage,
    }) => {
      const customerName = uniqueName('Cancel Edit Check');
      await createCustomer(page, customerName);

      try {
        await navToEdit(page, customerName);
        await customersEditPage.editNama(customerName + ' Mod');
        await customersEditPage.clickCancel();

        await customersEditPage.expectUrlContains('/customers');

        // Verify no changes saved
        await navToEdit(page, customerName);
        await customersEditPage.assertFieldValueIgnoreCase(
          customersEditPage.inputNama,
          customerName,
        );
      } finally {
        await cleanupCustomers(page, customerName);
      }
    });

    // ══════════════════════════════════════════════════════════════════
    //  BREADCRUMB & DIALOGS
    // ══════════════════════════════════════════════════════════════════

    test('TC-CEDT-023: should navigate directly to details page and load edit correctly', async ({
      page,
      customersDetailPage,
      customersEditPage,
    }) => {
      const customerName = uniqueName('Detail Edit Link');
      await createCustomer(page, customerName);

      try {
        const cap = new CustomersAllPage(page);
        await cap.goto();
        await cap.ensureFilterPanelOpen();
        await cap.filterByNama(customerName);
        await cap.clickDetail(customerName);

        await customersDetailPage.expectUrlContains('/customers/all/');
        await customersDetailPage.clickEdit();

        await customersEditPage.expectUrlContains('/edit');
      } finally {
        await cleanupCustomers(page, customerName);
      }
    });

    test('TC-CEDT-048: should open log activity modal successfully', async ({
      page,
      customersEditPage,
    }) => {
      const customerName = uniqueName('Activity Log Check');
      await createCustomer(page, customerName);

      try {
        await navToEdit(page, customerName);
        await customersEditPage.clickLogAktivitas();

        // Verify modal is open by checking visibility of dialog heading
        const dialog = page.locator(".MuiDialog-root:visible, div[role='dialog']:visible").last();
        await expect(dialog).toBeVisible();
        await expect(dialog.getByText(/Aktivitas|Activity|History|Log/i).first()).toBeVisible();

        // Escape close
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
      } finally {
        await cleanupCustomers(page, customerName);
      }
    });
  },
);
