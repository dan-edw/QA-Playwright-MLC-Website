import { defineConfig, devices } from '@playwright/test';

import './config/env';

export default defineConfig({
  testDir: './tests',

  timeout: 30 * 1000,

  expect: {
    timeout: 5 * 1000,
  },

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: [
    [
      'html',
      {
        outputFolder: 'playwright-report',
        open: 'never',
      },
    ],

    [
      'junit',
      {
        outputFile: 'test-results.xml',
      },
    ],

    [
      'json',
      {
        outputFile: 'playwright-results.json',
      },
    ],
  ],

  use: {
    headless: true,

    navigationTimeout: 30 * 1000,

    actionTimeout: 10 * 1000,

    trace: 'on-first-retry',

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },

    {
      name: 'Microsoft Edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
      },
    },
  ],
});
