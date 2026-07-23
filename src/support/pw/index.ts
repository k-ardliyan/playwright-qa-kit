/**
 * Playwright power helpers — official-API wrappers for Generator + human authors.
 *
 * Import from `@/support/pw`:
 *   import { mockJson, apiSeed, expectAriaSnapshot, expectVisual, freezeTime } from '@/support/pw';
 */

export { mockJson, mockServerError, mockAbort, mockText, unmockAll } from './network-mock';

export { readAriaCatalog, expectAriaMatchesCatalog, expectAriaSnapshot } from './aria-snapshot';

export { apiJson, apiSeed, apiCleanup, type ApiJsonResult, type HttpMethod } from './api-seed';

export { expectAllVisible, expectAllToContainText, expectSoftFieldErrors } from './soft-forms';

export { expectVisual, expectPageVisual, type VisualOptions } from './visual';

export { freezeTime, advanceTime, setTime, resumeRealTime } from './clock';

export {
  buildRoleProject,
  buildRoleProjects,
  roleStorageStatePath,
  type RoleProjectOptions,
} from './role-projects';
