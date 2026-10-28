import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { GlobalLoader } from '../components/common/GlobalLoader';
import { apiClient } from '../api/client';
import { formatToIST } from '../utils/dateUtils';

export const ActionHistoryView: React.FC = () => {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ width: '100%', padding: '32px 36px' }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Executed Action History
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
            Traceable business mutations executed through the separate Action Service boundary.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchActions} icon={<RefreshCw size={14} />}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <GlobalLoader
          size="md"
          text="Loading Action Execution History"
          subtext="Retrieving immutable audit logs and authorized mutations..."
          badge="Audit Trail"
        />
      ) : actions.length === 0 ? (
        <EmptyState
          title="No Actions Executed Yet"
          description="Zero business mutations have occurred. Actions are only executed when explicitly authorized through the Decision Gateway."
        />
      ) : (
        <Card style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-input-background)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action Request ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action Type</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Decision Type</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Target Reference</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Downstream Conf Ref</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Executed At</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-family-mono)', color: 'var(--color-primary)' }}>
                      {a.id.substring(0, 8)}...
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{a.action_type}</td>
                    <td style={{ padding: '12px 16px' }}>{a.decision_type}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-family-mono)', fontSize: '0.82rem' }}>
                      {a.target_reference}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge type={a.execution_status}>{a.execution_status}</Badge>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-family-mono)', fontSize: '0.82rem', color: '#16A34A' }}>
                      {a.downstream_reference || 'Pending'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>
                      {formatToIST(a.executed_at, { fallback: 'N/A' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};