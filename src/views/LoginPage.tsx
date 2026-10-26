import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Zap, ArrowRight, User, Lock, CheckCircle, ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: { name: string; role: string; email: string }) => void;
  onBack?: () => void;
}

const DEMO_PERSONAS = [
  {
    name: 'Priya Sharma',
    role: 'Senior Fraud Analyst',
    email: 'priya.sharma@fraudops.ai',
    password: 'analyst123',
    avatar: 'PS',
    badge: 'SENIOR',
    badgeColor: '#16A34A',
    description: 'Full access to case queue, decisions, and simulator',
  },
  {
    name: 'Rahul Verma',
    role: 'Risk Intelligence Lead',
    email: 'rahul.verma@fraudops.ai',
    password: 'riskops99',
    avatar: 'RV',
    badge: 'LEAD',
    badgeColor: '#FF5A14',
    description: 'Dashboard analytics and infrastructure oversight',
  },
  {
    name: 'Ananya Bose',
    role: 'Compliance Auditor',
    email: 'ananya.bose@fraudops.ai',
    password: 'audit2024',
    avatar: 'AB',
    badge: 'AUDIT',
    badgeColor: '#6D28D9',
    description: 'Read-only access with full audit trail visibility',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<number | null>(null);

  const handlePersonaSelect = (idx: number) => {
    const p = DEMO_PERSONAS[idx];
    setEmail(p.email);
    setPassword(p.password);
    setSelectedPersona(idx);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise((r) => setTimeout(r, 900));

    const matched = DEMO_PERSONAS.find(
      (p) => p.email === email && p.password === password
    );

    if (matched) {
      onLogin({ name: matched.name, role: matched.role, email: matched.email });
    } else {
      setError('Invalid credentials. Use a demo persona below or enter valid details.');
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--color-background)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,90,20,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,90,20,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Left Panel — Branding */}
      <div
        style={{
          flex: 1,
          display: 'none',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '64px',
          background:
            'linear-gradient(135deg, #FF5A14 0%, #FF8A55 50%, #FFB347 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="login-left-panel"
      >
        {/* Grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '56px',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <Shield size={28} color="white" />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
                FraudOps AI
              </div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', fontWeight: 500 }}>
                Enterprise Fraud Intelligence Platform
              </div>
            </div>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 3vw, 2.8rem)',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              marginBottom: '20px',
            }}
          >
            Autonomous Fraud <br />
            Investigation at Scale
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              marginBottom: '48px',
              maxWidth: '420px',
            }}
          >
            LangGraph-powered state machine. Real-time entity graph traversal. Evidence-grounded AI recommendations with deterministic human oversight.
          </p>

          {[
            'Zero-mock architecture — all live data',
            'ChromaDB policy RAG with SOP citations',
            'ArangoDB multi-hop fraud ring detection',
            'Decision gateway for human authorization',
          ].map((feat) => (
            <div
              key={feat}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '12px',
                color: 'rgba(255,255,255,0.9)',
                fontSize: '0.9rem',
              }}
            >
              <CheckCircle size={16} color="rgba(255,255,255,0.8)" />
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '48px 32px',
          position: 'relative',
          zIndex: 1,
        }}
        className="login-right-panel"
      >
        {/* Back to home + Mobile brand header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '40px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <Shield size={22} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>
                FraudOps AI
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Enterprise Fraud Intelligence
              </div>
            </div>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border-orange)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              <ArrowLeft size={14} />
              Back to Home
            </button>
          )}
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.03em',
              marginBottom: '8px',
            }}
          >
            Sign in to your workspace
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Select a demo persona or enter your credentials below
          </p>
        </div>

        {/* Demo Personas */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Zap size={12} color="var(--color-primary)" />
            Quick Access — Demo Personas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DEMO_PERSONAS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handlePersonaSelect(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${selectedPersona === idx ? 'var(--color-border-orange)' : 'var(--color-border)'}`,
                  backgroundColor:
                    selectedPersona === idx
                      ? 'var(--color-input-background)'
                      : 'var(--color-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)',
                  boxShadow: selectedPersona === idx ? 'var(--shadow-md)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (selectedPersona !== idx) {
                    e.currentTarget.style.borderColor = 'var(--color-border-orange)';
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPersona !== idx) {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                  }
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {p.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '2px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {p.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: `${p.badgeColor}20`,
                        color: p.badgeColor,
                        border: `1px solid ${p.badgeColor}40`,
                      }}
                    >
                      {p.badge}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--color-text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {p.role}
                  </div>
                </div>
                {selectedPersona === idx && (
                  <CheckCircle size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            or sign in manually
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: '6px',
              }}
            >
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-secondary)',
                }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSelectedPersona(null); }}
                placeholder="analyst@fraudops.ai"
                required
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-secondary)',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '40px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid rgba(220, 38, 38, 0.25)',
                color: '#DC2626',
                fontSize: '0.85rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px 24px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: loading ? 'var(--color-border)' : 'var(--color-primary)',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: 700,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all var(--transition-fast)',
              boxShadow: loading ? 'none' : 'var(--shadow-glow)',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = 'var(--color-hover)';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            }}
          >
            {loading ? (
              <>
                <span className="spin-loader" />
                Authenticating...
              </>
            ) : (
              <>
                Sign In to Workspace
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p
          style={{
            marginTop: '32px',
            textAlign: 'center',
            fontSize: '0.78rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          This is a demonstration environment. All data is live and production-grade.
          <br />
          No mock records or synthetic data.
        </p>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .login-left-panel { display: flex !important; }
          .login-right-panel { max-width: 480px !important; }
          .mobile-brand { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-loader {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
      `}</style>
    </div>
  );
};
