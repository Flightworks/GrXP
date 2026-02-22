import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { RiskEntry, StudyContext, Gravity, Occurrence, Exposition, Detectability } from '../../types';
import { GRAVITY_OPTIONS, OCCURRENCE_OPTIONS, EXPOSITION_OPTIONS, DETECTABILITY_OPTIONS, calculateRiskLevel } from '../../constants';

// Optional: Register custom fonts if needed
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#0f172a',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'extrabold',
        textTransform: 'uppercase',
        color: '#0f172a',
        marginBottom: 10,
    },
    contextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    contextLabel: {
        fontSize: 10,
        color: '#64748b',
    },
    contextValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
        color: '#1e293b',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 5,
    },
    riskCard: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 5,
        padding: 15,
        marginBottom: 15,
        backgroundColor: '#f8fafc',
    },
    riskHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    riskTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
        width: '70%',
    },
    riskLevelBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    label: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 2,
        marginTop: 8,
    },
    value: {
        fontSize: 10,
        color: '#334155',
        lineHeight: 1.4,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 8,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
    },
    pageNumber: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        fontSize: 8,
        color: '#94a3b8',
    },
    mitigationContainer: {
        backgroundColor: '#f0f9ff',
        borderWidth: 1,
        borderColor: '#bae6fd',
        borderLeftWidth: 4,
        borderLeftColor: '#0ea5e9',
        borderRadius: 6,
        padding: 12,
        marginTop: 15,
        marginBottom: 15,
    },
    mitigationLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0369a1',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    mitigationValue: {
        fontSize: 11,
        color: '#0f172a',
        lineHeight: 1.5,
    },
    // Matrix styles
    matrixSection: {
        alignItems: 'center',
        marginVertical: 15,
    },
    matrixContainer: {
        flexDirection: 'row',
        marginBottom: 10,
        justifyContent: 'center',
    },
    matrixYAxis: {
        width: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 5,
    },
    matrixYLabel: {
        transform: 'rotate(-90)',
        fontSize: 8,
        color: '#94a3b8',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        width: 60,
        textAlign: 'center',
    },
    matrixGrid: {
        flexDirection: 'column',
    },
    matrixXHeaderRow: {
        flexDirection: 'row',
        marginLeft: 15,
        marginBottom: 4,
    },
    matrixXLabel: {
        width: 35,
        textAlign: 'center',
        fontSize: 8,
        color: '#94a3b8',
        fontWeight: 'bold',
        marginRight: 4,
    },
    matrixRow: {
        flexDirection: 'row',
        marginBottom: 4,
        alignItems: 'center',
    },
    matrixRowLabel: {
        width: 15,
        fontSize: 8,
        color: '#94a3b8',
        fontWeight: 'bold',
        textAlign: 'right',
        paddingRight: 4,
    },
    matrixCell: {
        width: 35,
        height: 35,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    matrixCellText: {
        fontSize: 10,
        fontWeight: 'heavy',
        color: '#ffffff',
    },
    matrixCellTextDark: {
        fontSize: 10,
        fontWeight: 'heavy',
        color: '#0f172a',
    },
    matrixXFooter: {
        marginTop: 4,
        marginLeft: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: 152,
    },
    matrixXFooterLabel: {
        fontSize: 8,
        color: '#94a3b8',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 5,
        marginBottom: 10,
    },
    legendItem: {
        flexDirection: 'column',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    legendColorBar: {
        width: 30,
        height: 4,
        borderRadius: 2,
        marginBottom: 3,
    },
    legendLabel: {
        fontSize: 7,
        color: '#94a3b8',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    }
});

const getLevelColor = (level: string) => {
    switch (level) {
        case 'Inacceptable': return '#ef4444'; // Red
        case 'Fort': return '#f97316'; // Orange
        case 'Faible': return '#facc15'; // Yellow
        case 'Usuel': return '#22c55e'; // Green
        default: return '#94a3b8'; // Slate
    }
};

const getTextColorForBg = (level: string) => {
    if (level === 'Faible') return '#0f172a'; // Dark text on yellow
    return '#ffffff'; // White text on other colors
};

interface ReportPDFProps {
    risks: RiskEntry[];
    context: StudyContext;
}


const getGravityLabel = (val: Gravity) => GRAVITY_OPTIONS.find(o => o.value === val)?.label || val;
const getOccurrenceLabel = (val: Occurrence) => OCCURRENCE_OPTIONS.find(o => o.value === val)?.label || val;
const getExpositionLabel = (val: Exposition) => EXPOSITION_OPTIONS.find(o => o.value === val)?.label || val;
const getDetectabilityLabel = (val: Detectability) => DETECTABILITY_OPTIONS.find(o => o.value === val)?.label || val;

