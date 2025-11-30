import React, { useEffect, useState } from 'react';
import { RiskEntry, RiskCatalogEntry, StudyContext } from '../types';
import { getRisks, deleteRisk, saveRisk, getStudyContext, saveStudyContext, startNewStudy } from '../services/storage';
import { Search, Plus, BookOpen, Trash2, FileText, Download, Copy, RefreshCw } from 'lucide-react';
import SynthesisMatrix from '../components/SynthesisMatrix';
import CatalogModal from '../components/CatalogModal';
import { calculateRiskLevel } from '../constants';
import FullReportPrint from '../components/FullReportPrint';

interface DashboardProps {
  onNavigate: (page: string, id?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [risks, setRisks] = useState<RiskEntry[]>([]);
  const [context, setContext] = useState<StudyContext>({ studyName: '', aircraft: '', date: '', globalSynthesis: '' });
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'none' | 'synthesis' | 'full'>('none');

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

  // Handle printing side-effect
  useEffect(() => {
    if (printMode === 'none') return;

    // We use a timeout to allow React to flush the state change and render 
    // the print-specific components (FullReportPrint) into the DOM.
    const timer = setTimeout(() => {
      window.print();
      // After the print dialog closes (or immediately in non-blocking browsers),
      // we reset the state to hide the print components.
      setPrintMode('none');
    }, 500);

    return () => clearTimeout(timer);
  }, [printMode]);

  const handleContextChange = (field: keyof StudyContext, value: string) => {
    setContext(prev => ({ ...prev, [field]: value }));
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

  const handleCopySynthesis = () => {
    let text = `SYNTHÈSE GRXP\n`;
    text += `ÉTUDE: ${context.studyName} (${context.aircraft})\n`;
    text += `DATE: ${new Date().toLocaleDateString()}\n`;
    text += `---------------------------\n`;
    text += `SYNTHÈSE GLOBALE: ${context.globalSynthesis}\n\n`;
    text += `DÉTAIL DES RISQUES RÉSIDUELS:\n`;
    
    // Group by experimentation for text copy
    const grouped: Record<string, RiskEntry[]> = {};
    risks.forEach(r => {
        const exp = r.experimentation || 'Général';
        if (!grouped[exp]) grouped[exp] = [];
        grouped[exp].push(r);
    });

    Object.keys(grouped).forEach(exp => {
        text += `\nEXPÉRIMENTATION: ${exp.toUpperCase()}\n`;
        grouped[exp].forEach(r => {
             text += `- ${r.activityTitle}: ${r.residualRisk.computedLevel.toUpperCase()} (G${r.residualRisk.gravity}/O${r.residualRisk.occurrence})\n`;
             text += `  Mesures: ${r.mitigationMeasures}\n`;
        });
    });
    
    navigator.clipboard.writeText(text).then(() => alert('Synthèse copiée dans le presse-papier'));
  };

  const handlePrint = (mode: 'synthesis' | 'full') => {
    setPrintMode(mode);
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
      <div className={`w-full ${printMode === 'full' ? 'print-hidden' : ''}`}>
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
      
      {/* Hidden Full Report Component (Visible only when printMode === 'full' via CSS) */}
      <div className={printMode === 'full' ? 'block' : 'hidden'}>
         <FullReportPrint context={context} risks={risks} />
      </div>

      {/* --- Step 4: Export Actions --- */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white no-print">
         <div className="flex flex-col md:flex-row justify-between items-center gap-6">
             <div>
                 <h3 className="font-bold text-lg mb-1">Exporter le dossier</h3>
                 <p className="text-slate-400 text-xs">Générez les documents pour la commission de sécurité.</p>
             </div>
             <div className="flex flex-wrap gap-3 justify-center">
                 <button 
                    onClick={handleCopySynthesis}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                 >
                    <Copy className="w-4 h-4" /> Copier Texte
                 </button>
                 <button 
                    onClick={() => handlePrint('synthesis')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                 >
                    <Download className="w-4 h-4" /> PDF Synthèse
                 </button>
                 <button 
                    onClick={() => handlePrint('full')}
                    className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                 >
                    <Download className="w-4 h-4" /> Exporter Rapport Complet
                 </button>
             </div>
         </div>
      </div>

    </div>
  );
};

export default Dashboard;