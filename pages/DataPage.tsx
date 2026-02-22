import React, { useState } from 'react';
import { Download, Upload, Printer, Copy, AlertTriangle, FileText, Save, ArrowLeft } from 'lucide-react';
import { RiskEntry } from '../types';
import { getStudyContext, exportRisksToCSV, exportRisksToJSON, importRisksFromCSV, importRisksFromJSON, getRisks, exportToWord } from '../services/storage';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportPDF } from '../components/pdf/ReportPDF';
import { SynthesisPDF } from '../components/pdf/SynthesisPDF';

interface DataPageProps {
    onNavigate: (page: string) => void;
}

const DataPage: React.FC<DataPageProps> = ({ onNavigate }) => {
    const context = getStudyContext();
    const [risks, setRisks] = useState<RiskEntry[]>(getRisks());

    // --- Download Logic ---
    const triggerDownload = (blob: Blob, filename: string) => {
        try {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 60000);
        } catch (error) {
            console.error("Download failed:", error);
            alert("Erreur lors du téléchargement.");
        }
    };

    const downloadFile = (content: string, prefix: string, extension: string, mimeType: string) => {
        let safeName = (context.studyName || 'Etude').trim();
        safeName = safeName.replace(/[^a-z0-9\-_]/gi, '_').replace(/_+/g, '_');
        if (!safeName || safeName.length === 0) safeName = 'Etude_Sans_Nom';

        const filename = `${prefix}_${safeName}.${extension}`;
        const blobContent = extension === 'csv' ? ['\uFEFF' + content] : [content];
        const blob = new Blob(blobContent, { type: `${mimeType};charset=utf-8` });
        triggerDownload(blob, filename);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!confirm("ATTENTION : Cette action va effacer TOUTES les études existantes pour les remplacer par celles du fichier.\n\nÊtes-vous sûr de vouloir continuer ?")) {
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            try {
                if (file.name.toLowerCase().endsWith('.json')) {
                    importRisksFromJSON(content);
                    setRisks(getRisks());
                    alert('Base de données restaurée avec succès (JSON).');
                } else if (file.name.toLowerCase().endsWith('.csv')) {
                    importRisksFromCSV(content);
                    setRisks(getRisks());
                    alert('Études importées avec succès (CSV).');
                } else {
                    alert('Format de fichier non supporté. Utilisez .csv ou .json');
                }
            } catch (error) {
                console.error(error);
                alert('Erreur lors de l\'importation : ' + (error as Error).message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleCopySynthesis = () => {
        let text = `# Synthèse GRXP : ${context.studyName}\n\n`;
        text += `- **Expérimentation :** ${context.experimentation}\n`;
        text += `- **Aéronef :** ${context.aircraft}\n`;
        text += `- **Date :** ${new Date().toLocaleDateString()}\n\n`;
        text += `--- \n\n`;
        text += `## Synthèse Globale\n${context.globalSynthesis || "_Aucune synthèse renseignée_"}\n\n`;
        text += `## Détail des Risques Résiduels\n`;

        const grouped: Record<string, RiskEntry[]> = {};
        risks.forEach(r => {
            const exp = r.experimentation || 'Général';
            if (!grouped[exp]) grouped[exp] = [];
            grouped[exp].push(r);
        });

        Object.keys(grouped).forEach(exp => {
            text += `\n### Expérimentation : ${exp}\n\n`;
            text += `| Activité | Niveau | G | O | Mesures de Mitigation |\n`;
            text += `| :--- | :--- | :---: | :---: | :--- |\n`;
            grouped[exp].forEach(r => {
                const levelStr = r.residualRisk.computedLevel.toUpperCase();
                const safeTitle = r.activityTitle.replace(/\|/g, '\\|');
                const safeMeasures = r.mitigationMeasures.replace(/\|/g, '\\|').replace(/\n/g, '<br>');

                text += `| ${safeTitle} | **${levelStr}** | ${r.residualRisk.gravity} | ${r.residualRisk.occurrence} | ${safeMeasures} |\n`;
            });
        });

        navigator.clipboard.writeText(text).then(() => alert('Synthèse Markdown copiée dans le presse-papier'));
    };

    const handleWordExport = () => {
        const blob = exportToWord(risks);
        let safeName = (context.studyName || 'Etude').trim();
        safeName = safeName.replace(/[^a-z0-9\-_]/gi, '_').replace(/_+/g, '_');
        if (!safeName) safeName = 'Etude_Sans_Nom';

        triggerDownload(blob, `GRE_Synthese_${safeName}.doc`);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => onNavigate('dashboard')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors no-print">
                    <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des Données</h1>
                    <p className="text-slate-500 dark:text-slate-400">Exports, Sauvegardes et Imports</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 no-print">

                {/* 1. Rapports PDF & Word */}
                <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Rapports & Documents {context.studyName && <span className="text-slate-900 dark:text-white normal-case ml-2">— {context.studyName}</span>}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PDFDownloadLink
                            document={<SynthesisPDF context={context} risks={risks} />}
                            fileName={`Synthese_GrXP_${(context.studyName || 'Etude').replace(/[^a-z0-9\-_]/gi, '_')}.pdf`}
                            className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-4 transition-all group"
                        >
                            {/* @ts-ignore */}
                            <div className="flex items-center gap-4 w-full">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-slate-800 dark:text-slate-200">Télécharger la Synthèse</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Matrice et liste (Format A4 PDF)</span>
                                </div>
                            </div>
                        </PDFDownloadLink>

                        <PDFDownloadLink
                            document={<ReportPDF context={context} risks={risks} />}
                            fileName={`Rapport_Complet_GrXP_${(context.studyName || 'Etude').replace(/[^a-z0-9\-_]/gi, '_')}.pdf`}
                            className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-4 transition-all group"
                        >
                            {/* @ts-ignore */}
                            <div className="flex items-center gap-4 w-full">
                                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Printer className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-slate-800 dark:text-slate-200">Télécharger le Rapport Complet</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Fiches détaillées (Format A4 PDF)</span>
                                </div>
                            </div>
                        </PDFDownloadLink>

                        <button
                            onClick={handleWordExport}
                            className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-4 transition-all group"
                        >
                            <div className="w-10 h-10 bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-slate-800 dark:text-slate-200">Exporter GRE (Word)</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Format .doc éditable</span>
                            </div>
                        </button>

                        <button
                            onClick={handleCopySynthesis}
                            className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-4 transition-all group"
                        >
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Copy className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-slate-800 dark:text-slate-200">Copier en Markdown</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Pour Notion, Obsidian ou Email</span>
                            </div>
                        </button>
                    </div>
                </section>

                {/* 2. Sauvegardes CSV/JSON */}
                <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Save className="w-4 h-4" /> Sauvegardes & Échanges
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Export */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Exporter les données</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Format CSV pour Excel ou JSON pour une sauvegarde complète.
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => downloadFile(exportRisksToCSV(), 'risks', 'csv', 'text/csv')}
                                    className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-slate-100"
                                >
                                    <span>Format CSV (Toutes études)</span>
                                    <Download className="w-4 h-4 text-slate-400" />
                                </button>
                                <button
                                    onClick={() => downloadFile(exportRisksToJSON(), 'backup_grxp', 'json', 'application/json')}
                                    className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-slate-100"
                                >
                                    <span>Format JSON (Base Complète)</span>
                                    <Download className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        {/* Import */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Restaurer une sauvegarde</h3>

                            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/40 p-3 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-500 mt-0.5" />
                                    <p className="text-xs text-orange-800 dark:text-orange-300 leading-tight">
                                        <b>Attention :</b> L'importation remplace TOUTES les études actuelles.
                                    </p>
                                </div>
                            </div>

                            <label className="flex items-center justify-center w-full px-4 py-3 bg-slate-800 dark:bg-blue-600 text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-slate-700 dark:hover:bg-blue-700 transition-colors gap-2">
                                <Upload className="w-4 h-4" />
                                <span>Charger un fichier...</span>
                                <input
                                    type="file"
                                    accept=".csv,.json"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </label>
                        </div>
                    </div>
                </section>

            </div>

        </div>
    );
};

export default DataPage;
