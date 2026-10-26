import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Send, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Sparkles,
  Zap
} from 'lucide-react';

export default function DecisionPanel({ caseDetail, currentUser, onSubmitDecision, isSubmitting }) {
  const [selectedAction, setSelectedAction] = useState('TEMPORARY_RESTRICTION');
  const [rationale, setRationale] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [lastActionResult, setLastActionResult] = useState(null);

  const latestRecommendation = caseDetail?.recommendations && caseDetail.recommendations.length > 0
    ? caseDetail.recommendations[caseDetail.recommendations.length - 1]
    : null;

  // Set default action from agent recommendation
  React.useEffect(() => {
    if (latestRecommendation) {
      setSelectedAction(latestRecommendation.recommended_action);
    }
  }, [latestRecommendation]);

  const canApprove = currentUser?.permissions?.includes('recommendation.approve');
  const canReview = currentUser?.permissions?.includes('recommendation.review');
  const isAssignedInvestigator = caseDetail?.assigned_to === currentUser?.user_id && currentUser?.role === 'INVESTIGATOR';

  const handleAction = async (decisionType) => {
    if (!rationale) {
      alert("Please provide a decision rationale.");
      return;
    }

    try {
      const res = await onSubmitDecision({
        decision_type: decisionType,
        selected_action: selectedAction,
        decision_rationale: rationale,
        conditions: conditionNotes ? { notes: conditionNotes } : null,
        policy_reference: "POL-SOP-001"
      });
      setLastActionResult(res);
      setRationale('');
      setConditionNotes('');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="#6366f1" />
          <h3 className="font-display" style={{ fontSize: '1rem', fontWeight: 700 }}>
            Decision Gateway & Actions
          </h3>
        </div>
        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          Mode: {caseDetail?.decision_mode || 'ADVISOR'}
        </span>
      </div>

      {/* Recommended Action Summary */}
      <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
          AI AGENT PRESCRIPTION
        </span>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
          {latestRecommendation?.recommended_action || 'NO_ACTION'}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.3' }}>
          {latestRecommendation?.rationale || 'Awaiting initial investigation synthesis.'}
        </p>
      </div>

      {/* Separation of Duties Warning */}
      {isAssignedInvestigator && (
        <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#fca5a5' }}>
          <Lock size={15} color="#ef4444" />
          <span>Separation of Duties: As the assigned investigator, you cannot approve your own recommendation. Switch to Risk Approver to approve.</span>
        </div>
      )}

      {/* Action Selection Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            OPERATIONAL ACTION
          </label>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            disabled={!canReview}
            style={{
              width: '100%',
              background: '#0f172a',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              padding: '8px 10px'
            }}
          >
            <option value="TEMPORARY_RESTRICTION">TEMPORARY_RESTRICTION (User Checkout Freeze)</option>
            <option value="HOLD_TRANSACTION">HOLD_TRANSACTION (Merchant Shipment Hold)</option>
            <option value="BLOCK_USER">BLOCK_USER (Permanent Account Block)</option>
            <option value="BLOCK_MERCHANT">BLOCK_MERCHANT (Merchant Suspension)</option>
            <option value="REQUEST_VERIFICATION">REQUEST_VERIFICATION (Step-Up 2FA / KYC)</option>
            <option value="MONITOR">MONITOR (7-Day Watchlist)</option>
            <option value="NO_ACTION">NO_ACTION (Dismiss & Mark False Positive)</option>
            <option value="ESCALATE">ESCALATE (Refer to Senior Risk Committee)</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            DECISION RATIONALE (MANDATORY AUDIT LOG)
          </label>
          <textarea
            rows={3}
            placeholder="Document evidence justification, policy basis, and compliance rationale..."
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            disabled={!canReview}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '8px 10px',
              color: 'var(--text-primary)',
              fontSize: '0.78rem',
              resize: 'none',
              outline: 'none'
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            CONDITIONAL NOTES (OPTIONAL)
          </label>
          <input
            type="text"
            placeholder="e.g. Release hold if user submits Aadhaar/passport verification"
            value={conditionNotes}
            onChange={(e) => setConditionNotes(e.target.value)}
            disabled={!canReview}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '7px 10px',
              color: 'var(--text-primary)',
              fontSize: '0.78rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto' }}>
          <button
            onClick={() => handleAction('HUMAN_APPROVED')}
            disabled={!canApprove || isAssignedInvestigator || isSubmitting}
            className="btn btn-success"
            style={{ fontSize: '0.78rem' }}
            title={!canApprove ? 'Requires Approver or Admin role' : isAssignedInvestigator ? 'Separation of duties applies' : ''}
          >
            <CheckCircle size={15} />
            Approve & Dispatch
          </button>

          <button
            onClick={() => handleAction('HUMAN_REJECTED')}
            disabled={!canReview || isSubmitting}
            className="btn btn-danger"
            style={{ fontSize: '0.78rem' }}
          >
            <XCircle size={15} />
            Reject Action
          </button>

          <button
            onClick={() => handleAction('ESCALATED')}
            disabled={!canReview || isSubmitting}
            className="btn btn-outline"
            style={{ gridColumn: 'span 2', fontSize: '0.78rem', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)' }}
          >
            <AlertTriangle size={15} />
            Escalate to Risk Committee
          </button>
        </div>
      </div>

      {/* Action Execution Success Message */}
      {lastActionResult && (
        <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.75rem', color: '#6ee7b7' }}>
          <strong>Decision Registered:</strong> Action '{lastActionResult.selected_action}' successfully processed and dispatched to Action Service.
        </div>
      )}
    </div>
  );
}
