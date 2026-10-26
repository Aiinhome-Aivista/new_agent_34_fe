import React, { useState } from 'react';
import { X, BookOpen, Search, Shield, CheckCircle } from 'lucide-react';

export default function PolicyDrawer({ isOpen, onClose, policies = [] }) {
  if (!isOpen) return null;

  const [selectedPolicy, setSelectedPolicy] = useState(policies[0] || null);
  const [search, setSearch] = useState('');

  const filtered = policies.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.policy_code.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      maxWidth: '620px',
      background: 'rgba(11, 15, 25, 0.96)',
      backdropFilter: 'blur(20px)',
      boxShadow: '-8px 0 35px rgba(0,0,0,0.6)',
      borderLeft: '1px solid var(--border-subtle)',
      zIndex: 1100,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={20} color="#818cf8" />
          <div>
            <h2 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Fraud Investigation SOPs & Governance Policies
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Versioned policy knowledge base retrieved via Qdrant Semantic RAG
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <input
          type="text"
          placeholder="Search policy codes, criteria, escalation rules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '8px 12px',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Body: Two Column */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Policy List Sidebar */}
        <div style={{ width: '220px', borderRight: '1px solid var(--border-subtle)', overflowY: 'auto', padding: '10px' }}>
          {filtered.map(p => {
            const isSelected = selectedPolicy?.policy_id === p.policy_id;
            return (
              <div
                key={p.policy_id}
                onClick={() => setSelectedPolicy(p)}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  marginBottom: '6px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  border: isSelected ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="font-mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8' }}>
                    {p.policy_code}
                  </span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    v{p.version}
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: isSelected ? '#f8fafc' : 'var(--text-secondary)', fontWeight: 500, lineHeight: '1.2' }}>
                  {p.title}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Policy Content */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {selectedPolicy ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8' }}>
                  {selectedPolicy.policy_code}
                </span>
                <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>
                  Category: {selectedPolicy.category}
                </span>
              </div>
              <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px' }}>
                {selectedPolicy.title}
              </h3>

              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
                color: '#cbd5e1',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedPolicy.content}
              </div>

              {selectedPolicy.metadata_json && (
                <div style={{ marginTop: '16px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <pre style={{ margin: 0 }}>
                    Governance Metadata: {JSON.stringify(selectedPolicy.metadata_json, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Select a policy document to view contents.</p>
          )}
        </div>
      </div>
    </div>
  );
}
