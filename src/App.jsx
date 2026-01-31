import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AlertBanner from './components/AlertBanner';
import OfflineIndicator from './components/OfflineIndicator';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import IncidentReportPage from './pages/IncidentReportPage';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AgencyDashboard from './pages/AgencyDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { initSyncService } from './services/offlineSyncService';
import { initDB } from './services/offlineIncidentStore';
import './index.css';

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const { isAuthenticated, userRole } = useAuth();

  // Initialize offline services on mount
  useEffect(() => {
    const initOffline = async () => {
      try {
        await initDB();
        initSyncService();
        console.log('[App] Offline services initialized');
      } catch (error) {
        console.error('[App] Failed to init offline services:', error);
      }
    };
    initOffline();
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentPage === 'auth') {
      switch (userRole) {
        case 'agency':
          setCurrentPage('agency');
          break;
        case 'volunteer':
          setCurrentPage('volunteer');
          break;
        default:
          setCurrentPage('dashboard');
      }
    }
  }, [isAuthenticated, userRole, currentPage]);

  const [pageContext, setPageContext] = useState(null);

  const handleNavigate = (page, data = null) => {
    setCurrentPage(page);
    setPageContext(data);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'dashboard':
        return <DashboardPage />;
      case 'report':
        return <IncidentReportPage onNavigate={handleNavigate} initialData={pageContext} />;
      case 'auth':
        return <AuthPage onNavigate={handleNavigate} />;
      case 'volunteer':
        return <VolunteerDashboard />;
      case 'agency':
        return <AgencyDashboard />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-container">
      <AlertBanner />
      <Navbar onNavigate={setCurrentPage} currentPage={currentPage} />
      <main>
        {renderPage()}
      </main>
      <OfflineIndicator />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;

