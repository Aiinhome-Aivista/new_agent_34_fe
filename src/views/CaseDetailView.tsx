import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Network,
  Send,
  Lock,
  Unlock,
  FileText,
  AlertTriangle,
  Eye,
  UploadCloud,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Calendar,
  User,
  ExternalLink,
  Clock,
  FileImage,
  X,
  Maximize2,
  Database,
  Layers,
  FileCheck,
  Paperclip
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { apiClient } from '../api/client';
import type { InvestigationCase } from '../api/client';
import { formatToIST } from '../utils/dateUtils';

interface CaseDetailViewProps {
  caseId: string;
  onBack: () => void;
  currentUser?: { id?: string; name: string; role: string; email: string } | null;
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({ caseId, onBack, currentUser }) => {
  const [caseData, setCaseData] = useState<InvestigationCase | null>(null);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab: 'overview' | 'timeline' | 'evidence' | 'audit'
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'evidence' | 'audit'>('overview');

  // Decision Gateway Form State (5 Exact Analyst Actions)
  const [decision, setDecision] = useState('LOCK_USER');
  const [reason, setReason] = useState('');
  const [policyRef, setPolicyRef] = useState('FRAUD_SOP_04');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Evidence Upload Form State
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('IDENTITY_PROOF');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Lightbox Modal State
  const [activeLightboxDoc, setActiveLightboxDoc] = useState<any | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [verifyingDoc, setVerifyingDoc] = useState(false);

  const loadCase = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getInvestigationDetails(caseId);
      setCaseData(data);

      try {
        const audits = await apiClient.getAuditEvents(caseId);
        setAuditEvents(audits || []);
      } catch (auditErr) {
        console.warn('Could not load audit events for case:', auditErr);
      }
    } catch (err: any) {
      setError(err.message || 'Could not load case details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCase();
  }, [caseId]);

