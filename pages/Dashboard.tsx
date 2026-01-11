import React, { useEffect, useState } from 'react';
import { RiskEntry, RiskCatalogEntry, StudyContext } from '../types';
import { getRisks, deleteRisk, saveRisk, getStudyContext, saveStudyContext, startNewStudy } from '../services/storage';
import { Search, Plus, BookOpen, Trash2, FileText, RefreshCw } from 'lucide-react';
import SynthesisMatrix from '../components/SynthesisMatrix';
import CatalogModal from '../components/CatalogModal';
import { calculateRiskLevel } from '../constants';

interface DashboardProps {
  onNavigate: (page: string, id?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [risks, setRisks] = useState<RiskEntry[]>([]);
  const [context, setContext] = useState<StudyContext>({ studyName: '', aircraft: '', date: '', globalSynthesis: '' });
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  const loadData = () => {
    const data = getRisks();
    setRisks(data.sort((a, b) => b.updatedAt - a.updatedAt));
    setContext(getStudyContext());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-save context when changed
  useEffect(() => {
    if (context.studyName) {
      saveStudyContext(context);
    }
  }, [context]);



  const handleContextChange = (field: keyof StudyContext, value: string) => {
    setContext(prev => ({ ...prev, [field]: value }));
  };

  const handleDeleteRisk = (id: string) => {
    deleteRisk(id);
    loadData();
  };

  const handleNewStudy = () => {
    if (confirm("Attention : Cela va effacer les risques actuels pour démarrer une nouvelle étude. Confirmer ?")) {
      startNewStudy();
      loadData();
    }
  };

  const handleQuickAddFromCatalog = (entry: RiskCatalogEntry) => {
    const newRisk: RiskEntry = {
      id: crypto.randomUUID(),
      activityTitle: entry.title, // Maps to Risk Title
      studyNumber: context.studyName,
      experimentation: 'Nouvelle Expérimentation', // Default placeholder
      aircraft: context.aircraft,
      dreadedEvent: entry.dreadedEvent,
      mitigationMeasures: entry.mitigationMeasures,
      synthesis: '',
      updatedAt: Date.now(),
      initialRisk: {
        gravity: entry.defaultGravity,
        occurrence: entry.defaultOccurrence,
        exposition: 3, // Default
        detectability: 2, // Default
        computedLevel: calculateRiskLevel(entry.defaultGravity, entry.defaultOccurrence)
      },
      residualRisk: { // Default equal to initial until edited
        gravity: entry.defaultGravity,
        occurrence: entry.defaultOccurrence,
        exposition: 3,
        detectability: 2,
        computedLevel: calculateRiskLevel(entry.defaultGravity, entry.defaultOccurrence)
      }
    };
    saveRisk(newRisk);
    loadData();
    setIsCatalogOpen(false);
  };



  return (
    <div className="max-w-6xl mx-auto space-y-8">

      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelect={handleQuickAddFromCatalog}
      />

      {/* --- Step 1: Study Context (Inputs) --- */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 no-print">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">1. Configuration de l'étude</h2>
          <button onClick={handleNewStudy} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium">
            <RefreshCw className="w-3 h-3" /> Nouvelle Étude
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Nom de l'Étude (Projet)</label>
            <input
              type="text"
              value={context.studyName}
              onChange={(e) => handleContextChange('studyName', e.target.value)}
              placeholder="Ex: Campagne PHEL-182"
              className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 no-print"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Aéronef Concerné</label>
            <input
              type="text"
              value={context.aircraft}
              onChange={(e) => handleContextChange('aircraft', e.target.value)}
              placeholder="Ex: NH90"
              className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 font-medium no-print"
            />
          </div>
        </div>
      </div>

      {/* --- Step 2: Risk Selection (Actions) --- */}
      <div className="flex flex-col md:flex-row gap-4 no-print">
        <button
          onClick={() => setIsCatalogOpen(true)}
          className="flex-1 py-4 px-6 bg-white border border-blue-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex items-center justify-center gap-3 group"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-100 group-hover:scale-110 transition-all">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="block font-bold text-slate-800">Choisir dans le Catalogue</span>
            <span className="text-xs text-slate-500">Ajouter des risques standards</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('edit')}
          className="flex-1 py-4 px-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-400 transition-all flex items-center justify-center gap-3 group"
        >
          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 group-hover:bg-slate-100 group-hover:scale-110 transition-all">
            <Plus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="block font-bold text-slate-800">Créer un Nouveau Risque</span>
            <span className="text-xs text-slate-500">Partir d'une feuille vierge</span>
          </div>
        </button>
      </div>

      {/* --- Step 3: Synthesis View (Matrix) --- */}
      <div className="w-full">
        <div className="flex justify-between items-end mb-2 no-print">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">2. Synthèse & Matrice</h2>
          <div className="text-xs text-slate-400">
            {risks.length} risque(s) identifié(s)
          </div>
        </div>

        {/* Print Header (Visible only on print) */}
        <div className="hidden print-only mb-6 border-b-2 border-slate-900 pb-4">
          <h1 className="text-2xl font-black uppercase">Synthèse des Risques</h1>
          <div className="flex justify-between mt-2 text-sm">
            <span>Étude: <b>{context.studyName}</b></span>
            <span>Aéronef: <b>{context.aircraft}</b></span>
            <span>Date: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <SynthesisMatrix
          risks={risks}
          onRiskClick={(id) => onNavigate('edit', id)}
          onDeleteRisk={handleDeleteRisk}
        />

        {/* Global Synthesis Text Area */}
        <div className="mt-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm break-inside-avoid">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Conclusion Globale de l'Étude
          </label>
          {/* Screen View */}
          <textarea
            rows={3}
            placeholder="Indiquez ici la conclusion générale sur la faisabilité de l'expérimentation..."
            className="w-full p-0 border-none focus:ring-0 text-slate-800 text-sm leading-relaxed resize-none bg-transparent no-print"
            value={context.globalSynthesis}
            onChange={(e) => handleContextChange('globalSynthesis', e.target.value)}
          />
          {/* Print View */}
          <div className="hidden print-only text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">
            {context.globalSynthesis || "Aucune conclusion enregistrée pour cette étude."}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;