import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Network,
  Send,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Eye,
  X,
  Clock,
  UserX,
  UserCheck,
  FileSearch,
  ArrowUpRight,
  ShieldAlert,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { GlobalLoader } from '../components/common/GlobalLoader';
import { useGlobalLoader } from '../context/LoadingContext';
import { apiClient } from '../api/client';
import type { InvestigationCase } from '../api/client';
import { formatToIST } from '../utils/dateUtils';

interface CaseDetailViewProps {
  caseId: string;
  onBack: () => void;
  currentUser?: { id?: string; name: string; role: string; email: string } | null;
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({ caseId, onBack, currentUser }) => {
  const { showLoader, hideLoader } = useGlobalLoader();
  const [caseData, setCaseData] = useState<InvestigationCase | null>(null);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Decision Form State (5 Action Options)
  const [decision, setDecision] = useState('LOCK_USER');
  const [reason, setReason] = useState('');
  const [policyRef, setPolicyRef] = useState('FRAUD_SOP_04_USER_LOCK');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Evidence Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Lightbox Modal State
  const [selectedEvidence, setSelectedEvidence] = useState<any | null>(null);

  const loadCase = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getInvestigationDetails(caseId);
      setCaseData(data);
      // Also fetch audit events for this specific case
      const auditRes = await apiClient.getAuditEvents(caseId);
      setAuditEvents(auditRes.events || auditRes.items || []);
    } catch (err: any) {
      setError(err.message || 'Could not load case details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCase();
  }, [caseId]);

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a mandatory justification rationale for this decision.');
      return;
    }
    setSubmitting(true);
    setSubmitSuccess(null);
    showLoader(
      `Executing Action: ${decision.replace(/_/g, ' ')}`,
      'Validating policy rules and recording immutable audit event...',
      'Decision Gateway'
    );
    try {
      const reviewerId = currentUser?.id || currentUser?.email || 'ANALYST_01';
      const res = await apiClient.submitDecision(caseId, {
        decision,
        reason: reason.trim(),
        reviewer_id: reviewerId,
        policy_reference: policyRef.trim() || undefined,
      });
      setSubmitSuccess(`Action recorded: ${decision}. State updated to ${res.status}.`);
      setReason('');
      await loadCase();
    } catch (err: any) {
      alert(`Decision submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
      hideLoader();
    }
  };

  const handleEvidenceUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select an image (.png, .jpg) or document (.pdf) to upload.');
      return;
    }

    setUploading(true);
    setUploadSuccess(null);
    showLoader(
      'Uploading Forensic Evidence Artifact',
      `Persisting evidence document and attaching to Case #${caseId}...`,
      'Evidence Vault'
    );
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (uploadNotes) formData.append('notes', uploadNotes);
      formData.append('reviewer_id', currentUser?.id || currentUser?.email || 'ANALYST_UPLOAD');

      const res = await apiClient.uploadCaseEvidence(caseId, formData);
      setUploadSuccess(`Evidence document '${res.evidence?.source_reference || uploadFile.name}' attached successfully.`);
      setUploadFile(null);
      setUploadNotes('');
      // Reset input element
      const fileInput = document.getElementById('evidence-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      await loadCase();
    } catch (err: any) {
      alert(`Evidence upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      hideLoader();
    }
  };

  if (loading) {
    return (
      <div style={{ width: '100%', padding: '64px 36px' }}>
        <GlobalLoader
          size="lg"
          text="Loading Forensic Investigation Dossier"
          subtext="Retrieving risk signals, graph correlations, and master records from MySQL..."
          badge={`Case #${caseId || 'Investigation'}`}
        />

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

  // Lifecycle Stepper calculation based on case status
  // Statuses: RECEIVED -> COLLECTING_EVIDENCE -> UNDER_INVESTIGATION -> REQUIRES_REVIEW -> ACTION_AUTHORIZED / RESOLVED / ESCALATED / MONITORING / CLOSED
  const getStepStatus = (stepIndex: number) => {
    const s = caseData.status;
    let currentStep = 1;
    if (s === 'RECEIVED') currentStep = 1;
    else if (s === 'COLLECTING_EVIDENCE') currentStep = 2;
    else if (s === 'UNDER_INVESTIGATION') currentStep = 3;
    else if (s === 'REQUIRES_REVIEW') currentStep = 4;
    else if (s === 'ACTION_AUTHORIZED' || s === 'ESCALATED' || s === 'MONITORING') currentStep = 5;
    else if (s === 'RESOLVED' || s === 'CLOSED') currentStep = 6;

    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'pending';
  };

  const steps = [
    { title: '1. Ingestion', desc: 'Signal & User Resolved' },
    { title: '2. Evidence Retrieval', desc: 'm_* Master DB Records' },
    { title: '3. Graph & Topology', desc: 'Device / IP Correlation' },
    { title: '4. Policy RAG', desc: 'ChromaDB SOP Matching' },
    { title: '5. AI Assessment', desc: 'LangGraph Forensic Verdict' },
    { title: '6. Analyst Decision', desc: 'Authorized Action' },
  ];

  return (
    <div style={{ width: '100%', padding: '32px 36px' }} className="animate-fade-in">
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button variant="secondary" size="sm" onClick={onBack} icon={<ArrowLeft size={14} />}>
            Back to Queue
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-family-mono)', margin: 0 }}>
                Case: {caseData.id}
              </h1>
              <Badge type={caseData.priority}>{caseData.priority}</Badge>
              <Badge type={caseData.status}>{caseData.status.replace('_', ' ')}</Badge>
              {caseData.user_id_ref && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(255, 90, 20, 0.1)',
                    color: 'var(--color-primary)',
                    border: '1px solid rgba(255, 90, 20, 0.25)',
                  }}
                >
                  User: {caseData.user_id_ref}
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
              Received: <strong>{formatToIST(caseData.created_at)}</strong> · Idempotency Key: <code style={{ color: 'var(--color-primary)' }}>{caseData.idempotency_key}</code>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={loadCase} icon={<RefreshCw size={14} />}>
            Refresh Case
          </Button>
        </div>
      </div>

      {/* Step-by-Step Investigation Timeline Stepper */}
      <div
        style={{
          marginBottom: '28px',
          padding: '20px 24px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.92rem' }}>
            <Clock size={16} color="var(--color-primary)" />
            <span>Investigation Lifecycle Stepper</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
            Current State: <strong>{caseData.status.replace(/_/g, ' ')}</strong>
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            position: 'relative',
          }}
        >
          {steps.map((st, i) => {
            const stepStatus = getStepStatus(i + 1);
            const isCompleted = stepStatus === 'completed';
            const isActive = stepStatus === 'active';

            return (
              <div
                key={i}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive
                    ? 'rgba(255, 90, 20, 0.08)'
                    : isCompleted
                    ? 'rgba(16, 185, 129, 0.06)'
                    : 'var(--color-input-background)',
                  border: isActive
                    ? '1.5px solid var(--color-primary)'
                    : isCompleted
                    ? '1.5px solid #10B981'
                    : '1px solid var(--color-border)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {isCompleted ? (
                    <CheckCircle size={15} color="#10B981" />
                  ) : isActive ? (
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary)',
                        animation: 'pulse 1.5s infinite',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: '1.5px solid var(--color-text-secondary)',
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: isActive
                        ? 'var(--color-primary)'
                        : isCompleted
                        ? '#10B981'
                        : 'var(--color-text-secondary)',
                    }}
                  >
                    {st.title}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                  {st.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {submitSuccess && (
        <div style={{ padding: '14px 18px', backgroundColor: 'rgba(22, 163, 74, 0.1)', border: '1px solid #16A34A', color: '#16A34A', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} />
          <span>{submitSuccess}</span>
        </div>
      )}

      {uploadSuccess && (
        <div style={{ padding: '14px 18px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3B82F6', color: '#3B82F6', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UploadCloud size={18} />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Main Forensic Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Left Column: Recommendation & Review Gateway */}
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
                    <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', gap: '6px', margin: 0 }}>
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
                    <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', gap: '6px', margin: 0 }}>
                      {structured.counter_signals.map((cs: any, idx: number) => (
                        <li key={idx}>{cs.statement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
                Recommendation pending. Agent pipeline is gathering evidence.
              </p>
            )}
          </Card>

          {/* Decision Submission Panel (The 5 Actions) */}
          <Card title="Decision Gateway: Analyst Authorization">
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Enforce human-in-the-loop governance. Select an authorized operational action and record immutable justification.
            </p>
            <form onSubmit={handleSubmitDecision} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Action Selection
                </label>
                <select
                  value={decision}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDecision(val);
                    if (val === 'LOCK_USER') setPolicyRef('FRAUD_SOP_04_USER_LOCK');
                    else if (val === 'UNLOCK_USER') setPolicyRef('FRAUD_SOP_02_USER_RESTORE');
                    else if (val === 'REQUEST_EVIDENCE') setPolicyRef('FRAUD_SOP_05_EVIDENCE_REQUEST');
                    else if (val === 'ESCALATE') setPolicyRef('FRAUD_SOP_08_COMMITTEE_ESCALATION');
                    else if (val === 'MONITOR') setPolicyRef('FRAUD_SOP_01_WATCHLIST_MONITOR');
                  }}
                  style={{ width: '100%', fontWeight: 600 }}
                >
                  <option value="LOCK_USER">Lock User (Block Account &amp; Authorize Action)</option>
                  <option value="UNLOCK_USER">Unlock User (Restore Active &amp; Resolve Case)</option>
                  <option value="REQUEST_EVIDENCE">Request Evidence (Request Documents / Proof)</option>
                  <option value="ESCALATE">Escalate (Refer to Senior Committee)</option>
                  <option value="MONITOR">Monitor (Place on Watchlist)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Policy Reference Clause
                </label>
                <input
                  type="text"
                  value={policyRef}
                  onChange={(e) => setPolicyRef(e.target.value)}
                  placeholder="e.g. FRAUD_SOP_04_USER_LOCK"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Mandatory Audit Rationale (Recorded with User ID)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Document the exact basis for this decision (persisted in immutable audit trail)..."
                  style={{ width: '100%' }}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                variant={decision === 'LOCK_USER' ? 'primary' : 'secondary'}
                icon={
                  submitting ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : decision === 'LOCK_USER' ? (
                    <UserX size={15} />
                  ) : decision === 'UNLOCK_USER' ? (
                    <UserCheck size={15} />
                  ) : decision === 'ESCALATE' ? (
                    <ShieldAlert size={15} />
                  ) : (
                    <Send size={15} />
                  )
                }
              >
                {submitting ? 'Recording Decision...' : `Commit Decision: ${decision.replace('_', ' ')}`}
              </Button>
            </form>

            {/* In-Line Evidence Upload Dropzone when "REQUEST_EVIDENCE" is selected */}
            {decision === 'REQUEST_EVIDENCE' && (
              <div
                style={{
                  marginTop: '18px',
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(59, 130, 246, 0.06)',
                  border: '1.5px dashed #3B82F6',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.88rem', color: '#3B82F6', marginBottom: '8px' }}>
                  <UploadCloud size={16} />
                  <span>Attach Supporting Document / Image</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                  Upload customer identity document, KYC proof, invoice, or screenshot. Files are securely archived and visible in the lightbox viewer.
                </p>

                <form onSubmit={handleEvidenceUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    id="evidence-file-input"
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.pdf,.docx,.txt"
                    onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                    style={{ fontSize: '0.82rem' }}
                  />

                  <input
                    type="text"
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="Document description / notes (e.g. Government Aadhaar / Passport scan)"
                    style={{ width: '100%', fontSize: '0.82rem' }}
                  />

                  <Button
                    type="submit"
                    size="sm"
                    disabled={uploading || !uploadFile}
                    icon={uploading ? <RefreshCw size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                  >
                    {uploading ? 'Uploading Evidence...' : 'Upload & Attach to Case'}
                  </Button>
                </form>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Evidence Inventory & Graph Footprint */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Evidence Inventory with Lightbox Viewer Trigger */}
          <Card
            title="Retrieved Evidence Inventory"
            action={
              caseData.evidence_items && caseData.evidence_items.length > 0 ? (
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
                  {caseData.evidence_items.length} {caseData.evidence_items.length === 1 ? 'Item' : 'Items'}
                </span>
              ) : null
            }
          >
            {caseData.evidence_items && caseData.evidence_items.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  paddingRight: '6px',
                }}
              >
                {caseData.evidence_items.map((ev: any) => {
                  const isUploadedDoc =
                    ev.evidence_type === 'USER_UPLOADED_IMAGE' ||
                    ev.evidence_type === 'USER_UPLOADED_DOCUMENT' ||
                    ev.normalized_payload?.file_url;

                  return (
                    <div
                      key={ev.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isUploadedDoc ? 'rgba(59, 130, 246, 0.05)' : 'var(--color-input-background)',
                        border: isUploadedDoc ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--color-border)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isUploadedDoc ? (
                            ev.normalized_payload?.is_image ? <ImageIcon size={16} color="#3B82F6" /> : <FileText size={16} color="#3B82F6" />
                          ) : (
                            <FileSearch size={15} color="var(--color-primary)" />
                          )}
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{ev.evidence_type}</span>
                        </div>
                        <Badge type={ev.retrieval_status}>{ev.retrieval_status}</Badge>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                        Source: <strong>{ev.source_system}</strong> · Ref: <code>{ev.source_reference || 'N/A'}</code>
                      </div>

                      {/* Uploaded File Quick Action */}
                      {isUploadedDoc && ev.normalized_payload?.file_url && (
                        <div style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedEvidence(ev)}
                            icon={<Eye size={13} />}
                          >
                            Preview in Lightbox
                          </Button>
                          <a
                            href={ev.normalized_payload.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none' }}
                          >
                            <Button variant="secondary" size="sm" icon={<ArrowUpRight size={13} />}>
                              Open File
                            </Button>
                          </a>
                        </div>
                      )}

                      {/* Evidence JSON payload */}
                      {ev.normalized_payload && (
                        <pre
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            padding: '8px',
                            borderRadius: '4px',
                            fontSize: '0.74rem',
                            fontFamily: 'var(--font-family-mono)',
                            overflowX: 'auto',
                            maxHeight: '140px',
                            overflowY: 'auto',
                            border: '1px solid var(--color-border)',
                            margin: 0,
                          }}
                        >
                          {JSON.stringify(ev.normalized_payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
                No evidence items attached. Select <strong>Request Evidence</strong> above to upload documents.
              </p>
            )}
          </Card>

          {/* ArangoDB Entity Graph Link Map */}
          <Card title="Entity Graph Traversal (Topology & Footprint)">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', marginBottom: '12px' }}>
              <Network size={18} />
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Correlated Master Nodes (m_* Tables)</span>
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
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  👤 <strong>m_users:</strong> {caseData.user_id_ref || 'Target'}
                </div>
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  🏪 <strong>Merchant:</strong> {caseData.merchant_id_ref || 'Target'}
                </div>
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  💳 <strong>m_payments:</strong> {caseData.transaction_id || 'Target'}
                </div>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                Multi-hop graph link discovery active across device fingerprints, IP subnets, and chargeback disputes.
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Case Audit & Governance Trail Table */}
      <Card
        title={`Immutable Case Audit Trail (${auditEvents.length} Events)`}
        action={
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
            User ID Indexed · Tamper-Evident SHA-256
          </span>
        }
      >
        {auditEvents.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
            No audit records registered for this case yet.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-input-background)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Timestamp (IST)</th>
                  <th style={{ padding: '10px 14px' }}>Event Type</th>
                  <th style={{ padding: '10px 14px' }}>Target User ID</th>
                  <th style={{ padding: '10px 14px' }}>Actor</th>
                  <th style={{ padding: '10px 14px' }}>Recorded Input &amp; Action Details</th>
                </tr>
              </thead>
              <tbody>
                {auditEvents.map((evt: any) => (
                  <tr key={evt.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                      {formatToIST(evt.event_timestamp)}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.76rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor:
                            evt.event_type.includes('DECISION') || evt.event_type.includes('ACTION')
                              ? 'rgba(255, 90, 20, 0.1)'
                              : evt.event_type.includes('EVIDENCE')
                              ? 'rgba(59, 130, 246, 0.1)'
                              : 'var(--color-input-background)',
                          color:
                            evt.event_type.includes('DECISION') || evt.event_type.includes('ACTION')
                              ? 'var(--color-primary)'
                              : evt.event_type.includes('EVIDENCE')
                              ? '#3B82F6'
                              : 'var(--color-text-primary)',
                        }}
                      >
                        {evt.event_type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <code style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                        {evt.user_id || caseData.user_id_ref || 'N/A'}
                      </code>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600 }}>{evt.actor_type}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>
                        {evt.actor_id || 'System'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', maxWidth: '380px', lineHeight: 1.4 }}>
                      {evt.details ? (
                        <div>
                          {evt.details.decision && (
                            <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '2px' }}>
                              Decision: {evt.details.decision}
                            </div>
                          )}
                          {evt.details.reason && (
                            <div style={{ color: 'var(--color-text-primary)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                              &ldquo;{evt.details.reason}&rdquo;
                            </div>
                          )}
                          {evt.details.action_type && (
                            <div style={{ fontWeight: 600, color: '#10B981' }}>
                              Action Executed: {evt.details.action_type}
                            </div>
                          )}
                          {evt.details.filename && (
                            <div style={{ color: '#3B82F6', fontSize: '0.78rem' }}>
                              Document: <strong>{evt.details.filename}</strong> {evt.details.notes && `(${evt.details.notes})`}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Evidence Lightbox Viewer Modal */}
      {selectedEvidence && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '24px',
          }}
          onClick={() => setSelectedEvidence(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  Evidence Document Viewer
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  Ref: {selectedEvidence.source_reference} · Type: {selectedEvidence.evidence_type}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: '20px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                alignItems: 'center',
              }}
            >
              {selectedEvidence.normalized_payload?.is_image ||
              (selectedEvidence.normalized_payload?.file_url &&
                /\.(png|jpe?g|webp)$/i.test(selectedEvidence.normalized_payload.file_url)) ? (
                <div
                  style={{
                    width: '100%',
                    backgroundColor: '#000',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px',
                    maxHeight: '480px',
                  }}
                >
                  <img
                    src={selectedEvidence.normalized_payload.file_url}
                    alt={selectedEvidence.source_reference}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '460px',
                      objectFit: 'contain',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              ) : selectedEvidence.normalized_payload?.file_url ? (
                <div style={{ width: '100%', height: '420px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                  <iframe
                    src={selectedEvidence.normalized_payload.file_url}
                    title={selectedEvidence.source_reference}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              ) : (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Preview not available for this structured data item.
                </div>
              )}

              {/* Metadata Details */}
              <div
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-input-background)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div>
                  <strong>Original File:</strong> {selectedEvidence.normalized_payload?.original_filename || selectedEvidence.source_reference}
                </div>
                {selectedEvidence.normalized_payload?.notes && (
                  <div>
                    <strong>Analyst Notes:</strong> {selectedEvidence.normalized_payload.notes}
                  </div>
                )}
                <div>
                  <strong>Uploaded By:</strong> {selectedEvidence.normalized_payload?.uploaded_by || selectedEvidence.source_system}
                </div>
                <div>
                  <strong>SHA-256 Hash:</strong> <code style={{ fontSize: '0.74rem' }}>{selectedEvidence.content_hash || 'N/A'}</code>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              {selectedEvidence.normalized_payload?.file_url && (
                <a
                  href={selectedEvidence.normalized_payload.file_url}
                  download={selectedEvidence.source_reference}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Button variant="secondary" size="sm" icon={<Download size={14} />}>
                    Download File
                  </Button>
                </a>
              )}
              <Button variant="primary" size="sm" onClick={() => setSelectedEvidence(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
