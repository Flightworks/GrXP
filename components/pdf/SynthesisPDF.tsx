import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { RiskEntry, StudyContext, Gravity, Occurrence } from '../../types';
import { calculateRiskLevel } from '../../constants';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 20,
        fontFamily: 'Helvetica',
    },
    topSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        alignItems: 'flex-start',
    },
    matrixWrapper: {
        width: '48%',
    },
    contextCard: {
        width: '48%',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 6,
        padding: 12,
        backgroundColor: '#f8fafc',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: 'extrabold',
        textTransform: 'uppercase',
        color: '#0f172a',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        paddingBottom: 4,
    },
    contextLabel: {
        fontSize: 8,
        color: '#64748b',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    contextValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 2,
    },
    conclusionTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#0f172a',
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 4,
    },
    conclusionText: {
        fontSize: 8,
        color: '#334155',
        lineHeight: 1.3,
        marginTop: 2,
    },
    cardsSectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 2,
    },
    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4,
        padding: 8,
        marginBottom: 10,
        backgroundColor: '#ffffff',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#0f172a',
        width: '75%',
        lineHeight: 1.2,
    },
    levelBadge: {
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 3,
        fontSize: 7,
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'white'
    },
    cardLabel: {
        fontSize: 7,
        color: '#64748b',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginTop: 4,
    },
    cardContent: {
        fontSize: 8,
        color: '#334155',
        lineHeight: 1.3,
        marginTop: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 8,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 5,
    },
    pageNumber: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        fontSize: 8,
        color: '#94a3b8',
    },
    // Matrix styles - adjusted for compact layout
    matrixSection: {
        alignItems: 'center',
    },
    matrixContainer: {
        flexDirection: 'row',
        marginBottom: 8,
        justifyContent: 'center',
    },
    matrixYAxis: {
        width: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 2,
    },
    matrixYLabel: {
        transform: 'rotate(-90)',
        fontSize: 7,
        color: '#94a3b8',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        width: 50,
        textAlign: 'center',
    },
    matrixGrid: {
        flexDirection: 'column',
    },
    matrixXHeaderRow: {
        flexDirection: 'row',
        marginLeft: 12,
        marginBottom: 2,
    },
    matrixXLabel: {
        width: 30,
        textAlign: 'center',
        fontSize: 7,
        color: '#94a3b8',
        fontWeight: 'bold',
        marginRight: 2,
    },
    matrixRow: {
        flexDirection: 'row',
        marginBottom: 2,
        alignItems: 'center',
    },
    matrixRowLabel: {
        width: 12,
        fontSize: 7,
        color: '#94a3b8',
        fontWeight: 'bold',
        textAlign: 'right',
        paddingRight: 2,
    },
    matrixCell: {
        width: 30,
        height: 30,
        borderRadius: 3,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 2,
    },
    matrixCellText: {
        fontSize: 9,
        fontWeight: 'heavy',
        color: '#ffffff',
    },
    matrixCellTextDark: {
        fontSize: 9,
        fontWeight: 'heavy',
        color: '#0f172a',
    },
    matrixXFooter: {
        marginTop: 2,
        marginLeft: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: 128,
    },
    matrixXFooterLabel: {
        fontSize: 7,
        color: '#94a3b8',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: 4,
    },
    legendItem: {
        flexDirection: 'column',
        alignItems: 'center',
        marginHorizontal: 4,
        marginBottom: 4,
    },
    legendColorBar: {
        width: 25,
        height: 3,
        borderRadius: 2,
        marginBottom: 2,
    },
    legendLabel: {
        fontSize: 6,
        color: '#94a3b8',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    }
});

const getLevelColor = (level: string) => {
    switch (level) {
        case 'Inacceptable': return '#ef4444';
        case 'Fort': return '#f97316';
        case 'Faible': return '#facc15';
        case 'Usuel': return '#22c55e';
        default: return '#94a3b8';
    }
};

const getTextColorForBg = (level: string) => {
    if (level === 'Faible') return '#0f172a';
    return '#ffffff';
};

interface SynthesisPDFProps {
    risks: RiskEntry[];
    context: StudyContext;
}

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

export const SynthesisPDF: React.FC<SynthesisPDFProps> = ({ risks, context }) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>

                <View style={styles.topSection}>
                    <View style={styles.matrixWrapper}>
                        <VisualMatrix risks={risks} />
                    </View>

                    <View style={styles.contextCard}>
                        <Text style={styles.title}>Synthèse</Text>

                        <Text style={styles.contextLabel}>Étude</Text>
                        <Text style={styles.contextValue}>{context.studyName}</Text>

                        <Text style={styles.contextLabel}>Expérimentation</Text>
                        <Text style={styles.contextValue}>{context.experimentation}</Text>

                        <Text style={styles.contextLabel}>Aéronef</Text>
                        <Text style={styles.contextValue}>{context.aircraft}</Text>

                        {context.globalSynthesis && (
                            <View>
                                <Text style={styles.conclusionTitle}>Conclusion Globale</Text>
                                <Text style={styles.conclusionText}>{context.globalSynthesis}</Text>
                            </View>
                        )}
                    </View>
                </View>

                <Text style={styles.cardsSectionTitle}>Détail des Risques Résiduels</Text>

                <View style={styles.cardsContainer}>
                    {risks.map((risk, index) => {
                        const resLevel = risk.residualRisk.computedLevel;
                        const levelColor = getLevelColor(resLevel);
                        const textColor = getTextColorForBg(resLevel);

                        return (
                            <View key={risk.id} style={styles.card} wrap={false}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardTitle}>{index + 1}. {risk.activityTitle || "Sans titre"}</Text>
                                    <Text style={[styles.levelBadge, { backgroundColor: levelColor, color: textColor }]}>
                                        {resLevel}
                                    </Text>
                                </View>

                                <Text style={styles.cardLabel}>Événement Redouté</Text>
                                <Text style={styles.cardContent}>{risk.dreadedEvent || "-"}</Text>

                                <Text style={styles.cardLabel}>Mesures d'Atténuation</Text>
                                <Text style={styles.cardContent}>{risk.mitigationMeasures || "-"}</Text>
                            </View>
                        );
                    })}
                </View>

                <Text style={styles.footer} fixed>
                    Généré par GrXP - {new Date().toLocaleDateString()}
                </Text>
                <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
                    `${pageNumber} / ${totalPages}`
                )} fixed />

            </Page>
        </Document>
    );
};
