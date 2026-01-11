import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { RiskEntry, RiskCatalogEntry } from '../types';
import { saveRisk, getRiskById, createEmptyRisk } from '../services/storage';
import AssessmentSection from '../components/AssessmentSection';
import CatalogModal from '../components/CatalogModal';
import HelpTooltip from '../components/HelpTooltip';
import { ChevronLeft, Save, BookOpen, AlertCircle } from 'lucide-react';
import { calculateRiskLevel, getRiskTheme } from '../constants';

interface RiskFormProps {
    riskId?: string | null;
    onNavigate: (page: string, id?: string) => void;
}

const RiskForm: React.FC<RiskFormProps> = ({ riskId, onNavigate }) => {
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
                activityTitle: entry.title, // Title from catalog becomes Risk Title
                dreadedEvent: entry.dreadedEvent,
                mitigationMeasures: entry.mitigationMeasures,
                initialRisk: newInitial
            };
        });
        setIsCatalogOpen(false);
    };

    const residualRiskTheme = getRiskTheme(risk.residualRisk.computedLevel);

    return (
        <div className="max-w-4xl mx-auto pb-24">
            <CatalogModal
                isOpen={isCatalogOpen}
                onClose={() => setIsCatalogOpen(false)}
                onSelect={handleImportFromCatalog}
            />

            {/* Modern Sticky Header */}
            <div className="sticky top-0 md:top-16 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 -mx-4 px-4 py-3 md:rounded-xl md:mx-0 md:border md:mb-6 md:top-4 transition-all flex items-center justify-between">
                <button
                    onClick={() => onNavigate('dashboard')}
                    className="flex items-center text-slate-500 hover:text-slate-900 font-medium transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    <span className="hidden md:inline">Retour</span>
                </button>

                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 hidden md:block">
                    {riskId ? 'Édition du risque' : 'Nouveau Risque'}
                </h2>

                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-full shadow-lg shadow-slate-200 transition-all font-medium text-sm transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer</span>
                </button>
            </div>

            <div className="space-y-6 mt-6 md:mt-0">

                {/* Main Info Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                        Informations Générales
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1 flex items-center">
                                Étude (Réf.)
                                <HelpTooltip text="Référence unique identifiant l'étude ou le dossier d'essai en cours." />
                            </label>
                            <input
                                type="text"
                                value={risk.studyNumber}
                                onChange={(e) => handleChange('studyNumber', e.target.value)}
                                placeholder="Réf. Étude..."
                                className="w-full p-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1 flex items-center">
                                Aéronef
                                <HelpTooltip text="Modèle et immatriculation de l'aéronef ou du système concerné par l'essai." />
                            </label>
                            <input
                                type="text"
                                value={risk.aircraft}
                                onChange={(e) => handleChange('aircraft', e.target.value)}
                                placeholder="Ex: H160"
                                className="w-full p-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1 flex items-center">
                                Expérimentation (Groupe)
                                <HelpTooltip text="Contexte opérationnel ou groupe d'essais auquel ce risque est rattaché." />
                            </label>
                            <input
                                type="text"
                                value={risk.experimentation}
                                onChange={(e) => handleChange('experimentation', e.target.value)}
                                placeholder="Ex: Appontage N-1 sur BRF"
                                className="w-full p-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1 flex items-center">
                                Titre du Risque
                                <HelpTooltip text="Intitulé court et significatif résumant le risque (Danger + Conséquence)." />
                            </label>
                            <input
                                type="text"
                                value={risk.activityTitle}
                                onChange={(e) => handleChange('activityTitle', e.target.value)}
                                placeholder="Ex: Collision Hangar"
                                className="w-full p-4 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:shadow-md transition-all outline-none font-bold text-slate-800"
                            />
                        </div>
                    </div>
                </div>

                {/* Intrinsic Risk Section */}
                <AssessmentSection
                    title="Risque Intrinsèque"
                    tooltip="Niveau de risque initial brut, évalué sans tenir compte des mesures de protection."
                    type="intrinsic"
                    data={risk.initialRisk}
                    onChange={(d) => handleChange('initialRisk', d)}
                >
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" />
                                Événements Redoutés
                                <HelpTooltip text="Scénario détaillé décrivant l'enchaînement des causes menant à l'événement non désiré." />
                            </label>
                            <button
                                onClick={() => setIsCatalogOpen(true)}
                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
                            >
                                <BookOpen className="w-3 h-3" />
                                Importer du catalogue
                            </button>
                        </div>
                        <textarea
                            rows={3}
                            value={risk.dreadedEvent}
                            onChange={(e) => handleChange('dreadedEvent', e.target.value)}
                            className="w-full p-4 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed transition-all resize-none"
                            placeholder="Décrire le scénario de risque..."
                        />
                    </div>
                </AssessmentSection>

                {/* Residual Risk Section */}
                <AssessmentSection
                    title="Risque Résiduel"
                    tooltip="Niveau de risque final restant après l'application de toutes les mesures d'atténuation."
                    type="residual"
                    data={risk.residualRisk}
                    comparisonRisk={risk.initialRisk} // Pass initial risk for visual comparison
                    onChange={(d) => handleChange('residualRisk', d)}
                >
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1 flex items-center">
                            Mesures d'atténuation
                            <HelpTooltip text="Actions préventives (réduire la probabilité) et correctives (réduire la gravité) mises en œuvre." />
                        </label>
                        <textarea
                            rows={4}
                            value={risk.mitigationMeasures}
                            onChange={(e) => handleChange('mitigationMeasures', e.target.value)}
                            className="w-full p-4 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed transition-all resize-none"
                            placeholder="Mesures préventives et correctives..."
                        />
                    </div>
                </AssessmentSection>

                {/* Synthesis */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100/50 shadow-sm">
                    <label className="block text-xs font-bold text-blue-900 uppercase mb-2 ml-1 flex items-center">
                        Synthèse & Conclusion
                        <HelpTooltip text="Conclusion globale sur l'acceptabilité du risque après atténuation." />
                    </label>
                    <input
                        type="text"
                        value={risk.synthesis}
                        onChange={(e) => handleChange('synthesis', e.target.value)}
                        placeholder="Ex: Risque acceptable sous condition..."
                        className="w-full p-4 bg-white/80 border-transparent rounded-xl text-blue-900 placeholder:text-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium shadow-sm transition-all"
                    />
                </div>

            </div>

            {/* Rigid Bottom Footer for Residual Risk & Save */}
            {createPortal(
                <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] print-hidden">
                    <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className={`min-w-[2.5rem] w-auto px-3 h-10 rounded-xl flex items-center justify-center text-sm font-black uppercase text-white shadow-sm ${residualRiskTheme.bg}`}>
                                {risk.residualRisk.computedLevel}
                            </div>
                            <div className="text-left hidden xs:block">
                                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Risque Résiduel</span>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${residualRiskTheme.bg}`}></div>
                                    <span className="text-xs font-bold text-slate-700 leading-none">Niveau Calculé</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl shadow-lg shadow-slate-200 transition-all font-bold text-sm transform active:scale-95 hover:-translate-y-0.5"
                        >
                            <Save className="w-4 h-4" />
                            <span>Enregistrer</span>
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* Toast Notification */}
            <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0 pointer-events-none'}`}>
                <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-medium text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Sauvegarde effectuée
                </div>
            </div>
        </div>
    );
};

export default RiskForm;