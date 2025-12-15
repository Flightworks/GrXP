import React, { useState } from 'react';
import { Download, Upload, Printer, Copy, AlertTriangle, FileText, LayoutDashboard, Save, ArrowLeft } from 'lucide-react';
import { RiskEntry } from '../types';
import { getStudyContext, exportRisksToCSV, exportRisksToJSON, importRisksFromCSV, importRisksFromJSON, getRisks } from '../services/storage';
import FullReportPrint from '../components/FullReportPrint';
import html2pdf from 'html2pdf.js';
import SynthesisMatrix from '../components/SynthesisMatrix';

interface DataPageProps {
    onNavigate: (page: string) => void;
}

const DataPage: React.FC<DataPageProps> = ({ onNavigate }) => {
    const context = getStudyContext();
    const risks = getRisks();
    const [printMode, setPrintMode] = useState<'none' | 'synthesis' | 'full' | 'download'>('none');

    // --- Download Logic ---
    // --- Download Logic ---
    const triggerDownload = (blob: Blob, filename: string) => {
        try {
            // Create a URL for the blob
            const url = URL.createObjectURL(blob);

            // Create a temporary anchor element
            const link = document.createElement('a');
            link.href = url;
            link.download = filename; // The key attribute

            // Force target blank to help with some browser environments handling downloads
            link.target = '_blank';

            // Append to body to ensure it's part of the DOM transparency tree
            document.body.appendChild(link);

            // Dispatch a native click event
            link.click();

            // Cleanup
            document.body.removeChild(link);

            // Long timeout to ensure the download starts before revocation
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 60000); // 60 seconds

        } catch (error) {
            console.error("Download failed:", error);
            alert("Erreur lors du téléchargement.");
        }
    };

    const downloadFile = (content: string, prefix: string, extension: string, mimeType: string) => {
        // 1. Sanitize Filename with Fallback
        let safeName = (context.studyName || 'Etude').trim();
        safeName = safeName.replace(/[^a-z0-9\-_]/gi, '_').replace(/_+/g, '_');
        if (!safeName || safeName.length === 0) safeName = 'Etude_Sans_Nom';

        const filename = `${prefix}_${safeName}.${extension}`;

        // 2. Prepare Blob with BOM for CSV
        const blobContent = extension === 'csv' ? ['\uFEFF' + content] : [content];
        const blob = new Blob(blobContent, { type: `${mimeType};charset=utf-8` });

        // 3. Trigger Download
        triggerDownload(blob, filename);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!confirm("ATTENTION : Cette action va effacer tous les risques existants pour les remplacer par ceux du fichier.\n\nÊtes-vous sûr de vouloir continuer ?")) {
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            try {
                if (file.name.toLowerCase().endsWith('.json')) {
                    importRisksFromJSON(content);
                    alert('Risques importés avec succès (JSON).');
                } else if (file.name.toLowerCase().endsWith('.csv')) {
                    importRisksFromCSV(content);
                    alert('Risques importés avec succès (CSV).');
                } else {
                    alert('Format de fichier non supporté. Utilisez .csv ou .json');
                }
            } catch (error) {
                console.error(error);
                alert('Erreur lors de l\'importation : ' + (error as Error).message);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset
    };

    // --- Print Logic ---
    const handlePrint = (mode: 'synthesis' | 'full') => {
        setPrintMode(mode);
        // Use requestAnimationFrame to ensure the DOM has updated with the 'print-only' elements
        requestAnimationFrame(() => {
            setTimeout(() => {
                window.print();
                setPrintMode('none');
            }, 100);
        });
    };

    const handleDirectDownload = () => {
        setPrintMode('download');
        const element = document.getElementById('report-content-data');
        if (element) {
            const safeName = (context.studyName || 'Etude').replace(/[^a-z0-9\-_]/gi, '_') || 'Report';
            const opt = {
                margin: 10,
                filename: `Rapport_GrXP_${safeName}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
            };

            // Wait for render
            requestAnimationFrame(() => {
                // Add a small delay for images to render if needed
                setTimeout(() => {
                    html2pdf().set(opt).from(element).output('blob').then((blob: Blob) => {
                        triggerDownload(blob, opt.filename);
                        setPrintMode('none');
                    }, (err: any) => {
                        console.error('PDF generation error:', err);
                        alert('Erreur: Génération PDF échouée.');
                        setPrintMode('none');
                    });
                }, 500);
            });
        }
    };

    const handleCopySynthesis = () => {
        let text = `SYNTHÈSE GRXP\n`;
        text += `ÉTUDE: ${context.studyName} (${context.aircraft})\n`;
        text += `DATE: ${new Date().toLocaleDateString()}\n`;
        text += `---------------------------\n`;
        text += `SYNTHÈSE GLOBALE: ${context.globalSynthesis}\n\n`;
        text += `DÉTAIL DES RISQUES RÉSIDUELS:\n`;

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

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => onNavigate('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors no-print">
                    <ArrowLeft className="w-6 h-6 text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestion des Données</h1>
                    <p className="text-slate-500">Exports, Sauvegardes et Imports</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 no-print">

                {/* 1. Exports PDF / Print */}
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Rapports & Documents
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => handlePrint('synthesis')}
                            className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-4 transition-all group"
                        >
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-slate-800">Imprimer la Synthèse</span>
                                <span className="text-xs text-slate-500">Matrice et liste résumée</span>
                            </div>
                        </button>

                        <button
                            onClick={() => handlePrint('full')}
                            className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-4 transition-all group"
                        >
                            <div className="w-10 h-10 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Printer className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-slate-800">Rapport Complet</span>
                                <span className="text-xs text-slate-500">Fiches détaillées de tous les risques</span>
                            </div>
                        </button>

                        <button
                            onClick={handleDirectDownload}
                            className="p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl flex items-center gap-4 transition-all group"
                        >
                            <div className="w-10 h-10 bg-green-200 text-green-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Download className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-slate-800">Télécharger PDF</span>
                                <span className="text-xs text-slate-500">Générer le rapport PDF directement</span>
                            </div>
                        </button>

                        <button
                            onClick={handleCopySynthesis}
                            className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-4 transition-all group"
                        >
                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Copy className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-slate-800">Copier Texte</span>
                                <span className="text-xs text-slate-500">Pour coller dans un email/rapport</span>
                            </div>
                        </button>
                    </div>
                </section>

                {/* 2. Sauvegardes CSV/JSON */}
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Save className="w-4 h-4" /> Sauvegardes & Échanges
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Export */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-slate-700 text-sm">Exporter les données</h3>
                            <p className="text-xs text-slate-500">
                                Format CSV pour Excel ou JSON pour une sauvegarde complète.
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => downloadFile(exportRisksToCSV(), 'risks', 'csv', 'text/csv')}
                                    className="flex items-center justify-between px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                                >
                                    <span>Format CSV (Excel)</span>
                                    <Download className="w-4 h-4 text-slate-400" />
                                </button>
                                <button
                                    onClick={() => downloadFile(exportRisksToJSON(), 'backup_grxp', 'json', 'application/json')}
                                    className="flex items-center justify-between px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                                >
                                    <span>Format JSON (Complet)</span>
                                    <Download className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        {/* Import */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-slate-700 text-sm">Restaurer une sauvegarde</h3>

                            <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                                    <p className="text-xs text-orange-800 leading-tight">
                                        <b>Attention :</b> L'importation remplace toutes les données actuelles.
                                    </p>
                                </div>
                            </div>

                            <label className="flex items-center justify-center w-full px-4 py-3 bg-slate-800 text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-slate-700 transition-colors gap-2">
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

            {/* Hidden Render Areas for PDF/Print */}
            <div className={printMode === 'full' || printMode === 'download' ? 'block' : 'hidden'}>
                {/* Re-use FullReportPrint but we need to ensure it's rendered in DOM */}
                <div id="report-content-data">
                    <FullReportPrint context={context} risks={risks} />
                </div>
            </div>

            <div className={printMode === 'synthesis' ? 'block print-only' : 'hidden'}>
                <div className="mb-6 border-b-2 border-slate-900 pb-4">
                    <h1 className="text-2xl font-black uppercase">Synthèse des Risques</h1>
                    <div className="flex justify-between mt-2 text-sm">
                        <span>Étude: <b>{context.studyName}</b></span>
                        <span>Aéronef: <b>{context.aircraft}</b></span>
                        <span>Date: {new Date().toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="mb-8">
                    <p className="text-sm"><b>Conclusion Globale:</b> {context.globalSynthesis}</p>
                </div>
                <SynthesisMatrix risks={risks} onRiskClick={() => { }} />
            </div>

        </div>
    );
};

export default DataPage;
