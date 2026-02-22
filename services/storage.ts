import { RiskEntry, Occurrence, Gravity, Exposition, Detectability, RiskLevel, RiskCatalogEntry, StudyContext, Study } from "../types";
import { DEFAULT_CATALOG, calculateRiskLevel } from "../constants";
import { StudyArraySchema, StudySchema, RiskEntrySchema } from "../schema";
import { z } from "zod";

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
    const rawData = JSON.parse(jsonContent);
    if (!Array.isArray(rawData)) throw new Error("Le format JSON doit être un tableau.");

    // Check for legacy single study export (array of RiskEntry)
    if (rawData.length > 0 && 'initialRisk' in rawData[0] && !('risks' in rawData[0])) {
      const risks = z.array(RiskEntrySchema).parse(rawData) as unknown as RiskEntry[];
      const newStudy = createNewStudy("Etude Importée (Legacy)", "");
      updateCurrentStudy(s => {
        s.risks = risks;
      });
      return;
    }

    // Assume Study[]
    const validatedData = StudyArraySchema.parse(rawData) as unknown as Study[];
    saveDB(validatedData);
    if (validatedData.length > 0) {
      setActiveStudyId(validatedData[0].id);
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      const zodErrors = (e as any).errors as any[];
      console.error("Zod Validation Failed:", zodErrors);
      throw new Error(`Structure des données invalide : ${zodErrors.map(err => err.message).join(', ')}`);
    }
    console.error("Failed to import JSON", e);
    throw new Error("Impossible de lire le fichier JSON.");
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

  try {
    const validatedDB = StudyArraySchema.parse(newDB) as unknown as Study[];
    saveDB(validatedDB);
    if (validatedDB.length > 0) setActiveStudyId(validatedDB[0].id);
  } catch (e) {
    if (e instanceof z.ZodError) {
      const zodErrors = (e as any).errors as any[];
      console.error("CSV Validation Failed (Zod):", zodErrors);
      throw new Error(`Données invalides dans le CSV : vérifiez le format de chaque colonne.`);
    }
    throw e;
  }
};

