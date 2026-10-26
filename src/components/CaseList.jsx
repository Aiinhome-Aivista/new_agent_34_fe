import React, { useState } from 'react';
import { Filter, AlertTriangle, Clock, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function CaseList({ cases, selectedCaseId, onSelectCase }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCases = cases.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (priorityFilter && c.priority !== priorityFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.case_number.toLowerCase().includes(q) ||
        c.trigger_reason.toLowerCase().includes(q) ||
        (c.user_id && c.user_id.toLowerCase().includes(q)) ||
        (c.merchant_id && c.merchant_id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'CRITICAL':
      case 'HIGH':
        return <span className="badge badge-high">{p}</span>;
      case 'MEDIUM':
        return <span className="badge badge-medium">{p}</span>;
      default:
        return <span className="badge badge-low">{p}</span>;
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'AWAITING_REVIEW':
        return <span className="badge badge-inconclusive" style={{ fontSize: '0.65rem' }}>AWAITING REVIEW</span>;
      case 'INVESTIGATING':
        return <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>INVESTIGATING...</span>;
      case 'ACTION_EXECUTED':
      case 'CLOSED':
        return <span className="badge badge-legitimate" style={{ fontSize: '0.65rem' }}>{s}</span>;
      case 'ESCALATED':
        return <span className="badge badge-high" style={{ fontSize: '0.65rem' }}>ESCALATED</span>;
      default:
        return <span className="badge badge-medium" style={{ fontSize: '0.65rem' }}>{s}</span>;
    }
  };

  return (
    <div className="glass-panel" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header & Filter */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} color="#06b6d4" />
            <h2 className="font-display" style={{ fontSize: '1rem', fontWeight: 700 }}>
              Investigation Cases
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {filteredCases.length} records
          </span>
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by case #, user, reason..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '7px 10px',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            marginBottom: '10px',
            outline: 'none'
          }}
        />

        {/* Filters */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              flex: 1,
              background: '#0f172a',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontSize: '0.72rem',
              padding: '4px 6px'
            }}
          >
            <option value="">Status: All</option>
            <option value="AWAITING_REVIEW">Awaiting Review</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="INTAKE">Intake</option>
            <option value="ACTION_EXECUTED">Action Executed</option>
            <option value="ESCALATED">Escalated</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              flex: 1,
              background: '#0f172a',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontSize: '0.72rem',
              padding: '4px 6px'
            }}
          >
            <option value="">Priority: All</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Case List Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {filteredCases.length === 0 ? (
          <div style={{ padding: '30px 15px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No cases match the selected filters.
          </div>
        ) : (
          filteredCases.map(c => {
            const isSelected = c.case_id === selectedCaseId;
            return (
              <div
                key={c.case_id}
                onClick={() => onSelectCase(c.case_id)}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.45)',
                  border: isSelected ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid var(--border-subtle)',
                  boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.2)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className="font-mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? '#a5b4fc' : '#38bdf8' }}>
                    {c.case_number}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {getPriorityBadge(c.priority)}
                  </div>
                </div>

                <p style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  marginBottom: '8px',
                  lineHeight: '1.3',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {c.trigger_reason}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <div>
                    {getStatusBadge(c.status)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontSize: '0.65rem' }}>
                      {c.decision_mode}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
