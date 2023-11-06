import {defineConfig, devices} from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './playwright',
  timeout: 5 * 60 * 1000,
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    baseURL: 'http://localhost:7000/ui',
    screenshot: 'only-on-failure',
  },
  expect: {
    timeout: 20000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'onboarding',
      use: {...devices['Desktop Chrome']},
      testMatch: /onboarding.spec\.ts/,
      teardown: 'teardown',
    },
    {
      name: 'tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      testMatch: '*playwright/*.spec.ts',
      testIgnore: /onboarding.spec\.ts/,
      dependencies: ['onboarding'],
    },
    {
      name: 'teardown',
      testMatch: /global.teardown\.ts/,
    },
  ],
});