export const exportToWord = (risks: RiskEntry[]): Blob => {
  const getRiskColor = (level: RiskLevel): { bg: string, text: string } => {
    switch (level) {
      case RiskLevel.Inacceptable: return { bg: '#DC2626', text: '#FFFFFF' };
      case RiskLevel.Fort: return { bg: '#F97316', text: '#FFFFFF' };
      case RiskLevel.Faible: return { bg: '#FDE047', text: '#0F172A' };
      case RiskLevel.Usuel: return { bg: '#22C55E', text: '#FFFFFF' };
      default: return { bg: '#E5E7EB', text: '#1F2937' };
    }
  };

  const rowsLegend = [4, 3, 2, 1] as Gravity[];
  const colsLegend = ['A', 'B', 'C', 'D'] as Occurrence[];

  const renderMatrix = (specificRisk?: RiskEntry) => {
    let matrixHTML = `
    <table style="border-collapse: separate; border-spacing: 4px; margin-bottom: 20px; font-family: Arial, sans-serif; width: auto; margin-left: auto; margin-right: auto;">
      <tr>
        <td style="border: none; width: 40px;"></td>
        ${colsLegend.map(c => `<td style="border: none; text-align: center; font-weight: bold; color: #64748b; width: 40px;">${c}</td>`).join('')}
      </tr>
  `;

    rowsLegend.forEach(row => {
      matrixHTML += `
      <tr>
        <td style="border: none; text-align: right; padding-right: 8px; font-weight: bold; color: #64748b;">${row}</td>
    `;
      colsLegend.forEach(col => {
        const level = calculateRiskLevel(row, col);
        const { bg } = getRiskColor(level);
        const isWeak = level === RiskLevel.Faible;
        const textColor = isWeak ? '#0F172A' : '#FFFFFF';

        let opacityStyle = 'filter: alpha(opacity=30); opacity: 0.3;';
        let content = '';

        if (specificRisk) {
          const isInit = specificRisk.initialRisk.gravity === row && specificRisk.initialRisk.occurrence === col;
          const isRes = specificRisk.residualRisk.gravity === row && specificRisk.residualRisk.occurrence === col;
          if (isInit && isRes) { content = 'I / R'; opacityStyle = 'opacity: 1;'; }
          else if (isInit) { content = 'I'; opacityStyle = 'opacity: 1;'; }
          else if (isRes) { content = 'R'; opacityStyle = 'opacity: 1;'; }
        } else {
          const count = risks.filter(r => r.residualRisk.gravity === row && r.residualRisk.occurrence === col).length;
          if (count > 0) {
            content = count.toString();
            opacityStyle = 'opacity: 1;';
          }
        }

        matrixHTML += `
          <td style="background-color: ${bg}; color: ${textColor}; text-align: center; vertical-align: middle; height: 40px; width: 40px; border-radius: 4px; font-weight: bold; font-size: 14px; ${opacityStyle}">
            ${content}
          </td>
      `;
      });
      matrixHTML += `</tr>`;
    });

    matrixHTML += `
    </table>
    <div style="font-family: Arial, sans-serif; font-size: 10px; color: #64748b; text-align: center; margin-bottom: 30px;">
      <b>Gravité :</b> 4 (Catastrophique), 3 (Critique), 2 (Modérée), 1 (Négligeable)<br/>
      <b>Occurrence :</b> A (Très Improbable), B (Rare), C (Occasionnel), D (Fréquent)
    </div>
  `;
    return matrixHTML;
  };

  const globalMatrixHTML = renderMatrix();

  const riskPages = risks.map((risk, index) => {
    const level = risk.residualRisk.computedLevel;
    const { bg, text } = getRiskColor(level);
    const mitigation = risk.mitigationMeasures ? risk.mitigationMeasures.replace(/\n/g, '<br/>') : '';
    const transitionMatrixHTML = renderMatrix(risk);

    return `
      <br clear="all" style="page-break-before:always" />
      <h3 style="font-family: Arial, sans-serif; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 30px;">Fiche Risque : ${index + 1} / ${risks.length}</h3>
      
      <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px; font-family: Arial, sans-serif;">
        <tr>
          <td style="padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; width: 70%;">
            <strong style="color: #0f172a; font-size: 14pt;">${risk.activityTitle}</strong>
          </td>
          <td style="padding: 12px; background-color: ${bg}; color: ${text}; border: 1px solid #e2e8f0; text-align: center; width: 30%; font-weight: bold; font-size: 12pt;">
            ${level}
          </td>
        </tr>
      </table>

      <h4 style="font-family: Arial, sans-serif; color: #64748b; margin-bottom: 4px; font-size: 10pt; text-transform: uppercase;">Événement Redouté</h4>
      <p style="font-family: Arial, sans-serif; color: #334155; margin-top: 0; margin-bottom: 15px;">${risk.dreadedEvent || "Non renseigné"}</p>

      <h4 style="font-family: Arial, sans-serif; color: #64748b; margin-bottom: 4px; font-size: 10pt; text-transform: uppercase;">Mesures d'Atténuation</h4>
      <p style="font-family: Arial, sans-serif; color: #334155; margin-top: 0; margin-bottom: 15px;">${mitigation || "Non renseignées"}</p>

      <h4 style="font-family: Arial, sans-serif; color: #64748b; margin-bottom: 4px; font-size: 10pt; text-transform: uppercase;">Synthèse</h4>
      <p style="font-family: Arial, sans-serif; color: #334155; margin-top: 0; margin-bottom: 25px;">${risk.synthesis || "Non renseignée"}</p>
      ${transitionMatrixHTML}
    `;
  }).join('');

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Export GRE</title>
      <style>
        body { font-family: Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
      </style>
    </head>
    <body>
      <h2 style="font-family: Arial, sans-serif; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 10px;">Synthèse des Risques (GRE)</h2>
      
      <p style="font-family: Arial, sans-serif; color: #64748b; font-size: 10pt; margin-bottom: 30px;">
        Détail et transition de chaque risque sur les pages suivantes.
      </p>

      <h3 style="font-family: Arial, sans-serif; color: #1e293b; margin-top: 20px; margin-bottom: 10px; font-size: 14pt; text-align: center;">Matrice Globale des Risques Résiduels</h3>
      ${globalMatrixHTML}

      ${riskPages}
    </body>
    </html>
  `;

  return new Blob(['\ufeff', html], { type: 'application/msword' });
};
