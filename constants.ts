import { Gravity, Occurrence, RiskLevel, SelectOption, Exposition, Detectability, RiskCatalogEntry } from './types';

export const GRAVITY_OPTIONS: SelectOption<Gravity>[] = [
  { value: Gravity.Catastrophique, label: 'Catastrophique (4)' },
  { value: Gravity.Critique, label: 'Critique (3)' },
  { value: Gravity.Moderee, label: 'Modérée (2)' },
  { value: Gravity.Negligeable, label: 'Négligeable (1)' },
];

export const OCCURRENCE_OPTIONS: SelectOption<Occurrence>[] = [
  { value: Occurrence.Frequent, label: 'Fréquent (D)' },
  { value: Occurrence.Occasionnel, label: 'Occasionnel (C)' },
  { value: Occurrence.Rare, label: 'Rare (B)' },
  { value: Occurrence.TresImprobable, label: 'Très improbable (A)' },
];

export const EXPOSITION_OPTIONS: SelectOption<Exposition>[] = [
  { value: Exposition.Forte, label: 'Forte' },
  { value: Exposition.Importante, label: 'Importante' },
  { value: Exposition.Moyenne, label: 'Moyenne' },
  { value: Exposition.Faible, label: 'Faible' },
];

export const DETECTABILITY_OPTIONS: SelectOption<Detectability>[] = [
  { value: Detectability.Indetectable, label: 'Indétectable' },
  { value: Detectability.Faible, label: 'Faible' },
  { value: Detectability.Exploitable, label: 'Exploitable' },
  { value: Detectability.Totale, label: 'Totale' },
];

// Based on the matrix in the user image
export const calculateRiskLevel = (g: Gravity, o: Occurrence): RiskLevel => {
  // Map simplified matrix logic
  if (g === 4) {
    if (o === Occurrence.Frequent || o === Occurrence.Occasionnel) return RiskLevel.Inacceptable;
    if (o === Occurrence.Rare) return RiskLevel.Fort;
    return RiskLevel.Faible;
  }
  if (g === 3) {
    if (o === Occurrence.Frequent) return RiskLevel.Inacceptable;
    if (o === Occurrence.Occasionnel) return RiskLevel.Fort;
    return RiskLevel.Faible;
  }
  if (g === 2) {
    if (o === Occurrence.Frequent) return RiskLevel.Fort;
    if (o === Occurrence.Occasionnel || o === Occurrence.Rare) return RiskLevel.Faible;
    return RiskLevel.Usuel;
  }
  // g === 1
  if (o === Occurrence.Frequent || o === Occurrence.Occasionnel) return RiskLevel.Faible;
  return RiskLevel.Usuel;
};

