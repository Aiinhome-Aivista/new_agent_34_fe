import React, { useState } from 'react';
import { Database, User, ShoppingBag, CreditCard, RefreshCw, FileCode, CheckCircle, ShieldAlert } from 'lucide-react';

export default function EvidenceTabs({ evidenceRecords = [] }) {
  const [activeTab, setActiveTab] = useState('ALL');

  const filtered = activeTab === 'ALL'
    ? evidenceRecords
    : evidenceRecords.filter(e => e.source_type.includes(activeTab));

  return (
    <div className="glass-panel" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={16} color="#06b6d4" />
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            Evidence Repository ({evidenceRecords.length} Items Captured)
          </h3>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'USER', 'ORDER', 'PAYMENT', 'CHARGEBACK', 'POLICY'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: activeTab === tab ? '1px solid rgba(99, 102, 241, 0.6)' : '1px solid var(--border-subtle)',
                color: activeTab === tab ? '#e0e7ff' : 'var(--text-muted)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Items Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
            No evidence items recorded for this filter category.
          </p>
        ) : (
          filtered.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>
                    {item.source_type}
                  </span>
                  <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>
                    {item.record_identifier}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {item.is_counter_signal ? (
                    <span className="badge badge-legitimate" style={{ fontSize: '0.62rem' }}>Counter-Signal</span>
                  ) : (
                    <span className="badge badge-suspicious" style={{ fontSize: '0.62rem' }}>Risk Evidence</span>
                  )}
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {new Date(item.collected_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                {item.summary}
              </p>

              {/* Collapsible / Monospace Payload preview */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '8px 10px',
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: '#94a3b8',
                maxHeight: '120px',
                overflowY: 'auto'
              }}>
                <pre style={{ margin: 0 }}>
                  {JSON.stringify(item.evidence_payload, null, 2)}
                </pre>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
