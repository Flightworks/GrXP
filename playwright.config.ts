import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 30 * 1000,
    expect: {
        timeout: 5000
    },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        actionTimeout: 0,
        trace: 'on-first-retry',
        baseURL: 'http://127.0.0.1:5175',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npx vite dev --port 5175 --strictPort',
        url: 'http://127.0.0.1:5175/',
        reuseExistingServer: !process.env.CI,
    },
});
