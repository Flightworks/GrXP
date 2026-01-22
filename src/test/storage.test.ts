import { describe, it, expect, beforeEach } from 'vitest';
import {
    getAllStudies, createNewStudy, setCurrentStudy, getCurrentStudy,
    saveRisk, getRisks, exportRisksToJSON, importRisksFromJSON,
    exportRisksToCSV, importRisksFromCSV, deleteStudy
} from '../../services/storage';
import { Gravity, Occurrence, Exposition, Detectability, RiskLevel } from '../../types';

describe('Storage Service (Multi-Study)', () => {
    beforeEach(() => {
        localStorage.clear();
        // Note: The module-level initStorage has already run.
        // We rely on functions handling empty localStorage gracefully.
    });

    it('should handle empty storage by creating a new study', () => {
        const study = getCurrentStudy();
        expect(study).toBeDefined();
        expect(study.name).toBe('Nouvelle Étude');
        expect(getAllStudies()).toHaveLength(1);
    });

    it('should create and switch studies', () => {
        const study1 = getCurrentStudy();
        // Update name of first study
        saveRisk({ ...createMockRisk('r0'), studyNumber: 'Study 1' }); // This updates risk but not study name directly via saveRisk unless we sync

        const study2 = createNewStudy('Study 2', 'H160');

        expect(getAllStudies().length).toBe(2);
        expect(getCurrentStudy().id).toBe(study2.id);
        expect(getCurrentStudy().name).toBe('Study 2');

        setCurrentStudy(study1.id);
        expect(getCurrentStudy().id).toBe(study1.id);
    });

    it('should save risks to the active study only', () => {
        // Setup
        const s1 = createNewStudy('S1', 'A1');
        const s2 = createNewStudy('S2', 'A2');

        setCurrentStudy(s1.id);
        const r1 = createMockRisk('r1');
        saveRisk(r1);

        setCurrentStudy(s2.id);
        const r2 = createMockRisk('r2');
        saveRisk(r2);

        // Verify S1
        setCurrentStudy(s1.id);
        const risks1 = getRisks();
        expect(risks1).toHaveLength(1);
        expect(risks1[0].id).toBe('r1');

        // Verify S2
        setCurrentStudy(s2.id);
        const risks2 = getRisks();
        expect(risks2).toHaveLength(1);
        expect(risks2[0].id).toBe('r2');
    });

    it('should export all studies to JSON and import them back', () => {
        createNewStudy('S1', 'A1');
        createNewStudy('S2', 'A2');

        const json = exportRisksToJSON();
        const data = JSON.parse(json);
        expect(data).toHaveLength(2);

        // Simulate wipe
        localStorage.clear();
        expect(getAllStudies()).toHaveLength(0);

        // Import
        importRisksFromJSON(json);
        expect(getAllStudies()).toHaveLength(2);
        expect(getAllStudies().find(s => s.name === 'S1')).toBeDefined();
    });

    it('should delete a study', () => {
        const s1 = createNewStudy('S1', '');
        const s2 = createNewStudy('S2', '');

        expect(getAllStudies()).toHaveLength(2);

        deleteStudy(s1.id);
        expect(getAllStudies()).toHaveLength(1);
        expect(getCurrentStudy().id).toBe(s2.id); // Should switch to remaining
    });

    it('should export and import CSV with multiple studies', () => {
        const s1 = createNewStudy('StudyA', 'PlaneA');
        const s2 = createNewStudy('StudyB', 'PlaneB');

        setCurrentStudy(s1.id);
        saveRisk(createMockRisk('r1', 'StudyA', 'PlaneA'));

        setCurrentStudy(s2.id);
        saveRisk(createMockRisk('r2', 'StudyB', 'PlaneB'));

        const csv = exportRisksToCSV();

        // Wipe
        localStorage.clear();

        importRisksFromCSV(csv);

        const studies = getAllStudies();
        expect(studies).toHaveLength(2);

        const studyA = studies.find(s => s.name === 'StudyA');
        const studyB = studies.find(s => s.name === 'StudyB');

        expect(studyA).toBeDefined();
        expect(studyB).toBeDefined();
        expect(studyA?.risks).toHaveLength(1);
        expect(studyB?.risks).toHaveLength(1);
    });
});

function createMockRisk(id: string, study = 'S', aircraft = 'A'): any {
    return {
        id,
        studyNumber: study,
        aircraft: aircraft,
        experimentation: 'Exp',
        activityTitle: 'Title',
        dreadedEvent: '',
        mitigationMeasures: '',
        synthesis: '',
        initialRisk: {
            gravity: Gravity.Moderee,
            occurrence: Occurrence.Rare,
            exposition: Exposition.Faible,
            detectability: Detectability.Totale,
            computedLevel: RiskLevel.Faible
        },
        residualRisk: {
            gravity: Gravity.Moderee,
            occurrence: Occurrence.Rare,
            exposition: Exposition.Faible,
            detectability: Detectability.Totale,
            computedLevel: RiskLevel.Faible
        },
        updatedAt: Date.now()
    };
}
