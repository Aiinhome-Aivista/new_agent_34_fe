import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LoadingProvider /*, useGlobalLoader */ } from './context/LoadingContext';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './views/LoginPage';
import { LandingPage } from './views/LandingPage';
import { DashboardView } from './views/DashboardView';
import { QueueView } from './views/QueueView';
import { CaseDetailView } from './views/CaseDetailView';
import { ActionHistoryView } from './views/ActionHistoryView';
// import { IntegrationsView } from './views/IntegrationsView';
// import { SimulatorView } from './views/SimulatorView';
import { AdminManagementView } from './views/AdminManagementView';
import { BatchIngestView } from './views/BatchIngestView';
import { TaskProgressProvider } from './context/TaskProgressContext';
import { GlobalTaskProgressDock } from './components/common/GlobalTaskProgressDock';
import { EvidenceSubmissionPortal } from './views/EvidenceSubmissionPortal';
import './styles/globals.css';

type Page = 'landing' | 'login' | 'app';

interface User {
  id?: string;
  name: string;
  role: string;
  email: string;
}

function AppInner() {
  // Session Persistence across browser refresh
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('fraudops_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState<Page>(() => {
    try {
      const savedUser = localStorage.getItem('fraudops_user');
      const savedPage = localStorage.getItem('fraudops_page') as Page;
      if (savedUser && savedPage === 'app') {
        return 'app';
      }
      return 'landing';
    } catch {
      return 'landing';
    }
  });

  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const savedTab = localStorage.getItem('fraudops_tab');
      return savedTab || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('fraudops_case_id') || null;
    } catch {
      return null;
    }
  });

  // Synchronize authentication and view state with localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('fraudops_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fraudops_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('fraudops_page', page);
  }, [page]);

  useEffect(() => {
    localStorage.setItem('fraudops_tab', currentTab);
  }, [currentTab]);

  useEffect(() => {
    if (selectedCaseId) {
      localStorage.setItem('fraudops_case_id', selectedCaseId);
    } else {
      localStorage.removeItem('fraudops_case_id');
    }
  }, [selectedCaseId]);

  const handleLogin = (u: User) => {
    setUser(u);
    setCurrentTab('dashboard');
    setPage('app');
    localStorage.setItem('fraudops_user', JSON.stringify(u));
    localStorage.setItem('fraudops_page', 'app');
    localStorage.setItem('fraudops_tab', 'dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentTab('dashboard');
    setSelectedCaseId(null);
    setPage('landing');
    localStorage.removeItem('fraudops_user');
    localStorage.removeItem('fraudops_page');
    localStorage.removeItem('fraudops_tab');
    localStorage.removeItem('fraudops_case_id');
  };

  const handleNavigate = (tab: string, caseId?: string) => {
    if (caseId) {
      setSelectedCaseId(caseId);
      setCurrentTab('casedetail');
      localStorage.setItem('fraudops_tab', 'casedetail');
      localStorage.setItem('fraudops_case_id', caseId);
    } else {
      if (tab === 'queue') {
        setSelectedCaseId(null);
        localStorage.removeItem('fraudops_case_id');
      }
      setCurrentTab(tab);
      localStorage.setItem('fraudops_tab', tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentTab('casedetail');
    localStorage.setItem('fraudops_tab', 'casedetail');
    localStorage.setItem('fraudops_case_id', caseId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── PUBLIC: Customer Evidence Submission Portal (Direct Link) ────────────
  const isEvidencePortal = 
    window.location.search.includes('token=') ||
    window.location.pathname.includes('/evidence-submission') ||
    window.location.pathname.includes('/evidence-portal');

  if (isEvidencePortal) {
    return <EvidenceSubmissionPortal />;
  }

  // ── PUBLIC: Landing page ──────────────────────────────────────────────────
  if (page === 'landing') {
    return <LandingPage onGetStarted={() => setPage('login')} />;
  }

  // ── PUBLIC: Login page ────────────────────────────────────────────────────
  if (page === 'login') {
    return <LoginPage onLogin={handleLogin} onBack={() => setPage('landing')} />;
  }

  // ── PRIVATE: Authenticated app with sidebar ───────────────────────────────
  const activeNavTab = currentTab === 'casedetail' ? 'queue' : currentTab;

  return (
    <TaskProgressProvider onNavigate={handleNavigate}>
      <div
        style={{
          display: 'flex',
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          backgroundColor: 'var(--color-background)',
        }}
      >
        {/* Collapsible Sidebar */}
        <Sidebar
          currentTab={activeNavTab}
          onSelectTab={handleNavigate}
          user={user!}
          onLogout={handleLogout}
        />

        {/* Main content area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {/* Top bar */}
          <header
            style={{
              height: '64px',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 28px',
              flexShrink: 0,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {getPageTitle(currentTab)}
              </span>
              <span
                style={{
                  marginLeft: '10px',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 500,
                }}
              >
                {getPageSubtitle(currentTab, selectedCaseId)}
              </span>
            </div>

            {/* Right side controls: Global Loader preview + user pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* User info pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-input-background)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.82rem',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {user!.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {user!.name}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--color-text-secondary)',
                  }}
                  className="topbar-role"
                >
                  · {user!.role}
                </span>
              </div>
            </div>
          </header>

          {/* Scrollable page content */}
          <main
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              backgroundColor: 'var(--color-background)',
              width: '100%',
            }}
          >
            {currentTab === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
            {currentTab === 'queue' && (
              <QueueView
                onSelectCase={handleSelectCase}
              />
            )}
            {currentTab === 'casedetail' && selectedCaseId && (
              <CaseDetailView
                caseId={selectedCaseId}
                onBack={() => {
                  setSelectedCaseId(null);
                  setCurrentTab('queue');
                }}
                currentUser={user}
              />
            )}
            {currentTab === 'actions' && <ActionHistoryView onNavigateToCase={handleSelectCase} />}
            {/* {currentTab === 'integrations' && <IntegrationsView />} */}
            {/* {currentTab === 'simulator' && (
              <SimulatorView
                onNavigateToQueue={() => {
                  setSelectedCaseId(null);
                  setCurrentTab('queue');
                }}
              />
            )} */}
            {currentTab === 'batch-ingest' && (
              <BatchIngestView
                onNavigateToCase={handleSelectCase}
                onNavigateToQueue={() => {
                  setSelectedCaseId(null);
                  setCurrentTab('queue');
                }}
              />
            )}
            {currentTab === 'admin' && <AdminManagementView />}
          </main>

          {/* Fixed Footer */}
          <footer
            style={{
              borderTop: '1px solid var(--color-border)',
              padding: '10px 28px',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              fontSize: '0.75rem',
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <span style={{ fontWeight: 500 }}>
              FraudOps AI — Merchant &amp; User Fraud Investigation Platform
            </span>
            <span>
              Zero-Mock Architecture · LangGraph · ChromaDB · ArangoDB · MySQL
            </span>
          </footer>
        </div>
      </div>

      {/* Global Floating Task Progress Dock at Bottom-Right */}
      <GlobalTaskProgressDock />

      <style>{`
        @media (min-width: 768px) {
          .topbar-role { display: inline !important; }
        }
      `}</style>
    </TaskProgressProvider>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <AppInner />
      </LoadingProvider>
    </ThemeProvider>
  );
}

function getPageTitle(tab: string): string {
  const titles: Record<string, string> = {
    dashboard: 'Analytics Dashboard',
    queue: 'Case Queue',
    casedetail: 'Case Detail',
    'batch-ingest': 'Batch Excel/CSV Ingestion & Live Auto-Trigger',
    actions: 'Action History',
    integrations: 'Infrastructure & Integrations',
    // simulator: 'Concurrency Simulator',
    admin: 'Policy & Parameter Engine',
  };
  return titles[tab] || 'FraudOps AI';
}

function getPageSubtitle(tab: string, caseId: string | null): string {
  if (tab === 'casedetail' && caseId) return `Case ID: ${caseId}`;
  const subs: Record<string, string> = {
    dashboard: 'Live investigation metrics & KPIs',
    queue: 'Review and triage active fraud cases',
    'batch-ingest': 'Upload transaction files, monitor batch ingestion, and verify autonomous trigger execution',
    actions: 'Full audit trail of analyst decisions',
    integrations: 'System health & backend services',
    // simulator: 'Stress-test ingestion pipeline',
    admin: 'Manage organizational SOPs, detection parameters, and private knowledge base',
  };
  return subs[tab] || '';
}

export default App;
