import React from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Plane, BookOpen, Home, PlusCircle, Download, LayoutDashboard } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import RiskForm from './pages/RiskForm';
import { CatalogManager } from './pages/CatalogManager';
import PageTransition from './components/PageTransition';
import Footer from './components/Footer';
import { usePWAInstall } from './hooks/usePWAInstall';

// Wrapper to extract params for RiskForm
const RiskFormWrapper: React.FC<{ onNavigate: (page: string, id?: string) => void }> = ({ onNavigate }) => {
  const { id } = useParams<{ id: string }>();
  return <RiskForm riskId={id || null} onNavigate={onNavigate} />;
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isInstallable, promptInstall } = usePWAInstall();

  // Adapter function to maintain compatibility with existing components
  const handleNavigate = (page: string, id?: string) => {
    window.scrollTo(0, 0);
    switch (page) {
      case 'dashboard':
        navigate('/');
        break;
      case 'edit':
        navigate(id ? `/edit/${id}` : '/edit');
        break;
      case 'catalog':
        navigate('/catalog');
        break;
      default:
        navigate('/');
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0 font-sans text-slate-900">
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => handleNavigate('dashboard')}
            >
              <img
                src={`${import.meta.env.BASE_URL}icon.png`}
                alt="GrXP Logo"
                className="w-9 h-9 rounded-xl shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform"
              />
              <span className="font-bold text-xl tracking-tight text-slate-800">GrXP</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleNavigate('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive('/') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Etude
              </button>
              <button
                onClick={() => handleNavigate('catalog')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive('/catalog') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
              >
                <BookOpen className="w-4 h-4" />
                Catalogue
              </button>
              <div className="w-px h-6 bg-slate-200 mx-2"></div>

              {isInstallable && (
                <button
                  onClick={promptInstall}
                  className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all mr-2"
                >
                  <Download className="w-4 h-4" />
                  Installer
                </button>
              )}

              <button
                onClick={() => handleNavigate('edit')}
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
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <PageTransition>
                <Dashboard onNavigate={handleNavigate} />
              </PageTransition>
            } />
            <Route path="/edit" element={
              <PageTransition>
                <RiskFormWrapper onNavigate={handleNavigate} />
              </PageTransition>
            } />
            <Route path="/edit/:id" element={
              <PageTransition>
                <RiskFormWrapper onNavigate={handleNavigate} />
              </PageTransition>
            } />
            <Route path="/catalog" element={
              <PageTransition>
                <CatalogManager />
              </PageTransition>
            } />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 px-6 py-2 z-50 pb-safe no-print">
        <div className="flex justify-around items-center">
          <button
            onClick={() => handleNavigate('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive('/') ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium">Etude</span>
          </button>

          <button
            onClick={() => handleNavigate('edit')}
            className="flex flex-col items-center justify-center -mt-8"
          >
            <div className="w-14 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-200 flex items-center justify-center text-white transform active:scale-95 transition-transform">
              <PlusCircle className="w-7 h-7" />
            </div>
          </button>

          <button
            onClick={() => handleNavigate('catalog')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive('/catalog') ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-[10px] font-medium">Catalogue</span>
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default App;