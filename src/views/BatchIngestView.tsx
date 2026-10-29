import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  ArrowRight,
  Cpu,
  Layers,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { apiClient } from '../api/client';
import { formatToIST } from '../utils/dateUtils';
import { useTaskProgress } from '../context/TaskProgressContext';

interface BatchIngestViewProps {
  onNavigateToCase?: (caseId: string) => void;
  onNavigateToQueue?: () => void;
}

export const BatchIngestView: React.FC<BatchIngestViewProps> = ({
  onNavigateToCase,
  onNavigateToQueue
}) => {
  const {
    activeTask,
    startBatchIngest,
    latestBatchResult,
  } = useTaskProgress();

  const isBatchRunning = activeTask?.type === 'batch_ingest' && activeTask?.status === 'running';
  const displayedResult = (activeTask?.type === 'batch_ingest' && activeTask?.result) || latestBatchResult;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [autoInvestigate, setAutoInvestigate] = useState(true);
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
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an Excel (.xlsx) or CSV (.csv) file.');
      return;
    }

    setError(null);

    try {
      await startBatchIngest(selectedFile, autoInvestigate);
      fetchPollerStatus();
    } catch (err: any) {
      setError(err.message || 'File ingestion failed.');
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
              Interval: <strong>{pollerStatus?.poll_interval_seconds || 30}s</strong> · Last Polled: <strong>{formatToIST(pollerStatus?.last_polled_at, { fallback: 'Standby / Just now' })}</strong>
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

            {isBatchRunning && activeTask && (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid #10B981',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.85rem', color: '#10B981' }}>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Processing Batch Ingestion Live</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {activeTask.current} / {activeTask.total || '?'} records ({activeTask.progress}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${activeTask.progress}%`, backgroundColor: '#10B981', transition: 'width 0.35s ease' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{activeTask.message}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Floating dock active at bottom-right</span>
                </div>
              </div>
            )}

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
              disabled={isBatchRunning || !selectedFile}
              icon={isBatchRunning ? <RefreshCw size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            >
              {isBatchRunning
                ? `Ingesting ${activeTask?.current || 0}/${activeTask?.total || '?'} records (${activeTask?.progress || 0}%)...`
                : 'Ingest File & Trigger Agent'}
            </Button>
          </form>
        </Card>

        {/* Guidelines Card */}
        {/* <Card title="Microservice Batch Format (m_* Master Tables)">
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: 1.5 }}>
            <p style={{ margin: 0 }}>
              The ingestion engine supports a simplified <strong>3-4 column</strong> format. It searches the master user directory (<code>m_users</code>) by <code>user_id</code> or <code>email</code>, correlates linked orders (<code>m_orders</code>), payments (<code>m_payments</code>), and disputes (<code>m_chargebacks</code>), and immediately executes AI fraud investigation:
            </p>

            <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>user_id</strong> (Required): Customer identifier (e.g. <code>USR_FRAUD_RING_01</code>).</li>
              <li><strong>user_name</strong> (Optional): Full name for display and auto-provisioning.</li>
              <li><strong>email</strong> (Optional): Used as primary or fallback lookup in <code>m_users</code>.</li>
              <li><strong>reason</strong> (Optional): Specific trigger context or audit alert notes.</li>
            </ul>

            <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-input-background)', border: '1px solid var(--color-border)', marginTop: '4px' }}>
              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} color="#10B981" /> 4-Column Template Ready to Test
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem' }}>
                Click <strong>"Download Sample CSV Template"</strong> above for pre-configured test personas (Fraud Ring, KYC Pending, Verified VIP, Chargeback Heavy, Account Takeover, and Dormant Spike).
              </p>
            </div>
          </div>
        </Card> */}
      </div>

      {/* Ingestion Results & Case Table */}
      {displayedResult && (
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
            <div>{displayedResult.message}</div>
            {onNavigateToQueue && (
              <Button variant="secondary" size="sm" onClick={onNavigateToQueue} icon={<ArrowRight size={14} />}>
                Go to Case Queue
              </Button>
            )}
          </div>

          {displayedResult.triggered_cases && displayedResult.triggered_cases.length > 0 && (
            <Card title={`Triggered Investigation Cases (${displayedResult.triggered_cases.length})`}>
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
                    {displayedResult.triggered_cases.map((c: any) => (
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
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {c.user_name || c.user_id}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                            User: <code>{c.user_id}</code> {c.is_provisioned && <span style={{ color: '#F59E0B', fontSize: '0.72rem' }}>(New)</span>}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
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
