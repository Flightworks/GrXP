import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    BorderStyle,
    WidthType,
    AlignmentType,
    HeadingLevel,
    VerticalAlign,
    ShadingType,
} from "docx";
import { RiskEntry, StudyContext, RiskLevel } from '../types';

// Modern compact styling constants
const subtleBorder = { style: BorderStyle.SINGLE, size: 2, color: "E5E7EB" };
const strongBorder = { style: BorderStyle.SINGLE, size: 8, color: "9CA3AF" };
const borderNone = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; hex: string }> = {
    [RiskLevel.Inacceptable]: { bg: 'FEE2E2', text: 'B91C1C', hex: '#B91C1C' }, // Muted background, strong text
    [RiskLevel.Fort]: { bg: 'FFEDD5', text: 'C2410C', hex: '#C2410C' },
    [RiskLevel.Faible]: { bg: 'FEF9C3', text: 'A16207', hex: '#A16207' },
    [RiskLevel.Usuel]: { bg: 'DCFCE7', text: '15803D', hex: '#15803D' },
};

const DEFAULT_COLOR = { bg: 'F3F4F6', text: '374151', hex: '#374151' };
const getRiskStyle = (level: RiskLevel) => RISK_COLORS[level] || DEFAULT_COLOR;
const formatDate = (dateString: string) => dateString ? dateString : new Date().toLocaleDateString('fr-FR');

const calculateComputedLevel = (g: number, o: string): RiskLevel => {
    if (g === 1) {
        if (o === 'A' || o === 'B' || o === 'C') return RiskLevel.Usuel;
        return RiskLevel.Faible;
    }
    if (g === 2) {
        if (o === 'A' || o === 'B') return RiskLevel.Faible;
        return RiskLevel.Fort;
    }
    if (g === 3) {
        if (o === 'A') return RiskLevel.Faible;
        if (o === 'B') return RiskLevel.Fort;
        return RiskLevel.Inacceptable;
    }
    if (g === 4) {
        if (o === 'A') return RiskLevel.Fort;
        return RiskLevel.Inacceptable;
    }
    return RiskLevel.Faible;
};

// --- Design Definitions ---
const docStyles = {
    default: {
        document: {
            run: {
                font: "Arial",
                size: 20, // 10pt for denser text
                color: "1F2937", // Slate 800
            },
            paragraph: {
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: 240 }, // 1.0 line spacing
            }
        },
    },
    paragraphStyles: [
        {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
                size: 36, // 18pt
                bold: true,
                color: "111827",
            },
            paragraph: {
                alignment: AlignmentType.LEFT,
                spacing: { before: 200, after: 200 },
                border: {
                    bottom: strongBorder,
                }
            },
        },
        {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
                size: 28, // 14pt
                bold: true,
            },
            paragraph: {
                spacing: { before: 360, after: 120 },
            },
        },
        {
            id: "Heading3",
            name: "Heading 3",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
                size: 24, // 12pt
                bold: true,
                italics: true,
            },
            paragraph: {
                spacing: { before: 240, after: 120 },
            },
        },
        {
            id: "MatrixLabel",
            name: "Matrix Label",
            basedOn: "Normal",
            run: {
                size: 20, // 10pt
                bold: true,
            },
        }
    ]
};

const docMargins = {
    top: 1440, // 2.54 cm
    right: 1440,
    bottom: 1440,
    left: 1440,
};

// --- Shared Components ---

const createContextBlock = (context: StudyContext): (Paragraph | Table)[] => {
    return [
        new Paragraph({
            text: (context.studyName || "RAPPORT DES RISQUES").toUpperCase(),
            heading: HeadingLevel.HEADING_1,
        }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: borderNone, bottom: borderNone, left: borderNone, right: borderNone,
                insideVertical: borderNone, insideHorizontal: borderNone,
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 33, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({ children: [new TextRun({ text: "Aéronef : ", bold: true, color: "6B7280" }), new TextRun({ text: context.aircraft || "Non défini", bold: true })] })
                            ]
                        }),
                        new TableCell({
                            width: { size: 33, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({ children: [new TextRun({ text: "Expérimentation : ", bold: true, color: "6B7280" }), new TextRun({ text: context.experimentation || "Non définie", bold: true })] })
                            ]
                        }),
                        new TableCell({
                            width: { size: 34, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Date : ", bold: true, color: "6B7280" }), new TextRun({ text: formatDate(context.date), bold: true })] })
                            ]
                        })
                    ]
                })
            ]
        }),
        new Paragraph({ spacing: { after: 240 } }) // Spacing after context block
    ];
};

