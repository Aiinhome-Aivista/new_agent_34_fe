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
  Database,
  ShieldCheck,
  Search,
  UserCheck
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

  // Sample records preview for the 3-4 column specification
  const sampleRows = [
    { id: 'USR_LEGIT_101', name: 'Rahul Sharma', email: 'rahul.sharma@example.com', reason: 'Routine retail transaction risk audit', status: 'VERIFIED' },
    { id: 'USR_SYBIL_RING_01', name: 'Sameer Khan', email: 'sameer.khan@email.com', reason: 'Suspected ATO & emulator cluster', status: 'PENDING' },
    { id: 'USR_UNVERIFIED_103', name: 'Rohan Mehta', email: 'rohan.unverified@tempmail.org', reason: 'High-value INR 1,85,000 transfer without KYC', status: 'PENDING' },
    { id: 'USR_CHARGEBACK_104', name: 'Anita Deshmukh', email: 'anita.disputes@gmail.com', reason: 'Multiple active dispute chargebacks recorded', status: 'VERIFIED' },
    { id: 'USR_DORMANT_105', name: 'Priya Nair', email: 'priya.nair@example.com', reason: 'Sudden reactivation with high velocity', status: 'VERIFIED' },
  ];

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
              Batch Ingestion &amp; Master Search Gateway
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
              3–4 COLUMN SPECIFICATION
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', margin: 0, maxWidth: '850px' }}>
            Upload simplified 3–4 column Excel/CSV lists (<code>user_id</code>, <code>user_name</code>, <code>email</code>, <code>reason</code>). The backend strictly verifies identities against MySQL master tables (<code>m_users</code>, <code>m_orders</code>, <code>m_payments</code>, <code>m_chargebacks</code>) and dispatches real-time forensic investigations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadTemplate}
            icon={<Download size={14} />}
          >
            Download 4-Column Template
          </Button>
          {onNavigateToQueue && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onNavigateToQueue}
              icon={<ArrowRight size={14} />}
            >
              Case Queue
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Upload & 4-Column Specs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Upload Form Card */}
        <Card title="Upload Batch File (.xlsx / .csv)">
          <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div
              style={{
                border: '2px dashed var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '28px',
                textAlign: 'center',
                backgroundColor: selectedFile ? 'rgba(16, 185, 129, 0.05)' : 'var(--color-input-background)',
                transition: 'border-color var(--transition-fast)',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('batch-file-input')?.click()}
            >
              <input
                id="batch-file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 90, 20, 0.1)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <UploadCloud size={24} />
              </div>
              {selectedFile ? (
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB · Click to replace file
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.92rem' }}>
                    Drop Excel or CSV file here, or click to browse
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Requires <code>user_id</code> &amp; <code>user_name</code> (3–4 columns max)
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="auto-inv"
                checked={autoInvestigate}
                onChange={(e) => setAutoInvestigate(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="auto-inv" style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
                Auto-trigger forensic agent and evaluate master evidence immediately
              </label>
            </div>

            {/* Ingestion Progress */}
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
                    <span>Processing Batch &amp; Querying Master Tables...</span>
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
                ? `Ingesting ${activeTask?.current || 0}/${activeTask?.total || '?'} records...`
                : 'Ingest File & Verify Master Records'}
            </Button>
          </form>
        </Card>

        {/* 3-4 Column Specification Guide */}
        <Card title="Simplified 3–4 Column Specification">
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '14px', lineHeight: 1.5 }}>
            <p style={{ margin: 0 }}>
              The ingestion pipeline expects strictly 3 to 4 headers. The engine uses <code>user_id</code> to query the master data layer (<code>m_users</code>, <code>m_orders</code>, <code>m_payments</code>, <code>m_chargebacks</code>):
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-input-background)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.82rem' }}>1. user_id (Mandatory)</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Unique customer ID (e.g. <code>USR_LEGIT_101</code>)
                </div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-input-background)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.82rem' }}>2. user_name (Mandatory)</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Target user display name (e.g. <code>Rahul Sharma</code>)
                </div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-input-background)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.82rem' }}>3. email (Optional)</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Secondary query key for <code>m_users</code> lookup
                </div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-input-background)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.82rem' }}>4. reason (Optional)</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Trigger context for audit logs &amp; Policy RAG
                </div>
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ fontWeight: 700, color: '#10B981', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={14} /> Master MySQL Integration Active
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                All 4 master tables (<code>m_users</code>, <code>m_orders</code>, <code>m_payments</code>, <code>m_chargebacks</code>) are indexed in the primary MySQL database. Seeding includes 11 realistic test personas ready to verify.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Visual Sample Preview Table */}
      <div style={{ marginBottom: '32px' }}>
        <Card title="Pre-Seeded Master Personas Ready for Ingestion">
          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: '0 0 16px 0' }}>
            The sample template matches records present in the <code>m_users</code> master table:
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-input-background)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>user_id</th>
                  <th style={{ padding: '10px 14px' }}>user_name</th>
                  <th style={{ padding: '10px 14px' }}>email</th>
                  <th style={{ padding: '10px 14px' }}>reason</th>
                  <th style={{ padding: '10px 14px' }}>Master KYC</th>
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((sr, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-family-mono)', color: 'var(--color-primary)', fontWeight: 600 }}>{sr.id}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{sr.name}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>{sr.email}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>{sr.reason}</td>
                    <td style={{ padding: '10px 14px' }}><Badge type={sr.status}>{sr.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
                      <th style={{ padding: '12px 14px' }}>Target User</th>
                      <th style={{ padding: '12px 14px' }}>Assessment</th>
                      <th style={{ padding: '12px 14px' }}>Recommended Action</th>
                      <th style={{ padding: '12px 14px' }}>Agent Forensic Findings</th>
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
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-family-mono)' }}>
                            {c.user_id}
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
                              color: c.recommendation.includes('BLOCK') || c.recommendation.includes('LOCK') ? '#EF4444' : 'var(--color-text-primary)',
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
                              Inspect Case
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
