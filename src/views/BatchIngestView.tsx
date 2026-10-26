import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Layers,
  Sliders,
  Check,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { apiClient } from '../api/client';

interface BatchIngestViewProps {
  onNavigateToCase?: (caseId: string) => void;
  onNavigateToQueue?: () => void;
}

export const BatchIngestView: React.FC<BatchIngestViewProps> = ({
  onNavigateToCase,
  onNavigateToQueue
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [autoInvestigate, setAutoInvestigate] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Poller Status State
  const [pollerStatus, setPollerStatus] = useState<any | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const fetchPollerStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await apiClient.getIngestStatus();
      setPollerStatus(data);
    } catch (err: any) {
      console.warn('Could not fetch poller status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchPollerStatus();
    const interval = setInterval(fetchPollerStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an Excel (.xlsx) or CSV (.csv) file.');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('auto_investigate', autoInvestigate.toString());

    try {
      const res = await apiClient.uploadBatchFile(formData);
      setResult(res);
      fetchPollerStatus();
    } catch (err: any) {
      setError(err.message || 'File ingestion failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open(apiClient.getSampleTemplateUrl(), '_blank');
  };

  return (
    <div style={{ width: '100%', padding: '32px 36px' }} className="animate-fade-in">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
              }}
            >
              <FileSpreadsheet size={18} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Batch Ingestion &amp; Auto-Trigger Engine
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              LIVE PIPELINE
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', margin: 0, maxWidth: '800px' }}>
            Ingest multiple user payment records via Excel or CSV. The agent automatically triggers evidence collection, policy checks, graph correlation, and risk determination in real-time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadTemplate}
            icon={<Download size={14} />}
          >
            Download Sample CSV Template
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchPollerStatus}
            icon={<RefreshCw size={14} className={loadingStatus ? 'animate-spin' : ''} />}
          >
            Refresh Poller
          </Button>
        </div>
      </div>

      {/* Auto-Trigger Poller Status Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            padding: '18px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: pollerStatus?.is_running ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: pollerStatus?.is_running ? '#10B981' : '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {pollerStatus?.is_running ? 'Active Background Poller' : 'Poller Standby'}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Interval: <strong>{pollerStatus?.poll_interval_seconds || 30}s</strong> (configured in <code>.env</code>)
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '18px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Cpu size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>Auto-Trigger Ingestion</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Watch folder: <code style={{ fontSize: '0.72rem' }}>./data/incoming_excel</code>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '18px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 90, 20, 0.15)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {pollerStatus?.total_auto_ingested || 0} Records
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Total Auto-Processed &amp; Saved
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Instructions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Upload Card */}
        <Card title="Upload Excel / CSV Batch File">
          <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                border: '2px dashed var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '36px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--color-input-background)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onClick={() => document.getElementById('batch-file-input')?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setSelectedFile(e.dataTransfer.files[0]);
                }
              }}
            >
              <input
                id="batch-file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 90, 20, 0.1)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                }}
              >
                <UploadCloud size={24} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>
                {selectedFile ? selectedFile.name : 'Click to select or drag & drop file here'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                Supports Microsoft Excel (<code>.xlsx</code>) and comma-separated (<code>.csv</code>)
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="auto-investigate-toggle"
                checked={autoInvestigate}
                onChange={(e) => setAutoInvestigate(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="auto-investigate-toggle" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                Auto-trigger Agent Investigation immediately for all rows
              </label>
            </div>

            {error && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #EF4444',
                  color: '#EF4444',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={uploading || !selectedFile}
              icon={<UploadCloud size={16} />}
            >
              {uploading ? 'Processing File & Running Investigations...' : 'Ingest File & Trigger Agent'}
            </Button>
          </form>
        </Card>

        {/* Guidelines Card */}
        <Card title="Batch File Specification & Parameters">
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: 1.5 }}>
            <p style={{ margin: 0 }}>
              The ingestion engine synchronizes the 4 required domain tables (<strong>users</strong>, <strong>orders</strong>, <strong>payments</strong>, <strong>chargebacks</strong>) and immediately evaluates each user against active detection parameters:
            </p>

            <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>KYC Verification:</strong> <code>kyc_status=VERIFIED</code> marks legitimate profile.</li>
              <li><strong>Velocity &amp; Failures:</strong> <code>payment_status=FAILED</code> triggers decline audit.</li>
              <li><strong>High-Value Limit:</strong> Transactions &gt; <code>50,000</code> escalate to priority.</li>
              <li><strong>Device Footprints:</strong> Matching <code>device_id</code> across accounts triggers Sybil ring check.</li>
              <li><strong>Dispute Rates:</strong> <code>dispute_count &gt; 0</code> creates chargeback records and flags <code>SUSPICIOUS</code>.</li>
            </ul>

            <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-input-background)', border: '1px solid var(--color-border)', marginTop: '4px' }}>
              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} color="#10B981" /> Ready-to-Test Template Available
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem' }}>
                Click <strong>"Download Sample CSV Template"</strong> above to get a pre-populated file with 5 realistic test cases (Normal user, card velocity fraud, KYC unverified fraud, shared device ring, dispute spike).
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Ingestion Results & Case Table */}
      {result && (
        <div style={{ marginBottom: '32px' }} className="animate-fade-in">
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10B981',
              color: '#10B981',
              fontWeight: 700,
              fontSize: '0.95rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>{result.message}</div>
            {onNavigateToQueue && (
              <Button variant="secondary" size="sm" onClick={onNavigateToQueue} icon={<ArrowRight size={14} />}>
                Go to Case Queue
              </Button>
            )}
          </div>

          {result.triggered_cases && result.triggered_cases.length > 0 && (
            <Card title={`Triggered Investigation Cases (${result.triggered_cases.length})`}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'var(--color-input-background)',
                        borderBottom: '1px solid var(--color-border)',
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.78rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <th style={{ padding: '12px 14px' }}>Case ID</th>
                      <th style={{ padding: '12px 14px' }}>Target User &amp; Tx</th>
                      <th style={{ padding: '12px 14px' }}>Assessment</th>
                      <th style={{ padding: '12px 14px' }}>Recommended Action</th>
                      <th style={{ padding: '12px 14px' }}>Agent Findings &amp; Rationale</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.triggered_cases.map((c: any) => (
                      <tr
                        key={c.case_id}
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          transition: 'background-color var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <code style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                            {c.case_id.slice(0, 10)}...
                          </code>
                          <div style={{ marginTop: '4px' }}>
                            <Badge type={c.priority}>{c.priority}</Badge>
                          </div>
                        </td>

                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.user_id}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                            Tx: <code>{c.transaction_id}</code>
                          </div>
                        </td>

                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <Badge type={c.assessment}>{c.assessment}</Badge>
                        </td>

                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              color: c.recommendation.includes('BLOCK') ? '#EF4444' : 'var(--color-text-primary)',
                            }}
                          >
                            {c.recommendation}
                          </span>
                        </td>

                        <td style={{ padding: '12px 14px', maxWidth: '400px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                          {c.explanation}
                        </td>

                        <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {onNavigateToCase && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => onNavigateToCase(c.case_id)}
                              icon={<ArrowRight size={13} />}
                            >
                              Inspect
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
