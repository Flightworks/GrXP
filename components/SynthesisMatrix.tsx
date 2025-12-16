import React, { useState } from 'react';
import { RiskEntry, Gravity, Occurrence } from '../types';
import { calculateRiskLevel, getRiskTheme } from '../constants';
import { ArrowRight, ShieldCheck, Activity, Edit3 } from 'lucide-react';

interface SynthesisMatrixProps {
    risks: RiskEntry[];
    onRiskClick?: (id: string) => void;
}

const SynthesisMatrix: React.FC<SynthesisMatrixProps> = ({ risks, onRiskClick }) => {
    const [hoveredCell, setHoveredCell] = useState<{ g: Gravity, o: Occurrence } | null>(null);

    const rows = [4, 3, 2, 1] as Gravity[];
    const cols = ['A', 'B', 'C', 'D'] as Occurrence[];

    // Optimize grouping with useMemo
    const risksByCell = React.useMemo(() => {
        const map = new Map<string, RiskEntry[]>();
        risks.forEach(r => {
            const key = `${r.residualRisk.gravity}-${r.residualRisk.occurrence}`;
            const existing = map.get(key) || [];
            existing.push(r);
            map.set(key, existing);
        });
        return map;
    }, [risks]);


    // Helper to get risks in a specific cell (using Residual risk)
    const getRisksInCell = (g: Gravity, o: Occurrence) => {
        return risksByCell.get(`${g}-${o}`) || [];
    };

    const activeRisks = hoveredCell
        ? getRisksInCell(hoveredCell.g, hoveredCell.o)
        : risks; // Show all risks if none hovered

    const sortedRisks = [...activeRisks].sort((a, b) => {
        // Sort by severity (Gravity then Occurrence)
        if (b.residualRisk.gravity !== a.residualRisk.gravity) return b.residualRisk.gravity - a.residualRisk.gravity;
        return b.residualRisk.occurrence.localeCompare(a.residualRisk.occurrence);
    });

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col xl:flex-row gap-8">

                {/* Left Side: The Matrix */}
                <div className="flex-none flex flex-col items-center justify-center xl:w-auto mx-auto xl:mx-0">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 w-full text-center xl:text-left">
                        Matrice des Risques Résiduels
                    </h3>

                    <div className="relative p-6 bg-slate-100 rounded-3xl shadow-inner inline-block">
                        {/* Y Axis Label */}
                        <div className="absolute left-1 top-0 bottom-0 flex items-center justify-center w-6">
                            <div className="-rotate-90 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                                Gravité
                            </div>
                        </div>

                        <div className="flex flex-col relative">

                            {/* X Axis Header */}
                            <div className="flex ml-8 mb-2 gap-2">
                                {cols.map(c => (
                                    <div key={c} className="w-12 flex items-end justify-center font-bold text-slate-400 text-xs">{c}</div>
                                ))}
                            </div>

                            {rows.map(row => (
                                <div key={row} className="flex mb-2 last:mb-0 items-center">
                                    {/* Row Header */}
                                    <div className="w-8 flex items-center justify-end pr-3 font-bold text-slate-400 text-xs">{row}</div>

                                    {/* Cells */}
                                    <div className="flex gap-2">
                                        {cols.map(col => {
                                            const cellRisks = getRisksInCell(row, col);
                                            const count = cellRisks.length;
                                            const level = calculateRiskLevel(row, col);
                                            const theme = getRiskTheme(level);
                                            const bgColorClass = theme.bg;

                                            const isHovered = hoveredCell?.g === row && hoveredCell?.o === col;
                                            const isDimmed = hoveredCell && !isHovered;

                                            return (
                                                <div
                                                    key={`${row}-${col}`}
                                                    onMouseEnter={() => setHoveredCell({ g: row, o: col })}
                                                    onMouseLeave={() => setHoveredCell(null)}
                                                    className={`
                                            w-12 h-12
                                            ${bgColorClass} 
                                            rounded-lg md:rounded-xl
                                            flex items-center justify-center
                                            transition-all duration-300
                                            cursor-default
                                            relative
                                            ${isHovered ? 'scale-110 z-30 shadow-lg ring-2 ring-slate-800' : ''}
                                            ${count === 0 ? 'opacity-30 saturate-50' : 'opacity-100 shadow-sm'}
                                            ${isDimmed ? 'opacity-20 blur-[0.5px]' : ''}
                                        `}
                                                >
                                                    {count > 0 && (
                                                        <span className="font-black text-slate-900/80 text-sm">
                                                            {count}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* X Axis Label */}
                            <div className="flex justify-center mt-3 ml-8">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Occurrence</span>
                            </div>
                        </div>
                    </div>

                    {/* Matrix Legend */}
                    <div className="mt-6 grid grid-cols-4 gap-2 w-full max-w-[280px]">
                        {['Usuel', 'Faible', 'Fort', 'Inacceptable'].map((lvl) => {
                            const color = getRiskTheme(lvl as any).bg;
                            return (
                                <div key={lvl} className="flex flex-col items-center gap-1">
                                    <div className={`w-full h-1.5 rounded-full ${color}`}></div>
                                    <span className="text-[9px] text-slate-400 uppercase font-bold">{lvl.substring(0, 4)}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Right Side: Detailed Synthesis List */}
                <div className="flex-1 flex flex-col border-t xl:border-t-0 xl:border-l border-slate-100 pt-6 xl:pt-0 xl:pl-8 min-h-[400px]">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-500" />
                            {hoveredCell
                                ? `Risques G${hoveredCell.g} / O${hoveredCell.o}`
                                : "Synthèse Globale"}
                        </h4>
                        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                            {sortedRisks.length} risque{sortedRisks.length > 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar space-y-3">
                        {sortedRisks.length > 0 ? (
                            sortedRisks.map(risk => {
                                const residualTheme = getRiskTheme(risk.residualRisk.computedLevel);

                                return (
                                    <div
                                        key={risk.id}
                                        onClick={() => onRiskClick && onRiskClick(risk.id)}
                                        className={`
                                    group relative bg-white rounded-lg p-4 border border-slate-100 shadow-sm 
                                    ${onRiskClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-md' : ''}
                                    transition-all overflow-hidden
                                `}
                                    >
                                        {/* Left Border Indicator */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${residualTheme.bg}`}></div>

                                        <div className="pl-3">
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex flex-col">
                                                    {/* Experimentation Tag */}
                                                    {risk.experimentation && (
                                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight mb-0.5">
                                                            {risk.experimentation}
                                                        </span>
                                                    )}
                                                    <div className="font-bold text-slate-800 text-sm">{risk.activityTitle}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {onRiskClick && <Edit3 className="w-3 h-3 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />}
                                                    <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${residualTheme.full}`}>
                                                        {risk.residualRisk.computedLevel}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Measures */}
                                            <div className="mb-3">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    Mesures d'atténuation
                                                </div>
                                                <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-2 rounded border border-slate-100/50">
                                                    {risk.mitigationMeasures || "Aucune mesure spécifiée."}
                                                </p>
                                            </div>

                                            {/* Discreet Evolution Arrow (Textual) */}
                                            <div className="flex items-center justify-end gap-3 text-[10px] text-slate-400 font-medium">
                                                <span className="uppercase tracking-wide">Évolution:</span>
                                                <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                                                    <span className="text-slate-500">
                                                        G{risk.initialRisk.gravity}/O{risk.initialRisk.occurrence}
                                                    </span>
                                                    <ArrowRight className="w-3 h-3 text-slate-300" />
                                                    <span className="font-bold text-slate-700">
                                                        G{risk.residualRisk.gravity}/O{risk.residualRisk.occurrence}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                <span className="text-sm">Aucun risque dans cette zone</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SynthesisMatrix;