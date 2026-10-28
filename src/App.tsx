import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LoadingProvider, useGlobalLoader } from './context/LoadingContext';
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
import './styles/globals.css';

type Page = 'landing' | 'login' | 'app';

interface User {
  id?: string;
  name: string;
  role: string;
  email: string;
}

function AppInner() {
  const [page, setPage] = useState<Page>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const { showLoader, hideLoader } = useGlobalLoader();

  const handleLogin = (u: User) => {
    setUser(u);
    setCurrentTab('dashboard');
    setPage('app');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentTab('dashboard');
    setSelectedCaseId(null);
    setPage('landing');
  };

  const handleNavigate = (tab: string, caseId?: string) => {
    if (caseId) {
      setSelectedCaseId(caseId);
      setCurrentTab('casedetail');
    } else {
      if (tab === 'queue') {
        setSelectedCaseId(null);
      }
      setCurrentTab(tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentTab('casedetail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
              {/* Interactive preview trigger for light-orange sliding diamond loader */}
              <button
                type="button"
                onClick={() => {
                  showLoader(
                    'Multi-Modal Fraud Engine Processing...',
                    'Reconciling transaction graph clusters & computing anomaly vector distance...',
                    'Zero-Mock Engine'
                  );
                  setTimeout(() => {
                    hideLoader();
                  }, 3000);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(255, 162, 74, 0.12)',
                  border: '1px solid rgba(255, 162, 74, 0.35)',
                  color: 'var(--color-primary, #FF5A14)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 162, 74, 0.22)';
                  e.currentTarget.style.borderColor = '#FFA24A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 162, 74, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(255, 162, 74, 0.35)';
                }}
                title="Preview Global Loader (Lottie sliding diamond animation in light orange)"
              >
                <span
                  style={{
                    width: '9px',
                    height: '9px',
                    transform: 'rotate(-45deg)',
                    backgroundColor: '#FFA24A',
                    borderRadius: '2px',
                    display: 'inline-block',
                    boxShadow: '0 0 8px rgba(255, 162, 74, 0.65)',
                  }}
                />
                <span>Test Global Loader</span>
              </button>

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
            {currentTab === 'actions' && <ActionHistoryView />}
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
