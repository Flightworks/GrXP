import React, { useState } from 'react';
import { Download, Upload, Printer, Copy, AlertTriangle, FileText, Save, ArrowLeft } from 'lucide-react';
import { RiskEntry } from '../types';
import { getStudyContext, getRisks } from '../services/storage';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { useDataExport } from '../hooks/useDataExport';
import { ReportPDF } from '../components/pdf/ReportPDF';
import { SynthesisPDF } from '../components/pdf/SynthesisPDF';

interface DataPageProps {
    onNavigate: (page: string) => void;
}

const DataPage: React.FC<DataPageProps> = ({ onNavigate }) => {
    const context = getStudyContext();
    const {
        risks,
        previewType,
        setPreviewType,
        handleFileUpload,
        handleCopySynthesis,
        handleWordSynthesisExport,
        handleWordReportExport,
        handleDownloadCSV,
        handleDownloadJSON
    } = useDataExport(context, getRisks());

    if (previewType === 'synth') {
        return (
            <div className="absolute inset-0 bg-white z-50 flex flex-col">
                <button onClick={() => setPreviewType(null)} className="p-4 bg-slate-800 text-white font-bold">Fermer l'aperçu PDF</button>
                <PDFViewer width="100%" height="100%">
                    <SynthesisPDF context={context} risks={risks} />
                </PDFViewer>
            </div>
        );
    }

    if (previewType === 'full') {
        return (
            <div className="absolute inset-0 bg-white z-50 flex flex-col">
                <button onClick={() => setPreviewType(null)} className="p-4 bg-slate-800 text-white font-bold">Fermer l'aperçu PDF Complet</button>
                <PDFViewer width="100%" height="100%">
                    <ReportPDF context={context} risks={risks} />
                </PDFViewer>
            </div>
        );
    }

    // Word preview logic removed as it's a real docx blob now, impossible to render raw HTML iframe.

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

                        <button onClick={() => setPreviewType('synth')} className="p-4 bg-blue-50 text-blue-800 border-2 border-blue-200 rounded-xl" id="preview-synth-btn">
                            Aperçu Synthèse
                        </button>

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

                        <button onClick={() => setPreviewType('full')} className="p-4 bg-blue-50 text-blue-800 border-2 border-blue-200 rounded-xl" id="preview-full-btn">
                            Aperçu Complet
                        </button>

                        <button
                            onClick={handleWordSynthesisExport}
                            className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-4 transition-all group"
                        >
                            <div className="w-10 h-10 bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-slate-800 dark:text-slate-200">Exporter Synthèse (Word)</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Format compact (.docx)</span>
                            </div>
                        </button>

                        <button
                            onClick={handleWordReportExport}
                            className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-4 transition-all group"
                        >
                            <div className="w-10 h-10 bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-slate-800 dark:text-slate-200">Exporter Rapport (Word)</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Fiches détaillées (.docx)</span>
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
                                    onClick={handleDownloadCSV}
                                    className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-slate-100"
                                >
                                    <span>Format CSV (Toutes études)</span>
                                    <Download className="w-4 h-4 text-slate-400" />
                                </button>
                                <button
                                    onClick={handleDownloadJSON}
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
