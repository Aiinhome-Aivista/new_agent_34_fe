import React, { useState, useEffect } from 'react';
import {
  Shield,
  FileText,
  Sliders,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Layers,
  X,
  Lock,
  Zap,
  Globe,
  Database,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { apiClient } from '../api/client';
import type { CompanyPolicy, FraudParameter, SectionSummary } from '../api/client';

export const AdminManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'policies' | 'parameters'>('policies');

  // Policies State
  const [policies, setPolicies] = useState<CompanyPolicy[]>([]);
  const [policyCategoryFilter, setPolicyCategoryFilter] = useState('ALL');
  const [policySearch, setPolicySearch] = useState('');
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  // Parameters State
  const [parameters, setParameters] = useState<FraudParameter[]>([]);
  const [paramSectionFilter, setParamSectionFilter] = useState('ALL');
  const [paramSearch, setParamSearch] = useState('');
  const [sectionsSummary, setSectionsSummary] = useState<SectionSummary[]>([]);
  const [loadingParameters, setLoadingParameters] = useState(false);

  // Global Messages
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals State
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<CompanyPolicy | null>(null);
  const [policyForm, setPolicyForm] = useState({
    document_key: '',
    title: '',
    version: '1.0',
    category: 'GENERAL',
    action_impact: 'ADVISORY',
    description: '',
    content: '',
    status: 'APPROVED',
  });

  const [isParamModalOpen, setIsParamModalOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<FraudParameter | null>(null);
  const [paramForm, setParamForm] = useState({
    parameter_key: '',
    name: '',
    section: 'USER_PROFILE',
    data_type: 'STRING',
    threshold_value: '',
    risk_weight: 'HIGH',
    description: '',
    is_active: true,
  });

  // Load Policies
  const loadPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const data = await apiClient.getPolicies({
        category: policyCategoryFilter !== 'ALL' ? policyCategoryFilter : undefined,
      });
      setPolicies(data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load company policies' });
    } finally {
      setLoadingPolicies(false);
    }
  };

  // Load Parameters
  const loadParameters = async () => {
    setLoadingParameters(true);
    try {
      const [paramsData, sectionsData] = await Promise.all([
        apiClient.getParameters({
          section: paramSectionFilter !== 'ALL' ? paramSectionFilter : undefined,
        }),
        apiClient.getParameterSections(),
      ]);
      setParameters(paramsData);
      setSectionsSummary(sectionsData);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load parameters' });
    } finally {
      setLoadingParameters(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, [policyCategoryFilter]);

  useEffect(() => {
    loadParameters();
  }, [paramSectionFilter]);

  // Policy Form Handlers
  const openNewPolicyModal = () => {
    setEditingPolicy(null);
    setPolicyForm({
      document_key: `FRAUD_SOP_0${policies.length + 1}`,
      title: '',
      version: '1.0',
      category: 'GENERAL',
      action_impact: 'ADVISORY',
      description: '',
      content: '',
      status: 'APPROVED',
    });
    setIsPolicyModalOpen(true);
  };

  const openEditPolicyModal = (p: CompanyPolicy) => {
    setEditingPolicy(p);
    setPolicyForm({
      document_key: p.document_key,
      title: p.title,
      version: p.version,
      category: p.category,
      action_impact: p.action_impact || 'ADVISORY',
      description: p.description || '',
      content: p.content || '',
      status: p.status,
    });
    setIsPolicyModalOpen(true);
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyForm.document_key.trim() || !policyForm.title.trim()) {
      alert('Document Key and Title are required.');
      return;
    }
    try {
      if (editingPolicy) {
        await apiClient.updatePolicy(editingPolicy.id, policyForm);
        setFeedback({ type: 'success', message: `Policy ${policyForm.document_key} updated successfully.` });
      } else {
        await apiClient.createPolicy(policyForm);
        setFeedback({ type: 'success', message: `Policy ${policyForm.document_key} created successfully.` });
      }
      setIsPolicyModalOpen(false);
      loadPolicies();
    } catch (err: any) {
      alert(err.message || 'Failed to save policy');
    }
  };

  const handleDeletePolicy = async (p: CompanyPolicy) => {
    if (!window.confirm(`Are you sure you want to permanently delete policy ${p.document_key}?`)) {
      return;
    }
    try {
      await apiClient.deletePolicy(p.id);
      setFeedback({ type: 'success', message: `Policy ${p.document_key} deleted successfully.` });
      loadPolicies();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete policy' });
    }
  };

  // Parameter Form Handlers
  const openNewParamModal = () => {
    setEditingParam(null);
    setParamForm({
      parameter_key: '',
      name: '',
      section: paramSectionFilter !== 'ALL' ? paramSectionFilter : 'USER_PROFILE',
      data_type: 'STRING',
      threshold_value: '',
      risk_weight: 'HIGH',
      description: '',
      is_active: true,
    });
    setIsParamModalOpen(true);
  };

  const openEditParamModal = (param: FraudParameter) => {
    setEditingParam(param);
    setParamForm({
      parameter_key: param.parameter_key,
      name: param.name,
      section: param.section,
      data_type: param.data_type,
      threshold_value: param.threshold_value,
      risk_weight: param.risk_weight,
      description: param.description,
      is_active: param.is_active,
    });
    setIsParamModalOpen(true);
  };

  const handleSaveParam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paramForm.parameter_key.trim() || !paramForm.name.trim() || !paramForm.threshold_value.trim()) {
      alert('Parameter Key, Name, and Threshold Value are required.');
      return;
    }
    try {
      if (editingParam) {
        await apiClient.updateParameter(editingParam.id, paramForm);
        setFeedback({ type: 'success', message: `Parameter ${paramForm.parameter_key} updated successfully.` });
      } else {
        await apiClient.createParameter(paramForm);
        setFeedback({ type: 'success', message: `Parameter ${paramForm.parameter_key} created successfully.` });
      }
      setIsParamModalOpen(false);
      loadParameters();
    } catch (err: any) {
      alert(err.message || 'Failed to save parameter');
    }
  };

  const handleDeleteParam = async (param: FraudParameter) => {
    if (!window.confirm(`Are you sure you want to delete parameter ${param.parameter_key}?`)) {
      return;
    }
    try {
      await apiClient.deleteParameter(param.id);
      setFeedback({ type: 'success', message: `Parameter ${param.parameter_key} deleted successfully.` });
      loadParameters();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete parameter' });
    }
  };

  const filteredPolicies = policies.filter((p) => {
    if (!policySearch.trim()) return true;
    const q = policySearch.toLowerCase();
    return (
      p.document_key.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  const filteredParams = parameters.filter((param) => {
    if (!paramSearch.trim()) return true;
    const q = paramSearch.toLowerCase();
    return (
      param.parameter_key.toLowerCase().includes(q) ||
      param.name.toLowerCase().includes(q) ||
      param.description.toLowerCase().includes(q)
    );
  });

  const getSectionBadgeColor = (sec: string) => {
    switch (sec) {
      case 'USER_PROFILE':
        return '#3B82F6';
      case 'PAYMENT_TRANSACTION':
        return '#10B981';
      case 'ORDER_DETAILS':
        return '#F59E0B';
      case 'CHARGEBACK_DISPUTE':
        return '#EF4444';
      case 'GRAPH_NETWORK':
        return '#8B5CF6';
      case 'GATEWAY_RULE':
        return '#EC4899';
      default:
        return 'var(--color-primary)';
    }
  };

  const getRiskWeightBadgeColor = (weight: string) => {
    switch (weight) {
      case 'CRITICAL':
        return '#EF4444';
      case 'HIGH':
        return '#F97316';
      case 'MEDIUM':
        return '#F59E0B';
      case 'LOW':
        return '#10B981';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px' }} className="animate-fade-in">
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
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
              }}
            >
              <Shield size={18} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Admin Management Console
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              ADMIN PERSONA ONLY
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', margin: 0, maxWidth: '750px' }}>
            Configure and govern company fraud policies (SOPs) and live detection parameter thresholds across User, Payment, Order, Chargeback, and Graph Network sections.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'policies' ? (
            <Button variant="primary" size="sm" onClick={openNewPolicyModal} icon={<Plus size={15} />}>
              Create New Policy
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={openNewParamModal} icon={<Plus size={15} />}>
              Add Parameter Threshold
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (activeTab === 'policies') loadPolicies();
              else loadParameters();
            }}
            icon={<RefreshCw size={14} />}
          >
            Sync DB
          </Button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{policies.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Approved SOP Policies</div>
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
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sliders size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{parameters.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Active Fraud Parameters</div>
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
              backgroundColor: 'rgba(255, 90, 20, 0.12)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>6 Sections</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Profile, Tx, Order, Dispute, Graph, Rule</div>
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
              backgroundColor: 'rgba(139, 92, 246, 0.12)',
              color: '#8B5CF6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Database size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>MySQL 8.0</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Live Persisted State</div>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${feedback.type === 'success' ? '#10B981' : '#EF4444'}`,
            color: feedback.type === 'success' ? '#10B981' : '#EF4444',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '24px',
          gap: '8px',
        }}
      >
        <button
          onClick={() => setActiveTab('policies')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'policies' ? '2px solid var(--color-primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'policies' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'policies' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <FileText size={17} color={activeTab === 'policies' ? 'var(--color-primary)' : 'inherit'} />
          Company Policies & SOPs ({policies.length})
        </button>

        <button
          onClick={() => setActiveTab('parameters')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'parameters' ? '2px solid var(--color-primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'parameters' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'parameters' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <Sliders size={17} color={activeTab === 'parameters' ? 'var(--color-primary)' : 'inherit'} />
          Fraud Detection Parameters by Section ({parameters.length})
        </button>
      </div>

      {/* TAB 1: POLICIES VIEW */}
      {activeTab === 'policies' && (
        <div>
          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['ALL', 'CHARGEBACK', 'AUTO_ACTION', 'DEVICE_RING', 'HUMAN_REVIEW', 'IDENTITY', 'GENERAL'].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setPolicyCategoryFilter(cat)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      border: `1px solid ${policyCategoryFilter === cat ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      backgroundColor:
                        policyCategoryFilter === cat ? 'rgba(255, 90, 20, 0.12)' : 'var(--color-surface)',
                      color: policyCategoryFilter === cat ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                )
              )}
            </div>

            <div style={{ position: 'relative', width: '280px' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-secondary)',
                }}
              />
              <input
                type="text"
                placeholder="Search policies..."
                value={policySearch}
                onChange={(e) => setPolicySearch(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '34px',
                  paddingRight: '12px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>

          {/* Policy Cards Grid */}
          {loadingPolicies ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-secondary)' }}>
              Loading company policies from MySQL...
            </div>
          ) : filteredPolicies.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                  No company policies match your current filter.
                </p>
                <Button variant="secondary" size="sm" onClick={openNewPolicyModal}>
                  Create First Policy
                </Button>
              </div>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
              {filteredPolicies.map((p) => (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border-orange)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-family-mono)',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: 'var(--color-primary)',
                        }}
                      >
                        {p.document_key}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                            color: '#3B82F6',
                          }}
                        >
                          v{p.version}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            color: '#10B981',
                          }}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px', lineHeight: 1.3 }}>
                      {p.title}
                    </h3>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-input-background)',
                          color: 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        Category: <strong>{p.category}</strong>
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-input-background)',
                          color: p.action_impact === 'BLOCKING' ? '#EF4444' : 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        Impact: <strong>{p.action_impact}</strong>
                      </span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                      {p.description || 'No detailed summary provided.'}
                    </p>

                    {p.content && (
                      <div
                        style={{
                          padding: '10px 12px',
                          backgroundColor: 'var(--color-input-background)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          border: '1px solid var(--color-border)',
                          fontStyle: 'italic',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        "{p.content}"
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '8px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--color-border)',
                    }}
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditPolicyModal(p)}
                      icon={<Edit2 size={13} />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeletePolicy(p)}
                      icon={<Trash2 size={13} />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PARAMETERS VIEW */}
      {activeTab === 'parameters' && (
        <div>
          {/* Section Pill Switcher */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => setParamSectionFilter('ALL')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${paramSectionFilter === 'ALL' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                backgroundColor:
                  paramSectionFilter === 'ALL' ? 'rgba(255, 90, 20, 0.12)' : 'var(--color-surface)',
                color: paramSectionFilter === 'ALL' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              All Sections ({parameters.length})
            </button>

            {[
              { id: 'USER_PROFILE', label: '👤 User Profile', icon: '👤' },
              { id: 'PAYMENT_TRANSACTION', label: '💳 Payment Transaction', icon: '💳' },
              { id: 'ORDER_DETAILS', label: '📦 Order Details', icon: '📦' },
              { id: 'CHARGEBACK_DISPUTE', label: '⚖️ Chargeback & Dispute', icon: '⚖️' },
              { id: 'GRAPH_NETWORK', label: '🕸️ Graph Network & Device', icon: '🕸️' },
              { id: 'GATEWAY_RULE', label: '🛡️ Decision Gateway Rule', icon: '🛡️' },
            ].map((sec) => {
              const count = sectionsSummary.find((s) => s.section === sec.id)?.total_parameters || 0;
              return (
                <button
                  key={sec.id}
                  onClick={() => setParamSectionFilter(sec.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    border: `1px solid ${paramSectionFilter === sec.id ? getSectionBadgeColor(sec.id) : 'var(--color-border)'}`,
                    backgroundColor:
                      paramSectionFilter === sec.id ? `${getSectionBadgeColor(sec.id)}15` : 'var(--color-surface)',
                    color: paramSectionFilter === sec.id ? getSectionBadgeColor(sec.id) : 'var(--color-text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{sec.label}</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--color-input-background)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '380px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-secondary)',
              }}
            />
            <input
              type="text"
              placeholder="Search parameters by key or name..."
              value={paramSearch}
              onChange={(e) => setParamSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '34px',
                paddingRight: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* Parameters Table */}
          {loadingParameters ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-secondary)' }}>
              Loading fraud detection parameters...
            </div>
          ) : filteredParams.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                  No parameters found in this section.
                </p>
                <Button variant="secondary" size="sm" onClick={openNewParamModal}>
                  Add Parameter
                </Button>
              </div>
            </Card>
          ) : (
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
              }}
            >
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
                      <th style={{ padding: '14px 16px' }}>Parameter Name & Key</th>
                      <th style={{ padding: '14px 16px' }}>Section</th>
                      <th style={{ padding: '14px 16px' }}>Type</th>
                      <th style={{ padding: '14px 16px' }}>Threshold / Trigger Value</th>
                      <th style={{ padding: '14px 16px' }}>Risk Weight</th>
                      <th style={{ padding: '14px 16px' }}>Status</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParams.map((param) => (
                      <tr
                        key={param.id}
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
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '3px' }}>
                            {param.name}
                          </div>
                          <code
                            style={{
                              fontSize: '0.76rem',
                              color: 'var(--color-primary)',
                              backgroundColor: 'rgba(255, 90, 20, 0.08)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {param.parameter_key}
                          </code>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                            {param.description}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: `${getSectionBadgeColor(param.section)}15`,
                              color: getSectionBadgeColor(param.section),
                              border: `1px solid ${getSectionBadgeColor(param.section)}40`,
                            }}
                          >
                            {param.section.replace('_', ' ')}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                          {param.data_type}
                        </td>

                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontSize: '0.92rem',
                              fontFamily: 'var(--font-family-mono)',
                              fontWeight: 700,
                              color: 'var(--color-text-primary)',
                              backgroundColor: 'var(--color-input-background)',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            {param.threshold_value}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: `${getRiskWeightBadgeColor(param.risk_weight)}20`,
                              color: getRiskWeightBadgeColor(param.risk_weight),
                              border: `1px solid ${getRiskWeightBadgeColor(param.risk_weight)}40`,
                            }}
                          >
                            {param.risk_weight}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: param.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                              color: param.is_active ? '#10B981' : 'var(--color-text-secondary)',
                            }}
                          >
                            {param.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openEditParamModal(param)}
                              icon={<Edit2 size={13} />}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteParam(param)}
                              icon={<Trash2 size={13} />}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* POLICY MODAL (CREATE / EDIT) */}
      {isPolicyModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              maxWidth: '600px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {editingPolicy ? `Edit Policy: ${editingPolicy.document_key}` : 'Create New Company Policy'}
              </h2>
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Document Key *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPolicy}
                    value={policyForm.document_key}
                    onChange={(e) => setPolicyForm({ ...policyForm, document_key: e.target.value.toUpperCase() })}
                    placeholder="e.g. FRAUD_SOP_06"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Version
                  </label>
                  <input
                    type="text"
                    value={policyForm.version}
                    onChange={(e) => setPolicyForm({ ...policyForm, version: e.target.value })}
                    placeholder="1.0"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Policy Title *
                </label>
                <input
                  type="text"
                  required
                  value={policyForm.title}
                  onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
                  placeholder="e.g. Cross-Border Velocity Limits & KYC Escalation"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={policyForm.category}
                    onChange={(e) => setPolicyForm({ ...policyForm, category: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="CHARGEBACK">CHARGEBACK</option>
                    <option value="AUTO_ACTION">AUTO_ACTION</option>
                    <option value="DEVICE_RING">DEVICE_RING</option>
                    <option value="HUMAN_REVIEW">HUMAN_REVIEW</option>
                    <option value="IDENTITY">IDENTITY</option>
                    <option value="GENERAL">GENERAL</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Action Impact
                  </label>
                  <select
                    value={policyForm.action_impact}
                    onChange={(e) => setPolicyForm({ ...policyForm, action_impact: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="BLOCKING">BLOCKING (Requires Review)</option>
                    <option value="RESTRICTIVE">RESTRICTIVE (Payment Hold)</option>
                    <option value="MONITORING">MONITORING (Watchlist)</option>
                    <option value="ADVISORY">ADVISORY (Identity Check)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Summary Description
                </label>
                <textarea
                  rows={2}
                  value={policyForm.description}
                  onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                  placeholder="Brief summary of policy conditions and thresholds..."
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Policy Content / Mandatory Clauses (Vector RAG Indexed)
                </label>
                <textarea
                  rows={4}
                  value={policyForm.content}
                  onChange={(e) => setPolicyForm({ ...policyForm, content: e.target.value })}
                  placeholder="Specify exact clauses that the LLM agent will retrieve and ground recommendations against..."
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <Button variant="secondary" type="button" onClick={() => setIsPolicyModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingPolicy ? 'Update Policy' : 'Create Policy'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PARAMETER MODAL (CREATE / EDIT) */}
      {isParamModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              maxWidth: '600px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {editingParam ? `Edit Parameter: ${editingParam.name}` : 'Add Fraud Detection Parameter'}
              </h2>
              <button
                onClick={() => setIsParamModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveParam} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Parameter Name *
                </label>
                <input
                  type="text"
                  required
                  value={paramForm.name}
                  onChange={(e) => setParamForm({ ...paramForm, name: e.target.value })}
                  placeholder="e.g. Card Payment Failure Velocity"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Parameter Key *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingParam}
                    value={paramForm.parameter_key}
                    onChange={(e) => setParamForm({ ...paramForm, parameter_key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="e.g. card_payment_failure_velocity"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Section *
                  </label>
                  <select
                    value={paramForm.section}
                    onChange={(e) => setParamForm({ ...paramForm, section: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="USER_PROFILE">👤 User Profile</option>
                    <option value="PAYMENT_TRANSACTION">💳 Payment Transaction</option>
                    <option value="ORDER_DETAILS">📦 Order Details</option>
                    <option value="CHARGEBACK_DISPUTE">⚖️ Chargeback Dispute</option>
                    <option value="GRAPH_NETWORK">🕸️ Graph Network</option>
                    <option value="GATEWAY_RULE">🛡️ Gateway Rule</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Data Type
                  </label>
                  <select
                    value={paramForm.data_type}
                    onChange={(e) => setParamForm({ ...paramForm, data_type: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="STRING">STRING</option>
                    <option value="NUMBER">NUMBER</option>
                    <option value="PERCENTAGE">PERCENTAGE</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Threshold / Trigger Value *
                  </label>
                  <input
                    type="text"
                    required
                    value={paramForm.threshold_value}
                    onChange={(e) => setParamForm({ ...paramForm, threshold_value: e.target.value })}
                    placeholder="e.g. 3, 50000, 1.0%, TRUE"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Risk Weight
                  </label>
                  <select
                    value={paramForm.risk_weight}
                    onChange={(e) => setParamForm({ ...paramForm, risk_weight: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginTop: '24px', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="is_active_toggle"
                    checked={paramForm.is_active}
                    onChange={(e) => setParamForm({ ...paramForm, is_active: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="is_active_toggle" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                    Parameter Active in Engine
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Forensic Description / Rule Rationale *
                </label>
                <textarea
                  rows={3}
                  required
                  value={paramForm.description}
                  onChange={(e) => setParamForm({ ...paramForm, description: e.target.value })}
                  placeholder="Explain why this threshold is set and how the agent uses it to detect fraud vs legitimate transactions..."
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <Button variant="secondary" type="button" onClick={() => setIsParamModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingParam ? 'Save Changes' : 'Add Parameter'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
