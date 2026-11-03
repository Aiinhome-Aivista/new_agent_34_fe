import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Camera,
  Trash2,
  Clock,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../api/client';

export const EvidenceSubmissionPortal: React.FC = () => {
  // Extract token from URL search params: ?token=XYZ
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') || '';

  // Core state
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<{
    type: 'INVALID' | 'EXPIRED' | 'SUBMITTED' | 'REVOKED' | 'SERVER_ERROR';
    title: string;
    message: string;
  } | null>(null);

  const [portalData, setPortalData] = useState<any | null>(null);

  // Stepper state: 'VERIFY_OTP' | 'FORM_UPLOAD' | 'SUCCESS'
  const [step, setStep] = useState<'VERIFY_OTP' | 'FORM_UPLOAD' | 'SUCCESS'>('VERIFY_OTP');

  // OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [demoHint, setDemoHint] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Form & Upload state
  const [transactionDate, setTransactionDate] = useState('');
  const [claimedAmount, setClaimedAmount] = useState('');
  const [paymentMethodDetails, setPaymentMethodDetails] = useState('');
  const [userExplanation, setUserExplanation] = useState('');


  // Per-Document Upload Slot State
  interface DocSlot {
    file: File | null;
    validating: boolean;
    valid: boolean;
    error: string | null;
    reason: string | null;
  }
  const [docSlots, setDocSlots] = useState<Record<string, DocSlot>>({});
  const [certified, setCertified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Success state
  const [submissionReceipt, setSubmissionReceipt] = useState<any | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);



  // 1. Initial Token Context Verification
  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorState({
        type: 'INVALID',
        title: 'Missing Authentication Token',
        message: 'No evidence submission token was provided in the URL. Please verify the link from your email.'
      });
      return;
    }

    const loadContext = async () => {
      setLoading(true);
      try {
        const data = await apiClient.getPublicEvidenceRequest(token);
        setPortalData(data);
        if (data.transaction_context) {
          setClaimedAmount(String(data.transaction_context.amount || ''));
          if (data.transaction_context.transaction_date) {
            setTransactionDate(data.transaction_context.transaction_date.slice(0, 10));
          }
          setPaymentMethodDetails(data.transaction_context.payment_method || 'CARD');
        }
      } catch (err: any) {
        const msg = err.message || '';
        if (msg.includes('Already Submitted') || msg.includes('409')) {
          setErrorState({
            type: 'SUBMITTED',
            title: 'Evidence Already Submitted',
            message: 'Your documentation for this case has already been successfully received and recorded. No further action is required.'
          });
        } else if (msg.includes('expired') || msg.includes('410')) {
          setErrorState({
            type: 'EXPIRED',
            title: 'Verification Link Expired',
            message: 'This secure submission link has expired. For your security, evidence links are valid for a limited period. Please contact compliance support to request a fresh link.'
          });
        } else {
          setErrorState({
            type: 'INVALID',
            title: 'Invalid or Revoked Link',
            message: msg || 'The security token could not be verified. Please check the email link and try again.'
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadContext();
  }, [token]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => setOtpCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // 2. Send OTP Handler
  const handleSendOtp = async () => {
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await apiClient.sendPortalOtp(token);
      setOtpSent(true);
      setOtpCooldown(60);
      if (res.demo_hint) {
        setDemoHint(res.demo_hint);
      }
    } catch (err: any) {
      setOtpError(err.message || 'Failed to send verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // 3. Verify OTP Handler
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('').trim();
    if (code.length !== 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }

    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await apiClient.verifyPortalOtp(token, code);
      if (res.verified) {
        setSessionToken(res.session_token);
        setStep('FORM_UPLOAD');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Incorrect verification code. Please check and try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP individual input change
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-advance focus
    if (digit && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Normalized requested documents list
  const requestedDocs: { key: string; label: string }[] =
    portalData?.requested_documents && portalData.requested_documents.length > 0
      ? portalData.requested_documents.map((d: any, i: number) =>
          typeof d === 'string'
            ? { key: `DOC_${i}`, label: d }
            : { key: d.key || `DOC_${i}`, label: d.label || d.key || `Document ${i + 1}` }
        )
      : [{ key: 'SUPPORTING_DOC', label: 'Supporting Evidence Document' }];

  // Slot-specific File Selection & Pre-Upload Relevance Validation
  const handleSlotFileSelect = async (docKey: string, docLabel: string, file: File) => {
    setSubmitError(null);
    setDocSlots((prev) => ({
      ...prev,
      [docKey]: { file, validating: true, valid: false, error: null, reason: null },
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type_key', docKey);
      formData.append('doc_type_label', docLabel);

      const res = await apiClient.validateDocumentRelevance(formData);
      if (res.is_relevant) {
        setDocSlots((prev) => ({
          ...prev,
          [docKey]: { file, validating: false, valid: true, error: null, reason: res.reason },
        }));
      } else {
        setDocSlots((prev) => ({
          ...prev,
          [docKey]: {
            file: null,
            validating: false,
            valid: false,
            error: res.reason || `The selected file is not relevant to '${docLabel}'. Please upload an authentic ${docLabel}.`,
            reason: null,
          },
        }));
      }
    } catch (err: any) {
      setDocSlots((prev) => ({
        ...prev,
        [docKey]: {
          file: null,
          validating: false,
          valid: false,
          error: err.message || 'Relevance validation check failed. Please check the file format.',
          reason: null,
        },
      }));
    }
  };

  const handleSlotRemoveFile = (docKey: string) => {
    setDocSlots((prev) => {
      const copy = { ...prev };
      delete copy[docKey];
      return copy;
    });
  };

  // 4. Submit Evidence Handler with Per-Document Association
  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const missingDocs = requestedDocs.filter((d) => !docSlots[d.key]?.file || !docSlots[d.key]?.valid);
    if (missingDocs.length > 0) {
      setSubmitError(`Please attach and validate all required documents: ${missingDocs.map((m) => m.label).join(', ')}`);
      return;
    }

    if (!userExplanation.trim()) {
      setSubmitError('Please provide a brief explanation or statement describing this transaction.');
      return;
    }

    if (!certified) {
      setSubmitError('Please certify that all submitted documents and details are accurate.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('session_token', sessionToken || '');
      formData.append('claimed_amount', claimedAmount);
      formData.append('transaction_date', transactionDate);
      formData.append('payment_method_details', paymentMethodDetails);
      formData.append('user_explanation', userExplanation.trim());

      const docTypesMetadata: Record<string, { key: string; label: string }> = {};
      requestedDocs.forEach((d) => {
        const slot = docSlots[d.key];
        if (slot?.file) {
          formData.append('files', slot.file);
          docTypesMetadata[slot.file.name] = { key: d.key, label: d.label };
        }
      });
      formData.append('doc_types_metadata', JSON.stringify(docTypesMetadata));

      const res = await apiClient.submitPortalEvidence(formData);
      setSubmissionReceipt(res);
      setStep('SUCCESS');
    } catch (err: any) {
      setSubmitError(err.message || 'Evidence submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyReceipt = () => {
    if (!submissionReceipt?.submission_reference) return;
    navigator.clipboard.writeText(submissionReceipt.submission_reference);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2500);
  };

  // ── LOADING STATE ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <RefreshCw size={36} className="animate-spin" style={{ color: '#FF5A14', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px' }}>Validating Security Link...</h2>
            <p style={{ color: '#64748B', fontSize: '0.88rem' }}>
              Establishing end-to-end encrypted channel with Fraud Operations Vault.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── ERROR / EXPIRED / ALREADY SUBMITTED STATE ──────────────────────────────
  if (errorState) {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, maxWidth: '520px', textAlign: 'center', padding: '40px 32px' }}>
          {errorState.type === 'SUBMITTED' ? (
            <div style={iconBadgeStyle('#10B981', 'rgba(16, 185, 129, 0.12)')}>
              <CheckCircle2 size={36} color="#10B981" />
            </div>
          ) : errorState.type === 'EXPIRED' ? (
            <div style={iconBadgeStyle('#F59E0B', 'rgba(245, 158, 11, 0.12)')}>
              <Clock size={36} color="#F59E0B" />
            </div>
          ) : (
            <div style={iconBadgeStyle('#EF4444', 'rgba(239, 68, 68, 0.12)')}>
              <AlertTriangle size={36} color="#EF4444" />
            </div>
          )}

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '16px 0 8px', color: '#0F172A' }}>
            {errorState.title}
          </h2>
          <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
            {errorState.message}
          </p>

          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              fontSize: '0.78rem',
              color: '#64748B',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <ShieldCheck size={20} color="#10B981" style={{ flexShrink: 0 }} />
            <span>Fraud Prevention & Compliance Desk · Automated Security Guard</span>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN ONE-PAGE PORTAL VIEW ─────────────────────────────────────────────
  return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle, maxWidth: '780px' }}>
        {/* Top Header */}
        <header
          style={{
            padding: '24px 32px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 90, 20, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FF5A14',
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                  Fraud & Risk Operations
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#059669',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Lock size={10} /> 256-bit Encrypted
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                Official Evidence & Transaction Statement Submission Portal
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Case Reference</div>
            <code style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FF5A14', fontFamily: 'monospace', backgroundColor: '#FFF7ED', padding: '2px 8px', borderRadius: '4px', border: '1px solid #FFEDD5', display: 'inline-block', marginTop: '2px' }}>
              {portalData?.case_reference || 'CASE-****'}
            </code>
          </div>
        </header>

        {/* Stepper Progress Bar */}
        <div style={{ padding: '20px 32px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
              <div style={stepBubbleStyle(step === 'VERIFY_OTP' ? 'active' : 'completed')}>1</div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: step === 'VERIFY_OTP' ? '#FF5A14' : '#0F172A' }}>
                Verify Identity
              </span>
            </div>

            <div style={{ flex: 1, height: '2px', backgroundColor: step !== 'VERIFY_OTP' ? '#FF5A14' : '#E5E7EB', margin: '0 16px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
              <div style={stepBubbleStyle(step === 'FORM_UPLOAD' ? 'active' : step === 'SUCCESS' ? 'completed' : 'pending')}>2</div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: step === 'FORM_UPLOAD' ? '#FF5A14' : '#64748B' }}>
                Upload & Details
              </span>
            </div>

            <div style={{ flex: 1, height: '2px', backgroundColor: step === 'SUCCESS' ? '#FF5A14' : '#E5E7EB', margin: '0 16px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
              <div style={stepBubbleStyle(step === 'SUCCESS' ? 'completed' : 'pending')}>3</div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: step === 'SUCCESS' ? '#10B981' : '#64748B' }}>
                Confirmation
              </span>
            </div>
          </div>
        </div>

        {/* ── STEP 1: IDENTITY CHALLENGE (OTP) ─────────────────────────────── */}
        {step === 'VERIFY_OTP' && (
          <div style={{ padding: '36px 32px' }} className="animate-fade-in">
            <div style={{ textAlign: 'center', maxWidth: '480px', margin: '0 auto 32px' }}>
              <div style={iconBadgeStyle('#FF5A14', 'rgba(255, 90, 20, 0.1)')}>
                <Lock size={32} color="#FF5A14" />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '14px 0 6px', color: '#0F172A' }}>
                Account Holder Verification
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                To safeguard your account and ensure authorized access, we verify the registered owner before accepting evidence.
              </p>
            </div>

            {/* Context preview box */}
            <div
              style={{
                maxWidth: '480px',
                margin: '0 auto 28px',
                padding: '16px 20px',
                borderRadius: '12px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '0.82rem',
              }}
            >
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Account Name</span>
                <strong style={{ color: '#0F172A' }}>{portalData?.customer?.masked_name || 'Account Holder'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Registered Contact</span>
                <strong style={{ color: '#0F172A' }}>{portalData?.customer?.masked_email || 'Verified Email'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Flagged Transaction</span>
                <strong style={{ color: '#0F172A' }}>{portalData?.transaction_context?.transaction_id_masked || 'TXN-****'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Disputed Amount</span>
                <strong style={{ color: '#DC2626' }}>₹{portalData?.transaction_context?.amount?.toLocaleString() || '0.00'}</strong>
              </div>
            </div>

            {/* OTP Action Area */}
            {!otpSent ? (
              <div style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
                <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '18px' }}>
                  Click below to dispatch a 6-digit one-time code to <strong>{portalData?.customer?.masked_email}</strong>.
                </p>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                  style={primaryButtonStyle}
                >
                  {otpLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Dispatching Code...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} /> Send 6-Digit Verification Code
                    </>
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ maxWidth: '420px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                    Enter the 6-digit code sent to <strong>{portalData?.customer?.masked_email}</strong>:
                  </span>
                </div>

                {/* 6 Digit Input Boxes */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      autoFocus={idx === 0}
                      style={{
                        width: '48px',
                        height: '56px',
                        textAlign: 'center',
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        borderRadius: '10px',
                        border: digit ? '2px solid #FF5A14' : '1px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A',
                        outline: 'none',
                        transition: 'border-color 0.15s ease',
                      }}
                    />
                  ))}
                </div>

                {otpError && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#DC2626',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '16px',
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{otpError}</span>
                  </div>
                )}

                {/* Demo Helper Hint for automated/manual tests */}
                {demoHint && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      color: '#2563EB',
                      fontSize: '0.75rem',
                      marginBottom: '16px',
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                  >
                    {demoHint}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otpLoading || otpDigits.join('').length !== 6}
                  style={primaryButtonStyle}
                >
                  {otpLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      Verify Identity & Proceed <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpCooldown > 0 || otpLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: otpCooldown > 0 ? '#9CA3AF' : '#FF5A14',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: otpCooldown > 0 ? 'default' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <RefreshCw size={12} />
                    {otpCooldown > 0 ? `Resend code in ${otpCooldown}s` : 'Resend Verification Code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── STEP 2: DETAILS & EVIDENCE UPLOAD FORM ───────────────────────── */}
        {step === 'FORM_UPLOAD' && (
          <form onSubmit={handleSubmitEvidence} style={{ padding: '32px' }} className="animate-fade-in">
            {/* Required Documents Banner */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                backgroundColor: 'rgba(59, 130, 246, 0.06)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                marginBottom: '28px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9rem', color: '#1D4ED8', marginBottom: '6px' }}>
                <FileText size={18} />
                <span>Requested Verification Documents</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 10px' }}>
                {portalData?.request_reason || 'Please provide documentation validating your purchase and authorization.'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(portalData?.requested_documents || []).map((doc: any, i: number) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#FFFFFF',
                      color: '#1E40AF',
                      border: '1px solid #BFDBFE',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    ✓ {typeof doc === 'string' ? doc : doc.label || doc.key}
                  </span>
                ))}
              </div>
            </div>

            {/* Section 1: Transaction Details */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 14px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} color="#FF5A14" />
                <span>1. Transaction Statement</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Confirmed Transaction Date</label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Claimed / Authorized Amount (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={claimedAmount}
                    onChange={(e) => setClaimedAmount(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Payment Method & Account Details</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Debit Card ending in 4212, UPI ID, or Net Banking reference"
                  value={paymentMethodDetails}
                  onChange={(e) => setPaymentMethodDetails(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Customer Statement / Explanation</label>
                <textarea
                  rows={3}
                  placeholder="Please describe what was purchased, shipping status, merchant interaction, or why this transaction is legitimate..."
                  value={userExplanation}
                  onChange={(e) => setUserExplanation(e.target.value)}
                  required
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Section 2: Interactive Evidence Upload (Separate Box per Required Document Type) */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={18} color="#FF5A14" />
                  <span>2. Required Evidence Upload ({requestedDocs.length} Document {requestedDocs.length === 1 ? 'Type' : 'Types'})</span>
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  Max 10MB per file (.png, .jpg, .webp, .pdf) • Pre-upload AI validation active
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {requestedDocs.map((doc, idx) => {
                  const slot = docSlots[doc.key];
                  const hasFile = !!slot?.file && slot?.valid;
                  const isValidating = slot?.validating;
                  const hasError = !!slot?.error;

                  return (
                    <div
                      key={doc.key || idx}
                      style={{
                        borderRadius: '12px',
                        border: hasError
                          ? '1.5px solid #FCA5A5'
                          : hasFile
                          ? '1.5px solid #86EFAC'
                          : '1px solid #CBD5E1',
                        backgroundColor: hasError
                          ? '#FEF2F2'
                          : hasFile
                          ? 'rgba(240, 253, 244, 0.6)'
                          : '#FFFFFF',
                        padding: '18px 20px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Box Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              backgroundColor: hasFile ? '#DCFCE7' : '#EFF6FF',
                              color: hasFile ? '#16A34A' : '#2563EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                              {doc.label}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isValidating ? (
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '3px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <RefreshCw size={11} className="animate-spin" /> Validating Relevance...
                            </span>
                          ) : hasFile ? (
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803D', backgroundColor: '#DCFCE7', padding: '3px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} /> Verified &amp; Attached
                            </span>
                          ) : hasError ? (
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#B91C1C', backgroundColor: '#FEE2E2', padding: '3px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={12} /> Irrelevant File
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#B45309', backgroundColor: '#FEF3C7', padding: '3px 8px', borderRadius: '12px' }}>
                              Required Upload
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Error Message if rejected */}
                      {hasError && (
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #FCA5A5',
                            color: '#B91C1C',
                            fontSize: '0.78rem',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            lineHeight: 1.4,
                          }}
                        >
                          <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong>Validation Notice: </strong>
                            <span>{slot.error}</span>
                          </div>
                        </div>
                      )}

                      {/* Attached File Preview Card */}
                      {hasFile && slot.file ? (
                        <div
                          style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #BBF7D0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            {slot.file.type.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(slot.file)}
                                alt="preview"
                                style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0, border: '1px solid #E2E8F0' }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '6px',
                                  backgroundColor: '#F1F5F9',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <FileText size={22} color="#059669" />
                              </div>
                            )}

                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {slot.file.name}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <span>{(slot.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                                {slot.reason && <span>• {slot.reason}</span>}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById(`slot-file-input-${doc.key}`) as HTMLInputElement;
                                if (input) input.click();
                              }}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                color: '#334155',
                                cursor: 'pointer',
                              }}
                            >
                              Replace
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSlotRemoveFile(doc.key)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                padding: '6px',
                              }}
                              title="Remove file"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Dropzone for this slot */
                        <div
                          style={{
                            border: '1.5px dashed #CBD5E1',
                            borderRadius: '8px',
                            padding: '18px',
                            textAlign: 'center',
                            backgroundColor: '#F8FAFC',
                            cursor: isValidating ? 'wait' : 'pointer',
                            transition: 'border-color 0.2s ease',
                          }}
                          onClick={() => {
                            if (!isValidating) {
                              const input = document.getElementById(`slot-file-input-${doc.key}`) as HTMLInputElement;
                              if (input) input.click();
                            }
                          }}
                        >
                          <UploadCloud size={30} style={{ color: '#FF5A14', margin: '0 auto 6px' }} />
                          <p style={{ margin: '0 0 4px', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                            Click to upload {doc.label} or drag and drop here
                          </p>
                          <p style={{ margin: '0 0 10px', fontSize: '0.74rem', color: '#64748B' }}>
                            Supports PNG, JPG, WEBP, PDF (Max 10MB)
                          </p>

                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const cam = document.getElementById(`slot-camera-input-${doc.key}`) as HTMLInputElement;
                                if (cam) cam.click();
                              }}
                              disabled={isValidating}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                color: '#0F172A',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                cursor: isValidating ? 'wait' : 'pointer',
                              }}
                            >
                              <Camera size={13} color="#FF5A14" />
                              <span>Snap Photo</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Hidden slot file input */}
                      <input
                        id={`slot-file-input-${doc.key}`}
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,.pdf,.docx,.txt"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleSlotFileSelect(doc.key, doc.label, e.target.files[0]);
                          }
                          e.target.value = '';
                        }}
                      />

                      {/* Hidden slot camera input */}
                      <input
                        id={`slot-camera-input-${doc.key}`}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleSlotFileSelect(doc.key, doc.label, e.target.files[0]);
                          }
                          e.target.value = '';
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Legal Certification Checkbox */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <input
                type="checkbox"
                id="legal-cert"
                checked={certified}
                onChange={(e) => setCertified(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="legal-cert" style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, cursor: 'pointer' }}>
                I certify that I am the authorized account holder and that all uploaded documents, images, and transaction statements are genuine, unaltered, and submitted in good faith for compliance review.
              </label>
            </div>

            {submitError && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#DC2626',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                }}
              >
                <AlertCircle size={18} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Submission Actions */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              {(() => {
                const isSubmitDisabled = submitting || Object.values(docSlots).filter((s) => s.file && s.valid).length === 0 || !certified;
                return (
                  <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    style={{
                      ...primaryButtonStyle,
                      backgroundColor: isSubmitDisabled ? '#E2E8F0' : '#FF5A14',
                      color: isSubmitDisabled ? '#94A3B8' : '#FFFFFF',
                      boxShadow: isSubmitDisabled ? 'none' : '0 4px 14px rgba(255, 90, 20, 0.28)',
                      cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submitting ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" /> Digitally Fingerprinting & Encrypting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} /> Submit Evidence & Transaction Statement
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
          </form>
        )}

        {/* ── STEP 3: SUBMISSION SUCCESS & CONFIRMATION ─────────────────────── */}
        {step === 'SUCCESS' && (
          <div style={{ padding: '48px 32px', textAlign: 'center' }} className="animate-fade-in">
            <div style={iconBadgeStyle('#10B981', 'rgba(16, 185, 129, 0.12)')}>
              <CheckCircle2 size={42} color="#10B981" />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '18px 0 8px', color: '#0F172A' }}>
              Evidence Successfully Submitted
            </h2>
            <p style={{ color: '#475569', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Thank you. Your documents and transaction statements have been securely archived in our forensic vault and attached to your investigation case.
            </p>

            {/* Tracking Reference Receipt Box */}
            <div
              style={{
                maxWidth: '480px',
                margin: '0 auto 28px',
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                    Submission Reference Number
                  </span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FF5A14', fontFamily: 'monospace' }}>
                    {submissionReceipt?.submission_reference || 'SUB-179334-XXXX'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {copiedReceipt ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                  <span>{copiedReceipt ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
                <div>
                  <span style={{ color: '#64748B' }}>Items Received: </span>
                  <strong>{submissionReceipt?.items_submitted_count || Object.values(docSlots).filter((s) => s.file).length} files + statement</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Case Status: </span>
                  <strong style={{ color: '#059669' }}>REQUIRES REVIEW</strong>
                </div>
              </div>
            </div>

            <div
              style={{
                maxWidth: '480px',
                margin: '0 auto',
                padding: '14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.06)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                fontSize: '0.8rem',
                color: '#1E40AF',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Clock size={20} color="#2563EB" style={{ flexShrink: 0 }} />
              <span>
                Our Fraud & Dispute desk typically reviews customer-submitted evidence within 24 to 48 business hours. You may now close this window.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── STYLE CONSTANTS ─────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  colorScheme: 'light',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: '#F1F5F9',
  backgroundImage: 'radial-gradient(ellipse at 50% 0%, #EFF6FF 0%, #F1F5F9 65%, #E2E8F0 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '36px 16px',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  color: '#0F172A',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
  border: '1px solid #E2E8F0',
  overflow: 'hidden',
};

const iconBadgeStyle = (_color: string, bg: string): React.CSSProperties => ({
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
});

const stepBubbleStyle = (state: 'completed' | 'active' | 'pending'): React.CSSProperties => ({
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.78rem',
  fontWeight: 700,
  backgroundColor:
    state === 'completed'
      ? '#10B981'
      : state === 'active'
      ? '#FF5A14'
      : '#E2E8F0',
  color: state === 'pending' ? '#64748B' : '#FFFFFF',
  boxShadow: state === 'active' ? '0 0 0 3px rgba(255, 90, 20, 0.2)' : undefined,
});

const primaryButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 20px',
  borderRadius: '10px',
  backgroundColor: '#FF5A14',
  color: '#FFFFFF',
  fontSize: '0.92rem',
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  boxShadow: '0 4px 14px rgba(255, 90, 20, 0.28)',
  transition: 'all 0.15s ease',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#475569',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  backgroundColor: '#FFFFFF',
  color: '#0F172A',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
};
