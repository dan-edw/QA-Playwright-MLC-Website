import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load the correct environment file
dotenv.config({
  path: `.env.${(process.env.ENVIRONMENT || 'prod').toLowerCase()}`
});

console.log('Environment:', process.env.ENVIRONMENT);
console.log('Base URL:', process.env.BASE_URL);

export default defineConfig({
  testDir: './tests',

  // Maximum time for one test
  timeout: 30 * 1000,

  // Expect timeout
  expect: {
    timeout: 5 * 1000,
  },

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results.xml' }],
  ],

  use: {
    // Uses BASE_URL from the selected .env file
    baseURL: process.env.BASE_URL,

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
