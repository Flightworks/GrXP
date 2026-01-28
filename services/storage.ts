import { RiskEntry, Occurrence, Gravity, Exposition, Detectability, RiskLevel, RiskCatalogEntry, StudyContext, Study } from "../types";
import { DEFAULT_CATALOG, calculateRiskLevel } from "../constants";

const DB_KEY = 'grxp_db_v1';
const ACTIVE_STUDY_KEY = 'grxp_active_study_id_v1';
const CATALOG_KEY = 'grxp_catalog_v1';

// Legacy keys for migration
const LEGACY_RISKS_KEY = 'grxp_risks_v1';
const LEGACY_CONTEXT_KEY = 'grxp_context_v1';

// --- Seed Data Generator ---

const generateSeedData = (studyName: string, aircraftName: string): RiskEntry[] => {
  const scenarios = [
    {
      catId: 'cat-2',
      activity: 'Glissement sur le pont',
      experimentation: 'Qualification SHOL Jour/Nuit',
      aircraft: aircraftName,
      study: studyName,
      initG: Gravity.Catastrophique, initO: Occurrence.Occasionnel,
      resG: Gravity.Critique, resO: Occurrence.Rare
    },
    {
      catId: 'cat-5',
      activity: 'Perturbation CDVE',
      experimentation: 'Qualification SHOL Jour/Nuit',
      aircraft: aircraftName,
      study: studyName,
      initG: Gravity.Moderee, initO: Occurrence.Occasionnel,
      resG: Gravity.Moderee, resO: Occurrence.TresImprobable
    },
    {
      catId: 'cat-3',
      activity: 'Désorientation Spatiale',
      experimentation: 'Vol Tactique JVN (Niveau 5)',
      aircraft: aircraftName,
      study: studyName,
      initG: Gravity.Critique, initO: Occurrence.Occasionnel,
      resG: Gravity.Critique, resO: Occurrence.Rare
    },
    {
      catId: 'cat-7',
      activity: 'Collision Aviaire',
      experimentation: 'Vol Tactique JVN (Niveau 5)',
      aircraft: aircraftName,
      study: studyName,
      initG: Gravity.Moderee, initO: Occurrence.Occasionnel,
      resG: Gravity.Moderee, resO: Occurrence.Rare
    },
    {
      catId: 'cat-6',
      activity: 'Phénomène Vibratoire (Flutter)',
      experimentation: 'Ouverture Domaine Vitesse',
      aircraft: 'H160 Guépard',
      study: 'AERO-DYN-05',
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
      updatedAt: Date.now() - (index * 86400000),
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

// --- Internal Helpers ---

const getDB = (): Study[] => {
  try {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveDB = (db: Study[]) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

const getActiveStudyId = (): string | null => {
  return localStorage.getItem(ACTIVE_STUDY_KEY);
};

const setActiveStudyId = (id: string) => {
  localStorage.setItem(ACTIVE_STUDY_KEY, id);
};

// --- Migration & Initialization ---

const initStorage = () => {
  const dbData = localStorage.getItem(DB_KEY);
  if (dbData) return; // DB exists

  // Check for legacy data
  const legacyRisks = localStorage.getItem(LEGACY_RISKS_KEY);
  const legacyContext = localStorage.getItem(LEGACY_CONTEXT_KEY);

  if (legacyRisks || legacyContext) {
    // Migration
    const risks: RiskEntry[] = legacyRisks ? JSON.parse(legacyRisks) : [];
    const context: StudyContext = legacyContext ? JSON.parse(legacyContext) : {
      studyName: 'Etude Importée',
      aircraft: '',
      date: new Date().toISOString().split('T')[0],
      globalSynthesis: ''
    };

    const newStudy: Study = {
      id: crypto.randomUUID(),
      name: context.studyName || 'Nouvelle Etude',
      experimentation: '', // Default for migrated
      aircraft: context.aircraft || '',
      date: context.date || new Date().toISOString().split('T')[0],
      globalSynthesis: context.globalSynthesis || '',
      risks: risks,
      updatedAt: Date.now()
    };

    saveDB([newStudy]);
    setActiveStudyId(newStudy.id);
  } else {
    // Fresh Install: Seed Data
    const seedStudyId = crypto.randomUUID();
    const seedStudy: Study = {
      id: seedStudyId,
      name: 'Campagne PHEL-182',
      experimentation: 'Qualification SHOL Jour/Nuit',
      aircraft: 'NH90 Caïman',
      date: new Date().toISOString().split('T')[0],
      globalSynthesis: '',
      risks: [],
      updatedAt: Date.now()
    };
    seedStudy.risks = generateSeedData(seedStudy.name, seedStudy.aircraft);

    saveDB([seedStudy]);
    setActiveStudyId(seedStudyId);
  }
};

try {
  initStorage();
} catch (e) {
  console.error("Storage init failed", e);
}

// --- Study Management (New API) ---

export const getAllStudies = (): Study[] => {
  return getDB().sort((a, b) => b.updatedAt - a.updatedAt);
};

export const createNewStudy = (name: string, aircraft: string, experimentation: string = ''): Study => {
  const newStudy: Study = {
    id: crypto.randomUUID(),
    name: name || 'Nouvelle Etude',
    experimentation: experimentation || '',
    aircraft: aircraft || '',
    date: new Date().toISOString().split('T')[0],
    globalSynthesis: '',
    risks: [],
    updatedAt: Date.now()
  };
  const db = getDB();
  db.push(newStudy);
  saveDB(db);
  setActiveStudyId(newStudy.id);
  return newStudy;
};

export const deleteStudy = (id: string): void => {
  let db = getDB();
  db = db.filter(s => s.id !== id);
  saveDB(db);

  if (getActiveStudyId() === id) {
    if (db.length > 0) {
      setActiveStudyId(db[0].id);
    } else {
      localStorage.removeItem(ACTIVE_STUDY_KEY);
    }
  }
};

export const setCurrentStudy = (id: string): void => {
  setActiveStudyId(id);
};

export const getCurrentStudy = (): Study => {
  const db = getDB();
  const activeId = getActiveStudyId();

  if (activeId) {
    const study = db.find(s => s.id === activeId);
    if (study) return study;
  }

  // Fallback if ID invalid or not set
  if (db.length > 0) {
    // Sort by latest update to pick most relevant? Default to [0] ok.
    const sorted = db.sort((a, b) => b.updatedAt - a.updatedAt);
    setActiveStudyId(sorted[0].id);
    return sorted[0];
  }

  // No study exists (should not happen due to initStorage, but safe fallback)
  return createNewStudy('Nouvelle Étude', '');
};

const updateCurrentStudy = (updater: (study: Study) => void): void => {
  const db = getDB();
  const activeId = getActiveStudyId();
  const index = db.findIndex(s => s.id === activeId);

  if (index >= 0) {
    updater(db[index]);
    db[index].updatedAt = Date.now();
    saveDB(db);
  } else {
    // Recovery
    const newStudy = createNewStudy('Nouvelle Étude', '');
    const db2 = getDB();
    const idx2 = db2.findIndex(s => s.id === newStudy.id);
    if (idx2 >= 0) {
      updater(db2[idx2]);
      db2[idx2].updatedAt = Date.now();
      saveDB(db2);
    }
  }
};

// --- Legacy Adapters (Risk & Context) ---

export const getStudyContext = (): StudyContext => {
  const study = getCurrentStudy();
  return {
    studyName: study.name,
    experimentation: study.experimentation || '',
    aircraft: study.aircraft,
    date: study.date,
    globalSynthesis: study.globalSynthesis
  };
};

export const saveStudyContext = (context: StudyContext): void => {
  updateCurrentStudy(s => {
    s.name = context.studyName;
    s.experimentation = context.experimentation;
    s.aircraft = context.aircraft;
    s.date = context.date;
    s.globalSynthesis = context.globalSynthesis;
    // Sync to risks
    s.risks.forEach(r => {
      r.studyNumber = s.name;
      r.experimentation = s.experimentation;
      r.aircraft = s.aircraft;
    });
  });
};

export const startNewStudy = (): void => {
  // Legacy behavior maps to creating a new study
  createNewStudy('Nouvelle Étude', '');
};

// --- Risk Entries ---

export const getRisks = (): RiskEntry[] => {
  return getCurrentStudy().risks;
};

export const saveRisk = (risk: RiskEntry): void => {
  updateCurrentStudy(s => {
    const existingIndex = s.risks.findIndex(r => r.id === risk.id);
    if (existingIndex >= 0) {
      s.risks[existingIndex] = risk;
    } else {
      s.risks.push(risk);
    }
  });
};

export const getRiskById = (id: string): RiskEntry | undefined => {
  return getRisks().find(r => r.id === id);
};

export const deleteRisk = (id: string): void => {
  updateCurrentStudy(s => {
    s.risks = s.risks.filter(r => r.id !== id);
  });
};

export const createEmptyRisk = (): RiskEntry => {
  const study = getCurrentStudy();
  return {
    id: crypto.randomUUID(),
    studyNumber: study.name || '',
    experimentation: study.experimentation || '',
    activityTitle: '',
    aircraft: study.aircraft || '',
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

// --- Catalog Entries (Global) ---

export const getCatalogEntries = (): RiskCatalogEntry[] => {
  try {
    const data = localStorage.getItem(CATALOG_KEY);
    if (!data) {
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
  const db = getDB();
  return JSON.stringify(db, null, 2);
};

export const importRisksFromJSON = (jsonContent: string): void => {
  try {
    const data = JSON.parse(jsonContent);
    if (!Array.isArray(data)) throw new Error("Format invalide");

    // Check for legacy single study export
    if (data.length > 0 && 'initialRisk' in data[0] && !('risks' in data[0])) {
      const newStudy = createNewStudy("Etude Importée (Legacy)", "");
      updateCurrentStudy(s => {
        s.risks = data as RiskEntry[];
      });
      return;
    }

    // Assume Study[]
    saveDB(data);
    if (data.length > 0) {
      setActiveStudyId(data[0].id);
    }
  } catch (e) {
    console.error("Failed to import JSON", e);
    throw e;
  }
};

export const exportRisksToCSV = (): string => {
  const db = getDB();
  let allRisks: RiskEntry[] = [];

  db.forEach(study => {
    const studyRisks = study.risks.map(r => ({
      ...r,
      studyNumber: study.name, // Force study name from context
      aircraft: study.aircraft
    }));
    allRisks = [...allRisks, ...studyRisks];
  });

  if (allRisks.length === 0) return '';

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

  const rows = allRisks.map(r => [
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

  const header = lines[0];
  const separator = header.includes(';') ? ';' : ',';

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
      } else if (char === separator && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const importedRisks: RiskEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
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
        computedLevel: RiskLevel.Faible
      },
      residualRisk: {
        gravity: Number(vals[12]) || Gravity.Negligeable,
        occurrence: (vals[13] as Occurrence) || Occurrence.TresImprobable,
        exposition: Number(vals[14]) || Exposition.Faible,
        detectability: Number(vals[15]) || Detectability.Totale,
        computedLevel: RiskLevel.Faible
      },
      updatedAt: Number(vals[16]) || Date.now()
    };

    newRisk.initialRisk.computedLevel = calculateRiskLevel(newRisk.initialRisk.gravity, newRisk.initialRisk.occurrence);
    newRisk.residualRisk.computedLevel = calculateRiskLevel(newRisk.residualRisk.gravity, newRisk.residualRisk.occurrence);
    importedRisks.push(newRisk);
  }

  const grouped: Record<string, RiskEntry[]> = {};
  importedRisks.forEach(r => {
    const studyName = r.studyNumber || "Etude Sans Nom";
    if (!grouped[studyName]) grouped[studyName] = [];
    grouped[studyName].push(r);
  });

  const newDB: Study[] = Object.keys(grouped).map(studyName => {
    const risks = grouped[studyName];
    const aircraft = risks.length > 0 ? risks[0].aircraft : "";
    const experimentation = risks.length > 0 ? risks[0].experimentation : "";

    return {
      id: crypto.randomUUID(),
      name: studyName,
      experimentation: experimentation,
      aircraft: aircraft,
      date: new Date().toISOString().split('T')[0],
      globalSynthesis: "",
      risks: risks,
      updatedAt: Date.now()
    };
  });

  saveDB(newDB);
  if (newDB.length > 0) setActiveStudyId(newDB[0].id);
};
