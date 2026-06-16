import { frameworkFixtureExtend } from '@/fixtures/framework.fixture';
import { projectTest } from './project.fixture';

export const test = projectTest.extend(frameworkFixtureExtend);
export { expect } from '@playwright/test';
