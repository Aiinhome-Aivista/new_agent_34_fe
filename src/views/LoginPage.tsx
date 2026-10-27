import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Zap, ArrowRight, User, Lock, CheckCircle, ArrowLeft, Check } from 'lucide-react';
import { apiClient } from '../api/client';
import type { PersonaUser } from '../api/client';

interface LoginPageProps {
  onLogin: (user: { name: string; role: string; email: string; id?: string }) => void;
  onBack?: () => void;
}

const FALLBACK_PERSONAS: PersonaUser[] = [
  {
    id: 'demo-admin',
    identity_subject: 'SUB_ADMIN_01',
    display_name: 'Vikramaditya Roy',
    role: 'ADMIN',
    email: 'admin@fraudops.ai',
    demo_password: 'admin@123',
    avatar: 'VR',
    badge: 'ADMIN',
    badge_color: '#EF4444',
    description: 'Full system authority: policy manager, parameter engine, and user administration',
  },
  {
    id: 'demo-senior',
    identity_subject: 'SUB_ANALYST_01',
    display_name: 'Priya Sharma',
    role: 'SENIOR_INVESTIGATOR',
    email: 'priya.sharma@fraudops.ai',
    demo_password: 'analyst123',
    avatar: 'PS',
    badge: 'SENIOR',
    badge_color: '#16A34A',
    description: 'Full access to case queue, decisions, and simulator',
  },
  {
    id: 'demo-lead',
    identity_subject: 'SUB_LEAD_01',
    display_name: 'Rahul Verma',
    role: 'SUPERVISOR',
    email: 'rahul.verma@fraudops.ai',
    demo_password: 'riskops99',
    avatar: 'RV',
    badge: 'LEAD',
    badge_color: '#FF5A14',
    description: 'Dashboard analytics and infrastructure oversight',
  },
  {
    id: 'demo-audit',
    identity_subject: 'SUB_AUDIT_01',
    display_name: 'Ananya Bose',
    role: 'AUDITOR',
    email: 'ananya.bose@fraudops.ai',
    demo_password: 'audit2024',
    avatar: 'AB',
    badge: 'AUDIT',
    badge_color: '#6D28D9',
    description: 'Read-only access with full audit trail visibility',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack }) => {
  const [personas, setPersonas] = useState<PersonaUser[]>(FALLBACK_PERSONAS);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<number | null>(null);

  useEffect(() => {
    apiClient.getPersonas()
      .then((data) => {
        if (data && data.length > 0) {
          setPersonas(data);
        }
      })
      .catch((err) => {
        console.warn('Using fallback personas due to API note:', err);
      });
  }, []);

  const handlePersonaSelect = (idx: number) => {
    const p = personas[idx];
    if (!p) return;
    setEmail(p.email);
    setPassword(p.demo_password || 'admin@123');
    setSelectedPersona(idx);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.login({ email, password });
      onLogin({
        name: res.user.display_name,
        role: res.user.role,
        email: res.user.email,
        id: res.user.id,
      });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
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
          padding: '40px 48px',
          background:
            'linear-gradient(135deg, #FF5A14 0%, #FF8A55 50%, #FFB347 100%)',
          position: 'relative',
          overflow: 'hidden',
          height: '100vh',
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
              gap: '12px',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <Shield size={24} color="white" />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                FraudOps AI
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 500 }}>
                Enterprise Fraud Intelligence Platform
              </div>
            </div>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.8rem, 2.5vw, 2.4rem)',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              marginBottom: '16px',
            }}
          >
            Autonomous Fraud <br />
            Investigation at Scale
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              marginBottom: '32px',
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
                marginBottom: '10px',
                color: 'rgba(255,255,255,0.9)',
                fontSize: '0.86rem',
              }}
            >
              <CheckCircle size={15} color="rgba(255,255,255,0.85)" />
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* Right Column Container */}
      <div
        style={{
          flex: 1,
          height: '100vh',
          overflowY: 'auto',
          display: 'flex',
          position: 'relative',
          zIndex: 1,
          padding: '24px 36px',
        }}
        className="login-right-container"
      >
        <div
          style={{
            width: '100%',
            maxWidth: '620px',
            margin: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
          className="login-right-panel"
        >
          {/* Back to home + Brand header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                <Shield size={18} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
                  FraudOps AI
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
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
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: 'var(--color-surface)',
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

          <div style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.03em',
                marginBottom: '4px',
              }}
            >
              Sign in to your workspace
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
              Select a demo persona or enter your credentials below
            </p>
          </div>

          {/* Demo Personas */}
          <div style={{ marginBottom: '18px' }}>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Zap size={13} color="var(--color-primary)" />
              Quick Access — System Personas ({personas.length})
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
              }}
              className="personas-grid"
            >
              {personas.map((p, idx) => (
                <button
                  key={p.id || idx}
                  onClick={() => handlePersonaSelect(idx)}
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${selectedPersona === idx ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    backgroundColor:
                      selectedPersona === idx
                        ? 'rgba(255, 90, 20, 0.08)'
                        : 'var(--color-surface)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)',
                    boxShadow: selectedPersona === idx ? '0 0 0 1px var(--color-primary), var(--shadow-sm)' : 'none',
                    position: 'relative',
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
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      backgroundColor: p.badge_color || 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {p.avatar || p.display_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        marginBottom: '2px',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: 'var(--color-text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.display_name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: `${p.badge_color || '#FF5A14'}18`,
                          color: p.badge_color || '#FF5A14',
                          border: `1px solid ${p.badge_color || '#FF5A14'}35`,
                          flexShrink: 0,
                          letterSpacing: '0.03em',
                        }}
                      >
                        {p.badge || p.role}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--color-text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.role.replace(/_/g, ' ')}
                    </div>
                  </div>
                  {selectedPersona === idx && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(255, 90, 20, 0.4)',
                      }}
                    >
                      <Check size={11} color="white" strokeWidth={3} />
                    </div>
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
              marginBottom: '16px',
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
            <span style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', fontWeight: 500, letterSpacing: '0.02em' }}>
              or sign in manually
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div style={{ marginBottom: '14px' }}>
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
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '14px',
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
                    height: '44px',
                    paddingLeft: '40px',
                    paddingRight: '14px',
                    fontSize: '0.92rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-input-background)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
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
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '14px',
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
                    height: '44px',
                    paddingLeft: '40px',
                    paddingRight: '42px',
                    fontSize: '0.92rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-input-background)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    boxSizing: 'border-box',
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
                    padding: '6px',
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginBottom: '14px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  color: '#DC2626',
                  fontSize: '0.84rem',
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
                height: '46px',
                padding: '0 24px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: loading ? 'var(--color-border)' : 'var(--color-primary)',
                color: 'white',
                fontSize: '0.96rem',
                fontWeight: 700,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all var(--transition-fast)',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(255, 90, 20, 0.35)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'var(--color-hover)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 90, 20, 0.45)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(255, 90, 20, 0.35)';
                }
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
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p
            style={{
              marginTop: '16px',
              textAlign: 'center',
              fontSize: '0.74rem',
              lineHeight: 1.45,
              color: 'var(--color-text-secondary)',
            }}
          >
            This is a demonstration environment. All data is live and production-grade.
            <br />
            No mock records or synthetic data.
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .login-left-panel { display: flex !important; }
          .login-right-panel { max-width: 620px !important; }
        }
        @media (min-width: 1400px) {
          .login-right-panel { max-width: 640px !important; }
        }
        @media (max-width: 640px) {
          .personas-grid { grid-template-columns: 1fr !important; }
        }
        .login-right-container {
          background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 24px 24px;
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
