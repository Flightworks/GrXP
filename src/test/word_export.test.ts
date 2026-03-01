import { describe, it, expect } from 'vitest';
import { exportToWord } from '../../services/storage';
import { RiskLevel } from '../../types';

describe('Word Export', () => {
    it('should generate a valid HTML/Word Blob', async () => {
        const risks = [
            {
                id: '1',
                studyNumber: 'S1',
                aircraft: 'A1',
                experimentation: 'Exp1',
                activityTitle: 'Takeoff',
                dreadedEvent: 'Crash',
                mitigationMeasures: '- Check engine\n- Pray',
                synthesis: '',
                initialRisk: { computedLevel: RiskLevel.Fort } as any,
                residualRisk: { computedLevel: RiskLevel.Faible, gravity: 2, occurrence: 'C' } as any,
                updatedAt: Date.now()
            }
        ];

        const blob = exportToWord(risks);
        expect(blob).toBeDefined();
        expect(blob.type).toBe('application/msword');

        // blob.text() might not be available in jsdom/node environment depending on version
        // Use FileReader which is safer in jsdom
        const reader = new FileReader();
        const contentPromise = new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
            reader.readAsText(blob);
        });
        const content = await contentPromise as string;

        // Check for HTML structure
        expect(content).toContain('<html xmlns:o=\'urn:schemas-microsoft-com:office:office\'');

        // Check for data
        expect(content).toContain('Takeoff');
        expect(content).toContain('Crash');

        // Check formatting
        expect(content).toContain('- Check engine<br/>- Pray'); // Newline conversion

        // Check styles
        expect(content).toContain('background-color: #FDE047'); // Yellow for Faible
        expect(content).toContain('font-weight: bold');
        expect(content).toContain('border: 1px solid #e2e8f0');
    });
});