export const getRiskTheme = (level: RiskLevel) => {
  switch (level) {
    case RiskLevel.Inacceptable:
      return { bg: 'bg-red-600', text: 'text-white', border: 'border-red-800', full: 'bg-red-600 text-white border-red-800', lightBg: 'bg-red-100' };
    case RiskLevel.Fort:
      return { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-700', full: 'bg-orange-500 text-white border-orange-700', lightBg: 'bg-orange-100' };
    case RiskLevel.Faible:
      return { bg: 'bg-yellow-300', text: 'text-slate-900', border: 'border-yellow-500', full: 'bg-yellow-300 text-slate-900 border-yellow-500', lightBg: 'bg-yellow-50' };
    case RiskLevel.Usuel:
      return { bg: 'bg-green-500', text: 'text-white', border: 'border-green-700', full: 'bg-green-500 text-white border-green-700', lightBg: 'bg-green-50' };
    default:
      return { bg: 'bg-gray-200', text: 'text-gray-800', border: 'border-gray-300', full: 'bg-gray-200', lightBg: 'bg-white' };
  }
};

export const getRiskColor = (level: RiskLevel): string => {
  return getRiskTheme(level).full;
};

export const getRiskBgClass = (level: RiskLevel): string => {
  switch (level) {
    case RiskLevel.Inacceptable: return 'bg-red-100';
    case RiskLevel.Fort: return 'bg-orange-100';
    case RiskLevel.Faible: return 'bg-yellow-50';
    case RiskLevel.Usuel: return 'bg-green-50';
    default: return 'bg-white';
  }
};

export const DEFAULT_CATALOG: RiskCatalogEntry[] = [
  {
    id: 'cat-1',
    title: 'Panne GTR au décollage (OEI)',
    category: 'Technique / Propulsion',
    dreadedEvent: 'Perte d\'un moteur (OEI) lors de la phase de transition au départ du navire (Point CDP). Perte d\'altitude critique et impact surface.',
    mitigationMeasures: '- Calculs de performance (Masse/Température/Vent) avant vol rigoureux\n- Adoption profil décollage "Clear Deck" ou "Lateral"\n- Entraînement OEI équipage à jour\n- Délestage carburant possible',
    defaultGravity: Gravity.Catastrophique,
    defaultOccurrence: Occurrence.Rare
  },
  {
    id: 'cat-2',
    title: 'Appontage par mer formée (SHOL)',
    category: 'Environnement / Pilotage',
    dreadedEvent: 'Glissement de l\'hélicoptère sur le pont ou impact violent trains/fuselage dû au tangage/roulis excessif du navire (Mouvements hors limites).',
    mitigationMeasures: '- Respect strict des enveloppes SHOL (Ship Helicopter Operating Limits)\n- Harponnage immédiat à l\'impact\n- Équipe de pont parée aux saisines rapides\n- LSO (Landing Signal Officer) qualifié en place',
    defaultGravity: Gravity.Catastrophique,
    defaultOccurrence: Occurrence.Occasionnel
  },
  {
    id: 'cat-3',
    title: 'Désorientation Spatiale sous JVN',
    category: 'Facteur Humain',
    dreadedEvent: 'Perte de références visuelles sur l\'horizon par nuit noire (Niveau 5) au dessus de l\'eau. Entrée en virage engagé involontaire ou percut surface.',
    mitigationMeasures: '- Circuit visuel rigoureux (Scan Instruments/Dehors)\n- Annonce des hauteurs par le PNF (Radio-Sonde)\n- Passage IFR immédiat si perte de repères\n- Limitation de la durée du vol sous JVN',
    defaultGravity: Gravity.Critique,
    defaultOccurrence: Occurrence.Occasionnel
  },
  {
    id: 'cat-4',
    title: 'Rupture câble treuil',
    category: 'Opérationnel / Équipement',
    dreadedEvent: 'Cisaillement ou rupture du câble lors d\'un hélitreuillage (Diver/Civière). Chute du personnel ou fouettement du câble sur le rotor arrière (TR).',
    mitigationMeasures: '- Contrôle pré-vol du câble et du coupe-câble\n- Cisaille pneumatique de secours opérationnelle\n- Entraînement procédures dégradées treuil\n- Port du harnais sécurisé',
    defaultGravity: Gravity.Critique,
    defaultOccurrence: Occurrence.Rare
  },
  {
    id: 'cat-5',
    title: 'Interférences Électromagnétiques (EMC)',
    category: 'Environnement / Navire',
    dreadedEvent: 'Perturbation des commandes de vol électriques (CDVE) ou des écrans (MFD) lors de l\'approche radar du navire (champs forts).',
    mitigationMeasures: '- Cartographie des émetteurs navire et zones d\'exclusion (HIRTA)\n- Monitoring télémesure (TM) temps réel des paramètres EMC\n- Procédure de dégagement immédiate définie',
    defaultGravity: Gravity.Moderee,
    defaultOccurrence: Occurrence.Occasionnel
  },
  {
    id: 'cat-6',
    title: 'Vibrations excessives (Ouverture domaine)',
    category: 'Essais en vol',
    dreadedEvent: 'Apparition de phénomènes vibratoires non amortis (Flutter) lors de l\'atteinte de Vne + 10kts. Endommagement structurel.',
    mitigationMeasures: '- Progression incrémentale de la vitesse (Build-up)\n- Surveillance temps réel des jauges de contrainte par ingénieur d\'essai (ITE)\n- Arrêt immédiat de l\'essai si dépassement seuils',
    defaultGravity: Gravity.Critique,
    defaultOccurrence: Occurrence.TresImprobable
  },
  {
    id: 'cat-7',
    title: 'Collision aviaire basse altitude',
    category: 'Environnement',
    dreadedEvent: 'Impact avec oiseau en vol tactique (TBA) causant bris de verrière et blessure pilote, ou ingestion moteur.',
    mitigationMeasures: '- Évitement des zones migratoires connues (NOTAM)\n- Visière casque baissée obligatoire en TBA\n- Profil de vol "Oiseau" (remontée réflexe)',
    defaultGravity: Gravity.Moderee,
    defaultOccurrence: Occurrence.Occasionnel
  }
];