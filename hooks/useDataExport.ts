import React, { useState } from 'react';
import { RiskEntry, StudyContext } from '../types';
import { getRisks, importRisksFromCSV, importRisksFromJSON, exportRisksToCSV, exportRisksToJSON } from '../services/storage';
import { generateCompactSynthesisWord, generateFullReportWord, downloadDocxBlob } from '../services/wordExport';

export const useDataExport = (context: StudyContext, initialRisks: RiskEntry[]) => {
    const [risks, setRisks] = useState<RiskEntry[]>(initialRisks);
    const [previewType, setPreviewType] = useState<'synth' | 'full' | 'word' | null>(null);

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
            text += `| Risque | Niveau | G | O | Mesures de Mitigation |\n`;
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

    const handleWordSynthesisExport = async () => {
        try {
            const blob = await generateCompactSynthesisWord(context, risks);
            let safeName = (context.studyName || 'Etude').trim().replace(/[^a-z0-9\-_]/gi, '_').replace(/_+/g, '_');
            if (!safeName) safeName = 'Etude_Sans_Nom';

            downloadDocxBlob(blob, `Synthese_Risques_${safeName}.docx`);
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la génération Word.");
        }
    };

    const handleWordReportExport = async () => {
        try {
            const blob = await generateFullReportWord(context, risks);
            let safeName = (context.studyName || 'Etude').trim().replace(/[^a-z0-9\-_]/gi, '_').replace(/_+/g, '_');
            if (!safeName) safeName = 'Etude_Sans_Nom';

            downloadDocxBlob(blob, `Rapport_Complet_${safeName}.docx`);
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la génération Word.");
        }
    };

    const handleDownloadCSV = () => downloadFile(exportRisksToCSV(), 'risks', 'csv', 'text/csv');
    const handleDownloadJSON = () => downloadFile(exportRisksToJSON(), 'backup_grxp', 'json', 'application/json');

    return {
        risks,
        previewType,
        setPreviewType,
        handleFileUpload,
        handleCopySynthesis,
        handleWordSynthesisExport,
        handleWordReportExport,
        handleDownloadCSV,
        handleDownloadJSON
    };
};
