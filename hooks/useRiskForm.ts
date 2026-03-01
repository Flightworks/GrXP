import { useState, useEffect } from 'react';
import { RiskEntry, RiskCatalogEntry } from '../types';
import { saveRisk, getRiskById, createEmptyRisk } from '../services/storage';
import { calculateRiskLevel } from '../constants';

export const useRiskForm = (riskId?: string | null) => {
    const [risk, setRisk] = useState<RiskEntry>(createEmptyRisk());
    const [showToast, setShowToast] = useState(false);
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);

    useEffect(() => {
        if (riskId) {
            const existing = getRiskById(riskId);
            if (existing) {
                setRisk(existing);
            }
        } else {
            setRisk(createEmptyRisk());
        }
    }, [riskId]);

    const handleSave = () => {
        saveRisk({ ...risk, updatedAt: Date.now() });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    const handleChange = (field: keyof RiskEntry, value: any) => {
        setRisk(prev => ({ ...prev, [field]: value }));
    };

    const handleImportFromCatalog = (entry: RiskCatalogEntry) => {
        setRisk(prev => {
            const newInitial = {
                ...prev.initialRisk,
                gravity: entry.defaultGravity,
                occurrence: entry.defaultOccurrence,
                computedLevel: calculateRiskLevel(entry.defaultGravity, entry.defaultOccurrence)
            };
            return {
                ...prev,
                activityTitle: entry.title,
                dreadedEvent: entry.dreadedEvent,
                mitigationMeasures: entry.mitigationMeasures,
                initialRisk: newInitial
            };
        });
        setIsCatalogOpen(false);
    };

    return {
        risk,
        showToast,
        isCatalogOpen,
        setIsCatalogOpen,
        handleSave,
        handleChange,
        handleImportFromCatalog
    };
};
