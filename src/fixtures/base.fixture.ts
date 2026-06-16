import { frameworkFixtureExtend } from './framework.fixture';
import { projectTest } from './project.fixture';

/**
 * Core Framework Fixtures
 *
 * Assembly point between framework behaviour (logger, lifecycle trace) and
 * project-specific POM registrations (projectTest).
 * Generated tests import from here — register POMs in project.fixture.ts only.
 */

export const test = projectTest.extend(frameworkFixtureExtend);
export { expect } from '@playwright/test';

export type { FrameworkFixtures } from './framework.fixture';
