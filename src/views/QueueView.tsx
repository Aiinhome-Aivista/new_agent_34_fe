import React, { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Eye, RefreshCw, X } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { apiClient } from '../api/client';
import type { InvestigationCase } from '../api/client';

interface QueueViewProps {
  onSelectCase: (caseId: string) => void;
  initialCaseId?: string;
}

export const QueueView: React.FC<QueueViewProps> = ({ onSelectCase, initialCaseId }) => {
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [search, setSearch] = useState(initialCaseId || '');
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getInvestigations({
        status: statusFilter,
        priority: priorityFilter,
        search: search.trim() || undefined,
        page,
        page_size: pageSize,
      });
      setCases(res.items);
      setTotal(res.total);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [page, statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQueue();
  };

  const handleClearSearch = () => {
    setSearch('');
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div style={{ width: '100%', padding: '32px 36px' }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Investigation Queue
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
            Server-paginated case inventory. Only genuine records persisted in database.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => fetchQueue()} icon={<RefreshCw size={14} />}>
          Refresh Queue
        </Button>
      </div>

      <Card style={{ marginBottom: '24px', padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 260px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by Case ID, TXN, User, or Merchant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '34px', paddingRight: search ? '36px' : '12px' }}
            />
            <Search size={16} color="var(--color-placeholder)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                title="Clear search"
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-secondary)',
                  transition: 'color var(--transition-fast), background-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--color-divider)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status:</span>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="ALL">All Statuses</option>
              <option value="RECEIVED">Received</option>
              <option value="COLLECTING_EVIDENCE">Collecting Evidence</option>
              <option value="UNDER_INVESTIGATION">Under Investigation</option>
              <option value="REQUIRES_REVIEW">Requires Review</option>
              <option value="ACTION_AUTHORIZED">Action Authorized</option>
              <option value="ESCALATED">Escalated</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Priority:</span>
            <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <Button type="submit" size="sm">
            Apply Filters
          </Button>
        </form>
      </Card>

      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading case queue from database...
        </div>
      ) : cases.length === 0 ? (
        <EmptyState
          title="No Matching Cases in Queue"
          description={total === 0 ? "No investigations have been triggered yet in the database." : "No records match the applied filter or search parameters."}
        />
      ) : (
        <Card style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-input-background)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Case ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Trigger Reason</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Priority</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Target Reference</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Received At</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: '1px solid var(--color-divider)', transition: 'background-color var(--transition-fast)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-family-mono)', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {c.id.substring(0, 8)}...
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.trigger_reason}>
                      {c.trigger_reason}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge type={c.priority}>{c.priority}</Badge>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge type={c.status}>{c.status.replace('_', ' ')}</Badge>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-family-mono)', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {c.transaction_id || c.user_id_ref || c.merchant_id_ref || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>
                      {new Date(c.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Button size="sm" variant="outline" onClick={() => onSelectCase(c.id)} icon={<Eye size={14} />}>
                        Inspect & Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--color-divider)' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
              Showing {cases.length} of {total} cases (Page {page} of {totalPages})
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)} icon={<ChevronLeft size={14} />}>
                Prev
              </Button>
              <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)} icon={<ChevronRight size={14} />}>
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
