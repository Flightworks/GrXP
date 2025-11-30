import React from 'react';
import { RiskEntry, StudyContext } from '../types';
import MatrixGrid from './MatrixGrid';
import { getRiskColor } from '../constants';

interface FullReportPrintProps {
  context: StudyContext;
  risks: RiskEntry[];
}

const FullReportPrint: React.FC<FullReportPrintProps> = ({ context, risks }) => {
  // Group risks by Experimentation
  const groupedRisks: Record<string, RiskEntry[]> = {};
  
  risks.forEach(risk => {
    const key = risk.experimentation || 'Risques Généraux';
    if (!groupedRisks[key]) {
      groupedRisks[key] = [];
    }
    groupedRisks[key].push(risk);
  });

  const experimentations = Object.keys(groupedRisks).sort();

  return (
    <div className="print-only max-w-[210mm] mx-auto bg-white">
      {/* Report Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-8">
        <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">Analyse de Risques - Rapport Complet</h1>
        <div className="flex justify-between mt-4 text-sm font-medium text-slate-600">
          <div>
            <span className="block text-xs uppercase text-slate-400">Étude</span>
            <span className="text-lg text-black">{context.studyName}</span>
          </div>
          <div>
             <span className="block text-xs uppercase text-slate-400">Aéronef</span>
             <span className="text-lg text-black">{context.aircraft}</span>
          </div>
          <div className="text-right">
             <span className="block text-xs uppercase text-slate-400">Date</span>
             <span>{new Date(context.date || Date.now()).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>

      {/* Global Synthesis */}
      <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200 break-inside-avoid">
         <h2 className="text-sm font-bold uppercase text-slate-500 mb-2 tracking-widest border-b border-slate-200 pb-2">Conclusion Globale de l'Étude</h2>
         <p className="text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">
            {context.globalSynthesis || "Aucune conclusion enregistrée pour cette étude."}
         </p>
      </div>

      {/* Experimentations and Risks */}
      <div className="space-y-8">
        {experimentations.map((exp, expIndex) => (
            <div key={exp} className="break-inside-avoid">
                {/* Experimentation Section Header */}
                <div className="flex items-center gap-4 mb-4 mt-8 pb-2 border-b border-slate-300">
                     <h2 className="text-xl font-bold uppercase text-blue-900">{exp}</h2>
                     <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold">{groupedRisks[exp].length} Risques</span>
                </div>

                {groupedRisks[exp].map((risk, index) => (
                <div key={risk.id} className={`mb-6 border border-slate-300 rounded-xl overflow-hidden break-inside-avoid`}>
                    {/* Risk Header */}
                    <div className="bg-slate-100 p-4 border-b border-slate-300 flex justify-between items-start">
                    <div>
                        <h2 className="font-bold text-lg text-slate-900">{risk.activityTitle}</h2>
                        <div className="text-xs text-slate-500 mt-1 uppercase tracking-wide">
                        {risk.studyNumber}
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-slate-500 mb-1">Risque Résiduel</span>
                        <span className={`px-3 py-1 rounded text-xs font-black uppercase ${getRiskColor(risk.residualRisk.computedLevel)}`}>
                        {risk.residualRisk.computedLevel}
                        </span>
                    </div>
                    </div>

                    <div className="p-4 grid grid-cols-2 gap-8">
                    {/* Descriptions */}
                    <div className="space-y-4">
                        <div>
                        <h3 className="text-xs font-bold uppercase text-slate-500 mb-1">Événement Redouté</h3>
                        <p className="text-sm text-slate-900 leading-snug">{risk.dreadedEvent || "-"}</p>
                        </div>
                        <div>
                        <h3 className="text-xs font-bold uppercase text-slate-500 mb-1">Mesures d'atténuation</h3>
                        <p className="text-sm text-slate-900 leading-snug">{risk.mitigationMeasures || "-"}</p>
                        </div>
                        <div>
                        <h3 className="text-xs font-bold uppercase text-slate-500 mb-1">Synthèse Individuelle</h3>
                        <p className="text-sm text-slate-900 italic">{risk.synthesis || "-"}</p>
                        </div>
                    </div>

                    {/* Matrices Side-by-Side */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="text-center text-[10px] font-bold uppercase mb-2">Initial</div>
                                <div className="scale-75 origin-top">
                                    <MatrixGrid 
                                        currentGravity={risk.initialRisk.gravity} 
                                        currentOccurrence={risk.initialRisk.occurrence}
                                        size="sm" 
                                    />
                                </div>
                            </div>
                            <div className="text-slate-300">→</div>
                            <div className="flex-1">
                                <div className="text-center text-[10px] font-bold uppercase mb-2">Résiduel</div>
                                <div className="scale-75 origin-top">
                                    <MatrixGrid 
                                        currentGravity={risk.residualRisk.gravity} 
                                        currentOccurrence={risk.residualRisk.occurrence}
                                        initialGravity={risk.initialRisk.gravity}
                                        initialOccurrence={risk.initialRisk.occurrence}
                                        size="sm" 
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Cotation Details */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-100 pt-2 mt-auto">
                            <div>
                                <span className="block text-slate-400">Exposition:</span>
                                <b>{risk.initialRisk.exposition}</b> (Init) → <b>{risk.residualRisk.exposition}</b> (Res)
                            </div>
                            <div>
                                <span className="block text-slate-400">Détectabilité:</span>
                                <b>{risk.initialRisk.detectability}</b> (Init) → <b>{risk.residualRisk.detectability}</b> (Res)
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
                ))}
            </div>
        ))}
      </div>
    </div>
  );
};

export default FullReportPrint;