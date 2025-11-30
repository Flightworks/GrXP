import React, { useState, useEffect } from 'react';
import { RiskCatalogEntry } from '../types';
import { getCatalogEntries } from '../services/storage';
import { Search, X, BookOpen, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Gravity, Occurrence } from '../types';
import { calculateRiskLevel, getRiskColor } from '../constants';

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (entry: RiskCatalogEntry) => void;
}

const CatalogModal: React.FC<CatalogModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [entries, setEntries] = useState<RiskCatalogEntry[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEntries(getCatalogEntries());
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEntries = entries.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    e.dreadedEvent.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-lg">Importer du Catalogue</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Rechercher par titre, catégorie..." 
              className="w-full pl-9 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-4 space-y-3 bg-slate-50 flex-1">
          {filteredEntries.length === 0 ? (
            <div className="text-center text-slate-400 py-12 flex flex-col items-center">
                <BookOpen className="w-12 h-12 text-slate-200 mb-2" />
                <span>Aucun risque trouvé dans le catalogue.</span>
            </div>
          ) : (
            filteredEntries.map(entry => {
                const level = calculateRiskLevel(entry.defaultGravity, entry.defaultOccurrence);
                const riskColor = getRiskColor(level);
                const borderClass = riskColor.split(' ')[0]; // bg-color

                return (
                  <div 
                    key={entry.id} 
                    onClick={() => onSelect(entry)}
                    className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
                  >
                    {/* Left Border Indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${borderClass}`}></div>

                    <div className="pl-3">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{entry.title}</h3>
                                <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mt-1 inline-block">
                                    {entry.category}
                                </span>
                            </div>
                             <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${riskColor}`}>
                                {level}
                            </div>
                        </div>

                        {/* Content Preview */}
                        <div className="space-y-2 mb-2">
                            <div className="flex gap-2">
                                <AlertTriangle className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-600 line-clamp-2">{entry.dreadedEvent}</p>
                            </div>
                            {entry.mitigationMeasures && (
                                <div className="flex gap-2">
                                    <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-slate-500 line-clamp-1 italic">{entry.mitigationMeasures}</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Footer */}
                         <div className="flex items-center justify-end gap-2 text-[10px] text-slate-400 border-t border-slate-50 pt-2 mt-2">
                             <span>Cotation:</span>
                             <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                G{entry.defaultGravity} / O({entry.defaultOccurrence})
                             </span>
                        </div>
                    </div>
                  </div>
                );
            })
          )}
        </div>
        
        <div className="p-3 border-t border-slate-200 bg-white text-xs text-center text-slate-400">
            Cliquez sur un modèle pour l'importer dans votre formulaire
        </div>
      </div>
    </div>
  );
};

export default CatalogModal;