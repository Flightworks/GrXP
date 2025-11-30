import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import RiskForm from './pages/RiskForm';
import CatalogManager from './pages/CatalogManager';
import { Plane, BookOpen, Home, PlusCircle, Download } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'edit' | 'catalog'>('dashboard');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const navigate = (page: string, id?: string) => {
    window.scrollTo(0, 0);
    if (page === 'dashboard') {
      setCurrentPage('dashboard');
      setCurrentId(null);
    } else if (page === 'edit') {
      setCurrentPage('edit');
      setCurrentId(id || null);
    } else if (page === 'catalog') {
      setCurrentPage('catalog');
      setCurrentId(null);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0 font-sans text-slate-900">
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div 
                className="flex items-center gap-3 cursor-pointer group" 
                onClick={() => navigate('dashboard')}
            >
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform">
                <Plane className="w-5 h-5 transform -rotate-45" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">GrXP</span>
            </div>
            <div className="flex items-center space-x-2">
                <button 
                    onClick={() => navigate('dashboard')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${currentPage === 'dashboard' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  Tableau de bord
                </button>
                <button 
                    onClick={() => navigate('catalog')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${currentPage === 'catalog' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  <BookOpen className="w-4 h-4" />
                  Catalogue
                </button>
                <div className="w-px h-6 bg-slate-200 mx-2"></div>
                
                {deferredPrompt && (
                  <button 
                    onClick={handleInstallClick}
                    className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all mr-2"
                  >
                    <Download className="w-4 h-4" />
                    Installer
                  </button>
                )}

                <button 
                    onClick={() => navigate('edit')}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-full shadow-lg shadow-slate-200 text-sm font-medium transition-all transform hover:-translate-y-0.5"
                >
                    <PlusCircle className="w-4 h-4" />
                    Nouveau
                </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {currentPage === 'dashboard' ? (
          <Dashboard onNavigate={navigate} />
        ) : currentPage === 'edit' ? (
          <RiskForm riskId={currentId} onNavigate={navigate} />
        ) : (
          <CatalogManager />
        )}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 px-6 py-2 z-50 pb-safe no-print">
        <div className="flex justify-around items-center">
            <button 
                onClick={() => navigate('dashboard')}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${currentPage === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}
            >
                <Home className="w-6 h-6" />
                <span className="text-[10px] font-medium">Accueil</span>
            </button>
            
            <button 
                onClick={() => navigate('edit')}
                className="flex flex-col items-center justify-center -mt-8"
            >
                <div className="w-14 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-200 flex items-center justify-center text-white transform active:scale-95 transition-transform">
                    <PlusCircle className="w-7 h-7" />
                </div>
            </button>

            <button 
                onClick={() => navigate('catalog')}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${currentPage === 'catalog' ? 'text-blue-600' : 'text-slate-400'}`}
            >
                <BookOpen className="w-6 h-6" />
                <span className="text-[10px] font-medium">Catalogue</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default App;