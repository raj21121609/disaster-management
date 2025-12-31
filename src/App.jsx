import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AlertBanner from './components/AlertBanner';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import IncidentReportPage from './pages/IncidentReportPage';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AgencyDashboard from './pages/AgencyDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import './index.css';

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const { isAuthenticated, userRole, currentUser } = useAuth();

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

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={setCurrentPage} />;
      case 'dashboard':
        return <DashboardPage />;
      case 'report':
        return <IncidentReportPage onNavigate={setCurrentPage} />;
      case 'auth':
        return <AuthPage onNavigate={setCurrentPage} />;
      case 'volunteer':
        return <VolunteerDashboard />;
      case 'agency':
        return <AgencyDashboard />;
      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="app-container">
      <AlertBanner />
      <Navbar onNavigate={setCurrentPage} currentPage={currentPage} />
      <main>
        {renderPage()}
      </main>
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
