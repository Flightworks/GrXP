import { test, expect } from '@playwright/test';

const mockStudyId = 'test-study-uuid';

test.beforeEach(async ({ page }) => {
    // Inject mock data with just the active study container, no risks initially
    const emptyDB = [
        {
            id: mockStudyId,
            name: 'Test Setup Study',
            experimentation: 'Exp A',
            aircraft: 'Airbus A400M',
            date: '2026-02-27',
            globalSynthesis: '',
            risks: [],
            updatedAt: Date.now()
        }
    ];

    await page.addInitScript((mockData) => {
        window.localStorage.setItem('grxp_db_v1', JSON.stringify(mockData.db));
        window.localStorage.setItem('grxp_active_study_id_v1', mockData.activeStudyId);
    }, { db: emptyDB, activeStudyId: mockStudyId });
});

test.describe('2. Risk Creation & State Management Validation', () => {

    test('Creating a new risk saves it to the dashboard and modifying it persists', async ({ page }) => {
        // Navigate to Create New Risk Route
        await page.goto('/edit');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'e2e-debug-risk-form.png', fullPage: true });

        // Fill the mandatory form fields using flexible locator strategies
        // Using nth(1) because study info inputs are first. Activity title is the 4th input text.
        await page.locator('input[type="text"]').nth(3).fill('Test New Flight Pattern');
        await page.locator('textarea').first().fill('Collision Avoidance Failure');

        // Save (the top save CTA or bottom one)
        const saveButton = page.locator('button:has-text("Enregistrer")').first();
        await saveButton.click();

        // The form just shows a toast, so we must manually navigate back
        const retourButton = page.locator('button:has-text("Retour")').first();
        await retourButton.click();

        // Wait for redirect to dashboard
        await expect(page).toHaveURL('/');

        // Check if the newly added title is visible on the dashboard table
        await expect(page.getByText('Test New Flight Pattern')).toBeVisible();

        // Now let's try to Edit it
        // Click on the row containing the text to edit
        await page.getByText('Test New Flight Pattern').click();

        // It should navigate to /edit/:id
        await expect(page).toHaveURL(/\/edit\/.+/);

        // Modify the activity text
        const modifyInput = page.locator('input[type="text"]').nth(3);
        await modifyInput.fill('Test New Flight Pattern - EDITED');

        // Save again
        const finalSaveButton = page.locator('button:has-text("Enregistrer")').first();
        await finalSaveButton.click();

        const finalRetourButton = page.locator('button:has-text("Retour")').first();
        await finalRetourButton.click();

        // Validate the edit persisted
        await expect(page).toHaveURL('/');
        await expect(page.locator('text="Test New Flight Pattern - EDITED"').first()).toBeVisible();
    });

});