  // Handle Decision Gateway Commit
  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a mandatory justification rationale for this decision.');
      return;
    }
    setSubmitting(true);
    setSubmitSuccess(null);
    try {
      const reviewerId = currentUser?.id || currentUser?.email || 'SUB_ANALYST_01';
      const res = await apiClient.submitDecision(caseId, {
        decision,
        reason: reason.trim(),
        reviewer_id: reviewerId,
        policy_reference: policyRef.trim() || undefined,
      });
      setSubmitSuccess(`Decision '${decision}' recorded: Case state is now ${res.status}. Master data mutated & logged.`);
      setReason('');
      await loadCase();
    } catch (err: any) {
      alert(`Decision submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Evidence Document Upload
  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceFile) {
      setUploadError('Please select a document or image file to upload.');
      return;
    }
    setUploadingEvidence(true);
    setUploadSuccess(null);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', evidenceFile);
      formData.append('document_type', documentType);
      formData.append('notes', evidenceNotes);
      formData.append('uploader_name', currentUser?.name || 'Investigator');

      const res = await apiClient.uploadEvidence(caseId, formData);
      setUploadSuccess(res.message || 'Evidence document uploaded successfully.');
      setEvidenceFile(null);
      setEvidenceNotes('');
      // Reset file input element
      const fileInput = document.getElementById('evidence-upload-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      await loadCase();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload evidence document.');
    } finally {
      setUploadingEvidence(false);
    }
  };

  // Handle Evidence Document Verification from Lightbox
  const handleVerifyEvidence = async (evidenceId: string, status: 'VERIFIED' | 'FORGED' | 'REJECTED') => {
    setVerifyingDoc(true);
    try {
      await apiClient.verifyEvidence(caseId, evidenceId, {
        status,
        notes: `Analyst mark as ${status}`,
        analyst_name: currentUser?.name || 'Investigator',
      });
      if (activeLightboxDoc && activeLightboxDoc.id === evidenceId) {
        setActiveLightboxDoc({
          ...activeLightboxDoc,
          normalized_payload: {
            ...activeLightboxDoc.normalized_payload,
            verification_status: status,
          },
          retrieval_status: status === 'VERIFIED' ? 'COLLECTED' : 'FAILED',
        });
      }
      await loadCase();
    } catch (err: any) {
      alert(`Verification action failed: ${err.message}`);
    } finally {
      setVerifyingDoc(false);
    }
  };

  if (loading) {
    return (
      <div style={{ width: '100%', padding: '64px 36px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Loading forensic case data and master records from MySQL...
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div style={{ width: '100%', padding: '32px 36px' }}>
        <Button variant="secondary" size="sm" onClick={onBack} icon={<ArrowLeft size={14} />}>
          Back to Queue
        </Button>
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', borderRadius: 'var(--radius-sm)' }}>
          {error || 'Case not found'}
        </div>
      </div>
    );
  }

  const latestRec = caseData.recommendations && caseData.recommendations.length > 0
    ? caseData.recommendations[caseData.recommendations.length - 1]
    : null;

  const structured = latestRec?.structured_result || {};

  // Extract evidence subsets
  const userUploads = (caseData.evidence_items || []).filter(
    (ev: any) => ev.evidence_type === 'USER_UPLOADED_DOCUMENT'
  );
  const masterDomainEvidence = (caseData.evidence_items || []).filter(
    (ev: any) => ev.evidence_type !== 'USER_UPLOADED_DOCUMENT'
  );

  return (
    <div style={{ width: '100%', padding: '32px 36px' }} className="animate-fade-in">
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button variant="secondary" size="sm" onClick={onBack} icon={<ArrowLeft size={14} />}>
            Back to Queue
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-family-mono)', margin: 0 }}>
                Case: {caseData.id.slice(0, 16)}...
              </h1>
              <Badge type={caseData.priority}>{caseData.priority}</Badge>
              <Badge type={caseData.status}>{caseData.status.replace(/_/g, ' ')}</Badge>
              {caseData.user_id_ref && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '2px 10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    color: '#2563EB',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <User size={12} /> Target User: {caseData.user_id_ref}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Received: <strong>{formatToIST(caseData.created_at)}</strong> · Idempotency Key:{' '}
              <code style={{ color: 'var(--color-primary)' }}>{caseData.idempotency_key}</code>
            </div>
          </div>
        </div>

        {/* Quick Action Pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {caseData.status === 'EVIDENCE_REQUESTED' && (
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                color: '#CA8A04',
                border: '1px solid #CA8A04',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Paperclip size={14} /> Upload Portal Active
            </span>
          )}
        </div>
      </div>

      {/* View Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '24px',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'overview' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'overview' ? 700 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <ShieldCheck size={16} /> Forensic Overview &amp; Gateway
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'timeline' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'timeline' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'timeline' ? 700 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Clock size={16} /> Step-by-Step Investigation Timeline
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'evidence' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'evidence' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'evidence' ? 700 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Paperclip size={16} /> Evidence Portal &amp; Lightbox ({userUploads.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'audit' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'audit' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'audit' ? 700 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <FileCheck size={16} /> Audit Trail ({auditEvents.length})
        </button>
      </div>

      {submitSuccess && (
        <div style={{ padding: '14px 18px', backgroundColor: 'rgba(22, 163, 74, 0.1)', border: '1px solid #16A34A', color: '#16A34A', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontWeight: 600 }}>
          {submitSuccess}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: OVERVIEW & DECISION GATEWAY                                     */}
      {/* ===================================================================== */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Left Column: Recommendation & Decision Gateway */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Recommendation Card */}
            <Card title="Agent Forensic Recommendation">
              {latestRec ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <Badge type={latestRec.assessment}>{latestRec.assessment}</Badge>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      Action: {latestRec.recommendation_type}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
                      Confidence: <strong>{latestRec.confidence_label}</strong>
                    </span>
                  </div>

                  <div style={{ padding: '14px', backgroundColor: 'var(--color-input-background)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {latestRec.explanation}
                  </div>

                  {/* Risk Indicators */}
                  {structured.risk_indicators && structured.risk_indicators.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: '#DC2626', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertCircle size={15} /> Identified Risk Indicators
                      </h4>
                      <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {structured.risk_indicators.map((ind: any, idx: number) => (
                          <li key={idx}>{ind.statement}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Counter Signals */}
                  {structured.counter_signals && structured.counter_signals.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: '#16A34A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle size={15} /> Mitigating Counter-Signals
                      </h4>
                      <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {structured.counter_signals.map((cs: any, idx: number) => (
                          <li key={idx}>{cs.statement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
                  Recommendation pending. Agent pipeline is evaluating master data.
                </p>
              )}
            </Card>

            {/* Decision Gateway: 5 Analyst Authorization Actions */}
            <Card title="Decision Gateway: 5 Analyst Authorization Actions">
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                Enforce human-in-the-loop governance. Select an authorized action to mutate master records and log a cryptographic audit trail.
              </p>
              <form onSubmit={handleSubmitDecision} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Select Action
                  </label>
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    style={{ width: '100%', fontWeight: 600 }}
                  >
                    <option value="LOCK_USER">🔒 Lock User (BLOCKED in m_users &amp; Revoke Access)</option>
                    <option value="UNLOCK_USER">🔓 Unlock User (ACTIVE in m_users &amp; Restore Access)</option>
                    <option value="REQUEST_EVIDENCE">📎 Request Evidence (Flag Case for Document Collection)</option>
                    <option value="ESCALATE">⚡ Escalate (Set Priority CRITICAL &amp; Route to Senior Committee)</option>
                    <option value="MONITOR">👁️ Monitor (Watchlist User &amp; Set MONITORING State)</option>
                  </select>
                </div>

                {/* Explanatory banner for selected action */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-input-background)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.4,
                  }}
                >
                  {decision === 'LOCK_USER' && (
                    <span><strong>System Mutation:</strong> Sets <code>m_users.status = 'BLOCKED'</code> for {caseData.user_id_ref || 'target user'}. Enforces downstream gateway freeze and marks case <code>ACTION_AUTHORIZED</code>.</span>
                  )}
                  {decision === 'UNLOCK_USER' && (
                    <span><strong>System Mutation:</strong> Restores <code>m_users.status = 'ACTIVE'</code> for {caseData.user_id_ref || 'target user'} and marks case <code>RESOLVED</code>.</span>
                  )}
                  {decision === 'REQUEST_EVIDENCE' && (
                    <span><strong>System Mutation:</strong> Changes case status to <code>EVIDENCE_REQUESTED</code> and activates the Document Upload Portal.</span>
                  )}
                  {decision === 'ESCALATE' && (
                    <span><strong>System Mutation:</strong> Elevates case priority to <code>CRITICAL</code> and updates status to <code>ESCALATED</code> for committee review.</span>
                  )}
                  {decision === 'MONITOR' && (
                    <span><strong>System Mutation:</strong> Enrolls user into fraud monitoring watchlist with case status <code>MONITORING</code>.</span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Policy Reference Clause
                  </label>
                  <input
                    type="text"
                    value={policyRef}
                    onChange={(e) => setPolicyRef(e.target.value)}
                    placeholder="e.g. FRAUD_SOP_04_HUMAN_REVIEW"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Mandatory Audit Rationale (Includes Target User: {caseData.user_id_ref || 'N/A'})
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Document the exact basis for this authorization action (recorded permanently in audit_events with target user_id)..."
                    style={{ width: '100%' }}
                  />
                </div>

                <Button type="submit" disabled={submitting} icon={<Send size={15} />}>
                  {submitting ? 'Executing Action & Writing Audit Log...' : `Execute ${decision.replace(/_/g, ' ')}`}
                </Button>
              </form>
            </Card>
          </div>

          {/* Right Column: Master Evidence & ArangoDB Graph */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Master Evidence Inventory */}
            <Card
              title="Retrieved Master Evidence (m_* Tables)"
              action={
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(255, 90, 20, 0.1)',
                    color: 'var(--color-primary)',
                    border: '1px solid rgba(255, 90, 20, 0.25)',
                  }}
                >
                  {masterDomainEvidence.length} Domain Items
                </span>
              }
            >
              {masterDomainEvidence.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    paddingRight: '6px',
                  }}
                >
                  {masterDomainEvidence.map((ev: any) => (
                    <div
                      key={ev.id}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-input-background)',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{ev.evidence_type}</span>
                        <Badge type={ev.retrieval_status}>{ev.retrieval_status}</Badge>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                        Source: <strong>{ev.source_system}</strong> · Ref: <code>{ev.source_reference || 'N/A'}</code>
                      </div>
                      {ev.normalized_payload && (
                        <pre
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            padding: '8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-family-mono)',
                            overflowX: 'auto',
                            maxHeight: '160px',
                            overflowY: 'auto',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          {JSON.stringify(ev.normalized_payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
                  No master evidence items attached yet.
                </p>
              )}
            </Card>

            {/* ArangoDB Entity Graph Link Map */}
            <Card title="Entity Graph Traversal (ArangoDB)">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', marginBottom: '12px' }}>
                <Network size={18} />
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Correlated Entity Nodes</span>
              </div>
              <div
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-input-background)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                    👤 User: <strong>{caseData.user_id_ref || 'Target'}</strong>
                  </div>
                  <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                    🏪 Merchant: <strong>{caseData.merchant_id_ref || 'MERCH_PRIME_01'}</strong>
                  </div>
                  <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                    💳 Payment: <strong>{caseData.transaction_id || 'Target'}</strong>
                  </div>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  Multi-hop link analysis active across hardware fingerprint device_id and IP subnet clusters.
                </span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: STEP-BY-STEP INVESTIGATION TIMELINE STEPPER                     */}
      {/* ===================================================================== */}
      {activeTab === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Step-by-Step Investigation Timeline">
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              Chronological journey of this case from batch upload ingestion through master evidence aggregation, Policy RAG evaluation, evidence request, and final authorization commitment.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
              {/* Vertical connector line */}
              <div
                style={{
                  position: 'absolute',
                  top: '20px',
                  bottom: '20px',
                  left: '20px',
                  width: '2px',
                  backgroundColor: 'var(--color-border)',
                  zIndex: 0,
                }}
              />

              {/* Step 1: Batch Ingestion Received */}
              <div style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                    boxShadow: '0 0 0 4px var(--color-surface)',
                  }}
                >
                  1
                </div>
                <div style={{ flex: 1, padding: '16px 20px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-input-background)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                      Step 1: Batch Ingestion Received &amp; Master Search Verified
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                      {formatToIST(caseData.created_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: '0 0 10px 0' }}>
                    Row parsed from simplified batch file. Verified target identity <strong>{caseData.user_id_ref || 'USR'}</strong> against MySQL <code>m_users</code> master table.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      Source: {caseData.trigger_source}
                    </span>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      Reason: {caseData.trigger_reason}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 2: Master Evidence Pulled */}
              <div style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                    boxShadow: '0 0 0 4px var(--color-surface)',
                  }}
                >
                  2
                </div>
                <div style={{ flex: 1, padding: '16px 20px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-input-background)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                      Step 2: Master Forensics Pulled (m_users, m_orders, m_payments, m_chargebacks)
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                      {masterDomainEvidence.length} Evidence Records Aggregated
                    </span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: '0 0 10px 0' }}>
                    Evidence service successfully pulled customer profile from <code>m_users</code>, order history from <code>m_orders</code>, payments from <code>m_payments</code>, and dispute counts from <code>m_chargebacks</code>.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {masterDomainEvidence.map((ev: any, idx: number) => (
                      <span key={idx} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                        ✓ {ev.evidence_type} ({ev.source_system})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3: Graph Network & Policy RAG Evaluated */}
              <div style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: latestRec ? '#10B981' : '#EAB308',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                    boxShadow: '0 0 0 4px var(--color-surface)',
                  }}
                >
                  3
                </div>
                <div style={{ flex: 1, padding: '16px 20px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-input-background)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                      Step 3: Graph Network &amp; ChromaDB Policy RAG Evaluated
                    </div>
                    {latestRec && <Badge type={latestRec.assessment}>{latestRec.assessment}</Badge>}
                  </div>
                  {latestRec ? (
                    <div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: '0 0 8px 0' }}>
                        Evaluated against organizational SOPs via ChromaDB vector embeddings and ArangoDB entity link discovery. Recommended Action: <strong>{latestRec.recommendation_type}</strong> (Confidence: {latestRec.confidence_label}).
                      </p>
                      <div style={{ padding: '8px 12px', borderRadius: '4px', backgroundColor: 'var(--color-surface)', fontSize: '0.8rem', border: '1px solid var(--color-border)' }}>
                        {latestRec.explanation}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                      Multi-modal agent investigation in progress...
                    </p>
                  )}
                </div>
              </div>

              {/* Step 4: Evidence Requested */}
              <div style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: caseData.status === 'EVIDENCE_REQUESTED' || userUploads.length > 0 ? '#EAB308' : '#6B7280',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                    boxShadow: '0 0 0 4px var(--color-surface)',
                  }}
                >
                  4
                </div>
                <div style={{ flex: 1, padding: '16px 20px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-input-background)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                      Step 4: Evidence Request &amp; Document Portal Activation
                    </div>
                    {caseData.status === 'EVIDENCE_REQUESTED' && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CA8A04' }}>PORTAL ACTIVE</span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {caseData.status === 'EVIDENCE_REQUESTED'
                      ? 'Analyst has requested user supporting documentation (KYC identity proof, bank statement, or payment receipt).'
                      : userUploads.length > 0
                      ? 'Evidence collection step initiated and completed.'
                      : 'Optional step: Analyst may trigger "Request Evidence" from Decision Gateway if documentation is required.'}
                  </p>
                </div>
              </div>

              {/* Step 5: User Document Uploaded */}
              <div style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: userUploads.length > 0 ? '#3B82F6' : '#6B7280',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                    boxShadow: '0 0 0 4px var(--color-surface)',
                  }}
                >
                  5
                </div>
                <div style={{ flex: 1, padding: '16px 20px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-input-background)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                      Step 5: User Supporting Document Uploaded &amp; Lightbox Review
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                      {userUploads.length} Document(s) Attached
                    </span>
                  </div>
                  {userUploads.length > 0 ? (
                    <div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: '0 0 10px 0' }}>
                        Customer or analyst uploaded documents with cryptographic SHA-256 fingerprint verification.
                      </p>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {userUploads.map((u: any) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              setActiveLightboxDoc(u);
                              setZoomLevel(1);
                            }}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              color: 'var(--color-primary)',
                            }}
                          >
                            <FileImage size={14} /> {u.source_reference} (Click to View)
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                      No supporting documents uploaded yet. Switch to Evidence Portal to upload.
                    </p>
                  )}
                </div>
              </div>

              {/* Step 6: Final Authorization Committed */}
              <div style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: ['ACTION_AUTHORIZED', 'RESOLVED', 'CLOSED', 'ESCALATED', 'MONITORING'].includes(caseData.status) ? '#8B5CF6' : '#6B7280',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                    boxShadow: '0 0 0 4px var(--color-surface)',
                  }}
                >
                  6
                </div>
                <div style={{ flex: 1, padding: '16px 20px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-input-background)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                      Step 6: Final Authorization Committed (Locked / Unlocked / Escalated / Monitored)
                    </div>
                    <Badge type={caseData.status}>{caseData.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Final authorization executes downstream master mutations (e.g. <code>m_users.status = 'BLOCKED'</code> or <code>'ACTIVE'</code>) and writes immutable audit records to <code>audit_events</code>.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: EVIDENCE PORTAL & LIGHTBOX VIEWER                               */}
      {/* ===================================================================== */}
      {activeTab === 'evidence' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Upload Portal Card */}
          <Card title="Upload Supporting Evidence Document / Image">
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Upload customer identity cards, bank statements, transaction receipts, or dispute affidavits. Files are stored and fingerprinted with SHA-256.
            </p>

            <form onSubmit={handleUploadEvidence} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Document Type
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="IDENTITY_PROOF">Government Identity Card (Passport / Aadhaar / DL)</option>
                  <option value="BANK_STATEMENT">Bank Statement / Settlement Proof</option>
                  <option value="TRANSACTION_RECEIPT">Merchant Payment Receipt</option>
                  <option value="UTILITY_BILL">Address Verification / Utility Bill</option>
                  <option value="AFFIDAVIT">Signed Customer Fraud Affidavit</option>
                  <option value="OTHER">Other Forensic Document</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  File (Image / PDF / Document)
                </label>
                <input
                  id="evidence-upload-file-input"
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.gif,.svg,.pdf,.txt,.json"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setEvidenceFile(e.target.files[0]);
                      setUploadError(null);
                    }
                  }}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
                  Allowed: .png, .jpg, .jpeg, .webp, .pdf, .txt, .json (Max 25MB)
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Analyst / Customer Notes
                </label>
                <textarea
                  rows={2}
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  placeholder="Reason for requesting or uploading this document..."
                  style={{ width: '100%' }}
                />
              </div>

              {uploadError && (
                <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#EF4444', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  {uploadError}
                </div>
              )}

              {uploadSuccess && (
                <div style={{ padding: '10px 14px', backgroundColor: 'rgba(22, 163, 74, 0.1)', border: '1px solid #16A34A', color: '#16A34A', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  {uploadSuccess}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={uploadingEvidence || !evidenceFile}
                icon={<UploadCloud size={16} />}
              >
                {uploadingEvidence ? 'Uploading & Hashing Document...' : 'Upload Evidence Document'}
              </Button>
            </form>
          </Card>

          {/* Uploaded Documents Gallery & Viewer Card */}
          <Card
            title="Evidence Documents Gallery"
            action={
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                {userUploads.length} Document(s)
              </span>
            }
          >
            {userUploads.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {userUploads.map((doc: any) => {
                  const payload = doc.normalized_payload || {};
                  const isImage = payload.is_image;
                  const previewUrl = payload.file_path;
                  const status = payload.verification_status || 'PENDING_REVIEW';

                  return (
                    <div
                      key={doc.id}
                      style={{
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-input-background)',
                        border: '1px solid var(--color-border)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                    >
                      {/* Thumbnail Area */}
                      <div
                        onClick={() => {
                          setActiveLightboxDoc(doc);
                          setZoomLevel(1);
                        }}
                        style={{
                          height: '140px',
                          backgroundColor: 'var(--color-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {isImage && previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={payload.filename}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', color: 'var(--color-primary)' }}>
                            <FileText size={48} />
                            <div style={{ fontSize: '0.72rem', marginTop: '4px', textTransform: 'uppercase' }}>
                              {payload.document_type || 'DOCUMENT'}
                            </div>
                          </div>
                        )}

                        <div
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            color: '#FFF',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Maximize2 size={10} /> Preview
                        </div>
                      </div>

                      {/* Document Details */}
                      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {payload.filename || doc.source_reference}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>
                          Type: <strong>{payload.document_type || 'IDENTITY'}</strong>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                          Size: {payload.file_size ? `${(payload.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: status === 'VERIFIED' ? 'rgba(16, 185, 129, 0.15)' : status === 'FORGED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                              color: status === 'VERIFIED' ? '#10B981' : status === 'FORGED' ? '#EF4444' : '#CA8A04',
                            }}
                          >
                            {status}
                          </span>

                          <button
                            onClick={() => {
                              setActiveLightboxDoc(doc);
                              setZoomLevel(1);
                            }}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'var(--color-primary)',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
                No evidence documents uploaded yet for this case. Use the form on the left to attach identity or transactional proof.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: TAMPER-EVIDENT AUDIT TRAIL                                      */}
      {/* ===================================================================== */}
      {activeTab === 'audit' && (
        <Card title={`Tamper-Evident Case Audit History (${auditEvents.length} Events)`}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            All actions executed through the Decision Gateway, batch ingestion triggers, and evidence document uploads are signed with cryptographic SHA-256 hashes and linked directly to target <code>user_id</code>.
          </p>

          {auditEvents.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-input-background)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 14px' }}>Timestamp (IST)</th>
                    <th style={{ padding: '10px 14px' }}>Event Action</th>
                    <th style={{ padding: '10px 14px' }}>Target user_id</th>
                    <th style={{ padding: '10px 14px' }}>Actor</th>
                    <th style={{ padding: '10px 14px' }}>Exact Inputs &amp; Rationale</th>
                    <th style={{ padding: '10px 14px' }}>SHA-256 Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {auditEvents.map((a: any) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {formatToIST(a.event_timestamp)}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: a.event_type.includes('LOCK') ? 'rgba(239, 68, 68, 0.15)' : a.event_type.includes('UNLOCK') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: a.event_type.includes('LOCK') ? '#EF4444' : a.event_type.includes('UNLOCK') ? '#10B981' : '#2563EB',
                          }}
                        >
                          {a.event_type}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-family-mono)', color: 'var(--color-primary)', fontWeight: 600 }}>
                        {a.user_id || caseData.user_id_ref || 'N/A'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 600 }}>{a.actor_id || 'System'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{a.actor_type}</div>
                      </td>
                      <td style={{ padding: '10px 14px', maxWidth: '340px' }}>
                        {a.details ? (
                          <div style={{ fontSize: '0.78rem', lineHeight: 1.4, color: 'var(--color-text-primary)' }}>
                            {a.details.reason || a.details.notes || a.details.action_type || JSON.stringify(a.details)}
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-family-mono)', fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                        {a.event_hash ? `${a.event_hash.slice(0, 16)}...` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
              No audit events logged yet for this case.
            </p>
          )}
        </Card>
      )}

      {/* ===================================================================== */}
      {/* EVIDENCE LIGHTBOX MODAL VIEWER                                         */}
      {/* ===================================================================== */}
      {activeLightboxDoc && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
          }}
          className="animate-fade-in"
        >
          {/* Lightbox Topbar */}
          <div
            style={{
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(20, 20, 20, 0.95)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <FileImage size={22} color="var(--color-primary)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {activeLightboxDoc.normalized_payload?.filename || activeLightboxDoc.source_reference}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                  Type: {activeLightboxDoc.normalized_payload?.document_type || 'DOCUMENT'} · Uploaded: {formatToIST(activeLightboxDoc.retrieved_at)}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '4px 8px' }}>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                  style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: '4px' }}
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <span style={{ fontSize: '0.78rem', minWidth: '45px', textAlign: 'center' }}>
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                  style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: '4px' }}
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: '4px' }}
                  title="Reset Zoom"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              <button
                onClick={() => setActiveLightboxDoc(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFF',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }}
                title="Close Lightbox"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Lightbox Body (Image Preview & Metadata Drawer) */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Main Preview Center Area */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                padding: '24px',
              }}
            >
              {activeLightboxDoc.normalized_payload?.is_image && activeLightboxDoc.normalized_payload?.file_path ? (
                <img
                  src={activeLightboxDoc.normalized_payload.file_path}
                  alt={activeLightboxDoc.source_reference}
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s ease',
                    maxWidth: '90%',
                    maxHeight: '85vh',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    borderRadius: '8px',
                  }}
                />
              ) : (
                <div
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    padding: '36px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    maxWidth: '500px',
                  }}
                >
                  <FileText size={64} style={{ color: 'var(--color-primary)', margin: '0 auto 16px' }} />
                  <h3 style={{ margin: '0 0 8px 0' }}>{activeLightboxDoc.source_reference}</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                    Document file format. Click below to open in native tab.
                  </p>
                  {activeLightboxDoc.normalized_payload?.file_path && (
                    <a
                      href={activeLightboxDoc.normalized_payload.file_path}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        marginTop: '12px',
                      }}
                    >
                      <ExternalLink size={14} /> Open raw document file
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Metadata & Verification Actions */}
            <div
              style={{
                width: '320px',
                backgroundColor: 'rgba(24, 24, 27, 0.98)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFF',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                overflowY: 'auto',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.05em' }}>
                  Document Metadata
                </div>
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: '#9CA3AF' }}>File: </span>
                    <span>{activeLightboxDoc.normalized_payload?.filename || activeLightboxDoc.source_reference}</span>
                  </div>
                  <div>
                    <span style={{ color: '#9CA3AF' }}>Size: </span>
                    <span>{(activeLightboxDoc.normalized_payload?.file_size / 1024).toFixed(1)} KB</span>
                  </div>
                  <div>
                    <span style={{ color: '#9CA3AF' }}>Uploader: </span>
                    <span>{activeLightboxDoc.normalized_payload?.uploader || 'Analyst'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#9CA3AF' }}>SHA-256 Hash: </span>
                    <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.7rem', color: '#34D399', wordBreak: 'break-all', marginTop: '2px' }}>
                      {activeLightboxDoc.content_hash || activeLightboxDoc.normalized_payload?.content_hash || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Actions */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  Forensic Verification Action
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    disabled={verifyingDoc}
                    onClick={() => handleVerifyEvidence(activeLightboxDoc.id, 'VERIFIED')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      backgroundColor: '#16A34A',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <CheckCircle2 size={16} /> Mark Verified (Authentic)
                  </button>

                  <button
                    disabled={verifyingDoc}
                    onClick={() => handleVerifyEvidence(activeLightboxDoc.id, 'FORGED')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      backgroundColor: '#DC2626',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertTriangle size={16} /> Mark Forged (Fraudulent)
                  </button>

                  <button
                    disabled={verifyingDoc}
                    onClick={() => handleVerifyEvidence(activeLightboxDoc.id, 'REJECTED')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      backgroundColor: '#D97706',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <XCircle size={16} /> Reject Document (Unclear)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
