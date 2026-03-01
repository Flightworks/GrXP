import { test, expect } from '@playwright/test';

const mockStudyId = 'test-study-uuid';
const mockRiskId = 'test-risk-uuid';

const mockDB = [
    {
        id: mockStudyId,
        name: 'Test E2E Study',
        experimentation: 'Test Exp',
        aircraft: 'Helicopter A',
        date: '2026-02-27',
        globalSynthesis: 'Global synthesis test',
        risks: [
            {
                id: mockRiskId,
                studyNumber: 'Test E2E Study',
                experimentation: 'Test Exp',
                activityTitle: 'Dangerous Activity',
                aircraft: 'Helicopter A',
                dreadedEvent: 'Crash',
                mitigationMeasures: 'Buckle up',
                synthesis: 'Risk is handled',
                updatedAt: Date.now(),
                initialRisk: {
                    gravity: 4, // Catastrophique
                    occurrence: 'D', // Frequent
                    exposition: 3,
                    detectability: 1,
                    computedLevel: 'Inacceptable'
                },
                residualRisk: {
                    gravity: 2, // Moderee
                    occurrence: 'B', // Rare
                    exposition: 2,
                    detectability: 3,
                    computedLevel: 'Faible'
                }
            }
        ],
        updatedAt: Date.now()
    }
];

test.beforeEach(async ({ page }) => {
    // Inject mock data before loading the app
    await page.addInitScript((mockData) => {
        window.localStorage.setItem('grxp_db_v1', JSON.stringify(mockData.db));
        window.localStorage.setItem('grxp_active_study_id_v1', mockData.activeStudyId);
    }, { db: mockDB, activeStudyId: mockStudyId });
});

test.describe('1. Dashboard Rendering & Navigation', () => {

    test('Should load the dashboard with mocked data and verify UI', async ({ page }) => {
        await page.goto('/');

        await page.screenshot({ path: 'e2e-debug-dashboard.png' });

        // Verify study name appears in the input field
        await expect(page.locator('input[placeholder*="Campagne"]')).toHaveValue('Test E2E Study');

        // Verify the risk is listed in the dashboard table context
        await expect(page.locator('text=Dangerous Activity').first()).toBeVisible();

        // Verify that the risk matrix cell has "1" for the residual risk
        await expect(page.locator('text=1').first()).toBeVisible();
    });

    test('Should navigate to the Catalog Manager', async ({ page }) => {
        await page.goto('/');

        // Click the catalog nav item via its visible text
        await page.locator('text=Catalogue').first().click();

        // Check for catalog header or element indicating we are on the catalog page
        await expect(page).toHaveURL(/.*catalog/);
        await expect(page.locator('text="Catalogue des Risques"').first()).toBeVisible();
    });

});
