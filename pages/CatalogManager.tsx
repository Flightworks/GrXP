import React, { useState, useEffect } from 'react';
import { RiskCatalogEntry, Gravity, Occurrence } from '../types';
import { getCatalogEntries, saveCatalogEntry, deleteCatalogEntry } from '../services/storage';
import { Plus, Search, Trash2, Edit2, AlertTriangle, Save, X, BookOpen, ShieldCheck } from 'lucide-react';
import { GRAVITY_OPTIONS, OCCURRENCE_OPTIONS, calculateRiskLevel, getRiskColor } from '../constants';

export const CatalogManager: React.FC = () => {
  const [entries, setEntries] = useState<RiskCatalogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<RiskCatalogEntry | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setEntries(getCatalogEntries());
  };

  const handleEdit = (entry: RiskCatalogEntry) => {
    setCurrentEntry({ ...entry });
    setIsEditing(true);
  };

  const handleNew = () => {
    setCurrentEntry({
      id: crypto.randomUUID(),
      title: '',
      category: 'Technique',
      dreadedEvent: '',
      mitigationMeasures: '',
      defaultGravity: Gravity.Catastrophique,
      defaultOccurrence: Occurrence.Rare
    });
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce modèle de risque ?')) {
      deleteCatalogEntry(id);
      loadData();
    }
  };

  const handleSave = () => {
    if (currentEntry) {
      if (!currentEntry.title.trim()) {
          alert("Le titre est obligatoire");
          return;
      }
      saveCatalogEntry(currentEntry);
      setIsEditing(false);
      setCurrentEntry(null);
      loadData();
    }
  };

  const filteredEntries = entries.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  if (isEditing && currentEntry) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            {currentEntry.title ? 'Modifier le modèle' : 'Nouveau modèle'}
          </h2>
          <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-slate-800">
             <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Titre (Court)</label>
                 <input 
                    type="text" 
                    value={currentEntry.title}
                    onChange={(e) => setCurrentEntry({...currentEntry, title: e.target.value})}
                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    placeholder="Ex: Panne moteur"
                 />
             </div>
             <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Catégorie</label>
                 <input 
                    type="text" 
                    value={currentEntry.category}
                    onChange={(e) => setCurrentEntry({...currentEntry, category: e.target.value})}
                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    placeholder="Ex: Technique"
                 />
             </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description (Événement Redouté)</label>
             <textarea 
                rows={3}
                value={currentEntry.dreadedEvent}
                onChange={(e) => setCurrentEntry({...currentEntry, dreadedEvent: e.target.value})}
                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
             />
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mesures d'atténuation (Défaut)</label>
             <textarea 
                rows={4}
                value={currentEntry.mitigationMeasures}
                onChange={(e) => setCurrentEntry({...currentEntry, mitigationMeasures: e.target.value})}
                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
             />
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded border border-slate-100">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gravité par défaut</label>
                <select 
                    value={currentEntry.defaultGravity}
                    onChange={(e) => setCurrentEntry({...currentEntry, defaultGravity: Number(e.target.value) as Gravity})}
                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded appearance-none"
                >
                    {GRAVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Occurrence par défaut</label>
                <select 
                    value={currentEntry.defaultOccurrence}
                    onChange={(e) => setCurrentEntry({...currentEntry, defaultOccurrence: e.target.value as Occurrence})}
                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded appearance-none"
                >
                    {OCCURRENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
             </div>
          </div>

          <div className="flex justify-end pt-4">
             <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow-sm font-medium"
             >
                <Save className="w-4 h-4" />
                Enregistrer le modèle
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-600" />
            Catalogue des Risques
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gérez les modèles de risques récurrents pour standardiser vos analyses.</p>
        </div>
        <button 
            onClick={handleNew}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm font-medium"
        >
            <Plus className="w-4 h-4" />
            Nouveau Modèle
        </button>
      </div>

      <div className="space-y-4">
        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Rechercher un modèle..." 
                    className="w-full pl-9 pr-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm appearance-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {filteredEntries.map(entry => {
                const level = calculateRiskLevel(entry.defaultGravity, entry.defaultOccurrence);
                const riskColor = getRiskColor(level);
                const borderClass = riskColor.split(' ')[0]; // bg-color

                return (
                    <div key={entry.id} className="group relative bg-white rounded-xl p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-blue-300">
                        {/* Left Border Indicator */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${borderClass}`}></div>
                        
                        <div className="pl-3">
                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-slate-800 text-base">{entry.title}</h3>
                                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                            {entry.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                                    <div className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${riskColor}`}>
                                        {level}
                                    </div>
                                    
                                    <div className="flex items-center gap-1 border-l border-slate-100 pl-3">
                                        <button 
                                            onClick={() => handleEdit(entry)} 
                                            className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                                            title="Modifier"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(entry.id)} 
                                            className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                {/* Dreaded Event */}
                                <div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase mb-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Événement Redouté
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        {entry.dreadedEvent || "Non décrit."}
                                    </p>
                                </div>

                                {/* Measures */}
                                <div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase mb-1">
                                        <ShieldCheck className="w-3 h-3" />
                                        Mesures d'atténuation (Défaut)
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 line-clamp-3">
                                        {entry.mitigationMeasures || "Aucune mesure spécifiée."}
                                    </p>
                                </div>
                            </div>

                            {/* Footer Risk Values */}
                            <div className="flex items-center justify-end border-t border-slate-50 pt-3 mt-2">
                                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                                    <span className="uppercase tracking-wide">Cotation par défaut:</span>
                                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                        <span className="font-bold text-slate-700">
                                            G{entry.defaultGravity} / O({entry.defaultOccurrence})
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            
            {filteredEntries.length === 0 && (
                <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Aucun modèle trouvé.
                </div>
            )}
        </div>
      </div>
    );
};