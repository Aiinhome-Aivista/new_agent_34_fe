import React, { useState } from 'react';
import { X, Sparkles, Send, ShieldAlert, Cpu } from 'lucide-react';

export default function TriggerModal({ isOpen, onClose, onIngestTrigger }) {
  if (!isOpen) return null;

  const [triggerType, setTriggerType] = useState('TRANSACTION_INVESTIGATION');
  const [triggerSource, setTriggerSource] = useState('EXTERNAL_FRAUD_SYSTEM');
  const [triggerReason, setTriggerReason] = useState('Sudden amount deviation 15x over 90-day baseline with unverified device fingerprint');
  const [priority, setPriority] = useState('HIGH');
  const [userId, setUserId] = useState('USR-1001');
  const [merchantId, setMerchantId] = useState('MER-91822');
  const [orderId, setOrderId] = useState('ORD-5006');
  const [paymentId, setPaymentId] = useState('PAY-9006');
  const [decisionMode, setDecisionMode] = useState('ADVISOR');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyPreset = (preset) => {
    if (preset === 'VELOCITY') {
      setTriggerType('VELOCITY_EXCEEDED');
      setTriggerSource('SCHEDULER');
      setTriggerReason('Suspended customer attempted 4 rapid checkout transactions within 3 minutes');
      setPriority('CRITICAL');
      setUserId('USR-1003');
      setMerchantId('MER-91822');
      setOrderId('ORD-5005');
      setPaymentId('PAY-9005');
      setDecisionMode('ADVISOR');
    } else if (preset === 'MERCHANT_SURGE') {
      setTriggerType('MERCHANT_SURGE');
      setTriggerSource('OPERATIONS_PORTAL');
      setTriggerReason('Electronics merchant experienced 280% surge in high-ticket transactions');
      setPriority('MEDIUM');
      setUserId('USR-1001');
      setMerchantId('MER-91822');
      setOrderId('ORD-5001');
      setPaymentId('PAY-9001');
      setDecisionMode('CONDITIONAL_AUTOMATION');
    } else {
      setTriggerType('TRANSACTION_INVESTIGATION');
      setTriggerSource('EXTERNAL_FRAUD_SYSTEM');
      setTriggerReason('High-value transaction ₹82,000 flagged for immediate investigation');
      setPriority('HIGH');
      setUserId('USR-1001');
      setMerchantId('MER-91822');
      setOrderId('ORD-5006');
      setPaymentId('PAY-9006');
      setDecisionMode('ADVISOR');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onIngestTrigger({
        trigger_type: triggerType,
        trigger_source: triggerSource,
        trigger_reason: triggerReason,
        priority: priority,
        user_id: userId,
        merchant_id: merchantId,
        order_id: orderId,
        payment_id: paymentId,
        decision_mode: decisionMode
      });
      onClose();
    } catch (err) {
      alert("Trigger failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', padding: '24px', position: 'relative' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <Cpu size={20} color="#06b6d4" />
          </div>
          <div>
            <h2 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Simulate External Fraud Trigger
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Dispatches payload to Case Intake API to invoke LangGraph agent workflow
            </p>
          </div>
        </div>

        {/* Presets */}
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            QUICK PRESETS:
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => applyPreset('TICKET_SPIKE')}
              style={{ fontSize: '0.72rem', padding: '5px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: '#38bdf8', cursor: 'pointer' }}
            >
              High Ticket Spike (USR-1001)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('VELOCITY')}
              style={{ fontSize: '0.72rem', padding: '5px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: '#f43f5e', cursor: 'pointer' }}
            >
              Velocity Exceeded (USR-1003)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('MERCHANT_SURGE')}
              style={{ fontSize: '0.72rem', padding: '5px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: '#a78bfa', cursor: 'pointer' }}
            >
              Merchant Surge (MER-91822)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                TRIGGER SOURCE
              </label>
              <select
                value={triggerSource}
                onChange={(e) => setTriggerSource(e.target.value)}
                style={{ width: '100%', background: '#0f172a', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#f8fafc', padding: '6px 8px', fontSize: '0.75rem' }}
              >
                <option value="EXTERNAL_FRAUD_SYSTEM">EXTERNAL_FRAUD_SYSTEM</option>
                <option value="SCHEDULER">SCHEDULER</option>
                <option value="OPERATIONS_PORTAL">OPERATIONS_PORTAL</option>
                <option value="MANUAL">MANUAL</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                PRIORITY
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ width: '100%', background: '#0f172a', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#f8fafc', padding: '6px 8px', fontSize: '0.75rem' }}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              TRIGGER REASON / SIGNAL
            </label>
            <input
              type="text"
              required
              value={triggerReason}
              onChange={(e) => setTriggerReason(e.target.value)}
              style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#f8fafc', padding: '6px 8px', fontSize: '0.75rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                USER ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#f8fafc', padding: '6px 8px', fontSize: '0.75rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                MERCHANT ID
              </label>
              <input
                type="text"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#f8fafc', padding: '6px 8px', fontSize: '0.75rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                ORDER ID
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#f8fafc', padding: '6px 8px', fontSize: '0.75rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                PAYMENT ID
              </label>
              <input
                type="text"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#f8fafc', padding: '6px 8px', fontSize: '0.75rem' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ marginTop: '10px', padding: '10px' }}
          >
            <Send size={15} />
            {isSubmitting ? 'Ingesting and Spawning Agent 34...' : 'Dispatch Trigger to Agent 34'}
          </button>
        </form>
      </div>
    </div>
  );
}