const VisualMatrix: React.FC<{ risks: RiskEntry[] }> = ({ risks }) => {
    const rows = [4, 3, 2, 1] as Gravity[];
    const cols = ['A', 'B', 'C', 'D'] as Occurrence[];

    const getRisksInCell = (g: Gravity, o: Occurrence) => {
        return risks.filter(r => r.residualRisk.gravity === g && r.residualRisk.occurrence === o);
    };

    return (
        <View style={styles.matrixSection}>
            <View style={styles.matrixContainer}>
                <View style={styles.matrixYAxis}>
                    <Text style={styles.matrixYLabel}>Gravité</Text>
                </View>

                <View style={styles.matrixGrid}>
                    <View style={styles.matrixXHeaderRow}>
                        {cols.map(c => <Text key={c} style={styles.matrixXLabel}>{c}</Text>)}
                    </View>

                    {rows.map(row => (
                        <View key={row} style={styles.matrixRow}>
                            <Text style={styles.matrixRowLabel}>{row}</Text>
                            {cols.map(col => {
                                const level = calculateRiskLevel(row, col);
                                const cellRisks = getRisksInCell(row, col);
                                const count = cellRisks.length;
                                const bgColor = getLevelColor(level);
                                const opacity = count === 0 ? 0.3 : 1;
                                const textColorStyle = level === 'Faible' ? styles.matrixCellTextDark : styles.matrixCellText;

                                return (
                                    <View key={`${row}-${col}`} style={[styles.matrixCell, { backgroundColor: bgColor, opacity }]}>
                                        {count > 0 && <Text style={textColorStyle}>{count}</Text>}
                                    </View>
                                );
                            })}
                        </View>
                    ))}

                    <View style={styles.matrixXFooter}>
                        <Text style={styles.matrixXFooterLabel}>Occurrence</Text>
                    </View>
                </View>
            </View>

            <View style={styles.legendContainer}>
                {['Usuel', 'Faible', 'Fort', 'Inacceptable'].map(lvl => (
                    <View key={lvl} style={styles.legendItem}>
                        <View style={[styles.legendColorBar, { backgroundColor: getLevelColor(lvl) }]} />
                        <Text style={styles.legendLabel}>{lvl.substring(0, 4)}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const RiskTransitionMatrix: React.FC<{ risk: RiskEntry }> = ({ risk }) => {
    const rows = [4, 3, 2, 1] as Gravity[];
    const cols = ['A', 'B', 'C', 'D'] as Occurrence[];

    const initG = risk.initialRisk.gravity;
    const initO = risk.initialRisk.occurrence;
    const resG = risk.residualRisk.gravity;
    const resO = risk.residualRisk.occurrence;

    return (
        <View style={styles.matrixSection}>
            <View style={styles.matrixContainer}>
                <View style={styles.matrixYAxis}>
                    <Text style={styles.matrixYLabel}>Gravité</Text>
                </View>

                <View style={styles.matrixGrid}>
                    <View style={styles.matrixXHeaderRow}>
                        {cols.map(c => <Text key={c} style={styles.matrixXLabel}>{c}</Text>)}
                    </View>

                    {rows.map(row => (
                        <View key={row} style={styles.matrixRow}>
                            <Text style={styles.matrixRowLabel}>{row}</Text>
                            {cols.map(col => {
                                const level = calculateRiskLevel(row, col);
                                const isInit = initG === row && initO === col;
                                const isRes = resG === row && resO === col;

                                const bgColor = getLevelColor(level);
                                const opacity = (isInit || isRes) ? 1 : 0.2;
                                const textColorStyle = level === 'Faible' ? styles.matrixCellTextDark : styles.matrixCellText;

                                let content = '';
                                if (isInit && isRes) content = 'I / R';
                                else if (isInit) content = 'I';
                                else if (isRes) content = 'R';

                                return (
                                    <View key={`${row}-${col}`} style={[styles.matrixCell, { backgroundColor: bgColor, opacity }]}>
                                        {content ? <Text style={textColorStyle}>{content}</Text> : null}
                                    </View>
                                );
                            })}
                        </View>
                    ))}

                    <View style={styles.matrixXFooter}>
                        <Text style={styles.matrixXFooterLabel}>Occurrence</Text>
                    </View>
                </View>
            </View>

            <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                    <Text style={styles.legendLabel}>I = Risque Initial</Text>
                </View>
                <View style={styles.legendItem}>
                    <Text style={styles.legendLabel}>R = Risque Résiduel</Text>
                </View>
            </View>
        </View>
    );
};

export const ReportPDF: React.FC<ReportPDFProps> = ({ risks, context }) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.title}>Rapport Complet des Risques</Text>
                    <View style={styles.contextRow}>
                        <Text style={styles.contextLabel}>Étude: <Text style={styles.contextValue}>{context.studyName}</Text></Text>
                        <Text style={styles.contextLabel}>Expérimentation: <Text style={styles.contextValue}>{context.experimentation}</Text></Text>
                    </View>
                    <View style={styles.contextRow}>
                        <Text style={styles.contextLabel}>Aéronef: <Text style={styles.contextValue}>{context.aircraft}</Text></Text>
                        <Text style={styles.contextLabel}>Date: <Text style={styles.contextValue}>{new Date().toLocaleDateString()}</Text></Text>
                    </View>
                </View>

                {context.globalSynthesis && (
                    <View style={{ marginBottom: 20 }}>
                        <Text style={styles.sectionTitle}>Conclusion Globale</Text>
                        <Text style={styles.value}>{context.globalSynthesis}</Text>
                    </View>
                )}

                <VisualMatrix risks={risks} />

                <Text style={{ textAlign: 'center', color: '#64748b', fontSize: 10, marginTop: 30 }}>
                    Les pages suivantes détaillent individuellement chaque risque de l'étude.
                </Text>

                <Text style={styles.footer} fixed>
                    Généré par GrXP - {new Date().toLocaleDateString()}
                </Text>
                <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
                    `${pageNumber} / ${totalPages}`
                )} fixed />
            </Page>

            {risks.map((risk, index) => {
                const resLevel = risk.residualRisk.computedLevel;
                const levelColor = getLevelColor(resLevel);
                const textColor = getTextColorForBg(resLevel);

                return (
                    <Page key={risk.id} size="A4" style={styles.page}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Fiche Risque : {index + 1} / {risks.length}</Text>
                            <View style={styles.contextRow}>
                                <Text style={styles.contextLabel}>Activité: <Text style={styles.contextValue}>{risk.activityTitle}</Text></Text>
                            </View>
                        </View>

                        <View style={styles.riskCard}>
                            <View style={styles.riskHeaderRow}>
                                <Text style={styles.riskTitle}>{risk.activityTitle}</Text>
                                <Text style={[styles.riskLevelBadge, { backgroundColor: levelColor, color: textColor }]}>
                                    {resLevel}
                                </Text>
                            </View>

                            <Text style={styles.label}>Événement Redouté</Text>
                            <Text style={styles.value}>{risk.dreadedEvent || "Non renseigné"}</Text>

                            <View style={styles.mitigationContainer}>
                                <Text style={styles.mitigationLabel}>Mesures d'Atténuation</Text>
                                <Text style={styles.mitigationValue}>{risk.mitigationMeasures || "Non renseignées"}</Text>
                            </View>

                            <View style={{ flexDirection: 'row', marginTop: 15 }}>
                                <View style={{ flex: 1, paddingRight: 10 }}>
                                    <Text style={styles.label}>Évaluation Initiale</Text>
                                    <Text style={styles.value}>Gravité: {getGravityLabel(risk.initialRisk.gravity)}</Text>
                                    <Text style={styles.value}>Occurrence: {getOccurrenceLabel(risk.initialRisk.occurrence)}</Text>
                                    <Text style={{ ...styles.value, marginTop: 4 }}>Exposition: {getExpositionLabel(risk.initialRisk.exposition)}</Text>
                                    <Text style={styles.value}>Détect: {getDetectabilityLabel(risk.initialRisk.detectability)}</Text>
                                </View>
                                <View style={{ flex: 1, paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' }}>
                                    <Text style={styles.label}>Évaluation Résiduelle</Text>
                                    <Text style={styles.value}>Gravité: {getGravityLabel(risk.residualRisk.gravity)}</Text>
                                    <Text style={styles.value}>Occurrence: {getOccurrenceLabel(risk.residualRisk.occurrence)}</Text>
                                    <Text style={{ ...styles.value, marginTop: 4 }}>Exposition: {getExpositionLabel(risk.residualRisk.exposition)}</Text>
                                    <Text style={styles.value}>Détect: {getDetectabilityLabel(risk.residualRisk.detectability)}</Text>
                                </View>
                            </View>

                            {risk.synthesis && (
                                <View style={{ marginTop: 15 }}>
                                    <Text style={styles.label}>Synthèse du risque</Text>
                                    <Text style={styles.value}>{risk.synthesis}</Text>
                                </View>
                            )}
                        </View>
                        <RiskTransitionMatrix risk={risk} />
                        <Text style={styles.footer} fixed>
                            Généré par GrXP - {new Date().toLocaleDateString()}
                        </Text>
                        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
                            `${pageNumber} / ${totalPages}`
                        )} fixed />
                    </Page>
                );
            })}
        </Document>
    );
};
