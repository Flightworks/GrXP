export enum Gravity {
  Negligeable = 1,
  Moderee = 2,
  Critique = 3,
  Catastrophique = 4
}

export enum Occurrence {
  TresImprobable = 'A',
  Rare = 'B',
  Occasionnel = 'C',
  Frequent = 'D'
}

export enum Exposition {
  Faible = 1,
  Moyenne = 2,
  Importante = 3,
  Forte = 4
}

export enum Detectability {
  Totale = 1,
  Exploitable = 2,
  Faible = 3,
  Indetectable = 4
}

export enum RiskLevel {
  Usuel = 'Usuel',
  Faible = 'Faible',
  Fort = 'Fort',
  Inacceptable = 'Inacceptable'
}

export interface Assessment {
  gravity: Gravity;
  occurrence: Occurrence;
  exposition: Exposition;
  detectability: Detectability;
  computedLevel: RiskLevel;
}

export interface RiskEntry {
  id: string;
  studyNumber: string; // N° Étude / Ref
  experimentation: string; // Nom de l'expérimentation (Groupe de risques)
  activityTitle: string; // Titre du Risque
  aircraft: string;
  dreadedEvent: string; // "Événements redoutés"
  mitigationMeasures: string; // "Mesures d'atténuation"
  synthesis: string;
  initialRisk: Assessment;
  residualRisk: Assessment;
  updatedAt: number;
}

export interface RiskCatalogEntry {
  id: string;
  title: string;
  category: string;
  dreadedEvent: string;
  mitigationMeasures: string;
  defaultGravity: Gravity;
  defaultOccurrence: Occurrence;
}

export interface StudyContext {
  studyName: string;
  aircraft: string;
  date: string;
  globalSynthesis: string;
}

// Helper types for UI selection
export interface SelectOption<T> {
  value: T;
  label: string;
  description?: string;
}