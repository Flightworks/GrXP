import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { RiskEntry, StudyContext } from '../../types';

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
    table: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginTop: 10,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        alignItems: 'center',
        minHeight: 30,
    },
    tableHeader: {
        backgroundColor: '#f8fafc',
        fontWeight: 'bold',
    },
    colActivity: { width: '40%', padding: 5, fontSize: 9 },
    colEvent: { width: '35%', padding: 5, fontSize: 9 },
    colLevel: { width: '25%', padding: 5, fontSize: 9, textAlign: 'center' },

    levelBadge: {
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 2,
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center',
        alignSelf: 'center',
        color: 'white'
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

export const SynthesisPDF: React.FC<SynthesisPDFProps> = ({ risks, context }) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>

                <View style={styles.header}>
                    <Text style={styles.title}>Synthèse des Risques</Text>
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
                    <View style={{ marginBottom: 15 }}>
                        <Text style={styles.sectionTitle}>Conclusion Globale</Text>
                        <Text style={{ fontSize: 10, color: '#334155', lineHeight: 1.4 }}>{context.globalSynthesis}</Text>
                    </View>
                )}

                <Text style={styles.sectionTitle}>Liste des Risques</Text>

                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]} wrap={false}>
                        <Text style={styles.colActivity}>Activité / Titre</Text>
                        <Text style={styles.colEvent}>Événement Redouté</Text>
                        <Text style={styles.colLevel}>Niveau Résiduel</Text>
                    </View>

                    {risks.map((risk, index) => {
                        const resLevel = risk.residualRisk.computedLevel;
                        const levelColor = getLevelColor(resLevel);
                        const textColor = getTextColorForBg(resLevel);

                        return (
                            <View key={risk.id} style={styles.tableRow} wrap={false}>
                                <Text style={styles.colActivity}>{index + 1}. {risk.activityTitle || "Sans titre"}</Text>
                                <Text style={styles.colEvent}>{risk.dreadedEvent || "-"}</Text>
                                <View style={styles.colLevel}>
                                    <Text style={[styles.levelBadge, { backgroundColor: levelColor, color: textColor }]}>
                                        {resLevel}
                                    </Text>
                                </View>
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
