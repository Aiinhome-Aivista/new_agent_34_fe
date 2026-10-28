import React, { useEffect, useState } from 'react';
import { Layers, AlertTriangle, ShieldCheck, Clock, RefreshCw, ArrowUpRight } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { apiClient } from '../api/client';
import type { DashboardSummary } from '../api/client';
import { formatTimeToIST } from '../utils/dateUtils';

interface DashboardViewProps {
  onNavigate: (tab: string, caseId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await apiClient.getDashboardSummary();
      setData(summary);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to backend service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div style={{ width: '100%', padding: '32px 36px' }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Investigation Operations Dashboard
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
            Real-time persisted metrics gathered from MySQL database tables.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" size="sm" onClick={fetchSummary} icon={<RefreshCw size={14} />}>
            Refresh Metrics
          </Button>
          <Button size="sm" onClick={() => onNavigate('simulator')} icon={<ArrowUpRight size={14} />}>
            Concurrency Simulator
          </Button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#DC2626',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Computing persisted metrics from backend database...
        </div>
      ) : data?.is_empty ? (
        <EmptyState
          title="No Investigations Found"
          description="The database has zero active investigation cases. Trigger an investigation signal or launch a concurrent simulation to populate real records."
          action={
            <Button onClick={() => onNavigate('simulator')}>
              Launch Concurrency Signal Ingestion
            </Button>
          }
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Total Investigations
                </span>
                <Layers size={18} color="var(--color-primary)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {data?.total_investigations || 0}
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Pending Human Review
                </span>
                <Clock size={18} color="#D97706" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#D97706' }}>
                {data?.pending_review_count || 0}
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Actions Executed
                </span>
                <ShieldCheck size={18} color="#16A34A" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#16A34A' }}>
                {data?.actions_executed_count || 0}
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Critical Priority
                </span>
                <AlertTriangle size={18} color="#DC2626" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#DC2626' }}>
                {data?.priority_distribution?.CRITICAL || 0}
              </div>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>
            <Card title="Status Distribution">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(data?.status_distribution || {}).map(([status, count]) => (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Badge type={status}>{status.replace('_', ' ')}</Badge>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Priority Distribution">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(data?.priority_distribution || {}).map(([priority, count]) => (
                  <div key={priority} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Badge type={priority}>{priority}</Badge>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card title="Recent Persisted Audit Activity">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data?.recent_activity.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>No audit activity recorded yet.</p>
              ) : (
                data?.recent_activity.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-input-background)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.85rem',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Badge variant="outline">{event.event_type}</Badge>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                        Actor: <strong>{event.actor_type}</strong>
                      </span>
                    </div>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.78rem', fontFamily: 'var(--font-family-mono)' }}>
                      {formatTimeToIST(event.event_timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
