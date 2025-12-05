import { defineConfig, devices } from '@playwright/test';
import * as dotenv from '@dotenvx/dotenvx';
import path from 'path';
import fs from 'fs';

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const dotEnvPath = path.join(ROOT_DIR, 'config', '.env');
const dotEnvLocalPath = path.join(ROOT_DIR, 'config', '.env.local');
const dotEnvPaths = [dotEnvPath];

if (fs.existsSync(dotEnvLocalPath)) {
  dotEnvPaths.unshift(dotEnvLocalPath);
}

// Load environment variables from .env files
dotenv.config({
  path: dotEnvPaths,
  opsOff: true,
});

// Read the embedder URL from environment variables
const EMBEDDER_URL = process.env.VITE_EMBEDDER_ORIGIN_URL_HTTPS;
if (!EMBEDDER_URL) {
  throw new Error('VITE_EMBEDDER_ORIGIN_URL_HTTPS environment variable is required');
}

let serverPort = 8000;

try {
  const embedderUrl = new URL(EMBEDDER_URL);
  serverPort = parseInt(embedderUrl.port, 10) || 8000;
} catch (error) {
  // eslint-disable-next-line no-console
  console.warn('Failed to parse EMBEDDER_URL, using default port 8000:', error);
}

const REPORTS_PATH = path.join(ROOT_DIR, 'tests', 'integration', 'playwright-report');

/**
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directory where tests are located
  testDir: '.',

  // Maximum time one test can run for
  timeout: 60 * 1000,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 1 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 2 : undefined,

  // Reporter to use
  reporter: process.env.CI
    ? [
        ['dot'],
        [
          'junit',
          {
            outputFile: path.join(REPORTS_PATH, 'junit.xml'),
          },
        ],
      ]
    : 'line',

  outputDir: REPORTS_PATH,

  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: EMBEDDER_URL,

    trace: 'off',

    // Record video for failed tests
    video: 'on-first-retry',

    ignoreHTTPSErrors: !!process.env.CI,
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'global setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--ignore-certificate-errors'],
        },
      },
      dependencies: ['global setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'security.enterprise_roots.enabled': true,
            'security.cert_pinning.enforcement_level': 0,
          },
        },
      },
      dependencies: ['global setup'],
    },
  ],

  // Start the example app before running tests
  webServer: {
    // Builds and starts the example server in HTTPS mode.
    command: 'yarn build:example && yarn start:example "yarn serve:example:https"',

    // Does not start the example app if it's already running and listening to the server port
    port: serverPort,

    // Unless CI
    reuseExistingServer: !process.env.CI,

    stdout: 'pipe',

    stderr: 'pipe',

    timeout: 60 * 1000,
  },
});
