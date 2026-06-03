import { test, expect } from '@/fixtures/base.fixture';
import { CustomersNewPage } from '@/pages/ui/customers/CustomersNewPage';
import { CustomersAllPage } from '@/pages/ui/customers/CustomersAllPage';
import { uniqueEmail, uniqueName } from '@/shared/utils/factories';
import type { Page } from '@playwright/test';

// ── UTILITY HELPERS FOR THE SUITE ───────────────────────────────────────────

const toInt = (rawText: string): number => {
  const clean = rawText.replace(/\./g, '').replace(/,/g, '');
  const match = clean.match(/\d+/);
  if (!match) throw new Error(`Tidak bisa parsing angka dari '${rawText}'`);
  return parseInt(match[0], 10);
};

const getSummaryCounts = async (
  customersAllPage: CustomersAllPage,
): Promise<[number, number, number]> => {
  const totalCard = customersAllPage.cardTotal.locator(
    "xpath=ancestor::*[contains(@class,'MuiCardContent-root')][1]",
  );
  const aktifCard = customersAllPage.cardAktif.locator(
    "xpath=ancestor::*[contains(@class,'MuiCardContent-root')][1]",
  );
  const nonaktifCard = customersAllPage.cardTidakAktif.locator(
    "xpath=ancestor::*[contains(@class,'MuiCardContent-root')][1]",
  );

  const total = toInt(await totalCard.locator('h3').first().innerText());
  const aktif = toInt(await aktifCard.locator('h3').first().innerText());
  const nonaktif = toInt(await nonaktifCard.locator('h3').first().innerText());

  return [total, aktif, nonaktif];
};

const createCustomerForTest = async (page: Page, name: string): Promise<void> => {
  const np = new CustomersNewPage(page);
  await np.goto();
  await np.fillKode(`AUTO-${Math.floor(Date.now() / 1000)}`);
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
};

