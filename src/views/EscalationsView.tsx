import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ShieldAlert, AlertTriangle, ArrowRight, RefreshCw, UserCheck, Lock, Search } from 'lucide-react';
import { apiClient } from '../api/client';
import type { InvestigationCase } from '../api/client';

interface EscalationsViewProps {
  onSelectCase: (caseId: string) => void;
  currentUser?: { id?: string; name: string; role: string; email: string } | null;
}

export const EscalationsView: React.FC<EscalationsViewProps> = ({ onSelectCase, currentUser }) => {
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<{
    total_escalated: number;
    critical_escalations: number;
    high_escalations: number;
  }>({ total_escalated: 0, critical_escalations: 0, high_escalations: 0 });

  const isSeniorOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SENIOR_INVESTIGATOR';

  const fetchEscalatedCases = async () => {
    setLoading(true);
    try {
      // 1. Fetch cases with status=ESCALATED
      const res = await apiClient.getInvestigations({
        status: 'ESCALATED',
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        search: searchTerm.trim() || undefined,
        page: 1,
        page_size: 50,
      });
      setCases(res.items || []);

      // 2. Fetch stats
      const statsRes = await apiClient.getEscalationStats().catch(() => null);
      if (statsRes) {
        setStats({
          total_escalated: statsRes.total_escalated,
          critical_escalations: statsRes.critical_escalations,
          high_escalations: statsRes.high_escalations,
        });
      } else {
        const crit = (res.items || []).filter((c: InvestigationCase) => c.priority === 'CRITICAL').length;
        const high = (res.items || []).filter((c: InvestigationCase) => c.priority === 'HIGH').length;
        setStats({
          total_escalated: res.total || (res.items || []).length,
          critical_escalations: crit,
          high_escalations: high,
        });
      }
    } catch (err) {
      console.error('Failed to fetch escalated cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalatedCases();
  }, [priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEscalatedCases();
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Banner Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(153, 27, 27, 0.04) 100%)',
          border: '1px solid rgba(220, 38, 38, 0.25)',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
            }}
          >
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                Escalation Desk
              </h1>
              <span
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '12px',
                  letterSpacing: '0.04em',
                }}
              >
                SENIOR COMMITTEE QUEUE
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Dedicated triage queue for high-stakes investigations requiring Senior Fraud Investigator and Administrator authorization.
            </p>
          </div>
        </div>

        {/* Persona Authority Badge */}
        <div>
          {isSeniorOrAdmin ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                border: '1px solid #86EFAC',
                color: '#16A34A',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              <UserCheck size={16} />
              <span>Full Decision Authority Active ({currentUser?.role})</span>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid #FDE047',
                color: '#CA8A04',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <Lock size={15} />
              <span>Read-Only Oversight ({currentUser?.role})</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Total Escalated Cases
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#DC2626', marginTop: '6px' }}>
            {stats.total_escalated}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Pending Senior sign-off
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Critical Priority Escalations
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#EF4444', marginTop: '6px' }}>
            {stats.critical_escalations}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: '4px', fontWeight: 600 }}>
            Immediate action recommended
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            High Priority Escalations
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B', marginTop: '6px' }}>
            {stats.high_escalations}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Flagged for policy ambiguity
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Designated Handlers
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '8px' }}>
            Admin &amp; Senior Investigator
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Email dispatch + In-App Alerts active
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search escalated cases by User ID, Case ID, or reason..."
              style={{ width: '100%', paddingLeft: '36px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Priority:
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>

          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setPriorityFilter('ALL');
              fetchEscalatedCases();
            }}
          >
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
          </Button>
        </form>
      </Card>

      {/* Escalated Cases Table */}
      <Card style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <div>Loading escalated cases...</div>
          </div>
        ) : cases.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <AlertTriangle size={36} style={{ color: '#16A34A', opacity: 0.8, marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: 'var(--color-text-primary)', fontWeight: 700 }}>
              No Pending Escalations
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              All escalated cases have been reviewed and authorized by the Senior Fraud Committee.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}>
                    CASE ID &amp; PRIORITY
                  </th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}>
                    TARGET ENTITY
                  </th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}>
                    ESCALATED BY (SENDER)
                  </th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}>
                    RATIONALE &amp; POLICY CLAUSE
                  </th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}>
                    ESCALATED TIME
                  </th>
                  <th style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}>
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => {
                  const latestDecision = c.decisions && c.decisions.length > 0 ? c.decisions[c.decisions.length - 1] : null;
                  const senderName = latestDecision?.reviewer_name || latestDecision?.reviewer_id || 'Investigator';
                  const rationale = latestDecision?.reason || c.trigger_reason || 'Referred for senior review';
                  const policyRef = latestDecision?.policy_reference || 'FRAUD_SOP_08_COMMITTEE_ESCALATION';

                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Case ID & Priority */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          #{c.id.slice(0, 8)}
                        </div>
                        <div style={{ marginTop: '4px', display: 'flex', gap: '6px' }}>
                          <Badge variant={c.priority.toLowerCase() as any}>
                            {c.priority}
                          </Badge>
                          <span
                            style={{
                              backgroundColor: 'rgba(220, 38, 38, 0.12)',
                              color: '#DC2626',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            ESCALATED
                          </span>
                        </div>
                      </td>

                      {/* Target Entity */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {c.user_id_ref ? <code>{c.user_id_ref}</code> : 'N/A'}
                        </div>
                        {c.transaction_id && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                            Txn: <code>{c.transaction_id.slice(0, 14)}</code>
                          </div>
                        )}
                      </td>

                      {/* Escalated By */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {senderName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          <span
                            style={{
                              backgroundColor: 'var(--color-input-background)',
                              border: '1px solid var(--color-border)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            Investigator Desk
                          </span>
                        </div>
                      </td>

                      {/* Rationale & Policy */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', maxWidth: '340px' }}>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--color-text-primary)',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                          title={rationale}
                        >
                          "{rationale}"
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          Ref: <code>{policyRef}</code>
                        </div>
                      </td>

                      {/* Time Elapsed */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                        {formatTimeAgo(c.updated_at || c.created_at)}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', verticalAlign: 'top' }}>
                        <Button
                          variant={isSeniorOrAdmin ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => onSelectCase(c.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <span>{isSeniorOrAdmin ? 'Review & Authorize' : 'View Case'}</span>
                          <ArrowRight size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
