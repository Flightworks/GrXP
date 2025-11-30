import React from 'react';
import { Assessment, Gravity, Occurrence, Exposition, Detectability, RiskLevel } from '../types';
import { GRAVITY_OPTIONS, OCCURRENCE_OPTIONS, EXPOSITION_OPTIONS, DETECTABILITY_OPTIONS, calculateRiskLevel, getRiskColor } from '../constants';
import MatrixGrid from './MatrixGrid';

interface AssessmentSectionProps {
  title: string;
  type: 'intrinsic' | 'residual';
  data: Assessment;
  comparisonRisk?: Assessment;
  onChange: (data: Assessment) => void;
  children?: React.ReactNode;
}

const AssessmentSection: React.FC<AssessmentSectionProps> = ({ title, type, data, comparisonRisk, onChange, children }) => {

  const handleUpdate = (field: keyof Assessment, value: any) => {
    const newData = { ...data, [field]: value };
    if (field === 'gravity' || field === 'occurrence') {
      newData.computedLevel = calculateRiskLevel(newData.gravity, newData.occurrence);
    }
    onChange(newData);
  };

  const handleMatrixSelect = (g: Gravity, o: Occurrence) => {
      const newData = {
          ...data,
          gravity: g,
          occurrence: o,
          computedLevel: calculateRiskLevel(g, o)
      };
      onChange(newData);
  };

  // Modern segmented control component
  const SegmentedControl = <T extends string | number>({ 
    label, 
    value, 
    options, 
    onSelect 
  }: { 
    label: string, 
    value: T, 
    options: {value: T, label: string}[], 
    onSelect: (v: T) => void 
  }) => (
    <div className="mb-4">
      <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest ml-1">{label}</div>
      <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
        {options.map((opt) => {
            const isActive = opt.value === value;
            // Extract short label if needed, or use full
            const shortLabel = opt.label.split('(')[0].trim();
            return (
                <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => onSelect(opt.value)}
                    className={`
                        flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all whitespace-nowrap
                        ${isActive 
                            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                            : 'text-slate-500 hover:text-slate-700'
                        }
                    `}
                >
                    {shortLabel}
                    {/* Add indicator for Gravity/Occurrence specific values like (A) or (4) */}
                    {opt.label.includes('(') && <span className="opacity-50 ml-1 text-[9px]">{opt.label.match(/\((.*?)\)/)?.[0]}</span>}
                </button>
            )
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wide">
            <span className={`w-2 h-2 rounded-full ${type === 'intrinsic' ? 'bg-slate-400' : 'bg-blue-500'}`}></span>
            {title}
        </h3>
        {/* Computed level is now shown in the Matrix header and sticky footer, so we can hide it here to clean up or keep it minimal */}
      </div>

      <div className="p-6">
        {children}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Matrix Visualization - Ordered first */}
            <div className="xl:col-span-6 flex justify-center order-1">
                <MatrixGrid 
                    currentGravity={data.gravity} 
                    currentOccurrence={data.occurrence} 
                    initialGravity={comparisonRisk?.gravity}
                    initialOccurrence={comparisonRisk?.occurrence}
                    label="Matrice"
                    onCellClick={handleMatrixSelect}
                    size="md"
                />
            </div>

            {/* Input Controls - Ordered second */}
            <div className="xl:col-span-6 flex flex-col justify-center order-2">
                <div className="grid grid-cols-1 gap-1">
                    <SegmentedControl 
                        label="Gravité" 
                        value={data.gravity} 
                        options={GRAVITY_OPTIONS} 
                        onSelect={(v) => handleUpdate('gravity', v)} 
                    />
                     <SegmentedControl 
                        label="Occurrence" 
                        value={data.occurrence} 
                        options={OCCURRENCE_OPTIONS} 
                        onSelect={(v) => handleUpdate('occurrence', v)} 
                    />
                </div>
                
                <div className="h-px bg-slate-100 my-6"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SegmentedControl 
                        label="Exposition" 
                        value={data.exposition} 
                        options={EXPOSITION_OPTIONS} 
                        onSelect={(v) => handleUpdate('exposition', v)} 
                    />
                    <SegmentedControl 
                        label="Détectabilité" 
                        value={data.detectability} 
                        options={DETECTABILITY_OPTIONS} 
                        onSelect={(v) => handleUpdate('detectability', v)} 
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentSection;