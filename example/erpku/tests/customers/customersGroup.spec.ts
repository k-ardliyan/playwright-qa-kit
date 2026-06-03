import { test, expect } from '@/fixtures/base.fixture';
import { uniqueName } from '@/shared/utils/factories';
import { CustomersGroupPage } from '@/pages/ui/customers/CustomersGroupPage';

test.describe('Customer Group Scenario Suite', { tag: ['@customer', '@customer-group'] }, () => {
  // Helper: Navigasi langsung ke halaman Customer Groups
  const navigateToGroups = async (customersGroupPage: CustomersGroupPage) => {
    await customersGroupPage.goto();
    await customersGroupPage.expectUrlContains('/customers/groups');
  };

  // Helper: Cleanup — hapus satu grup jika masih ada di tabel
  const cleanupGroup = async (customersGroupPage: CustomersGroupPage, groupName: string) => {
    await customersGroupPage.clearSearch();
    await customersGroupPage.searchGroup(groupName);
    await customersGroupPage.clickDeleteGroup(groupName);
    await customersGroupPage.confirmDelete();
    await customersGroupPage.verifySuccessToastGeneric(groupName, 'delete');
  };

  // Helper: Cleanup — hapus satu dari beberapa nama grup (yang pertama ditemukan)
  const cleanupFirstFoundGroup = async (
    customersGroupPage: CustomersGroupPage,
    ...names: string[]
  ) => {
    await customersGroupPage.clearSearch();
    for (const name of names) {
      await customersGroupPage.searchGroup(name);
      if (await customersGroupPage.isGroupVisible(name)) {
        await customersGroupPage.clickDeleteGroup(name);
        await customersGroupPage.confirmDelete();
        await customersGroupPage.verifySuccessToastGeneric(name, 'delete');
        await customersGroupPage.clearSearch();
        return;
      }
      await customersGroupPage.clearSearch();
    }
  };

  // Helper: Cleanup — hapus semua grup dari daftar yang diberikan
  const cleanupAllGroups = async (customersGroupPage: CustomersGroupPage, ...names: string[]) => {
    await customersGroupPage.clearSearch();
    for (const name of names) {
      await customersGroupPage.searchGroup(name);
      if (await customersGroupPage.isGroupVisible(name)) {
        await customersGroupPage.clickDeleteGroup(name);
        await customersGroupPage.confirmDelete();
        await customersGroupPage.verifySuccessToastGeneric(name, 'delete');
      }
      await customersGroupPage.clearSearch();
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  SMOKE / PAGE LOAD
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-001: should load customer groups page successfully', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);

    // Header & Breadcrumb
    await expect(customersGroupPage.heading).toBeVisible();
    await expect(customersGroupPage.breadcrumbGrup).toBeVisible();

    // Tombol aksi utama
    await expect(customersGroupPage.btnNewGroup).toBeVisible();
    await expect(customersGroupPage.btnFilters).toBeVisible();

    // Tabel & column headers
    await expect(customersGroupPage.table).toBeVisible();
    await expect(customersGroupPage.colNo).toBeVisible();
    await expect(customersGroupPage.colNamaGrup).toBeVisible();
    await expect(customersGroupPage.colAksi).toBeVisible();
    await customersGroupPage.assertTableHasRows(customersGroupPage.table);

    // Pagination
    await expect(customersGroupPage.selectRowsPerPage).toBeVisible();
  });

  // ══════════════════════════════════════════════════════════════════
  //  CRUD — CREATE
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-002: should create customer group successfully with valid data', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);
    const testGroupName = uniqueName('Test Group');

    try {
      // CREATE
      await customersGroupPage.clickNewGroup();
      await customersGroupPage.fillGroupForm(testGroupName);
      await customersGroupPage.clickSave();
      await customersGroupPage.verifySuccessToastGeneric(testGroupName, 'add');

      // VERIFY IN TABLE
      await customersGroupPage.searchGroup(testGroupName);
      await customersGroupPage.assertRowExists(
        customersGroupPage.row(testGroupName),
        testGroupName,
      );
    } finally {
      await cleanupGroup(customersGroupPage, testGroupName);
    }
  });

  // ══════════════════════════════════════════════════════════════════
  //  CRUD — CANCEL EDIT
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-003: should close edit form without modifications when cancelled', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);
    const testGroupName = uniqueName('For Cancel Edit');

    try {
      // SETUP
      await customersGroupPage.clickNewGroup();
      await customersGroupPage.fillGroupForm(testGroupName);
      await customersGroupPage.clickSave();
      await customersGroupPage.verifySuccessToastGeneric(testGroupName, 'add');

      // ACT: Buka edit lalu cancel
      await customersGroupPage.searchGroup(testGroupName);
      await expect(customersGroupPage.row(testGroupName)).toBeVisible();
      await customersGroupPage.clickEditGroup(testGroupName);
      await customersGroupPage.clickCancel();

      // ASSERT
      await customersGroupPage.clearSearch();
      await customersGroupPage.searchGroup(testGroupName);
      await customersGroupPage.assertRowExists(
        customersGroupPage.row(testGroupName),
        testGroupName,
      );
    } finally {
      await cleanupGroup(customersGroupPage, testGroupName);
    }
  });

  // ══════════════════════════════════════════════════════════════════
  //  CRUD — UPDATE
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-004: should update customer group name successfully', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);
    const testGroupName = uniqueName('For Update');
    const updatedGroupName = testGroupName + ' Updated';

    try {
      // SETUP
      await customersGroupPage.clickNewGroup();
      await customersGroupPage.fillGroupForm(testGroupName);
      await customersGroupPage.clickSave();
      await customersGroupPage.verifySuccessToastGeneric(testGroupName, 'add');

      // ACT
      await customersGroupPage.searchGroup(testGroupName);
      await expect(customersGroupPage.row(testGroupName)).toBeVisible();
      await customersGroupPage.clickEditGroup(testGroupName);
      await customersGroupPage.fillGroupForm(updatedGroupName);
      await customersGroupPage.clickSave();
      await customersGroupPage.verifySuccessToastGeneric(updatedGroupName, 'update');

      // ASSERT
      await customersGroupPage.clearSearch();
      await customersGroupPage.searchGroup(updatedGroupName);
      await customersGroupPage.assertRowExists(
        customersGroupPage.row(updatedGroupName),
        updatedGroupName,
      );
    } finally {
      await cleanupFirstFoundGroup(customersGroupPage, updatedGroupName, testGroupName);
    }
  });

  // ══════════════════════════════════════════════════════════════════
  //  CRUD — CANCEL DELETE
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-005: should close delete dialog without removing group when cancelled', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);
    const testGroupName = uniqueName('For Cancel Delete');

    try {
      // SETUP
      await customersGroupPage.clickNewGroup();
      await customersGroupPage.fillGroupForm(testGroupName);
      await customersGroupPage.clickSave();
      await customersGroupPage.verifySuccessToastGeneric(testGroupName, 'add');

      // ACT: Klik hapus lalu cancel
      await customersGroupPage.searchGroup(testGroupName);
      await expect(customersGroupPage.row(testGroupName)).toBeVisible();
      await customersGroupPage.clickDeleteGroup(testGroupName);

      // Verifikasi dialog muncul
      await expect(customersGroupPage.dialogHeading).toBeVisible();
      await expect(customersGroupPage.btnConfirmDelete).toBeVisible();
      await expect(customersGroupPage.btnCancelDelete).toBeVisible();

      await customersGroupPage.cancelDelete();

      // ASSERT: Grup masih ada
      await customersGroupPage.assertRowExists(
        customersGroupPage.row(testGroupName),
        testGroupName,
      );
    } finally {
      await cleanupGroup(customersGroupPage, testGroupName);
    }
  });

  // ══════════════════════════════════════════════════════════════════
  //  CRUD — DELETE
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-006: should delete customer group successfully', async ({ customersGroupPage }) => {
    await navigateToGroups(customersGroupPage);
    const testGroupName = uniqueName('For Delete');

    // SETUP
    await customersGroupPage.clickNewGroup();
    await customersGroupPage.fillGroupForm(testGroupName);
    await customersGroupPage.clickSave();
    await customersGroupPage.verifySuccessToastGeneric(testGroupName, 'add');

    // ACT
    await customersGroupPage.searchGroup(testGroupName);
    await expect(customersGroupPage.row(testGroupName)).toBeVisible();
    await customersGroupPage.clickDeleteGroup(testGroupName);
    await customersGroupPage.confirmDelete();
    await customersGroupPage.verifySuccessToastGeneric(testGroupName, 'delete');

    // ASSERT
    await customersGroupPage.clearSearch();
    await customersGroupPage.searchGroup(testGroupName);
    await customersGroupPage.assertRowNotExists(
      customersGroupPage.row(testGroupName),
      testGroupName,
    );
  });

  // ══════════════════════════════════════════════════════════════════
  //  NEGATIVE — DUPLICATE CREATE
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-007: should reject duplicate customer group creation', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);
    const baseGroupName = uniqueName('Duplicate Base');

    try {
      // PREPARE
      await customersGroupPage.clickNewGroup();
      await customersGroupPage.fillGroupForm(baseGroupName);
      await customersGroupPage.clickSave();
      await customersGroupPage.verifySuccessToastGeneric(baseGroupName, 'add');
      await customersGroupPage.waitForLoad(); // tunggu page settled

      // ACT: Coba buat dengan nama yang sama
      await customersGroupPage.clickNewGroup();
      await customersGroupPage.fillGroupForm(baseGroupName);
      await customersGroupPage.clickSave();

      // ASSERT
      await customersGroupPage.verifyErrorToast(
        /(gagal|error|failed|invalid|sudah ada|already exists|duplikat|duplicate)/i,
      );
      await customersGroupPage.clickCancel();
    } finally {
      await cleanupGroup(customersGroupPage, baseGroupName);
    }
  });

  // ══════════════════════════════════════════════════════════════════
  //  NEGATIVE — DUPLICATE UPDATE
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-008: should reject customer group update to an existing duplicate name', async ({
    customersGroupPage,
  }) => {
    test.setTimeout(60000);
    await navigateToGroups(customersGroupPage);
    const sourceName = uniqueName('Src');
    const targetName = uniqueName('Target');

    try {
      // PREPARE
      await customersGroupPage.clickNewGroup();
      await customersGroupPage.fillGroupForm(sourceName);
      await customersGroupPage.clickSave();
      await customersGroupPage.verifySuccessToastGeneric(sourceName, 'add');

      await customersGroupPage.clickNewGroup();
      await customersGroupPage.fillGroupForm(targetName);
      await customersGroupPage.clickSave();
      await customersGroupPage.verifySuccessToastGeneric(targetName, 'add');

      // ACT
      await customersGroupPage.searchGroup(targetName);
      await expect(customersGroupPage.row(targetName)).toBeVisible();
      await customersGroupPage.clickEditGroup(targetName);
      await customersGroupPage.fillGroupForm(sourceName);
      await customersGroupPage.clickSave();

      // ASSERT
      await customersGroupPage.verifyErrorToast(
        /(gagal|error|failed|invalid|sudah ada|already exists|duplikat|duplicate)/i,
      );
      await customersGroupPage.clickCancel();
    } finally {
      await cleanupAllGroups(customersGroupPage, sourceName, targetName);
    }
  });

  // ══════════════════════════════════════════════════════════════════
  //  FORM — CANCEL NEW
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-009: should close create form without saving when cancelled', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);
    const testGroupName = uniqueName('Cancel New');

    // ACT: Buka form, isi, lalu cancel
    await customersGroupPage.clickNewGroup();
    await expect(customersGroupPage.inputGroupName).toBeVisible();
    await customersGroupPage.fillGroupForm(testGroupName);
    await customersGroupPage.clickCancel();

    // ASSERT: Form tertutup, data tidak tersimpan
    await expect(customersGroupPage.inputGroupName).toBeHidden();
    await customersGroupPage.searchGroup(testGroupName);
    await customersGroupPage.assertRowNotExists(
      customersGroupPage.row(testGroupName),
      testGroupName,
    );
  });

  // ══════════════════════════════════════════════════════════════════
  //  FORM — EMPTY VALIDATION
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-010: should reject saving an empty customer group form', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);

    // ACT: Buka form, langsung save tanpa isi nama
    await customersGroupPage.clickNewGroup();
    await expect(customersGroupPage.inputGroupName).toBeVisible();
    await customersGroupPage.clickSave();

    // ASSERT: Error muncul (toast atau form masih terbuka)
    await customersGroupPage.verifyErrorToast();
    await customersGroupPage.clickCancel();
  });

  // ══════════════════════════════════════════════════════════════════
  //  SEARCH — DITEMUKAN
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-011: should filter customer groups correctly with matching keyword', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);
    const testGroupName = uniqueName('Search Hit');

    try {
      // SETUP
      await customersGroupPage.clickNewGroup();
      await customersGroupPage.fillGroupForm(testGroupName);
      await customersGroupPage.clickSave();
      await customersGroupPage.verifySuccessToastGeneric(testGroupName, 'add');

      // ACT
      await customersGroupPage.searchGroup(testGroupName);

      // ASSERT
      await customersGroupPage.assertRowExists(
        customersGroupPage.row(testGroupName),
        testGroupName,
      );
    } finally {
      await cleanupGroup(customersGroupPage, testGroupName);
    }
  });

  // ══════════════════════════════════════════════════════════════════
  //  SEARCH — TIDAK DITEMUKAN
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-012: should display empty table cell for non-matching search keyword', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);
    const nonexistent = `ZZNONEXIST_${Math.floor(Date.now() / 1000)}`;

    // ACT
    await customersGroupPage.searchGroup(nonexistent);

    // ASSERT — tabel menampilkan 1 baris berisi cell "Tidak ada hasil ditemukan"
    await expect(customersGroupPage.getEmptyTableCell()).toBeVisible();

    // CLEANUP
    await customersGroupPage.clearSearch();
  });

  // ══════════════════════════════════════════════════════════════════
  //  SEARCH — CLEAR SEARCH RESETS
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-013: should restore full list after clearing search keyword', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);

    // Baseline: hitung jumlah row awal
    const initialCount = await customersGroupPage.getTableRowCount(customersGroupPage.table);

    // ACT: Search keyword nonsense → clear
    await customersGroupPage.searchGroup(`ZZTEMPFILTER_${Math.floor(Date.now() / 1000)}`);
    await customersGroupPage.clearSearch();
    await customersGroupPage.waitForLoad();

    // ASSERT: Kembali ke jumlah awal
    const restoredCount = await customersGroupPage.getTableRowCount(customersGroupPage.table);
    expect(restoredCount).toBeGreaterThanOrEqual(initialCount);
  });

  // ══════════════════════════════════════════════════════════════════
  //  FILTER PANEL — TOGGLE
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-014: should toggle filter panel correctly when button is clicked', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);

    // Buka filter
    await customersGroupPage.openFilters();
    await expect(customersGroupPage.inputSearch).toBeVisible();
    await expect(customersGroupPage.btnResetFilter).toBeVisible();

    // Tutup filter
    await customersGroupPage.openFilters();
    await expect(customersGroupPage.inputSearch).toBeHidden();
  });

  // ══════════════════════════════════════════════════════════════════
  //  FILTER — RESET
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-015: should clear filters and restore full list when reset is clicked', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);

    // Catat baseline
    const initialCount = await customersGroupPage.getTableRowCount(customersGroupPage.table);

    // ACT: Search sesuatu lalu reset
    await customersGroupPage.searchGroup(`ZZRESET_${Math.floor(Date.now() / 1000)}`);
    await customersGroupPage.resetFilters();

    // ASSERT: Input kosong dan tabel kembali penuh
    await expect(customersGroupPage.inputSearch).toHaveValue('');

    const restoredCount = await customersGroupPage.getTableRowCount(customersGroupPage.table);
    expect(restoredCount).toBeGreaterThanOrEqual(initialCount);
  });

  // ══════════════════════════════════════════════════════════════════
  //  TABLE — COLUMN HEADERS
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-016: should display all core table column headers', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);

    await expect(customersGroupPage.colNo).toBeVisible();
    await expect(customersGroupPage.colNamaGrup).toBeVisible();
    await expect(customersGroupPage.colAksi).toBeVisible();
    await customersGroupPage.assertTableHasRows(customersGroupPage.table);
  });

  // ══════════════════════════════════════════════════════════════════
  //  DIALOG — DELETE CONFIRMATION ELEMENTS
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-017: should display all elements correctly on delete confirmation dialog', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);
    const testGroupName = uniqueName('Dialog Test');

    try {
      // SETUP
      await customersGroupPage.clickNewGroup();
      await customersGroupPage.fillGroupForm(testGroupName);
      await customersGroupPage.clickSave();
      await customersGroupPage.verifySuccessToastGeneric(testGroupName, 'add');

      // ACT: Buka dialog hapus
      await customersGroupPage.searchGroup(testGroupName);
      await expect(customersGroupPage.row(testGroupName)).toBeVisible();
      await customersGroupPage.clickDeleteGroup(testGroupName);

      // ASSERT: Elemen dialog lengkap
      await expect(customersGroupPage.dialogHeading).toBeVisible();
      await expect(customersGroupPage.dialogHapusText).toBeVisible();
      await expect(customersGroupPage.btnConfirmDelete).toBeVisible();
      await expect(customersGroupPage.btnCancelDelete).toBeVisible();

      await customersGroupPage.cancelDelete();
    } finally {
      await cleanupGroup(customersGroupPage, testGroupName);
    }
  });

  // ══════════════════════════════════════════════════════════════════
  //  NAVIGATION — BREADCRUMB
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-018: should navigate to parent page when breadcrumb is clicked', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);

    // Verifikasi breadcrumb ada
    await expect(customersGroupPage.breadcrumbGrup).toBeVisible();

    // ACT
    await customersGroupPage.clickBreadcrumb();

    // ASSERT: URL berubah ke parent
    await customersGroupPage.expectUrlContains('/customers');
  });

  // ══════════════════════════════════════════════════════════════════
  //  PAGINATION — ROWS PER PAGE
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-019: should adjust table row counts based on rows per page select option', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);

    // Set ke 10
    await customersGroupPage.setRowsPerPage('10');
    await customersGroupPage.waitAfterPagination();
    const rowCount10 = await customersGroupPage.getTableRowCount(customersGroupPage.table);
    expect(rowCount10).toBeLessThanOrEqual(10);

    // Set ke 5
    await customersGroupPage.setRowsPerPage('5');
    await customersGroupPage.waitAfterPagination();
    const rowCount5 = await customersGroupPage.getTableRowCount(customersGroupPage.table);
    expect(rowCount5).toBeLessThanOrEqual(5);
  });

  // ══════════════════════════════════════════════════════════════════
  //  PAGINATION — NEXT / PREV
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-020: should change pages correctly when next and previous are clicked', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);

    // Setup: kurangi rows agar ada halaman berikutnya
    await customersGroupPage.setRowsPerPage('5');
    await customersGroupPage.waitAfterPagination();
    await expect(
      customersGroupPage.btnNextPage,
      'Data harus cukup banyak untuk multi-halaman (btnNextPage harus enabled)',
    ).toBeEnabled();

    // Catat cell pertama halaman 1
    const firstPageCell = await customersGroupPage.getTableCellText(customersGroupPage.table, 1, 2);

    // Next
    await customersGroupPage.nextPage();
    await customersGroupPage.waitAfterPagination();
    const secondPageCell = await customersGroupPage.getTableCellText(
      customersGroupPage.table,
      1,
      2,
    );
    expect(firstPageCell).not.toBe(secondPageCell);

    // Prev
    await customersGroupPage.prevPage();
    await customersGroupPage.waitAfterPagination();
    const backToFirstCell = await customersGroupPage.getTableCellText(
      customersGroupPage.table,
      1,
      2,
    );
    expect(backToFirstCell).toBe(firstPageCell);
  });

  // ══════════════════════════════════════════════════════════════════
  //  PAGINATION — FIRST / LAST
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-021: should navigate directly to first and last pages', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);

    await customersGroupPage.setRowsPerPage('5');
    await customersGroupPage.waitAfterPagination();
    await expect(
      customersGroupPage.btnLastPage,
      'Data harus cukup banyak untuk multi-halaman (btnLastPage harus enabled)',
    ).toBeEnabled();

    const firstPageCell = await customersGroupPage.getTableCellText(customersGroupPage.table, 1, 2);

    // Last page
    await customersGroupPage.lastPage();
    await customersGroupPage.waitAfterPagination();
    const lastPageCell = await customersGroupPage.getTableCellText(customersGroupPage.table, 1, 2);
    expect(lastPageCell).not.toBe(firstPageCell);

    // First page
    await customersGroupPage.firstPage();
    await customersGroupPage.waitAfterPagination();
    const backToFirstCell = await customersGroupPage.getTableCellText(
      customersGroupPage.table,
      1,
      2,
    );
    expect(backToFirstCell).toBe(firstPageCell);
  });

  // ══════════════════════════════════════════════════════════════════
  //  PAGINATION — GO TO PAGE
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-022: should navigate to specific page when page number is input', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);

    await customersGroupPage.setRowsPerPage('5');
    await customersGroupPage.waitAfterPagination();
    await expect(
      customersGroupPage.btnNextPage,
      'Data harus cukup banyak untuk multi-halaman (btnNextPage harus enabled)',
    ).toBeEnabled();

    // Go to page 2
    await customersGroupPage.goToPage(2);

    // ASSERT: Halaman 2 ditandai aktif (aria-current="true")
    const activePage = customersGroupPage.page.locator('button[aria-current="true"]');
    await expect(activePage).toBeVisible();
    await expect(activePage).toHaveText('2');
  });

  // ══════════════════════════════════════════════════════════════════
  //  FORM — EDIT PREFILLED
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-023: should prefill edit form correctly with existing group data', async ({
    customersGroupPage,
  }) => {
    await navigateToGroups(customersGroupPage);
    const testGroupName = uniqueName('Prefill Check');

    try {
      // SETUP
      await customersGroupPage.clickNewGroup();
      await customersGroupPage.fillGroupForm(testGroupName);
      await customersGroupPage.clickSave();
      await customersGroupPage.verifySuccessToastGeneric(testGroupName, 'add');

      // ACT: Buka edit
      await customersGroupPage.searchGroup(testGroupName);
      await expect(customersGroupPage.row(testGroupName)).toBeVisible();
      await customersGroupPage.clickEditGroup(testGroupName);

      // ASSERT: Input sudah terisi (case-insensitive — nama grup disimpan dalam UPPERCASE oleh aplikasi)
      await expect(customersGroupPage.inputGroupName).toBeVisible();
      await customersGroupPage.assertFieldValueIgnoreCase(
        customersGroupPage.inputGroupName,
        testGroupName,
      );

      await customersGroupPage.clickCancel();
    } finally {
      await cleanupGroup(customersGroupPage, testGroupName);
    }
  });

  // ══════════════════════════════════════════════════════════════════
  //  NEGATIVE — DELETE GROUP IN USE (INTEGRATION FLOW)
  // ══════════════════════════════════════════════════════════════════

  test('TC-CGRP-024: should reject deletion of customer group that is in use by a customer', async ({
    customersGroupPage,
    customersNewPage,
    customersAllPage,
  }) => {
    test.setTimeout(60000);
    const testGroupName = uniqueName('In Use Group');
    const customerName = uniqueName('Customer For Group Test');

    try {
      // 1. Buat Customer Group baru
      await navigateToGroups(customersGroupPage);
      await customersGroupPage.clickNewGroup();
      await customersGroupPage.fillGroupForm(testGroupName);
      await customersGroupPage.clickSave();
      await customersGroupPage.verifySuccessToastGeneric(testGroupName, 'add');

      // 2. Buat Customer baru yang ditugaskan ke group di atas
      await customersNewPage.goto();
      await customersNewPage.fillKode(`AUTO-${Math.floor(Date.now() / 1000)}`);
      await customersNewPage.fillNama(customerName);
      await customersNewPage.fillEmail(`qa_${Math.floor(Date.now() / 1000)}@test.erpku.com`);
      await customersNewPage.fillTelepon('81234567890');

      // Pilih grup pelanggan yang baru dibuat tadi
      await customersNewPage.selectGrupPelanggan(testGroupName);
      await customersNewPage.selectMataUangPelanggan('IDR');
      await customersNewPage.fillInfoAlamat(
        'Indonesia',
        'Jawa Barat',
        'Kota Bandung',
        'Coblong',
        'Dago',
        '40135',
        'Jl. Test No. 123',
      );
      await customersNewPage.clickSave();
      await customersNewPage.verifySuccessToastGeneric(customerName, 'add');

      // 3. Kembali ke halaman Customer Groups dan coba hapus grup yang sedang digunakan
      await navigateToGroups(customersGroupPage);
      await customersGroupPage.searchGroup(testGroupName);
      await expect(customersGroupPage.row(testGroupName)).toBeVisible();
      await customersGroupPage.clickDeleteGroup(testGroupName);
      await customersGroupPage.confirmDelete();

      // 4. ASSERT: Error toast muncul menghalangi penghapusan
      await customersGroupPage.verifyErrorToast(
        /(sedang digunakan|masih digunakan|in use|dipakai|cannot be deleted|tidak dapat dihapus|gagal|failed|customer group in use)/i,
      );

      // 5. ASSERT: Grup masih terdaftar di tabel
      // Navigate fresh to guarantee a clean, stable page state after the error toast interaction.
      await navigateToGroups(customersGroupPage);
      await customersGroupPage.searchGroup(testGroupName);
      await customersGroupPage.assertRowExists(
        customersGroupPage.row(testGroupName),
        testGroupName,
      );
    } finally {
      // ── CLEANUP (TEARDOWN) ──
      try {
        // 1. Hapus Customer terlebih dahulu jika browser masih aktif
        await customersAllPage.goto();
        await customersAllPage.filterByNama(customerName);
        await customersAllPage.clickDelete(customerName).catch(() => {});
        await customersAllPage.confirmDelete().catch(() => {});
        await customersAllPage.verifySuccessToastGeneric(customerName, 'delete').catch(() => {});
      } catch (e) {
        console.warn(
          'Cleanup Customer failed (might not have been created or browser was already closed):',
          e,
        );
      }

      try {
        // 2. Hapus Customer Group setelah relasinya bersih
        await cleanupGroup(customersGroupPage, testGroupName);
      } catch (e) {
        console.warn('Cleanup Group failed (browser might have been closed):', e);
      }
    }
  });
});
