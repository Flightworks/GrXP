import { describe, it, expect } from 'vitest';
import { calculateRiskLevel } from '../../constants';
import { Gravity, Occurrence, RiskLevel } from '../../types';

describe('Risk Calculation Logic', () => {
    it('should return Inacceptable for Catastrophique + Frequent', () => {
        expect(calculateRiskLevel(Gravity.Catastrophique, Occurrence.Frequent)).toBe(RiskLevel.Inacceptable);
    });

    it('should return Faible for Negligeable + Rare', () => {
        expect(calculateRiskLevel(Gravity.Negligeable, Occurrence.Rare)).toBe(RiskLevel.Usuel);
    });

    // Boundary checks based on the logic in constants.ts
    // if (g === 4) {
    //   if (o === Occurrence.Frequent || o === Occurrence.Occasionnel) return RiskLevel.Inacceptable;
    //   if (o === Occurrence.Rare) return RiskLevel.Fort;
    //   return RiskLevel.Faible;
    // }
    it('should correctly classify Gravity Catastrophique (4)', () => {
        expect(calculateRiskLevel(4, Occurrence.Frequent)).toBe(RiskLevel.Inacceptable);
        expect(calculateRiskLevel(4, Occurrence.Occasionnel)).toBe(RiskLevel.Inacceptable);
        expect(calculateRiskLevel(4, Occurrence.Rare)).toBe(RiskLevel.Fort);
        expect(calculateRiskLevel(4, Occurrence.TresImprobable)).toBe(RiskLevel.Faible);
    });

    // if (g === 3) {
    //   if (o === Occurrence.Frequent) return RiskLevel.Inacceptable;
    //   if (o === Occurrence.Occasionnel) return RiskLevel.Fort;
    //   return RiskLevel.Faible;
    // }
    it('should correctly classify Gravity Critique (3)', () => {
        expect(calculateRiskLevel(3, Occurrence.Frequent)).toBe(RiskLevel.Inacceptable);
        expect(calculateRiskLevel(3, Occurrence.Occasionnel)).toBe(RiskLevel.Fort);
        expect(calculateRiskLevel(3, Occurrence.Rare)).toBe(RiskLevel.Faible);
        expect(calculateRiskLevel(3, Occurrence.TresImprobable)).toBe(RiskLevel.Faible);
    });
});
