import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { GlobalLoader } from '../components/common/GlobalLoader';
import { apiClient } from '../api/client';
import type { IntegrationItem } from '../api/client';

export const IntegrationsView: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getIntegrationsStatus();
      setIntegrations(res.integrations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  return (
    <div style={{ width: '100%', padding: '32px 36px' }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Infrastructure &amp; Integration Health
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
            Real connectivity status for all forensic storage, RAG vector index, graph, and runtime layers.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchIntegrations} icon={<RefreshCw size={14} />}>
          Re-check Connectivity
        </Button>
      </div>

      {loading ? (
        <GlobalLoader
          size="lg"
          text="Verifying System &amp; Infrastructure Integrations"
          subtext="Performing live health checks across MySQL, ChromaDB, ArangoDB, and Redis..."
          badge="Live Health Probe"
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {integrations.map((item, idx) => (
            <Card key={idx}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                  {item.name}
                </span>
                <Badge type={item.status}>{item.status}</Badge>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '8px' }}>
                {item.type}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
