import { describe, it, expect } from 'vitest';
import { generateHtmlContent } from '../../services/htmlExport';
import { RiskEntry, StudyContext, RiskLevel, Gravity, Occurrence, Exposition, Detectability } from '../../types';

describe('htmlExport', () => {
  it('should generate HTML content with correct risk data and styles', () => {
    const context: StudyContext = {
      studyName: 'Test Study',
      experimentation: 'Test Exp',
      aircraft: 'Test Aircraft',
      date: '2023-10-27',
      globalSynthesis: 'Global Conclusion'
    };

    const risk: RiskEntry = {
      id: '1',
      studyNumber: 'Test Study',
      experimentation: 'Test Exp',
      activityTitle: 'Risk 1',
      aircraft: 'Test Aircraft',
      dreadedEvent: 'Dreaded Event 1',
      mitigationMeasures: 'Measure 1\nMeasure 2',
      synthesis: '',
      updatedAt: 123456789,
      initialRisk: {
        gravity: Gravity.Critique,
        occurrence: Occurrence.Frequent,
        exposition: Exposition.Moyenne,
        detectability: Detectability.Faible,
        computedLevel: RiskLevel.Inacceptable
      },
      residualRisk: {
        gravity: Gravity.Moderee,
        occurrence: Occurrence.Rare,
        exposition: Exposition.Moyenne,
        detectability: Detectability.Faible,
        computedLevel: RiskLevel.Faible
      }
    };

    const html = generateHtmlContent(context, [risk]);

    // Check for context
    expect(html).toContain('Test Study');
    expect(html).toContain('Global Conclusion');

    // Check for risk data
    expect(html).toContain('Risk 1');
    expect(html).toContain('Dreaded Event 1');
    expect(html).toContain('Measure 1<br>Measure 2'); // Check newline replacement

    // Check for specific styles (Faible = yellow-300 = #FDE047)
    expect(html).toContain('#FDE047');
    expect(html).toContain('border-radius: 6px');

    // Check for table structure
    expect(html).toContain('<table');
  });
});
