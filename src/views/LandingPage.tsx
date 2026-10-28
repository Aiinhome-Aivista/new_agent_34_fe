import React, { useState, useEffect } from 'react';
import {
  Shield,
  Cpu,
  Network,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Activity,
  Zap,
  Lock,
  TrendingUp,
  AlertTriangle,
  Clock,
  Target,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LandingPageProps {
  onGetStarted: () => void;
}

const TECH_STACK = [
  { label: 'LangGraph', color: '#16A34A', desc: 'Deterministic orchestration' },
  { label: 'ChromaDB', color: '#7C3AED', desc: 'Policy vector search' },
  { label: 'ArangoDB', color: '#FF5A14', desc: 'Entity graph traversal' },
  { label: 'MySQL', color: '#1D6FA0', desc: 'Audit persistence' },
  { label: 'Redis', color: '#DC2626', desc: 'Idempotency & caching' },
  { label: 'Flask', color: '#374151', desc: 'REST API layer' },
];

const FEATURES = [
  {
    icon: Cpu,
    title: 'LangGraph State Machine',
    description:
      'Deterministic orchestration of evidence gathering, graph traversal, and LLM reasoning with bounded retries and schema-validated outputs.',
    color: '#FF5A14',
  },
  {
    icon: Network,
    title: 'Multi-Hop Entity Graph',
    description:
      'ArangoDB traversal detects fraud rings by correlating devices, IPs, and payment instruments shared across users and merchants.',
    color: '#16A34A',
  },
  {
    icon: BookOpen,
    title: 'Policy RAG Engine',
    description:
      'ChromaDB vector search over approved SOPs, chargeback thresholds, and blocking rules. Every citation explicitly anchored.',
    color: '#7C3AED',
  },
  {
    icon: Lock,
    title: 'Decision Gateway',
    description:
      'The LLM never directly executes mutations. High-impact operations are gated behind explicit human analyst authorization.',
    color: '#1D6FA0',
  },
  {
    icon: Target,
    title: 'Idempotency Enforcement',
    description:
      'Redis-backed deduplication prevents duplicate investigations from concurrent upstream signals hitting the same transaction.',
    color: '#DC2626',
  },
  {
    icon: Activity,
    title: 'Real-Time Audit Trail',
    description:
      'Every reasoning step, evidence item, policy citation, and analyst decision is persisted with full provenance metadata.',
    color: '#D97706',
  },
];

const WORKFLOW_STEPS = [
  { step: '01', title: 'Signal Ingestion', desc: 'Fraud alert received via REST webhook from upstream risk system' },
  { step: '02', title: 'Idempotency Check', desc: 'Redis verifies no duplicate in-flight investigation for same transaction' },
  { step: '03', title: 'Evidence Gathering', desc: 'LangGraph executes parallel tool calls across transaction history, velocity data, and device fingerprints' },
  { step: '04', title: 'Graph Traversal', desc: 'ArangoDB multi-hop query reveals shared entities and connected fraud rings' },
  { step: '05', title: 'Policy Retrieval', desc: 'ChromaDB semantic search surfaces applicable SOPs and chargeback thresholds' },
  { step: '06', title: 'AI Recommendation', desc: 'LLM synthesizes evidence into structured recommendation — never directly executes actions' },
  { step: '07', title: 'Human Decision', desc: 'Analyst reviews evidence package and authorizes or rejects recommended action' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const { theme, toggleTheme } = useTheme();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveStep((s) => (s + 1) % WORKFLOW_STEPS.length), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── PUBLIC HEADER ─────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          padding: '0 28px',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <Shield size={19} color="white" />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '1rem',
                  letterSpacing: '-0.02em',
                  color: 'var(--color-text-primary)',
                }}
              >
                FraudOps AI
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                Enterprise Fraud Intelligence
              </div>
            </div>
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={`Theme: ${theme}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: 'var(--color-input-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-orange)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
            >
              {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              <span style={{ textTransform: 'capitalize' }} className="hide-mobile">{theme}</span>
            </button>

            {/* Sign In CTA */}
            <button
              onClick={onGetStarted}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 20px',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-glow)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary)'; }}
            >
              Sign In
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ── PAGE CONTENT ──────────────────────────────────────────── */}
      <main style={{ flex: 1 }}>
        <div
          style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 28px 80px' }}
          className="animate-fade-in"
        >
          {/* ── HERO ──────────────────────────────────────────────── */}
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '56px',
              alignItems: 'center',
              padding: '72px 0 80px',
              borderBottom: '1px solid var(--color-divider)',
              marginBottom: '80px',
            }}
          >
            <div>
              {/* Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-input-background)',
                  border: '1px solid var(--color-border-orange)',
                  color: 'var(--color-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginBottom: '28px',
                  letterSpacing: '0.06em',
                }}
              >
                <Shield size={12} />
                ENTERPRISE FRAUD INTELLIGENCE · LIVE PRODUCTION
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.035em',
                  marginBottom: '22px',
                }}
              >
                Autonomous Fraud Forensics with{' '}
                <span style={{ color: 'var(--color-primary)' }}>Deterministic Governance</span>
              </h1>

              <p
                style={{
                  fontSize: '1.08rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.65,
                  marginBottom: '40px',
                  maxWidth: '520px',
                }}
              >
                Activated exclusively by upstream risk signals. Correlates multi-hop entity graphs, retrieves SOP policies, and formulates evidence-grounded recommendations — with zero hallucinated actions.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '44px' }}>
                <button
                  onClick={onGetStarted}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: '13px 28px',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.97rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-glow)',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-hover)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Access Analyst Workspace
                  <ArrowRight size={18} />
                </button>

                {/* <a
                  href="http://localhost:5000/api/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: '13px 24px',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-orange)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                >
                  <BookOpen size={16} />
                  View API Docs
                </a> */}
              </div>

              {/* Tech stack pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {TECH_STACK.map((t) => (
                  <span
                    key={t.label}
                    title={t.desc}
                    style={{
                      padding: '4px 11px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      backgroundColor: `${t.color}15`,
                      color: t.color,
                      border: `1px solid ${t.color}30`,
                    }}
                  >
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero right: stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { icon: TrendingUp, val: '99.8%', label: 'Idempotency Rate', color: '#16A34A' },
                  { icon: Clock, val: '<2s', label: 'Avg Ingest Latency', color: '#FF5A14' },
                  { icon: AlertTriangle, val: '0', label: 'Mock Records', color: '#7C3AED' },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.label}
                      style={{
                        padding: '18px 12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        textAlign: 'center',
                      }}
                    >
                      <Icon size={20} color={s.color} style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--color-text-primary)' }}>
                        {s.val}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', lineHeight: 1.3, marginTop: '4px' }}>
                        {s.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* How it works teaser */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-input-background)',
                  border: '1px solid var(--color-border-orange)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    letterSpacing: '0.08em',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                  }}
                >
                  <Zap size={13} />
                  LIVE PIPELINE — STEP {WORKFLOW_STEPS[activeStep].step}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                  {WORKFLOW_STEPS[activeStep].title}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {WORKFLOW_STEPS[activeStep].desc}
                </div>

                {/* Step dots */}
                <div style={{ display: 'flex', gap: '5px', marginTop: '16px' }}>
                  {WORKFLOW_STEPS.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveStep(i)}
                      style={{
                        width: i === activeStep ? '20px' : '7px',
                        height: '7px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: i === activeStep ? 'var(--color-primary)' : 'var(--color-border)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-normal)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── FEATURE GRID ──────────────────────────────────────── */}
          <section style={{ marginBottom: '80px' }}>
            <div style={{ textAlign: 'center', maxWidth: '620px', margin: '0 auto 52px' }}>
              <h2
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.025em',
                  marginBottom: '12px',
                }}
              >
                Engineered for High-Consequence Financial Operations
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Strictly separates reasoning from action execution. Meets enterprise auditability, data provenance, and thread-safe ingestion standards.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
              }}
            >
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    style={{
                      padding: '24px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-card-background)',
                      border: '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                      e.currentTarget.style.borderColor = 'var(--color-border-orange)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <div
                        style={{
                          padding: '10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: `${f.color}15`,
                          color: f.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={22} />
                      </div>
                      <h3 style={{ fontSize: '0.97rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {f.title}
                      </h3>
                    </div>
                    <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                      {f.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── CTA BANNER ────────────────────────────────────────── */}
          <section
            style={{
              padding: '48px 40px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--color-input-background) 0%, var(--color-surface) 100%)',
              border: '1px solid var(--color-border-orange)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--color-primary)',
                fontWeight: 800,
                fontSize: '0.95rem',
                marginBottom: '14px',
              }}
            >
              <CheckCircle size={20} />
              NON-NEGOTIABLE INTEGRITY GUARANTEE
            </div>
            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--color-text-secondary)',
                maxWidth: '680px',
                margin: '0 auto 32px',
                lineHeight: 1.65,
              }}
            >
              Every case, evidence item, and audit log is persisted in MySQL and gathered from live API data sources. Zero synthetic mock records, seeded demo cases, or cosmetic fallbacks at any layer.
            </p>
            <button
              onClick={onGetStarted}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '9px',
                padding: '14px 32px',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-glow)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-hover)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Access Analyst Workspace
              <ArrowRight size={18} />
            </button>
          </section>
        </div>
      </main>

      {/* ── PUBLIC FOOTER ─────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: '16px 28px',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-secondary)',
          fontSize: '0.75rem',
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
        <span>Zero-Mock Architecture · LangGraph · ChromaDB · ArangoDB · MySQL</span>
      </footer>

      <style>{`
        @media (max-width: 600px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
};
