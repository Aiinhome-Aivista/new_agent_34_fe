import React from 'react';
import { Shield, Sparkles, User, RefreshCw, PlusCircle, BookOpen, Database } from 'lucide-react';

export default function Header({ currentUser, onSwitchUser, onOpenTriggerModal, onOpenPolicyDrawer, onRefresh }) {
  const users = [
    { username: 'admin', role: 'ADMIN', name: 'System Admin' },
    { username: 'priya.investigator', role: 'INVESTIGATOR', name: 'Priya Sharma (Sr. Inv.)' },
    { username: 'ananya.approver', role: 'APPROVER', name: 'Ananya Sen (Risk Approver)' },
    { username: 'vikram.auditor', role: 'AUDITOR', name: 'Vikram Rao (Compliance Auditor)' },
  ];

  return (
    <header className="glass-panel" style={{ padding: '14px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: '0 0 16px 16px' }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
        }}>
          <Shield size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #f8fafc, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AGENT 34
            </h1>
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '4px', color: '#38bdf8', fontWeight: 700 }}>
              v1.0 ORCHESTRATOR
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Merchant & User Fraud Investigation Intelligence
          </p>
        </div>
      </div>

      {/* Database & Service Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '8px',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.78rem'
        }}>
          <Database size={15} color="#10b981" />
          <span style={{ color: 'var(--text-secondary)' }}>DB:</span>
          <span className="font-mono" style={{ color: '#34d399', fontWeight: 600 }}>Agent_34 (Local MySQL 8.0)</span>
        </div>

        {/* Policies button */}
        <button
          onClick={onOpenPolicyDrawer}
          className="btn btn-outline"
          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          title="Browse versioned investigation SOPs and governance documents"
        >
          <BookOpen size={15} color="#818cf8" />
          Fraud Policies RAG
        </button>

        {/* Trigger New Case */}
        <button
          onClick={onOpenTriggerModal}
          className="btn btn-primary"
          style={{ fontSize: '0.78rem', padding: '6px 14px' }}
        >
          <PlusCircle size={15} />
          Simulate External Trigger
        </button>

        {/* User Role Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 14px',
          borderRadius: '8px',
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}>
          <User size={16} color="#a5b4fc" />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e0e7ff' }}>
              {currentUser?.full_name || 'Authenticating...'}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
              Role: <span style={{ color: '#38bdf8', fontWeight: 700 }}>{currentUser?.role}</span>
            </div>
          </div>

          <select
            value={currentUser?.username || 'priya.investigator'}
            onChange={(e) => onSwitchUser(e.target.value)}
            style={{
              background: '#0f172a',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '0.75rem',
              padding: '4px 8px',
              cursor: 'pointer'
            }}
          >
            {users.map(u => (
              <option key={u.username} value={u.username}>
                Switch: {u.role} ({u.username})
              </option>
            ))}
          </select>
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="btn btn-outline"
          style={{ padding: '8px', borderRadius: '8px' }}
          title="Refresh Data"
        >
          <RefreshCw size={15} />
        </button>
      </div>
    </header>
  );
}