const createSynthesisMatrix = (risks: RiskEntry[], specificRisk?: RiskEntry): Table => {
    const rows = [4, 3, 2, 1];
    const cols = ['A', 'B', 'C', 'D'];
    const cellWidth = { size: 15, type: WidthType.PERCENTAGE };

    const tableRows: TableRow[] = [];

    // Header row
    tableRows.push(new TableRow({
        tableHeader: true,
        children: [
            new TableCell({
                rowSpan: 4,
                verticalAlign: VerticalAlign.CENTER,
                borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone },
                children: [new Paragraph({ text: "GRAVITÉ", alignment: AlignmentType.CENTER, style: "MatrixLabel" })]
            }),
            new TableCell({ borders: { top: borderNone, bottom: subtleBorder, left: borderNone, right: borderNone }, children: [] }),
            ...cols.map(c => new TableCell({
                width: cellWidth,
                shading: { type: ShadingType.CLEAR, fill: "F3F4F6" }, // Light gray header
                borders: { top: borderNone, bottom: subtleBorder, left: borderNone, right: borderNone },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ text: c, alignment: AlignmentType.CENTER, style: "MatrixLabel" })]
            }))
        ]
    }));

    // Data rows
    rows.forEach((r, idx) => {
        const isLastRow = idx === rows.length - 1;
        const cellBottomBorder = isLastRow ? borderNone : subtleBorder;

        tableRows.push(new TableRow({
            children: [
                new TableCell({
                    borders: { top: borderNone, bottom: cellBottomBorder, left: borderNone, right: borderNone },
                    shading: { type: ShadingType.CLEAR, fill: "F3F4F6" }, // Light gray header
                    verticalAlign: VerticalAlign.CENTER,
                    children: [new Paragraph({ text: r.toString(), alignment: AlignmentType.RIGHT, style: "MatrixLabel", spacing: { before: 60, after: 60 } })]
                }),
                ...cols.map(c => {
                    const level = calculateComputedLevel(r, c);
                    const style = getRiskStyle(level);

                    let content = "";
                    let fill = style.bg;
                    let color = style.text;
                    let hasValue = false;

                    if (specificRisk) {
                        const isInit = specificRisk.initialRisk.gravity === r && specificRisk.initialRisk.occurrence === c;
                        const isRes = specificRisk.residualRisk.gravity === r && specificRisk.residualRisk.occurrence === c;
                        if (isInit && isRes) { content = 'I / R'; hasValue = true; }
                        else if (isInit) { content = 'I'; hasValue = true; }
                        else if (isRes) { content = 'R'; hasValue = true; }
                    } else {
                        const count = risks.filter(risk => risk.residualRisk.gravity === r && risk.residualRisk.occurrence === c).length;
                        if (count > 0) {
                            content = count.toString();
                            hasValue = true;
                        }
                    }

                    if (!hasValue) {
                        color = style.bg; // fade out text
                        fill = "FFFFFF"; // clear background to make it look academic
                    }

                    return new TableCell({
                        width: cellWidth,
                        shading: { type: ShadingType.CLEAR, fill: fill },
                        borders: { top: subtleBorder, bottom: subtleBorder, left: subtleBorder, right: subtleBorder },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 100, bottom: 100 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: content, bold: true, color: color, size: 24 })]
                            })
                        ]
                    });
                })
            ]
        }));
    });

    // Footer row containing OCCURRENCE label below the table
    // It's cleaner to return the label as a following paragraph in Word, but we can do it inside to keep alignment.
    tableRows.push(new TableRow({
        children: [
            new TableCell({ borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone }, children: [] }),
            new TableCell({ borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone }, children: [] }),
            new TableCell({
                columnSpan: 4,
                borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone },
                children: [new Paragraph({ text: "OCCURRENCE", alignment: AlignmentType.CENTER, style: "MatrixLabel", spacing: { before: 60 } })]
            })
        ]
    }));

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone, insideHorizontal: borderNone, insideVertical: borderNone },
        rows: tableRows
    });
};

