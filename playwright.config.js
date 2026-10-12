import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const isCI = !!process.env.CI

// Screenshots render differently per OS (fonts, anti-aliasing), so baselines are only generated and compared on
// Linux: in CI or via `make e2e` / `make e2e-update`, which run in the official Playwright Docker image.
const runVisual = process.platform === 'linux'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.001,
    },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      grepInvert: /@visual/,
    },
    // The profile UI is used mainly on desktop, so screenshots are taken at one desktop size.
    ...(runVisual
      ? [
          {
            name: 'visual',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
            grep: /@visual/,
          },
        ]
      : []),
  ],
  webServer: {
    // `npm run build` is avoided on purpose: it appends UI_VERSION to .env.
    command: `vite build --mode e2e --outDir dist-e2e && vite preview --mode e2e --outDir dist-e2e --host localhost --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
})