const cleanupCustomers = async (page: Page, ...names: string[]): Promise<void> => {
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

const normalizeStatusForFilter = (rawStatus: string): string => {
  if (/tidak aktif|inactive/i.test(rawStatus)) {
    return 'Tidak Aktif';
  }
  return 'Aktif';
};

const getFirstRowSnapshot = async (
  customersAllPage: CustomersAllPage,
): Promise<Record<string, string>> => {
  const firstRow = customersAllPage.table.locator('tbody tr').first();
  await expect(firstRow).toBeVisible();

  return {
    kode: (await firstRow.locator("td[data-index='1']").innerText()).trim(),
    nama: (await firstRow.locator("td[data-index='2']").innerText()).trim(),
    email: (await firstRow.locator("td[data-index='3']").innerText()).trim(),
    telepon: (await firstRow.locator("td[data-index='4']").innerText()).trim(),
    status: (await firstRow.locator("td[data-index='5']").innerText()).trim(),
    negara: (await firstRow.locator("td[data-index='6']").innerText()).trim(),
    grup: (await firstRow.locator("td[data-index='7']").innerText()).trim(),
    mata_uang: (await firstRow.locator("td[data-index='8']").innerText()).trim(),
    waktu_dibuat: (await firstRow.locator("td[data-index='9']").innerText()).trim(),
  };
};

const assertRowsMatchStatus = async (
  customersAllPage: CustomersAllPage,
  expectedStatus: string,
  sampleSize = 10,
): Promise<void> => {
  const rows = customersAllPage.table.locator('tbody tr');
  await expect(rows.first()).toBeVisible();

  const statusPattern = /tidak aktif|inactive/i.test(expectedStatus)
    ? /Tidak Aktif|Inactive/i
    : /Aktif|Active/i;

  const count = await rows.count();
  for (let index = 0; index < Math.min(count, sampleSize); index++) {
    const statusCell = rows.nth(index).locator("td[data-index='5']");
    await expect(statusCell).toContainText(statusPattern);
  }
};

const assertRowsHaveNonEmptyCells = async (
  customersAllPage: CustomersAllPage,
  sampleSize = 10,
): Promise<void> => {
  const rows = customersAllPage.table.locator('tbody tr');
  await expect(rows.first()).toBeVisible();

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const count = await rows.count();
  for (let index = 0; index < Math.min(count, sampleSize); index++) {
    const row = rows.nth(index);
    for (const key of keys) {
      const value = (await row.locator(`td[data-index='${key}']`).innerText()).trim();
      expect(value, `Cell data-index='${key}' pada row index=${index} kosong`).not.toBe('');
    }
  }
};

// ── TEST SCENARIOS ──────────────────────────────────────────────────────────

test.describe('Customer List Scenario Suite', { tag: ['@customer', '@customer-all'] }, () => {
  test('TC-CUST-001: should load customers list page successfully', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    await customersAllPage.expectUrlContains('/customers/all');
    await expect(customersAllPage.heading).toBeVisible();
    await expect(customersAllPage.btnNewCustomer).toBeVisible();
  });

  test('TC-CUST-002: should toggle filter panel correctly', async ({ customersAllPage }) => {
    await customersAllPage.goto();

    // Open
    await customersAllPage.openFilters();
    await expect(customersAllPage.inputSearchNama).toBeVisible();
    await expect(customersAllPage.btnResetFilter).toBeVisible();

    // Close
    await customersAllPage.openFilters();
    await expect(customersAllPage.inputSearchNama).toBeHidden();
  });

  test('TC-CUST-003: should clear filter input search when reset is clicked', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    await customersAllPage.openFilters();

    await customersAllPage.filterByNama(`ZZRESET_${Math.floor(Date.now() / 1000)}`);
    await customersAllPage.resetFilters();

    await expect(customersAllPage.inputSearchNama).toHaveValue('');
  });

  test('TC-CUST-004: should display summary cards and table layout correctly', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    await expect(customersAllPage.cardTotal).toBeVisible();
    await expect(customersAllPage.cardAktif).toBeVisible();
    await expect(customersAllPage.cardTidakAktif).toBeVisible();
    await expect(customersAllPage.table).toBeVisible();
    await expect(customersAllPage.btnNewCustomer).toBeVisible();
  });

  test('TC-CUST-005: should display correct table headers and row actions', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();

    await expect(customersAllPage.colKode).toBeVisible();
    await expect(customersAllPage.colNama).toBeVisible();
    await expect(customersAllPage.colEmail).toBeVisible();
    await expect(customersAllPage.colStatus).toBeVisible();
    await expect(customersAllPage.colNegara).toBeVisible();
    await expect(customersAllPage.colGrup).toBeVisible();
    await expect(customersAllPage.colMataUang).toBeVisible();
    await expect(customersAllPage.colAksi).toBeVisible();

    const firstRow = customersAllPage.table.locator('tbody tr').first();
    await expect(firstRow).toBeVisible();
    await expect(
      firstRow.locator('button[aria-label="Detail"], button[aria-label="detail"]'),
    ).toBeVisible();
    await expect(
      firstRow.locator('button[aria-label="Edit"], button[aria-label="Ubah"]'),
    ).toBeVisible();
    await expect(
      firstRow.locator('button[aria-label="Delete"], button[aria-label="Hapus"]'),
    ).toBeVisible();
  });

  test('TC-CUST-006: should verify pagination default components and initial page', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();

    await expect(customersAllPage.selectRowsPerPage).toBeVisible();
    await expect(customersAllPage.inputGoToPage).toBeVisible();
    await expect(customersAllPage.btnFirstPage).toBeVisible();
    await expect(customersAllPage.btnPrevPage).toBeVisible();
    await expect(customersAllPage.btnNextPage).toBeVisible();
    await expect(customersAllPage.btnLastPage).toBeVisible();

    const rowsPerPageText = (await customersAllPage.selectRowsPerPage.innerText()).trim();
    expect(rowsPerPageText).toMatch(/^(5|10|25|50|100)$/);
    await expect(customersAllPage.inputGoToPage).toHaveValue('1');
  });

  test('TC-CUST-007: should show consistent summary metrics', async ({ customersAllPage }) => {
    await customersAllPage.goto();
    const [total, aktif, nonaktif] = await getSummaryCounts(customersAllPage);
    const visibleRows = await customersAllPage.table.locator('tbody tr').count();

    expect(total).toBe(aktif + nonaktif);
    expect(visibleRows).toBeLessThanOrEqual(total);
  });

  test('TC-CUST-008: should filter list correctly by existing customer code', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    const firstRow = customersAllPage.table.locator('tbody tr').first();
    const codeText = (await firstRow.locator("td[data-index='1'] p").innerText()).trim();

    await customersAllPage.filterByKode(codeText);

    await expect(customersAllPage.table.locator('tbody tr').first()).toBeVisible();
    await expect(
      customersAllPage.table.locator('tbody tr').first().locator("td[data-index='1'] p"),
    ).toHaveText(new RegExp(codeText, 'i'));

    await customersAllPage.resetFilters();
  });

  test('TC-CUST-009: should adjust page size when rows per page is set to 5', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    await customersAllPage.setRowsPerPage('5');
    await customersAllPage.waitAfterPagination();
    const rowCount = await customersAllPage.table.locator('tbody tr').count();

    await expect(customersAllPage.selectRowsPerPage).toHaveText('5');
    expect(rowCount).toBeLessThanOrEqual(5);
  });

  test('TC-CUST-010: should navigate successfully to calculated last page', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    const [total] = await getSummaryCounts(customersAllPage);
    await customersAllPage.setRowsPerPage('5');
    await customersAllPage.waitAfterPagination();

    const expectedLastPage = Math.max(1, Math.ceil(total / 5));
    await customersAllPage.goToPage(expectedLastPage);
    await customersAllPage.waitAfterPagination();

    await expect(customersAllPage.inputGoToPage).toHaveValue(expectedLastPage.toString());
    await expect(customersAllPage.btnNextPage).toBeDisabled();
    await expect(customersAllPage.btnPrevPage).toBeEnabled();
  });

  test('TC-CUST-011: should show only Active records when status Aktif filter is applied', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    await customersAllPage.filterByStatus('Aktif');

    await assertRowsMatchStatus(customersAllPage, 'Aktif');
    await customersAllPage.resetFilters();
  });

  test('TC-CUST-012: should clear multiple text filters when reset is clicked', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    const ts = Math.floor(Date.now() / 1000);
    const randomCode = `ZZCODE_${ts}`;
    const randomName = `ZZNAME_${ts}`;

    await customersAllPage.filterByKode(randomCode);
    await customersAllPage.filterByNama(randomName);
    await customersAllPage.resetFilters();

    await expect(customersAllPage.inputSearchKode).toHaveValue('');
    await expect(customersAllPage.inputSearchNama).toHaveValue('');
    await expect(customersAllPage.inputGoToPage).toHaveValue('1');
  });

  test('TC-CUST-013: should navigate to correct routes from row action clicks', async ({
    page,
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    const firstRowName = (
      await customersAllPage.table
        .locator('tbody tr')
        .first()
        .locator("td[data-index='2'] p")
        .innerText()
    ).trim();

    // Detail Click
    await customersAllPage.clickDetail(firstRowName);
    await expect(page).toHaveURL(/\/customers\/all\/[^/]+$/);

    // Edit Click
    await page.goBack();
    await customersAllPage.waitForLoad();
    await customersAllPage.clickEdit(firstRowName);
    await expect(page).toHaveURL(/\/customers\/all\/[^/]+\/edit$/);
  });

  test('TC-CUST-014: should navigate to creation page when Pelanggan Baru is clicked', async ({
    page,
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    await customersAllPage.clickNewCustomer();

    await expect(page).toHaveURL(/\/customers\/all\/new$/);
  });

  test('TC-CUST-015: should cancel row deletion correctly and keep the customer in table', async ({
    page,
    customersAllPage,
  }) => {
    const customerName = uniqueName('Cancel Delete');
    await createCustomerForTest(page, customerName);

    try {
      await customersAllPage.goto();
      await customersAllPage.filterByNama(customerName);
      await customersAllPage.clickDelete(customerName);
      await expect(customersAllPage.dialogHapus).toBeVisible();
      await customersAllPage.cancelDelete();

      await expect(customersAllPage.dialogHapus).toBeHidden();
      await customersAllPage.filterByNama(customerName);
      await expect(customersAllPage.row(customerName)).toBeVisible();
    } finally {
      await cleanupCustomers(page, customerName);
    }
  });

  test('TC-CUST-016: should confirm row deletion correctly and remove the customer permanently', async ({
    page,
    customersAllPage,
  }) => {
    const customerName = uniqueName('Confirm Delete');
    await createCustomerForTest(page, customerName);

    try {
      await customersAllPage.goto();
      await customersAllPage.filterByNama(customerName);
      await customersAllPage.clickDelete(customerName);
      await customersAllPage.confirmDelete();
      await customersAllPage.verifySuccessToastGeneric(customerName, 'delete');

      await customersAllPage.filterByNama(customerName);
      await expect(customersAllPage.getEmptyTableCell()).toBeVisible();

      await page.reload();
      await customersAllPage.waitForLoad();
      await customersAllPage.filterByNama(customerName);
      await expect(customersAllPage.getEmptyTableCell()).toBeVisible();
    } finally {
      await cleanupCustomers(page, customerName);
    }
  });

  test('TC-CUST-017: should display no-result state for non-matching customer name filter', async ({
    customersAllPage,
  }) => {
    const keyword = `ZZ_NO_MATCH_${Math.floor(Date.now() / 1000)}`;
    await customersAllPage.goto();
    await customersAllPage.filterByNama(keyword);

    await expect(customersAllPage.getEmptyTableCell()).toBeVisible();
    await customersAllPage.resetFilters();
  });

  test('TC-CUST-018: should ignore invalid text value inputs on Go To Page input box', async ({
    customersAllPage,
  }) => {
    const invalidValues = ['0', '-1', 'abc', '1a'];
    await customersAllPage.goto();
    await customersAllPage.setRowsPerPage('5');
    await customersAllPage.waitAfterPagination();

    for (const rawValue of invalidValues) {
      await customersAllPage.goToPageRaw(rawValue);
      const currentPage = (await customersAllPage.inputGoToPage.inputValue()).trim();

      expect(currentPage).toMatch(/^\d+$/);
      expect(parseInt(currentPage, 10)).toBeGreaterThanOrEqual(1);
      await expect(customersAllPage.table).toBeVisible();
    }
  });

  test('TC-CUST-019: should respect next/prev page boundary locks', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    await customersAllPage.setRowsPerPage('5');
    await customersAllPage.waitAfterPagination();

    // Go to Last
    await customersAllPage.lastPage();
    await customersAllPage.waitAfterPagination();
    const lastPageVal = await customersAllPage.inputGoToPage.inputValue();

    await expect(customersAllPage.btnNextPage).toBeDisabled();
    await expect(customersAllPage.inputGoToPage).toHaveValue(lastPageVal);

    // Go to First
    await customersAllPage.firstPage();
    await customersAllPage.waitAfterPagination();
    await expect(customersAllPage.btnPrevPage).toBeDisabled();
    await expect(customersAllPage.inputGoToPage).toHaveValue('1');
  });

  test('TC-CUST-020: should keep correct action targets when filter is active', async ({
    page,
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    const firstRowName = (
      await customersAllPage.table
        .locator('tbody tr')
        .first()
        .locator("td[data-index='2'] p")
        .innerText()
    ).trim();

    await customersAllPage.filterByNama(firstRowName);
    await customersAllPage.clickDetail(firstRowName);
    await expect(page).toHaveURL(/\/customers\/all\/[^/]+$/);

    await page.goBack();
    await customersAllPage.waitForLoad();
    await customersAllPage.filterByNama(firstRowName);
    await customersAllPage.clickEdit(firstRowName);
    await expect(page).toHaveURL(/\/customers\/all\/[^/]+\/edit$/);
  });

  test('TC-CUST-021: should show only Inactive records when status Tidak Aktif filter is applied', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    await customersAllPage.filterByStatus('Tidak Aktif');

    await assertRowsMatchStatus(customersAllPage, 'Tidak Aktif');
    await customersAllPage.resetFilters();
  });

  test('TC-CUST-022: should change rows per page option to 10 successfully', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    await customersAllPage.setRowsPerPage('5');
    await customersAllPage.waitAfterPagination();
    const fiveCount = await customersAllPage.table.locator('tbody tr').count();

    await customersAllPage.setRowsPerPage('10');
    await customersAllPage.waitAfterPagination();
    const tenCount = await customersAllPage.table.locator('tbody tr').count();

    await expect(customersAllPage.selectRowsPerPage).toHaveText('10');
    expect(tenCount).toBeLessThanOrEqual(10);
    expect(tenCount).toBeGreaterThanOrEqual(Math.min(fiveCount, 10));
  });

  test('TC-CUST-023: should preserve filter panel values when it is toggled open and closed', async ({
    customersAllPage,
  }) => {
    const keyword = `PANEL_STATE_${Math.floor(Date.now() / 1000)}`;
    await customersAllPage.goto();

    await customersAllPage.openFilters();
    await customersAllPage.inputSearchNama.fill(keyword);

    // Toggle close
    await customersAllPage.openFilters();
    await expect(customersAllPage.inputSearchNama).toBeHidden();

    // Toggle open again
    await customersAllPage.openFilters();
    await expect(customersAllPage.inputSearchNama).toHaveValue(keyword);

    await customersAllPage.resetFilters();
  });

  test('TC-CUST-024: should target correct action routes after pagination navigation', async ({
    page,
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    await customersAllPage.setRowsPerPage('5');
    await customersAllPage.waitAfterPagination();
    const [total] = await getSummaryCounts(customersAllPage);
    expect(total, 'Dataset harus > 5 agar test pagination page 2 bisa berjalan').toBeGreaterThan(5);

    await customersAllPage.goToPage(2);
    await customersAllPage.waitAfterPagination();
    await expect(customersAllPage.inputGoToPage).toHaveValue('2');

    const pageTwoRowName = (
      await customersAllPage.table
        .locator('tbody tr')
        .first()
        .locator("td[data-index='2'] p")
        .innerText()
    ).trim();
    await customersAllPage.clickDetail(pageTwoRowName);
    await expect(page).toHaveURL(/\/customers\/all\/[^/]+$/);

    await page.goBack();
    await customersAllPage.waitForLoad();
    await customersAllPage.goToPage(2);
    await customersAllPage.waitAfterPagination();
    await customersAllPage.clickEdit(pageTwoRowName);
    await expect(page).toHaveURL(/\/customers\/all\/[^/]+\/edit$/);
  });

  test('TC-CUST-025: should filter list correctly by exact name matching', async ({
    page,
    customersAllPage,
  }) => {
    const customerName = uniqueName('Exact Match');
    await createCustomerForTest(page, customerName);

    try {
      await customersAllPage.goto();
      await customersAllPage.filterByNama(customerName);

      const firstRowName = (
        await customersAllPage.table
          .locator('tbody tr')
          .first()
          .locator("td[data-index='2']")
          .innerText()
      ).trim();
      expect(firstRowName).toBe(customerName);
    } finally {
      await cleanupCustomers(page, customerName);
    }
  });

  test('TC-CUST-026: should filter list correctly by partial name matching', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    const sourceName = (
      await customersAllPage.table
        .locator('tbody tr')
        .first()
        .locator("td[data-index='2']")
        .innerText()
    ).trim();
    const partialKeyword = sourceName.slice(0, Math.max(3, Math.min(sourceName.length, 6))).trim();
    expect(
      partialKeyword.length,
      'Nama row pertama harus >= 2 karakter agar partial search valid',
    ).toBeGreaterThanOrEqual(2);

    await customersAllPage.filterByNama(partialKeyword);
    const rows = customersAllPage.table.locator('tbody tr');
    await expect(rows.first()).toBeVisible();

    const count = await rows.count();
    for (let index = 0; index < Math.min(count, 10); index++) {
      const rowName = (await rows.nth(index).locator("td[data-index='2']").innerText()).trim();
      expect(rowName.toLowerCase()).toContain(partialKeyword.toLowerCase());
    }

    await customersAllPage.resetFilters();
  });

  test('TC-CUST-027: should filter list correctly by selected country', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    const country = (
      await customersAllPage.table
        .locator('tbody tr')
        .first()
        .locator("td[data-index='6']")
        .innerText()
    ).trim();
    expect(
      country,
      'Row pertama harus memiliki data negara yang valid (tidak kosong/strip)',
    ).not.toMatch(/^(-|)$/);

    await customersAllPage.filterByNegara(country);
    const rows = customersAllPage.table.locator('tbody tr');
    await expect(rows.first()).toBeVisible();

    const count = await rows.count();
    for (let index = 0; index < Math.min(count, 10); index++) {
      const countryCell = rows.nth(index).locator("td[data-index='6']");
      await expect(countryCell).toContainText(new RegExp(country, 'i'));
    }

    await customersAllPage.resetFilters();
  });

  test('TC-CUST-028: should filter list correctly by selected customer group', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    const group = (
      await customersAllPage.table
        .locator('tbody tr')
        .first()
        .locator("td[data-index='7']")
        .innerText()
    ).trim();
    expect(
      group,
      'Row pertama harus memiliki data grup yang valid (tidak kosong/strip)',
    ).not.toMatch(/^(-|)$/);

    await customersAllPage.filterByGrup(group);
    const rows = customersAllPage.table.locator('tbody tr');
    await expect(rows.first()).toBeVisible();

    const count = await rows.count();
    for (let index = 0; index < Math.min(count, 10); index++) {
      const groupCell = rows.nth(index).locator("td[data-index='7']");
      await expect(groupCell).toContainText(new RegExp(group, 'i'));
    }

    await customersAllPage.resetFilters();
  });

  test('TC-CUST-029: should resolve combined AND filter for code, name, and status', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    const snapshot = await getFirstRowSnapshot(customersAllPage);
    const statusVal = normalizeStatusForFilter(snapshot.status);

    await customersAllPage.filterByKode(snapshot.kode);
    await customersAllPage.filterByNama(snapshot.nama);
    await customersAllPage.filterByStatus(statusVal);

    const rows = customersAllPage.table.locator('tbody tr');
    await expect(rows.first()).toBeVisible();

    const firstRow = rows.first();
    await expect(firstRow.locator("td[data-index='1']")).toContainText(
      new RegExp(snapshot.kode, 'i'),
    );
    await expect(firstRow.locator("td[data-index='2']")).toContainText(
      new RegExp(snapshot.nama, 'i'),
    );
    await assertRowsMatchStatus(customersAllPage, statusVal);

    await customersAllPage.resetFilters();
  });

  test('TC-CUST-030: should resolve combined AND filter for name, country, and group', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    const snapshot = await getFirstRowSnapshot(customersAllPage);
    expect(snapshot.negara, 'Row pertama harus memiliki data negara yang valid').not.toMatch(
      /^(-|)$/,
    );
    expect(snapshot.grup, 'Row pertama harus memiliki data grup yang valid').not.toMatch(/^(-|)$/);

    await customersAllPage.filterByNama(snapshot.nama);
    await customersAllPage.filterByNegara(snapshot.negara);
    await customersAllPage.filterByGrup(snapshot.grup);

    const rows = customersAllPage.table.locator('tbody tr');
    await expect(rows.first()).toBeVisible();

    const firstRow = rows.first();
    await expect(firstRow.locator("td[data-index='2']")).toContainText(
      new RegExp(snapshot.nama, 'i'),
    );
    await expect(firstRow.locator("td[data-index='6']")).toContainText(
      new RegExp(snapshot.negara, 'i'),
    );
    await expect(firstRow.locator("td[data-index='7']")).toContainText(
      new RegExp(snapshot.grup, 'i'),
    );

    await customersAllPage.resetFilters();
  });

  test('TC-CUST-031: should restore default dataset first record values after filters reset', async ({
    customersAllPage,
  }) => {
    const keyword = `RESET_DEFAULT_${Math.floor(Date.now() / 1000)}`;
    await customersAllPage.goto();

    const defaultSnapshot = await getFirstRowSnapshot(customersAllPage);
    await customersAllPage.filterByNama(keyword);
    await expect(customersAllPage.getEmptyTableCell()).toBeVisible();

    await customersAllPage.resetFilters();
    const restoredSnapshot = await getFirstRowSnapshot(customersAllPage);

    expect(restoredSnapshot.kode).toBe(defaultSnapshot.kode);
    expect(restoredSnapshot.nama).toBe(defaultSnapshot.nama);
  });

  test('TC-CUST-032: should reset pagination back to first page when reset filter is clicked', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    await customersAllPage.setRowsPerPage('5');
    await customersAllPage.waitAfterPagination();
    const [total] = await getSummaryCounts(customersAllPage);
    expect(
      total,
      'Dataset harus > 5 agar reset filter bisa divalidasi dari page 2',
    ).toBeGreaterThan(5);

    await customersAllPage.goToPage(2);
    await customersAllPage.waitAfterPagination();
    await customersAllPage.filterByNama('a');
    await customersAllPage.resetFilters();

    await expect(customersAllPage.inputGoToPage).toHaveValue('1');
  });

  test('TC-CUST-033: should navigate to correct target page via valid pagination number input', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    await customersAllPage.setRowsPerPage('5');
    await customersAllPage.waitAfterPagination();
    const [total] = await getSummaryCounts(customersAllPage);
    const totalPages = Math.max(1, Math.ceil(total / 5));
    expect(
      totalPages,
      'Total halaman harus >= 2 agar navigasi ke page 2 bisa diuji',
    ).toBeGreaterThanOrEqual(2);

    await customersAllPage.goToPage(2);
    await customersAllPage.waitAfterPagination();
    await expect(customersAllPage.inputGoToPage).toHaveValue('2');
  });

  test('TC-CUST-034: should display different dataset elements between page 1 and page 2', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();
    await customersAllPage.setRowsPerPage('5');
    await customersAllPage.waitAfterPagination();
    const [total] = await getSummaryCounts(customersAllPage);
    expect(total, 'Dataset harus > 5 agar perbandingan page 1 vs page 2 valid').toBeGreaterThan(5);

    const pageOneSnapshot = await getFirstRowSnapshot(customersAllPage);
    await customersAllPage.goToPage(2);
    await customersAllPage.waitAfterPagination();
    const pageTwoSnapshot = await getFirstRowSnapshot(customersAllPage);

    expect(pageOneSnapshot.kode).not.toBe(pageTwoSnapshot.kode);
  });

  test('TC-CUST-035: should display correct columns structures and valid non-empty data cells', async ({
    customersAllPage,
  }) => {
    await customersAllPage.goto();

    await expect(customersAllPage.colNo).toBeVisible();
    await expect(customersAllPage.colKode).toBeVisible();
    await expect(customersAllPage.colNama).toBeVisible();
    await expect(customersAllPage.colEmail).toBeVisible();
    await expect(customersAllPage.colTelepon).toBeVisible();
    await expect(customersAllPage.colStatus).toBeVisible();
    await expect(customersAllPage.colNegara).toBeVisible();
    await expect(customersAllPage.colGrup).toBeVisible();
    await expect(customersAllPage.colMataUang).toBeVisible();
    await expect(customersAllPage.colWaktuDibuat).toBeVisible();

    await assertRowsHaveNonEmptyCells(customersAllPage);

    const rows = customersAllPage.table.locator('tbody tr');
    const count = await rows.count();
    for (let index = 0; index < Math.min(count, 10); index++) {
      const statusCell = rows.nth(index).locator("td[data-index='5']");
      await expect(statusCell).toContainText(/Aktif|Tidak Aktif|Active|Inactive/i);
    }
  });

  test('TC-CUST-036: should show empty table for impossible query combinations', async ({
    customersAllPage,
  }) => {
    const ts = Math.floor(Date.now() / 1000);
    const impossibleCode = `IMPOSSIBLE_CODE_${ts}`;
    const impossibleName = `IMPOSSIBLE_NAME_${ts}`;

    await customersAllPage.goto();
    await customersAllPage.filterByKode(impossibleCode);
    await customersAllPage.filterByNama(impossibleName);

    await expect(customersAllPage.getEmptyTableCell()).toBeVisible();
    await customersAllPage.resetFilters();
  });
});
