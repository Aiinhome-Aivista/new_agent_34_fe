import React, { useEffect, useState } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle, Network, Send } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { apiClient } from '../api/client';
import type { InvestigationCase } from '../api/client';

interface CaseDetailViewProps {
  caseId: string;
  onBack: () => void;
  currentUser?: { id?: string; name: string; role: string; email: string } | null;
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({ caseId, onBack, currentUser }) => {
  const [caseData, setCaseData] = useState<InvestigationCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Decision Form State
  const [decision, setDecision] = useState('APPROVE');
  const [reason, setReason] = useState('');
  const [policyRef, setPolicyRef] = useState('FRAUD_SOP_04');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const loadCase = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getInvestigationDetails(caseId);
      setCaseData(data);
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
      alert('Please provide a mandatory justification reason for the decision.');
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
      setSubmitSuccess(`Decision recorded: ${res.status}. Action scheduled/closed per policy.`);
      loadCase();
    } catch (err: any) {
      alert(`Decision submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ width: '100%', padding: '64px 36px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Loading forensic case data from MySQL...
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

  return (
    <div style={{ width: '100%', padding: '32px 36px' }} className="animate-fade-in">
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button variant="secondary" size="sm" onClick={onBack} icon={<ArrowLeft size={14} />}>
            Back to Queue
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-family-mono)' }}>
                Case: {caseData.id}
              </h1>
              <Badge type={caseData.priority}>{caseData.priority}</Badge>
              <Badge type={caseData.status}>{caseData.status.replace('_', ' ')}</Badge>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Idempotency Key: <code style={{ color: 'var(--color-primary)' }}>{caseData.idempotency_key}</code>
            </span>
          </div>
        </div>
      </div>

      {submitSuccess && (
        <div style={{ padding: '14px', backgroundColor: 'rgba(22, 163, 74, 0.1)', border: '1px solid #16A34A', color: '#16A34A', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontWeight: 600 }}>
          {submitSuccess}
        </div>
      )}

      {/* Main Forensic Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Left Column: Recommendation & Review Gateway */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Recommendation Card */}
          <Card title="Agent Forensic Recommendation">
            {latestRec ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                Recommendation pending. Agent pipeline is gathering evidence.
              </p>
            )}
          </Card>

          {/* Decision Submission Panel */}
          <Card title="Decision Gateway: Analyst Authorization">
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Enforce human-in-the-loop governance. Submit approval or rejection with audit rationale.
            </p>
            <form onSubmit={handleSubmitDecision} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Decision Action
                </label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="APPROVE">APPROVE (Authorize Action)</option>
                  <option value="REJECT">REJECT (Dismiss & Close Case)</option>
                  <option value="REQUEST_EVIDENCE">REQUEST_EVIDENCE (Re-open gathering)</option>
                  <option value="MONITOR">MONITOR (Watchlist only)</option>
                  <option value="ESCALATE">ESCALATE (Escalate to Senior Committee)</option>
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
                  placeholder="e.g. FRAUD_SOP_04_DISPUTE_LIMIT"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Mandatory Audit Rationale
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Document the exact basis for this decision (persisted in immutable audit trail)..."
                  style={{ width: '100%' }}
                />
              </div>

              <Button type="submit" disabled={submitting} icon={<Send size={15} />}>
                {submitting ? 'Recording Decision...' : 'Commit Analyst Decision'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Evidence Inventory & Graph Footprint */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Evidence Inventory */}
          <Card title="Retrieved Evidence Inventory">
            {caseData.evidence_items && caseData.evidence_items.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {caseData.evidence_items.map((ev: any) => (
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
                No evidence items attached.
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
                padding: '24px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-input-background)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  👤 User: {caseData.user_id_ref || 'Target'}
                </div>
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  🏪 Merchant: {caseData.merchant_id_ref || 'Target'}
                </div>
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  💳 Payment Ref: {caseData.transaction_id || 'Target'}
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Multi-hop graph link discovery active across device and network footprints.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
