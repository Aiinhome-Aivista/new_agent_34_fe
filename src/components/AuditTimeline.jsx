import React from 'react';
import { History, Shield, User, Bot, CheckCircle, ArrowDownCircle, Cpu } from 'lucide-react';

export default function AuditTimeline({ auditEvents = [] }) {
  const getActorBadge = (type) => {
    switch (type) {
      case 'AGENT':
        return <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', fontSize: '0.65rem', fontWeight: 600 }}>AI AGENT</span>;
      case 'APPROVER':
      case 'ANALYST':
        return <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', fontSize: '0.65rem', fontWeight: 600 }}>HUMAN</span>;
      default:
        return <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(100, 116, 139, 0.15)', color: '#cbd5e1', fontSize: '0.65rem', fontWeight: 600 }}>SYSTEM</span>;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
        <History size={16} color="#818cf8" />
        <h3 style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
          Immutable Audit Lineage ({auditEvents.length} Events)
        </h3>
      </div>

      <div style={{ position: 'relative', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Timeline bar */}
        <div style={{
          position: 'absolute',
          left: '6px',
          top: '8px',
          bottom: '8px',
          width: '2px',
          background: 'rgba(255, 255, 255, 0.1)'
        }} />

        {auditEvents.length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No audit events logged yet.</p>
        ) : (
          auditEvents.map((evt, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              {/* Dot */}
              <div style={{
                position: 'absolute',
                left: '-18px',
                top: '4px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: evt.actor_type === 'AGENT' ? '#06b6d4' : (evt.actor_type === 'APPROVER' ? '#10b981' : '#6366f1'),
                boxShadow: '0 0 8px currentColor'
              }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="font-mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                    {evt.event_type}
                  </span>
                  {getActorBadge(evt.actor_type)}
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {new Date(evt.created_at).toLocaleTimeString()}
                </span>
              </div>

              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                {evt.event_description}
              </p>

              {evt.event_payload && (
                <div style={{
                  marginTop: '4px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: '#94a3b8'
                }}>
                  {JSON.stringify(evt.event_payload)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
