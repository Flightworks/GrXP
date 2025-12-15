import { RiskEntry, Occurrence, Gravity, Exposition, Detectability, RiskLevel, RiskCatalogEntry, StudyContext } from "../types";
import { DEFAULT_CATALOG, calculateRiskLevel } from "../constants";

const STORAGE_KEY = 'grxp_risks_v1';
const CATALOG_KEY = 'grxp_catalog_v1';
const CONTEXT_KEY = 'grxp_context_v1';

// --- Seed Data Generator ---

const generateSeedData = (): RiskEntry[] => {
  // Create realistic scenarios based on the catalog
  const scenarios = [
    {
      catId: 'cat-2', // Appontage SHOL
      activity: 'Glissement sur le pont',
      experimentation: 'Qualification SHOL Jour/Nuit',
      aircraft: 'NH90 Caïman',
      study: 'PHEL-182',
      // High initial risk, improved by strict procedures
      initG: Gravity.Catastrophique, initO: Occurrence.Occasionnel,
      resG: Gravity.Critique, resO: Occurrence.Rare
    },
    {
      catId: 'cat-5', // EMC
      activity: 'Perturbation CDVE',
      experimentation: 'Qualification SHOL Jour/Nuit',
      aircraft: 'NH90 Caïman',
      study: 'PHEL-182',
      // Low initial risk, kept low
      initG: Gravity.Moderee, initO: Occurrence.Occasionnel,
      resG: Gravity.Moderee, resO: Occurrence.TresImprobable
    },
    {
      catId: 'cat-3', // JVN
      activity: 'Désorientation Spatiale',
      experimentation: 'Vol Tactique JVN (Niveau 5)',
      aircraft: 'Panther Std 2',
      study: 'EXP-NVG-24',
      // Mitigation reduces probability mainly
      initG: Gravity.Critique, initO: Occurrence.Occasionnel,
      resG: Gravity.Critique, resO: Occurrence.Rare
    },
    {
      catId: 'cat-7', // Bird strike
      activity: 'Collision Aviaire',
      experimentation: 'Vol Tactique JVN (Niveau 5)',
      aircraft: 'Panther Std 2',
      study: 'EXP-NVG-24',
      initG: Gravity.Moderee, initO: Occurrence.Occasionnel,
      resG: Gravity.Moderee, resO: Occurrence.Rare
    },
    {
      catId: 'cat-6', // Vibrations/Flutter
      activity: 'Phénomène Vibratoire (Flutter)',
      experimentation: 'Ouverture Domaine Vitesse',
      aircraft: 'H160 Guépard',
      study: 'AERO-DYN-05',
      // Mitigation via telemetry reduces Gravity (preventing structural failure)
      initG: Gravity.Catastrophique, initO: Occurrence.Rare,
      resG: Gravity.Moderee, resO: Occurrence.Rare
    }
  ];

  return scenarios.map((scenario, index) => {
    const template = DEFAULT_CATALOG.find(c => c.id === scenario.catId) || DEFAULT_CATALOG[0];

    return {
      id: crypto.randomUUID(),
      studyNumber: scenario.study,
      experimentation: scenario.experimentation,
      activityTitle: scenario.activity,
      aircraft: scenario.aircraft,
      dreadedEvent: template.dreadedEvent,
      mitigationMeasures: template.mitigationMeasures,
      synthesis: 'Risque maîtrisé. Application stricte des fiches d\'essais et du briefing.',
      updatedAt: Date.now() - (index * 86400000), // Stagger dates
      initialRisk: {
        gravity: scenario.initG,
        occurrence: scenario.initO,
        exposition: Exposition.Forte,
        detectability: Detectability.Faible,
        computedLevel: calculateRiskLevel(scenario.initG, scenario.initO)
      },
      residualRisk: {
        gravity: scenario.resG,
        occurrence: scenario.resO,
        exposition: Exposition.Moyenne,
        detectability: Detectability.Totale,
        computedLevel: calculateRiskLevel(scenario.resG, scenario.resO)
      }
    };
  });
};

// --- Study Context ---

export const getStudyContext = (): StudyContext => {
  try {
    const data = localStorage.getItem(CONTEXT_KEY);
    if (data) return JSON.parse(data);
    return {
      studyName: 'Nouvelle Étude',
      aircraft: '',
      date: new Date().toISOString().split('T')[0],
      globalSynthesis: ''
    };
  } catch {
    return { studyName: '', aircraft: '', date: '', globalSynthesis: '' };
  }
};

export const saveStudyContext = (context: StudyContext): void => {
  localStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
};

export const startNewStudy = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(CONTEXT_KEY, JSON.stringify({
    studyName: 'Nouvelle Étude',
    aircraft: '',
    date: new Date().toISOString().split('T')[0],
    globalSynthesis: ''
  }));
};

// --- Risk Entries ---

export const saveRisk = (risk: RiskEntry): void => {
  const risks = getRisks();
  const existingIndex = risks.findIndex(r => r.id === risk.id);

  if (existingIndex >= 0) {
    risks[existingIndex] = risk;
  } else {
    risks.push(risk);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(risks));
};

export const getRisks = (): RiskEntry[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsedData = JSON.parse(data);
      if (parsedData.length > 0) return parsedData;
    }

    // Seed data ONLY if explicitly requested or for demo purposes on very first load?
    // User requested "Enter study name THEN choose risks".
    // So default should probably be empty if strictly following workflow, 
    // but for demo purposes we keep seeding if "completely empty".
    // Let's seed only if context is also missing (fresh app)
    if (!localStorage.getItem(CONTEXT_KEY)) {
      const seedData = generateSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
      return seedData;
    }
    return [];

  } catch (e) {
    console.error("Failed to load risks", e);
    return [];
  }
};