const createGlobalSynthesisBlock = (context: StudyContext, risks: RiskEntry[]): (Table | Paragraph)[] => {
    return [
        new Paragraph({ text: "1. Synthèse Globale", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [new TextRun({ text: "1.1 Matrice de Synthèse", bold: true })], spacing: { after: 120 } }),
        createSynthesisMatrix(risks),
        new Paragraph({ children: [new TextRun({ text: "1.2 Conclusion Globale", bold: true })], spacing: { before: 240, after: 120 } }),
        ...((context.globalSynthesis || "Aucune conclusion renseignée.").split('\n').map(l => new Paragraph({ text: l })))
    ];
};

// --- Compact Synthesis Specifics ---

const createCompactRiskTable = (risks: RiskEntry[]): Table => {
    // Header Row
    const headerCellProps = {
        shading: { type: ShadingType.CLEAR, fill: "F9FAFB" },
        borders: { top: strongBorder, bottom: subtleBorder, left: borderNone, right: borderNone },
        margins: { top: 60, bottom: 60 }
    };

    const rows: TableRow[] = [
        new TableRow({
            tableHeader: true,
            children: [
                new TableCell({ ...headerCellProps, children: [new Paragraph({ children: [new TextRun({ text: "N°", bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
                new TableCell({ ...headerCellProps, children: [new Paragraph({ children: [new TextRun({ text: "Risque", bold: true, size: 18 })] })] }),
                new TableCell({ ...headerCellProps, children: [new Paragraph({ children: [new TextRun({ text: "G", bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
                new TableCell({ ...headerCellProps, children: [new Paragraph({ children: [new TextRun({ text: "O", bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
                new TableCell({ ...headerCellProps, children: [new Paragraph({ children: [new TextRun({ text: "Niveau", bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
                new TableCell({ ...headerCellProps, children: [new Paragraph({ children: [new TextRun({ text: "Mesures d'Atténuation", bold: true, size: 18 })] })] }),
            ]
        })
    ];

    risks.forEach((risk, index) => {
        const level = risk.residualRisk.computedLevel;
        const style = getRiskStyle(level);
        const isLastRow = index === risks.length - 1;
        const cellBottomBorder = isLastRow ? strongBorder : subtleBorder;

        const cellProps = {
            borders: { top: borderNone, bottom: cellBottomBorder, left: borderNone, right: borderNone },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 80, bottom: 80 },
        };

        const activityLines = (risk.activityTitle || 'Sans titre').split('\n');
        const mitigationLines = (risk.mitigationMeasures || 'Aucune mesure').split('\n');

        rows.push(new TableRow({
            children: [
                new TableCell({
                    ...cellProps,
                    children: [new Paragraph({ children: [new TextRun({ text: (index + 1).toString(), size: 18 })], alignment: AlignmentType.CENTER })]
                }),
                new TableCell({
                    ...cellProps,
                    children: activityLines.map(l => new Paragraph({ children: [new TextRun({ text: l, size: 18 })], spacing: { after: 40 } }))
                }),
                new TableCell({
                    ...cellProps,
                    children: [new Paragraph({ children: [new TextRun({ text: risk.residualRisk.gravity.toString(), size: 18 })], alignment: AlignmentType.CENTER })]
                }),
                new TableCell({
                    ...cellProps,
                    children: [new Paragraph({ children: [new TextRun({ text: risk.residualRisk.occurrence.toString(), size: 18 })], alignment: AlignmentType.CENTER })]
                }),
                new TableCell({
                    ...cellProps,
                    children: [new Paragraph({ children: [new TextRun({ text: level, bold: true, color: style.text, size: 18 })], alignment: AlignmentType.CENTER })]
                }),
                new TableCell({
                    ...cellProps,
                    children: mitigationLines.map(l => new Paragraph({ children: [new TextRun({ text: l, size: 18 })], spacing: { after: 40 } }))
                }),
            ]
        }));
    });

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone, insideHorizontal: borderNone, insideVertical: borderNone },
        rows: rows
    });
}

export const generateCompactSynthesisWord = async (context: StudyContext, risks: RiskEntry[]): Promise<Blob> => {
    const doc = new Document({
        styles: docStyles,
        sections: [
            {
                properties: { page: { margin: docMargins } },
                children: [
                    ...createContextBlock(context),
                    ...createGlobalSynthesisBlock(context, risks),
                    new Paragraph({ text: "2. Liste des Risques Résiduels", heading: HeadingLevel.HEADING_2 }),
                    createCompactRiskTable(risks)
                ]
            }
        ]
    });
    return await Packer.toBlob(doc);
};

// --- Full Report Specifics ---

const createRiskSummaryList = (risks: RiskEntry[]): Paragraph[] => {
    return [
        new Paragraph({ text: "2. Sommaire des Risques", heading: HeadingLevel.HEADING_2 }),
        ...risks.map((r, i) => new Paragraph({
            spacing: { before: 80 },
            children: [
                new TextRun({ text: `${i + 1}. `, bold: true }),
                new TextRun({ text: r.activityTitle || "Sans titre" }),
                new TextRun({ text: ` [${r.residualRisk.computedLevel}]`, bold: true, color: getRiskStyle(r.residualRisk.computedLevel).hex.replace('#', '') })
            ]
        })),
        new Paragraph({ spacing: { before: 360 }, children: [new TextRun({ text: "Détails et transitions sur les pages suivantes.", italics: true })] })
    ];
};

const createRiskDetailedSections = (risks: RiskEntry[]): (Paragraph | Table)[] => {
    const elements: (Paragraph | Table)[] = [];

    // Add the section heading at the start of the risk pages
    if (risks.length > 0) {
        elements.push(new Paragraph({ text: "3. Fiches Détaillées", heading: HeadingLevel.HEADING_2, pageBreakBefore: true }));
    }

    risks.forEach((risk, idx) => {
        const dreadedEventLines = (risk.dreadedEvent || "Non renseigné").split('\n');
        const mitigationLines = (risk.mitigationMeasures || "Aucune mesure définie").split('\n');
        const synthesisLines = (risk.synthesis || "Non renseignée").split('\n');

        // Activity title (H3) with a page break if it's not the very first risk (since H2 has one)
        elements.push(new Paragraph({
            text: `3.${idx + 1} ${risk.activityTitle || 'Sans titre'}`,
            heading: HeadingLevel.HEADING_3,
            pageBreakBefore: idx > 0 // Separate each risk
        }));

        // Dreaded Event
        elements.push(new Paragraph({ children: [new TextRun({ text: "Événement Redouté", smallCaps: true, bold: true })] }));
        dreadedEventLines.forEach(line => {
            elements.push(new Paragraph({ text: line, spacing: { before: 60, after: 120 } }));
        });

        // Mitigation
        elements.push(new Paragraph({ children: [new TextRun({ text: "Mesures d'Atténuation", smallCaps: true, bold: true })], spacing: { before: 120 } }));
        mitigationLines.forEach(line => {
            elements.push(new Paragraph({ text: line, spacing: { before: 60, after: 120 } }));
        });

        // Synthesis
        elements.push(new Paragraph({ children: [new TextRun({ text: "Synthèse", smallCaps: true, bold: true })], spacing: { before: 120 } }));
        synthesisLines.forEach(line => {
            elements.push(new Paragraph({ text: line, spacing: { before: 60, after: 120 } }));
        });

        // Exposition et Détectabilité
        elements.push(new Paragraph({ children: [new TextRun({ text: "Exposition et Détectabilité", smallCaps: true, bold: true })], spacing: { before: 120 } }));
        elements.push(new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [
                new TextRun({ text: "Initial : ", bold: true }),
                new TextRun({ text: `Exposition: ${risk.initialRisk.exposition ?? 'N/A'}, Détectabilité: ${risk.initialRisk.detectability ?? 'N/A'}` })
            ]
        }));
        elements.push(new Paragraph({
            spacing: { after: 120 },
            children: [
                new TextRun({ text: "Résiduel : ", bold: true }),
                new TextRun({ text: `Exposition: ${risk.residualRisk.exposition ?? 'N/A'}, Détectabilité: ${risk.residualRisk.detectability ?? 'N/A'}` })
            ]
        }));

        // Transition Matrix
        elements.push(new Paragraph({ children: [new TextRun({ text: "Matrice de Transition", smallCaps: true, bold: true })], spacing: { before: 240, after: 120 } }));

        // Put the matrix in a table cell to align it nicely or constrain its width if needed.
        // We will just print the matrix. It automatically adapts to width.
        elements.push(createSynthesisMatrix([], risk));
    });

    return elements;
}

export const generateFullReportWord = async (context: StudyContext, risks: RiskEntry[]): Promise<Blob> => {
    const doc = new Document({
        styles: docStyles,
        sections: [
            {
                properties: { page: { margin: docMargins } },
                children: [
                    ...createContextBlock(context),
                    ...createGlobalSynthesisBlock(context, risks),
                    ...createRiskSummaryList(risks),
                    ...createRiskDetailedSections(risks)
                ]
            }
        ]
    });
    return await Packer.toBlob(doc);
};

export const downloadDocxBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
