import React from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Dashboard from './pages/Dashboard';
import RiskForm from './pages/RiskForm';
import { CatalogManager } from './pages/CatalogManager';
import StudyManager from './pages/StudyManager';
import DataPage from './pages/DataPage';
import PageTransition from './components/PageTransition';
import Layout from './components/Layout';

// Wrapper to extract params for RiskForm
const RiskFormWrapper: React.FC<{ onNavigate: (page: string, id?: string) => void }> = ({ onNavigate }) => {
  const { id } = useParams<{ id: string }>();
  return <RiskForm riskId={id || null} onNavigate={onNavigate} />;
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
      case 'studies':
        navigate('/studies');
        break;
      case 'catalog':
        navigate('/catalog');
        break;
      case 'data':
        navigate('/data');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <Layout onNavigate={handleNavigate}>
      <AnimatePresence mode="wait">
        {/* @ts-ignore Key is required for framer-motion AnimatePresence */}
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
          <Route path="/studies" element={
            <PageTransition>
              <StudyManager />
            </PageTransition>
          } />
          <Route path="/catalog" element={
            <PageTransition>
              <CatalogManager />
            </PageTransition>
          } />
          <Route path="/data" element={
            <PageTransition>
              <DataPage onNavigate={handleNavigate} />
            </PageTransition>
          } />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
};

export default App;