export const getRiskById = (id: string): RiskEntry | undefined => {
  const risks = getRisks();
  return risks.find(r => r.id === id);
};

export const deleteRisk = (id: string): void => {
  const risks = getRisks().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(risks));
};

export const createEmptyRisk = (): RiskEntry => {
  const context = getStudyContext();
  return {
    id: crypto.randomUUID(),
    studyNumber: context.studyName || '',
    experimentation: '',
    activityTitle: '',
    aircraft: context.aircraft || '',
    dreadedEvent: '',
    mitigationMeasures: '',
    synthesis: '',
    updatedAt: Date.now(),
    initialRisk: {
      gravity: Gravity.Catastrophique,
      occurrence: Occurrence.Frequent,
      exposition: Exposition.Forte,
      detectability: Detectability.Indetectable,
      computedLevel: RiskLevel.Inacceptable
    },
    residualRisk: {
      gravity: Gravity.Catastrophique,
      occurrence: Occurrence.Frequent,
      exposition: Exposition.Forte,
      detectability: Detectability.Indetectable,
      computedLevel: RiskLevel.Inacceptable
    }
  };
};

// --- Catalog Entries ---

export const getCatalogEntries = (): RiskCatalogEntry[] => {
  try {
    const data = localStorage.getItem(CATALOG_KEY);
    if (!data) {
      // Initialize with default if empty
      localStorage.setItem(CATALOG_KEY, JSON.stringify(DEFAULT_CATALOG));
      return DEFAULT_CATALOG;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load catalog", e);
    return [];
  }
};

export const saveCatalogEntry = (entry: RiskCatalogEntry): void => {
  const entries = getCatalogEntries();
  const existingIndex = entries.findIndex(e => e.id === entry.id);

  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }

  localStorage.setItem(CATALOG_KEY, JSON.stringify(entries));
};

export const deleteCatalogEntry = (id: string): void => {
  const entries = getCatalogEntries().filter(e => e.id !== id);
  localStorage.setItem(CATALOG_KEY, JSON.stringify(entries));
};

// --- Import / Export ---

export const exportRisksToJSON = (): string => {
  const risks = getRisks();
  return JSON.stringify(risks, null, 2);
};

export const importRisksFromJSON = (jsonContent: string): void => {
  try {
    const risks = JSON.parse(jsonContent);
    if (!Array.isArray(risks)) throw new Error("Format JSON invalide : doit être un tableau");

    // REPLACE Strategy: Overwrite all risks
    localStorage.setItem(STORAGE_KEY, JSON.stringify(risks));

  } catch (e) {
    console.error("Failed to import JSON", e);
    throw e;
  }
};

export const exportRisksToCSV = (): string => {
  const risks = getRisks();
  if (risks.length === 0) return '';

  const headers = [
    'ID', 'Etude', 'Cahier_Manipe', 'Titre_Activite', 'Aeronef', 'Evenement_Redoute', 'Mesures_Attenuation', 'Synthese',
    'Init_Gravite', 'Init_Occurrence', 'Init_Exposition', 'Init_Detectabilite',
    'Res_Gravite', 'Res_Occurrence', 'Res_Exposition', 'Res_Detectabilite',
    'Mise_a_jour'
  ];

  const escapeCsv = (str: string | number | undefined) => {
    if (str === undefined || str === null) return '';
    const stringValue = String(str);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const rows = risks.map(r => [
    r.id, r.studyNumber, r.experimentation, r.activityTitle, r.aircraft, r.dreadedEvent, r.mitigationMeasures, r.synthesis,
    r.initialRisk.gravity, r.initialRisk.occurrence, r.initialRisk.exposition, r.initialRisk.detectability,
    r.residualRisk.gravity, r.residualRisk.occurrence, r.residualRisk.exposition, r.residualRisk.detectability,
    r.updatedAt
  ].map(escapeCsv).join(','));

  return [headers.join(','), ...rows].join('\n');
};

export const importRisksFromCSV = (csvContent: string): void => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) throw new Error("Fichier CSV vide ou sans en-tête");

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const newRisks: RiskEntry[] = [];

  // Skip header, start at 1
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    // Should have at least enough columns for ID..InitD (approx 12+)
    if (vals.length < 12) continue;

    const newRisk: RiskEntry = {
      id: vals[0] || crypto.randomUUID(),
      studyNumber: vals[1],
      experimentation: vals[2],
      activityTitle: vals[3],
      aircraft: vals[4],
      dreadedEvent: vals[5],
      mitigationMeasures: vals[6],
      synthesis: vals[7],
      initialRisk: {
        gravity: Number(vals[8]) || Gravity.Negligeable,
        occurrence: (vals[9] as Occurrence) || Occurrence.TresImprobable,
        exposition: Number(vals[10]) || Exposition.Faible,
        detectability: Number(vals[11]) || Detectability.Totale,
        computedLevel: RiskLevel.Faible // Recalculated below
      },
      residualRisk: {
        gravity: Number(vals[12]) || Gravity.Negligeable,
        occurrence: (vals[13] as Occurrence) || Occurrence.TresImprobable,
        exposition: Number(vals[14]) || Exposition.Faible,
        detectability: Number(vals[15]) || Detectability.Totale,
        computedLevel: RiskLevel.Faible // Recalculated below
      },
      updatedAt: Number(vals[16]) || Date.now()
    };

    // Recalculate levels to be safe
    newRisk.initialRisk.computedLevel = calculateRiskLevel(newRisk.initialRisk.gravity, newRisk.initialRisk.occurrence);
    newRisk.residualRisk.computedLevel = calculateRiskLevel(newRisk.residualRisk.gravity, newRisk.residualRisk.occurrence);

    newRisks.push(newRisk);
  }

  // REPLACE Strategy: Overwrite all risks
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newRisks));
};