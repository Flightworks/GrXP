import React, { useState, useEffect } from 'react';
import { getAllStudies, createNewStudy, deleteStudy, setCurrentStudy, getCurrentStudy } from '../services/storage';
import { Study } from '../types';
import { Plus, Trash2, Check, FolderOpen, Calendar, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudyManager: React.FC = () => {
    const [studies, setStudies] = useState<Study[]>([]);
    const [activeStudyId, setActiveStudyId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newStudyName, setNewStudyName] = useState('');
    const [newAircraft, setNewAircraft] = useState('');
    const navigate = useNavigate();

    const loadStudies = () => {
        setStudies(getAllStudies());
        const current = getCurrentStudy();
        setActiveStudyId(current?.id || null);
    };

    useEffect(() => {
        loadStudies();
    }, []);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStudyName.trim()) return;

        const newStudy = createNewStudy(newStudyName, newAircraft);
        setNewStudyName('');
        setNewAircraft('');
        setIsCreating(false);
        loadStudies();
        // Optional: Auto-navigate or just stay on list?
        // Let's stay on list but highlight it's active now (createNewStudy sets it active)
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Attention : Voulez-vous vraiment supprimer cette étude et tous ses risques ?")) {
            deleteStudy(id);
            loadStudies();
        }
    };

    const handleSelect = (id: string) => {
        setCurrentStudy(id);
        loadStudies();
        navigate('/'); // Go to Dashboard
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Mes Études</h1>
                    <p className="text-slate-500">Gérez vos différentes campagnes d'essais</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full shadow-lg shadow-slate-200 transition-all font-medium transform hover:-translate-y-0.5"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nouvelle Étude</span>
                </button>
            </div>

            {/* Create Modal / Inline Form */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Créer une nouvelle étude</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nom de l'étude</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newStudyName}
                                    onChange={e => setNewStudyName(e.target.value)}
                                    placeholder="Ex: Campagne PHEL-182"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Aéronef</label>
                                <input
                                    type="text"
                                    value={newAircraft}
                                    onChange={e => setNewAircraft(e.target.value)}
                                    placeholder="Ex: NH90"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newStudyName.trim()}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Créer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studies.map(study => {
                    const isActive = study.id === activeStudyId;
                    return (
                        <div
                            key={study.id}
                            onClick={() => handleSelect(study.id)}
                            className={`
                                group relative p-6 rounded-2xl border transition-all cursor-pointer hover:shadow-md
                                ${isActive
                                    ? 'bg-blue-50/50 border-blue-200 ring-2 ring-blue-500 ring-offset-2'
                                    : 'bg-white border-slate-200 hover:border-blue-300'
                                }
                            `}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500'} transition-colors`}>
                                    <FolderOpen className="w-6 h-6" />
                                </div>
                                {isActive && (
                                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Actif
                                    </span>
                                )}
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                                {study.name}
                            </h3>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Plane className="w-4 h-4" />
                                    <span>{study.aircraft || 'Non spécifié'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(study.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {study.risks.length} Risques
                                </span>
                                <button
                                    onClick={(e) => handleDelete(study.id, e)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    title="Supprimer l'étude"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {studies.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-slate-900 font-bold text-lg mb-2">Aucune étude</h3>
                    <p className="text-slate-500 mb-6">Commencez par créer votre première campagne d'essais.</p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition-colors"
                    >
                        Créer une étude
                    </button>
                </div>
            )}
        </div>
    );
};

export default StudyManager;
