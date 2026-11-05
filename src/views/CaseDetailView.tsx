import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Send,
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
  Mail,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  History,
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
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'CURRENT' | 'PRECEDENT'>('ALL');

  const precedentCount = auditEvents.filter((e) => !e.is_current_case).length;
  const currentCount = auditEvents.filter((e) => e.is_current_case).length;
  const filteredAuditEvents = auditEvents.filter((evt) => {
    if (auditFilter === 'CURRENT') return evt.is_current_case;
    if (auditFilter === 'PRECEDENT') return !evt.is_current_case;
    return true;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Decision Form State (5 Action Options)
  const [decision, setDecision] = useState('LOCK_USER');
  const [reason, setReason] = useState('');
  const [policyRef, setPolicyRef] = useState('FRAUD_SOP_04_USER_LOCK');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);



  // Lightbox Modal State
  const [selectedEvidence, setSelectedEvidence] = useState<any | null>(null);

  // Customer Evidence Request (Portal) State

  const [customerReqReason, setCustomerReqReason] = useState('Additional supporting documentation required for fraud verification.');
  // Dynamic Required Document Types State (Persona: Admin / Investigator)
  interface ReqDocItem {
    key: string;
    label: string;
    selected: boolean;
    isCustom?: boolean;
  }

  const [reqDocList, setReqDocList] = useState<ReqDocItem[]>([
    { key: 'GOVT_ID', label: 'Government Photo ID', selected: true },
    { key: 'TAX_INVOICE', label: 'Tax Invoice / Receipt', selected: true },
    { key: 'PAYMENT_PROOF', label: 'Bank Statement / Card Slip', selected: true },
    { key: 'DELIVERY_PROOF', label: 'Proof of Delivery', selected: false },
  ]);
  const [customDocName, setCustomDocName] = useState('');

  const canManageDocTypes =
    currentUser?.role === 'ADMIN' ||
    (currentUser?.role && currentUser.role.includes('INVESTIGATOR'));

  const handleAddCustomDocType = () => {
    if (!customDocName.trim()) return;
    const name = customDocName.trim();
    const key = `CUSTOM_${name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now()}`;
    setReqDocList((prev) => [
      ...prev,
      { key, label: name, selected: true, isCustom: true },
    ]);
    setCustomDocName('');
  };

  const handleRemoveCustomDocType = (keyToRemove: string) => {
    setReqDocList((prev) => prev.filter((d) => d.key !== keyToRemove));
  };

  const handleToggleDocType = (key: string) => {
    setReqDocList((prev) =>
      prev.map((d) => (d.key === key ? { ...d, selected: !d.selected } : d))
    );
  };

  const [reqExpiryHours, setReqExpiryHours] = useState(48);
  const [dispatchingPortalReq, setDispatchingPortalReq] = useState(false);
  const [portalDispatchResult, setPortalDispatchResult] = useState<any | null>(null);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);
  const [existingRequests, setExistingRequests] = useState<any[]>([]);

  const loadCase = async (isInitial: boolean | React.MouseEvent = true) => {
    const shouldShowFullLoader = typeof isInitial === 'boolean' ? isInitial : true;
    if (shouldShowFullLoader) setLoading(true);
    try {
      const data = await apiClient.getInvestigationDetails(caseId);
      setCaseData(data);
      // Also fetch audit events for this specific case
      const auditRes = await apiClient.getAuditEvents(caseId);
      setAuditEvents(auditRes.events || auditRes.items || []);
      const reqRes = await apiClient.getCaseEvidenceRequests(caseId).catch(() => ({ items: [] }));
      const items = reqRes.items || [];
      setExistingRequests(items);

      // If active portalDispatchResult has been submitted by customer, clear it so UI hides the dispatched link
      if (portalDispatchResult && items.some((r: any) => r.id === portalDispatchResult.request_id && r.status === 'SUBMITTED')) {
        setPortalDispatchResult(null);
      }

      if (shouldShowFullLoader && data?.status === 'COLLECTING_EVIDENCE') {
        setDecision('REQUEST_EVIDENCE');
      }
    } catch (err: any) {
      setError(err.message || 'Could not load case details');
    } finally {
      if (shouldShowFullLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadCase();
  }, [caseId]);

  // Auto-detect when customer uploads evidence from portal to immediately hide link and refresh case data
  useEffect(() => {
    const isCollecting = caseData?.status === 'COLLECTING_EVIDENCE';
    const hasActivePendingReq = portalDispatchResult || (existingRequests || []).some((r: any) => r.status === 'ISSUED');

    if (!isCollecting && !hasActivePendingReq) return;

    const interval = setInterval(() => {
      loadCase(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [caseData?.status, portalDispatchResult, existingRequests]);

  // Natural scrolling preserved - scrolling is not removed when viewing evidence
  useEffect(() => {
    // Intentionally no overflow restriction to allow normal scrolling
  }, [selectedEvidence]);

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
      await loadCase(false);
    } catch (err: any) {
      alert(`Decision submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
      hideLoader();
    }
  };

  const handleDispatchEvidenceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerReqReason.trim()) {
      alert('Please provide a message or reason for requesting customer evidence.');
      return;
    }
    setDispatchingPortalReq(true);
    setPortalDispatchResult(null);
    try {
      const docs = reqDocList.filter((d) => d.selected).map((d) => ({ key: d.key, label: d.label }));
      if (docs.length === 0) {
        alert('Please select at least one required document type.');
        return;
      }

      const res = await apiClient.requestEvidenceFromCustomer(caseId, {
        reviewer_id: currentUser?.id || currentUser?.email || 'ANALYST_01',
        reason: customerReqReason.trim(),
        requested_documents: docs,
        expiry_hours: reqExpiryHours,
      });

      setPortalDispatchResult(res);
      setCustomerReqReason('');
      await loadCase(false);
    } catch (err: any) {
      alert(`Failed to dispatch evidence request: ${err.message}`);
    } finally {
      setDispatchingPortalReq(false);
    }
  };

  const handleCopyPortalLink = (urlToCopy?: string) => {
    const target = (typeof urlToCopy === 'string' && urlToCopy) ? urlToCopy : portalDispatchResult?.portal_url;
    if (!target) return;
    navigator.clipboard.writeText(target);
    setCopiedPortalLink(true);
    setTimeout(() => setCopiedPortalLink(false), 2500);
  };



  if (loading) {
    return (
      <div style={{ width: '100%', padding: '64px 36px' }}>
        <GlobalLoader size="lg" />

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
          <Button variant="secondary" size="sm" onClick={() => loadCase(true)} icon={<RefreshCw size={14} />}>
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

      

      {/* Main Forensic Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Left Column: Recommendation & Review Gateway */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Hardware Device Taint / Ban Evasion Alert Banner */}
          {latestRec && (
            (structured.risk_indicators && structured.risk_indicators.some(
              (ind: any) =>
                ind.statement &&
                (ind.statement.toLowerCase().includes('ban evasion') ||
                 ind.statement.toLowerCase().includes('tainted') ||
                 ind.statement.toLowerCase().includes('hardware'))
            )) ||
            (latestRec.explanation && latestRec.explanation.toLowerCase().includes('ban evasion'))
          ) && (
            <div
              style={{
                padding: '14px 18px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px solid #EF4444',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <ShieldAlert size={22} color="#EF4444" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#EF4444', marginBottom: '2px' }}>
                  Hardware Fingerprint Taint — Potential Ban Evasion Detected
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
                  This transaction originated from a physical hardware device linked to <strong>BLOCKED fraudster account(s)</strong>. Syndicate multi-accounting or ban evasion suspected.
                </div>
              </div>
            </div>
          )}

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

              {/* Requirement 1: When REQUEST_EVIDENCE is selected, hide Policy Ref, Mandatory Audit Rationale, and Commit Button */}
              {decision !== 'REQUEST_EVIDENCE' && (
                <>
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
                </>
              )}
            </form>

            {/* Requirement 1: Only show Send Customer Email Link section when REQUEST_EVIDENCE is selected */}
            {decision === 'REQUEST_EVIDENCE' && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                }}
              >
                <form onSubmit={handleDispatchEvidenceRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#1E40AF' }}>
                    <ShieldCheck size={18} color="#2563EB" />
                    <span>Send Customer Evidence Request Link</span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    Dispatches a time-bound, cryptographically signed magic link to the account holder's registered email. The customer must pass an OTP identity challenge before submitting separate documents for each requested document type.
                  </p>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                      Reason / Instructions to Customer
                    </label>
                    <input
                      type="text"
                      value={customerReqReason}
                      onChange={(e) => setCustomerReqReason(e.target.value)}
                      placeholder="e.g. Identity and invoice proof required for fraud verification"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </div>

                  {/* Requirement 2: Required Document Types (Admin / Investigator can add custom types) */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700 }}>
                        Required Document Types
                      </label>
                      {canManageDocTypes && (
                        <span style={{ fontSize: '0.7rem', color: '#2563EB', fontWeight: 600 }}>
                          {currentUser?.role?.replace(/_/g, ' ')}: Custom Types Enabled
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', marginBottom: '10px' }}>
                      {reqDocList.map((doc) => (
                        <div
                          key={doc.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            backgroundColor: doc.selected ? 'rgba(59, 130, 246, 0.08)' : 'var(--color-surface)',
                            border: `1px solid ${doc.selected ? '#93C5FD' : 'var(--color-border)'}`,
                          }}
                        >
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flex: 1, minWidth: 0 }}>
                            <input
                              type="checkbox"
                              checked={doc.selected}
                              onChange={() => handleToggleDocType(doc.key)}
                            />
                            <span style={{ fontWeight: doc.selected ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doc.label}
                            </span>
                          </label>

                          {doc.isCustom && canManageDocTypes && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomDocType(doc.key)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                padding: '2px',
                                marginLeft: '4px',
                              }}
                              title="Delete custom document type"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Admin / Investigator "+ Add Document Type" Input */}
                    {canManageDocTypes && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <input
                          type="text"
                          value={customDocName}
                          onChange={(e) => setCustomDocName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomDocType();
                            }
                          }}
                          placeholder="Add custom document type (e.g. Utility Bill, Affidavit, Salary Slip)..."
                          style={{ flex: 1, fontSize: '0.78rem', padding: '6px 10px' }}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleAddCustomDocType}
                          disabled={!customDocName.trim()}
                        >
                          + Add Type
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                      Link Validity Duration
                    </label>
                    <select
                      value={reqExpiryHours}
                      onChange={(e) => setReqExpiryHours(Number(e.target.value))}
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    >
                      <option value={24}>24 Hours</option>
                      <option value={48}>48 Hours (Recommended)</option>
                      <option value={72}>72 Hours</option>
                      <option value={168}>7 Days</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={dispatchingPortalReq}
                    icon={dispatchingPortalReq ? <RefreshCw size={14} className="animate-spin" /> : <Mail size={14} />}
                  >
                    {dispatchingPortalReq ? 'Dispatching...' : 'Dispatch Email Link to Customer'}
                  </Button>

                  {/* Newly Dispatched Evidence Request Link (shown only after clicking "Dispatch Email Link to Customer", hidden once uploaded by user) */}
                  {(() => {
                    if (!portalDispatchResult) return null;

                    // Check if this request has already been submitted by the customer
                    const matchedReq = (existingRequests || []).find(
                      (r: any) => r.id === portalDispatchResult?.request_id
                    ) || (existingRequests && existingRequests.length > 0 ? existingRequests[0] : null);

                    const isSubmitted = matchedReq?.status === 'SUBMITTED';

                    // Requirement: Once uploaded by the user, hide this portion from UI
                    if (isSubmitted) return null;

                    const isExpired = portalDispatchResult.expires_at
                      ? new Date(portalDispatchResult.expires_at).getTime() <= Date.now()
                      : false;

                    if (isExpired) return null;

                    return (
                      <div
                        style={{
                          marginTop: '12px',
                          padding: '14px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          fontSize: '0.8rem',
                        }}
                      >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065F46', fontWeight: 700, marginBottom: '6px' }}>
                        <CheckCircle size={16} color="#10B981" />
                        <span>
                          Evidence Request Dispatched {portalDispatchResult.recipient_email ? `to ${portalDispatchResult.recipient_email}` : ''}
                        </span>
                      </div>
                      {portalDispatchResult.expires_at && (
                        <div style={{ fontSize: '0.74rem', color: '#047857', marginBottom: '10px' }}>
                          Link valid until: <strong>{new Date(portalDispatchResult.expires_at).toLocaleString()}</strong>
                        </div>
                      )}

                      {portalDispatchResult.portal_url && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCopyPortalLink(portalDispatchResult.portal_url)}
                            icon={copiedPortalLink ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                          >
                            {copiedPortalLink ? 'Link Copied!' : 'Copy Portal Link'}
                          </Button>

                          <a
                            href={portalDispatchResult.portal_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none' }}
                          >
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              icon={<ExternalLink size={14} />}
                            >
                              Open Portal as Customer
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </form>

                {/* Existing Evidence Requests History */}
                {existingRequests && existingRequests.length > 0 && (
                  <div style={{ marginTop: '14px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      Previous Evidence Requests ({existingRequests.length})
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                      {existingRequests.map((req: any) => (
                        <div
                          key={req.id}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            fontSize: '0.74rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600 }}>{req.request_reason}</span>
                            <span style={{ color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
                              • {new Date(req.created_at).toLocaleDateString()}
                            </span>
                            {req.status === 'SUBMITTED' && (
                              <span style={{ color: '#10B981', marginLeft: '8px', fontWeight: 600 }}>
                                (Evidence Uploaded)
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {req.status === 'ISSUED' && req.portal_url && (
                              <a
                                href={req.portal_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: 'none' }}
                              >
                                <Button type="button" variant="secondary" size="sm" icon={<ExternalLink size={12} />}>
                                  Open Portal
                                </Button>
                              </a>
                            )}
                            <Badge type={req.status}>{req.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                  const isPortalSubmission =
                    ev.source_system === 'CUSTOMER_EVIDENCE_PORTAL' ||
                    ev.evidence_type === 'USER_PORTAL_IMAGE' ||
                    ev.evidence_type === 'USER_PORTAL_DOCUMENT' ||
                    ev.evidence_type === 'USER_TRANSACTION_STATEMENT';

                  const isUploadedDoc =
                    ev.evidence_type === 'USER_UPLOADED_IMAGE' ||
                    ev.evidence_type === 'USER_UPLOADED_DOCUMENT' ||
                    ev.evidence_type === 'USER_PORTAL_IMAGE' ||
                    ev.evidence_type === 'USER_PORTAL_DOCUMENT' ||
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
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {isPortalSubmission && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#059669',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                              }}
                            >
                              PORTAL
                            </span>
                          )}
                          <Badge type={ev.retrieval_status}>{ev.retrieval_status}</Badge>
                        </div>
                      </div>

                      {/* Customer Transaction Statement Card */}
                      {ev.evidence_type === 'USER_TRANSACTION_STATEMENT' && ev.normalized_payload && (
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            marginBottom: '10px',
                            fontSize: '0.8rem',
                          }}
                        >
                          <div style={{ fontWeight: 700, color: '#065F46', marginBottom: '4px' }}>
                            Customer Statement:
                          </div>
                          <div style={{ color: 'var(--color-text-primary)', fontStyle: 'italic', marginBottom: '6px' }}>
                            "{ev.normalized_payload.user_explanation}"
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#047857', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                            <span>Claimed: <strong>₹{ev.normalized_payload.claimed_amount}</strong></span>
                            <span>Date: <strong>{ev.normalized_payload.transaction_date}</strong></span>
                            <span>Method: <strong>{ev.normalized_payload.payment_method_details}</strong></span>
                          </div>
                        </div>
                      )}

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
        </div>
      </div>

      {/* Case Audit & Governance Trail Table */}
      <Card
        title={
          precedentCount > 0
            ? `Forensic Audit Trail & Cross-Case Precedents (${auditEvents.length} Events)`
            : `Immutable Case Audit Trail (${auditEvents.length} Events)`
        }
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {precedentCount > 0 && (
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: '#F59E0B',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                {precedentCount} Historical Precedent{precedentCount > 1 ? 's' : ''}
              </span>
            )}
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
              User ID Indexed · SHA-256 Verified
            </span>
          </div>
        }
      >
        {/* Precedent Notification Banner & Scope Filter Toolbar */}
        {precedentCount > 0 && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 16px',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History size={18} color="#F59E0B" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#F59E0B' }}>
                  Cross-Case Forensic Precedent Detected
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  This target customer has <strong>{precedentCount} historical audit events</strong> recorded across past investigation cases.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setAuditFilter('ALL')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: auditFilter === 'ALL' ? 'var(--color-primary)' : 'var(--color-input-background)',
                  color: auditFilter === 'ALL' ? 'white' : 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                All Events ({auditEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setAuditFilter('CURRENT')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: auditFilter === 'CURRENT' ? 'var(--color-primary)' : 'var(--color-input-background)',
                  color: auditFilter === 'CURRENT' ? 'white' : 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                Current Case ({currentCount})
              </button>
              <button
                type="button"
                onClick={() => setAuditFilter('PRECEDENT')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: auditFilter === 'PRECEDENT' ? '#F59E0B' : 'rgba(245, 158, 11, 0.15)',
                  color: auditFilter === 'PRECEDENT' ? '#000' : '#F59E0B',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                }}
              >
                Past Precedents ({precedentCount})
              </button>
            </div>
          </div>
        )}

        {filteredAuditEvents.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
            No audit records matching the selected filter.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-input-background)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Timestamp (IST)</th>
                  <th style={{ padding: '10px 14px' }}>Scope / Case</th>
                  <th style={{ padding: '10px 14px' }}>Event Type</th>
                  <th style={{ padding: '10px 14px' }}>Target User ID</th>
                  <th style={{ padding: '10px 14px' }}>Actor</th>
                  <th style={{ padding: '10px 14px' }}>Recorded Input &amp; Action Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditEvents.map((evt: any) => {
                  const isPrecedent = !evt.is_current_case;
                  return (
                  <tr
                    key={evt.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: isPrecedent ? 'rgba(245, 158, 11, 0.03)' : undefined,
                    }}
                  >
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                      {formatToIST(evt.event_timestamp)}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {evt.is_current_case ? (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: '#3B82F6',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                          }}
                        >
                          Current Case
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: '#F59E0B',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Historical event recorded in a prior investigation case for this customer"
                        >
                          📜 {evt.case_label || 'Past Precedent'}
                        </span>
                      )}
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
                          {/* Requirement 5: Document Type with Hyperlinked Document Name */}
                          {evt.details.documents && evt.details.documents.length > 0 && (
                            <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                                Attached Evidence Documents:
                              </span>
                              {evt.details.documents.map((doc: any, dIdx: number) => (
                                <div key={dIdx} style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 600, color: '#60A5FA', backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.35)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.74rem' }}>
                                    {doc.document_type || 'Document'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSelectedEvidence({
                                        source_reference: doc.original_filename || 'Evidence Document',
                                        evidence_type: doc.document_type || 'Evidence Document',
                                        normalized_payload: doc,
                                      });
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      padding: '1px 4px',
                                      color: '#38BDF8',
                                      fontWeight: 600,
                                      textDecoration: 'underline',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      font: 'inherit',
                                      borderRadius: '4px',
                                    }}
                                    title="Click to preview document in popup"
                                  >
                                    <FileText size={13} color="#38BDF8" style={{ flexShrink: 0 }} />
                                    <span>{doc.original_filename}</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {evt.details.filename && (!evt.details.documents || evt.details.documents.length === 0) && (
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.78rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>Document:</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedEvidence({
                                    source_reference: evt.details.filename,
                                    evidence_type: evt.details.notes || 'Evidence Document',
                                    normalized_payload: {
                                      original_filename: evt.details.filename,
                                      saved_filename: evt.details.saved_filename,
                                      file_url: `/api/v1/investigations/${caseId}/evidence-file/${evt.details.saved_filename || evt.details.filename}`,
                                      is_image: /\.(png|jpe?g|webp)$/i.test(evt.details.filename),
                                      notes: evt.details.notes,
                                    },
                                  });
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '1px 4px',
                                  color: '#38BDF8',
                                  fontWeight: 600,
                                  textDecoration: 'underline',
                                  cursor: 'pointer',
                                  font: 'inherit',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                                title="Click to preview document in popup"
                              >
                                <FileText size={13} color="#38BDF8" style={{ flexShrink: 0 }} />
                                <span>{evt.details.filename}</span>
                              </button>{' '}
                              {evt.details.notes && `(${evt.details.notes})`}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)' }}>-</span>
                      )}
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>      {/* Evidence Lightbox Viewer Modal - Portaled to document.body to prevent containing-block / scroll issues */}
      {selectedEvidence && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '24px 16px',
            overflowY: 'auto',
          }}
          onClick={() => setSelectedEvidence(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface, #181B22)',
              borderRadius: 'var(--radius-md, 12px)',
              border: '1px solid var(--color-border, #2D3748)',
              width: '100%',
              maxWidth: '820px',
              maxHeight: 'min(90vh, 720px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
              margin: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                flexShrink: 0,
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border, #2D3748)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--color-surface, #181B22)',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary, #FFFFFF)' }}>
                  Evidence Document Viewer
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary, #94A3B8)' }}>
                  Ref: {selectedEvidence.source_reference} · Type: {selectedEvidence.evidence_type}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvidence(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary, #94A3B8)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Close Viewer"
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
                minHeight: 0,
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
                    backgroundColor: '#000000',
                    borderRadius: 'var(--radius-sm, 8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px',
                    maxHeight: '380px',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={selectedEvidence.normalized_payload.file_url}
                    alt={selectedEvidence.source_reference}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '350px',
                      objectFit: 'contain',
                      borderRadius: '4px',
                      display: 'block',
                    }}
                  />
                </div>
              ) : selectedEvidence.normalized_payload?.file_url ? (
                <div style={{ width: '100%', height: '380px', borderRadius: 'var(--radius-sm, 8px)', overflow: 'hidden', border: '1px solid var(--color-border, #2D3748)' }}>
                  <iframe
                    src={selectedEvidence.normalized_payload.file_url}
                    title={selectedEvidence.source_reference}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              ) : (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-secondary, #94A3B8)' }}>
                  Preview not available for this structured data item.
                </div>
              )}

              {/* Metadata Details */}
              <div
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm, 8px)',
                  backgroundColor: 'var(--color-input-background, #1C1F26)',
                  border: '1px solid var(--color-border, #2D3748)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  flexShrink: 0,
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
                flexShrink: 0,
                padding: '14px 20px',
                borderTop: '1px solid var(--color-border, #2D3748)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                backgroundColor: 'var(--color-surface, #181B22)',
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
        </div>,
        document.body
      )}
    </div>
  );
};
