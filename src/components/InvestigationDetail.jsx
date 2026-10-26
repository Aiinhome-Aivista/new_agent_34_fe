import React from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  ShieldAlert, 
  Scale, 
  FileText, 
  ExternalLink, 
  Sparkles, 
  Layers, 
  Play,
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function InvestigationDetail({ caseDetail, isRunningAgent, onRunInvestigation }) {
  if (!caseDetail) {
    return (
      <div className="glass-panel" style={{ height: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Select a case from the queue to inspect findings and evidence.</p>
      </div>
    );
  }

  const latestFinding = caseDetail.findings && caseDetail.findings.length > 0
    ? caseDetail.findings[caseDetail.findings.length - 1]
    : null;

  const latestRecommendation = caseDetail.recommendations && caseDetail.recommendations.length > 0
    ? caseDetail.recommendations[caseDetail.recommendations.length - 1]
    : null;

  const assessment = latestFinding?.assessment || 'INCONCLUSIVE';
  const confidence = latestFinding?.qualitative_confidence || 'MEDIUM';

  const getAssessmentTheme = () => {
    switch (assessment) {
      case 'SUSPICIOUS':
        return {
          bg: 'rgba(244, 63, 94, 0.12)',
          border: 'rgba(244, 63, 94, 0.4)',
          text: '#fb7185',
          icon: <ShieldAlert size={28} color="#f43f5e" />
        };
      case 'LEGITIMATE':
        return {
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.4)',
          text: '#34d399',
          icon: <CheckCircle2 size={28} color="#10b981" />
        };
      default:
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.4)',
          text: '#fbbf24',
          icon: <HelpCircle size={28} color="#f59e0b" />
        };
    }
  };

  const theme = getAssessmentTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner: Assessment & LLM Confidence */}
      <div className="glass-panel" style={{ padding: '20px', borderLeft: `5px solid ${theme.text}`, background: theme.bg, borderColor: theme.border }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {theme.icon}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="font-display" style={{ fontSize: '1.3rem', fontWeight: 800, color: theme.text, letterSpacing: '0.02em' }}>
                  {assessment}
                </span>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.15)'
                }}>
                  CONFIDENCE: {confidence}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  (Qualitative Reasoning — No ML Probability)
                </span>
              </div>
              <p style={{ marginTop: '6px', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                {latestFinding?.summary || caseDetail.trigger_reason}
              </p>
            </div>
          </div>

          {/* Trigger Re-investigation Button */}
          <button
            onClick={() => onRunInvestigation(caseDetail.case_id)}
            disabled={isRunningAgent}
            className="btn btn-primary"
            style={{ fontSize: '0.78rem', padding: '8px 14px', whiteSpace: 'nowrap' }}
          >
            <Sparkles size={15} />
            {isRunningAgent ? 'Agent Investigating...' : 'Re-Run Agent 34'}
          </button>
        </div>
      </div>

      {/* Trigger Overview Card */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} color="#38bdf8" />
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
              External Trigger Context
            </h3>
          </div>
          <span className="font-mono" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Source: <strong style={{ color: '#f8fafc' }}>{caseDetail.trigger_source}</strong>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '0.8rem' }}>
          <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block' }}>TRIGGER TYPE</span>
            <strong style={{ color: '#e2e8f0' }}>{caseDetail.trigger_type}</strong>
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block' }}>USER IDENTIFIER</span>
            <strong className="font-mono" style={{ color: '#38bdf8' }}>{caseDetail.user_id || 'N/A'}</strong>
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block' }}>MERCHANT IDENTIFIER</span>
            <strong className="font-mono" style={{ color: '#c084fc' }}>{caseDetail.merchant_id || 'N/A'}</strong>
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block' }}>ORDER / PAYMENT ID</span>
            <strong className="font-mono" style={{ color: '#34d399' }}>{caseDetail.order_id || caseDetail.payment_id || 'N/A'}</strong>
          </div>
        </div>
      </div>

      {/* Risk Indicators & Counter Signals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Risk Indicators */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <ShieldAlert size={16} color="#fb7185" />
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fca5a5' }}>
              Risk Indicators ({latestFinding?.risk_indicators?.length || 0})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(!latestFinding?.risk_indicators || latestFinding.risk_indicators.length === 0) ? (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No heightened risk indicators recorded.</p>
            ) : (
              latestFinding.risk_indicators.map((r, idx) => (
                <div key={idx} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fecdd3' }}>{r.indicator}</span>
                    <span className="badge badge-high" style={{ fontSize: '0.65rem' }}>{r.severity || 'HIGH'}</span>
                  </div>
                  <span className="font-mono" style={{ fontSize: '0.68rem', color: '#fda4af' }}>
                    Evidence Ref: {r.evidence_id}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Counter Signals */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Scale size={16} color="#34d399" />
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#6ee7b7' }}>
              Counter-Signals & Mitigations ({latestFinding?.counter_signals?.length || 0})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(!latestFinding?.counter_signals || latestFinding.counter_signals.length === 0) ? (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No mitigating counter-signals identified.</p>
            ) : (
              latestFinding.counter_signals.map((c, idx) => (
                <div key={idx} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a7f3d0' }}>{c.indicator}</span>
                    <span className="badge badge-legitimate" style={{ fontSize: '0.65rem' }}>MITIGATING</span>
                  </div>
                  <span className="font-mono" style={{ fontSize: '0.68rem', color: '#6ee7b7' }}>
                    Evidence Ref: {c.evidence_id}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Missing Evidence & Explicit Data Gaps (HLA Section 7.3 & Blueprint Section 6) */}
      <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #f59e0b', background: 'rgba(245, 158, 11, 0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <AlertTriangle size={16} color="#fbbf24" />
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fde68a' }}>
            Missing Evidence & Explicit Data Gaps
          </h3>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Per the High-Level Architecture, technical unavailability or unverified merchant foreign keys must never be assumed as evidence of fraud.
        </p>

        <ul style={{ paddingLeft: '18px', fontSize: '0.78rem', color: '#fef08a' }}>
          {latestFinding?.missing_evidence?.map((gap, idx) => (
            <li key={idx} style={{ marginBottom: '4px' }}>{gap}</li>
          )) || <li>No explicit evidence gaps detected.</li>}
        </ul>
      </div>

      {/* Prescriptive Recommendation Card */}
      {latestRecommendation && (
        <div className="glass-panel" style={{ padding: '18px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#818cf8" />
              <h3 className="font-display" style={{ fontSize: '1rem', fontWeight: 700, color: '#e0e7ff' }}>
                Agent 34 Recommendation: <span style={{ color: '#38bdf8' }}>{latestRecommendation.recommended_action}</span>
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', padding: '3px 8px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '6px', color: '#c7d2fe', fontWeight: 600 }}>
              Target: {latestRecommendation.suggested_target_type}:{latestRecommendation.suggested_target_id}
            </span>
          </div>

          <p style={{ fontSize: '0.84rem', color: '#f1f5f9', lineHeight: '1.45', marginBottom: '10px' }}>
            {latestRecommendation.rationale}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>• Human Review Required: <strong style={{ color: latestRecommendation.human_review_required ? '#fca5a5' : '#86efac' }}>{latestRecommendation.human_review_required ? 'YES (Mandatory)' : 'NO'}</strong></span>
            <span>• Auto-Action Eligible: <strong style={{ color: latestRecommendation.auto_eligible ? '#86efac' : '#cbd5e1' }}>{latestRecommendation.auto_eligible ? 'YES' : 'NO'}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
