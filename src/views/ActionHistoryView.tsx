import React, { useEffect, useState, useMemo } from 'react';
import {
  RefreshCw,
  Lock,
  Unlock,
  ShieldCheck,
  User,
  FileText,
  Eye,
  X,
  Search,
  CheckCircle2,
  ExternalLink,
  History,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { GlobalLoader } from '../components/common/GlobalLoader';
import { apiClient } from '../api/client';
import { formatToIST } from '../utils/dateUtils';

interface ActionDetailModalProps {
  actionId: string;
  onClose: () => void;
  onNavigateToCase?: (caseId: string) => void;
}

const ActionAuditDetailModal: React.FC<ActionDetailModalProps> = ({ actionId, onClose, onNavigateToCase }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.getActionDetails(actionId);
        if (isMounted) setData(res);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to fetch action audit details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [actionId]);

  const user = data?.user_profile;
  const c = data?.case;
  const decision = data?.analyst_decision;
  const auditEvents = data?.audit_trail || [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-card-background, #FFFFFF)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
        className="animate-scale-in"
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-input-background, #F8FAFC)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor:
                  data?.action_type === 'LOCK_USER' || data?.action_type === 'BLOCK_USER'
                    ? '#FEE2E2'
                    : data?.action_type === 'UNLOCK_USER'
                    ? '#DCFCE7'
                    : '#EFF6FF',
                color:
                  data?.action_type === 'LOCK_USER' || data?.action_type === 'BLOCK_USER'
                    ? '#DC2626'
                    : data?.action_type === 'UNLOCK_USER'
                    ? '#16A34A'
                    : '#2563EB'
              }}
            >
              {data?.action_type === 'LOCK_USER' || data?.action_type === 'BLOCK_USER' ? (
                <Lock size={20} />
              ) : data?.action_type === 'UNLOCK_USER' ? (
                <Unlock size={20} />
              ) : (
                <Shield size={20} />
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Action Audit Trail: {data?.action_type || 'Loading...'}
                </h2>
                {data?.execution_status && (
                  <Badge type={data.execution_status}>{data.execution_status}</Badge>
                )}
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-family-mono)' }}>
                Request ID: {actionId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? (
            <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
              <GlobalLoader size="md" />
            </div>
          ) : error ? (
            <div style={{ padding: '16px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '8px', fontSize: '0.88rem' }}>
              {error}
            </div>
          ) : data ? (
            <>
              {/* 1. Live Target Customer State Card */}
              <div
                style={{
                  padding: '16px 20px',
                  backgroundColor: user?.status === 'BLOCKED' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(248, 250, 252, 0.8)',
                  borderRadius: '12px',
                  border: `1px solid ${user?.status === 'BLOCKED' ? '#FCA5A5' : 'var(--color-border)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} color="var(--color-primary)" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      Target Customer & Live Database State
                    </span>
                  </div>
                  {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Current DB Status:</span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor: user.status === 'BLOCKED' ? '#DC2626' : '#16A34A',
                          color: '#FFFFFF'
                        }}
                      >
                        {user.status === 'BLOCKED' ? <Lock size={12} /> : <Unlock size={12} />}
                        {user.status === 'BLOCKED' ? 'LOCKED / BLOCKED' : 'ACTIVE'}
                      </span>
                    </div>
                  ) : (
                    <Badge type="MEDIUM">Target: {data.target_reference}</Badge>
                  )}
                </div>

                {user ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.84rem' }}>
                    <div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>Name / User ID</div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{user.display_name}</div>
                      <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {user.user_id}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>Risk Score / Level</div>
                      <div style={{ fontWeight: 600, color: user.risk_level === 'HIGH' ? '#DC2626' : 'var(--color-text-primary)' }}>
                        {user.risk_level} ({user.risk_score})
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>KYC Profile Status</div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{user.kyc_status}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>Domain Activity</div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {user.orders_count} Orders | {user.payments_count} Payments
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                    Customer identifier: <strong>{data.target_reference}</strong>. Direct record not found in master table.
                  </p>
                )}
              </div>

              {/* 2. Analyst Decision & Justification */}
              {decision && (
                <div style={{ padding: '16px 20px', backgroundColor: 'var(--color-input-background, #F8FAFC)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#16A34A" />
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        Analyst Reviewer Authorization
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                      Authorized By: <strong>{decision.reviewer_name}</strong> ({decision.decision})
                    </span>
                  </div>
                  <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-card-background, #FFF)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                    "{decision.reason}"
                  </div>
                  {decision.policy_reference && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                      Enforced Policy: <Badge type="LOW">{decision.policy_reference}</Badge>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Originating Case & AI Recommendation */}
              {c && (
                <div style={{ padding: '16px 20px', backgroundColor: 'var(--color-input-background, #F8FAFC)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="var(--color-primary)" />
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        Originating Case & AI Recommendation
                      </span>
                    </div>
                    {onNavigateToCase && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToCase(c.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        Open Case <ExternalLink size={12} />
                      </button>
                    )}
                  </div>

                  <p style={{ margin: '0 0 10px 0', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                    <strong>Trigger Note:</strong> {c.trigger_reason}
                  </p>

                  {c.recommendation && (
                    <div style={{ padding: '12px', backgroundColor: 'var(--color-card-background, #FFF)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Badge type={c.recommendation.assessment}>{c.recommendation.assessment}</Badge>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                          Proposed: {c.recommendation.recommendation_type}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
                          Model: {c.recommendation.model_name}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-primary)', lineHeight: 1.45 }}>
                        {c.recommendation.explanation}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Immutable Audit Trail Timeline */}
              <div style={{ padding: '16px 20px', backgroundColor: 'var(--color-input-background, #F8FAFC)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <History size={16} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Chronological Audit Trail ({auditEvents.length} Events)
                  </span>
                </div>

                {auditEvents.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                    No audit records logged for this correlation ID.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {auditEvents.map((ev: any, idx: number) => (
                      <div
                        key={ev.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '10px 14px',
                          backgroundColor: 'var(--color-card-background, #FFF)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          fontSize: '0.82rem'
                        }}
                      >
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor:
                              ev.event_type === 'ACTION_EXECUTED'
                                ? '#16A34A'
                                : ev.event_type === 'DECISION_SUBMITTED'
                                ? '#2563EB'
                                : '#D97706',
                            marginTop: '6px',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{ev.event_type}</span>
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                              {formatToIST(ev.event_timestamp)}
                            </span>
                          </div>
                          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}>
                            Actor: <strong>{ev.actor_type}</strong> ({ev.actor_id || 'System'}) | Correlation: {ev.correlation_id?.substring(0, 16)}...
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 28px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            backgroundColor: 'var(--color-input-background, #F8FAFC)'
          }}
        >
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Inspection
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ActionHistoryView: React.FC<{ onNavigateToCase?: (caseId: string) => void }> = ({ onNavigateToCase }) => {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination State - initially 4 rows per page
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getActions();
      setActions(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  // Filtered & Date-sorted actions
  const filteredActions = useMemo(() => {
    return actions.filter((a) => {
      // Type filter
      if (typeFilter !== 'ALL' && a.action_type !== typeFilter) return false;

      // User Status filter
      if (statusFilter !== 'ALL') {
        const uStatus = a.user?.status || 'UNKNOWN';
        if (statusFilter === 'BLOCKED' && uStatus !== 'BLOCKED') return false;
        if (statusFilter === 'ACTIVE' && uStatus !== 'ACTIVE') return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const target = (a.target_reference || '').toLowerCase();
        const userName = (a.user?.name || '').toLowerCase();
        const userId = (a.user?.user_id || '').toLowerCase();
        const id = (a.id || '').toLowerCase();
        const reason = (a.decision_reason || '').toLowerCase();
        const reviewer = (a.reviewer_name || a.requested_by || '').toLowerCase();
        return (
          target.includes(term) ||
          userName.includes(term) ||
          userId.includes(term) ||
          id.includes(term) ||
          reason.includes(term) ||
          reviewer.includes(term)
        );
      }

      return true;
    });
  }, [actions, searchTerm, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredActions.length / pageSize) || 1;

  const paginatedActions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredActions.slice(start, start + pageSize);
  }, [filteredActions, page, pageSize]);

  // Metric counts
  const totalLocked = useMemo(() => {
    const userMap = new Map<string, string>();
    actions.forEach((a) => {
      if (a.user?.user_id && a.user?.status) {
        userMap.set(a.user.user_id, a.user.status);
      }
    });
    return Array.from(userMap.values()).filter((s) => s === 'BLOCKED').length;
  }, [actions]);

  return (
    <div style={{ width: '100%', padding: '32px 36px' }} className="animate-fade-in">
      {/* Header & Metrics */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 6px 0' }}>
            Executed Action History & Audit Log
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Traceable business mutations executed through the Action Service boundary with live customer state persistence.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="secondary" size="sm" onClick={fetchActions} icon={<RefreshCw size={14} />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Executed Actions</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{actions.length}</div>
          </div>
        </Card>

        <Card style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Users Currently Blocked</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#DC2626' }}>{totalLocked}</div>
          </div>
        </Card>

        <Card style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Action Execution Rate</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16A34A' }}>100%</div>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card style={{ padding: '14px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              placeholder="Search by User ID, Name, Action ID, Reason, or Reviewer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 'var(--radius-sm, 8px)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-input-background, #FFF)',
                color: 'var(--color-text-primary)',
                fontSize: '0.86rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Action Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Action:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm, 8px)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-input-background, #FFF)',
                color: 'var(--color-text-primary)',
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Actions</option>
              <option value="LOCK_USER">LOCK_USER</option>
              <option value="UNLOCK_USER">UNLOCK_USER</option>
              <option value="HOLD_TRANSACTION">HOLD_TRANSACTION</option>
              <option value="REQUEST_VERIFICATION">REQUEST_VERIFICATION</option>
              <option value="ESCALATE">ESCALATE</option>
            </select>
          </div>

          {/* User Live Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>User State:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm, 8px)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-input-background, #FFF)',
                color: 'var(--color-text-primary)',
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All States</option>
              <option value="BLOCKED">BLOCKED (Locked)</option>
              <option value="ACTIVE">ACTIVE</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      {loading ? (
        <GlobalLoader size="md" />
      ) : filteredActions.length === 0 ? (
        <EmptyState
          title="No Executed Actions Found"
          description={
            searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'No action records match your current filter criteria.'
              : 'Zero business mutations have occurred. Actions are only executed when explicitly authorized through the Decision Gateway.'
          }
        />
      ) : (
        <Card style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-input-background, #F8FAFC)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Executed Date (IST)
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Action Type
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Target Customer & Live State
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Analyst Justification / Policy
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Authorized Reviewer
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Downstream Status
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedActions.map((a) => {
                  const isBlocked = a.user?.status === 'BLOCKED';
                  const isLockAction = a.action_type === 'LOCK_USER' || a.action_type === 'BLOCK_USER';
                  const isUnlockAction = a.action_type === 'UNLOCK_USER';

                  return (
                    <tr
                      key={a.id}
                      onClick={() => setSelectedActionId(a.id)}
                      style={{
                        borderBottom: '1px solid var(--color-divider, #E2E8F0)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(241, 245, 249, 0.7)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Date & Time */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.84rem' }}>
                          {formatToIST(a.executed_at || a.created_at)}
                        </div>
                        <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>
                          ID: {a.id.substring(0, 8)}...
                        </div>
                      </td>

                      {/* Action Type Badge */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            backgroundColor: isLockAction
                              ? '#FEE2E2'
                              : isUnlockAction
                              ? '#DCFCE7'
                              : '#EFF6FF',
                            color: isLockAction ? '#DC2626' : isUnlockAction ? '#16A34A' : '#2563EB',
                            border: `1px solid ${isLockAction ? '#FCA5A5' : isUnlockAction ? '#86EFAC' : '#BFDBFE'}`
                          }}
                        >
                          {isLockAction ? <Lock size={13} /> : isUnlockAction ? <Unlock size={13} /> : <Shield size={13} />}
                          {a.action_type}
                        </span>
                      </td>

                      {/* Target Customer & Live State */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {a.user?.name || a.target_reference}
                          </span>
                          {/* Live Status Badge */}
                          {a.user ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                backgroundColor: isBlocked ? '#DC2626' : '#16A34A',
                                color: '#FFFFFF'
                              }}
                            >
                              {isBlocked ? <Lock size={10} /> : <Unlock size={10} />}
                              {isBlocked ? 'LOCKED' : 'ACTIVE'}
                            </span>
                          ) : null}
                        </div>
                        <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          {a.target_reference}
                        </div>
                      </td>

                      {/* Justification & Policy */}
                      <td style={{ padding: '14px 18px', maxWidth: '320px' }}>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--color-text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={a.decision_reason || a.policy_reference || 'Authorized operational enforcement'}
                        >
                          {a.decision_reason || 'Enforced per analyst authorization.'}
                        </div>
                        {a.policy_reference && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                            Policy: <strong>{a.policy_reference}</strong>
                          </div>
                        )}
                      </td>

                      {/* Authorized Reviewer */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {a.reviewer_name || a.requested_by || 'System Gateway'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>
                          {a.decision_type}
                        </div>
                      </td>

                      {/* Downstream Execution Status */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Badge type={a.execution_status}>{a.execution_status}</Badge>
                        </div>
                        <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.74rem', color: '#16A34A', marginTop: '2px' }}>
                          {a.downstream_reference || 'CONF_MUTATION_ACK'}
                        </div>
                      </td>

                      {/* Inspect Button */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedActionId(a.id);
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--color-primary)'
                          }}
                        >
                          <Eye size={13} />
                          Audit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderTop: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                Showing <strong>{filteredActions.length === 0 ? 0 : (page - 1) * pageSize + 1}</strong> – <strong>{Math.min(page * pageSize, filteredActions.length)}</strong> of <strong>{filteredActions.length}</strong> actions (Page {page} of {totalPages})
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.78rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-input-background)',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  <option value={4}>4 rows</option>
                  <option value={8}>8 rows</option>
                  <option value={12}>12 rows</option>
                  <option value={20}>20 rows</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                size="sm"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                icon={<ChevronLeft size={14} />}
              >
                Prev
              </Button>

              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    style={{
                      minWidth: '28px',
                      height: '28px',
                      padding: '0 6px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: p === page ? 700 : 500,
                      cursor: 'pointer',
                      backgroundColor: p === page ? 'var(--color-primary)' : 'var(--color-input-background)',
                      color: p === page ? '#FFFFFF' : 'var(--color-text-primary)',
                      border: p === page ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <Button
                size="sm"
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                icon={<ChevronRight size={14} />}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Audit Detail Modal */}
      {selectedActionId && (
        <ActionAuditDetailModal
          actionId={selectedActionId}
          onClose={() => setSelectedActionId(null)}
          onNavigateToCase={onNavigateToCase}
        />
      )}
    </div>
  );
};
