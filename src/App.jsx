import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CaseList from './components/CaseList';
import InvestigationDetail from './components/InvestigationDetail';
import EvidenceTabs from './components/EvidenceTabs';
import DecisionPanel from './components/DecisionPanel';
import AuditTimeline from './components/AuditTimeline';
import TriggerModal from './components/TriggerModal';
import PolicyDrawer from './components/PolicyDrawer';
import { api, setAuthToken } from './api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [caseDetail, setCaseDetail] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [policies, setPolicies] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRunningAgent, setIsRunningAgent] = useState(false);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [isPolicyDrawerOpen, setIsPolicyDrawerOpen] = useState(false);

  // 1. Initial login as Lead Investigator
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    setIsLoading(true);
    try {
      // Default login as priya.investigator
      const authData = await api.login('priya.investigator');
      setCurrentUser(authData);

      // Fetch cases & policies
      await loadCases();
      const policyData = await api.getPolicies();
      setPolicies(policyData);
    } catch (err) {
      console.error("Initialization failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCases = async () => {
    try {
      const caseList = await api.getCases();
      setCases(caseList);
      if (caseList.length > 0 && !selectedCaseId) {
        setSelectedCaseId(caseList[0].case_id);
      }
    } catch (err) {
      console.error("Failed to load cases:", err);
    }
  };

  // 2. Load case detail and audit when selectedCaseId changes
  useEffect(() => {
    if (selectedCaseId) {
      loadCaseData(selectedCaseId);
    }
  }, [selectedCaseId]);

  const loadCaseData = async (caseId) => {
    try {
      const [detail, audits] = await Promise.all([
        api.getCaseDetail(caseId),
        api.getCaseAudit(caseId)
      ]);
      setCaseDetail(detail);
      setAuditEvents(audits);
    } catch (err) {
      console.error("Failed to load case data:", err);
    }
  };

  // Switch role dynamically
  const handleSwitchUser = async (username) => {
    try {
      const authData = await api.login(username);
      setCurrentUser(authData);
      // Reload current case data with new token permissions
      if (selectedCaseId) {
        await loadCaseData(selectedCaseId);
      }
    } catch (err) {
      alert("Role switch failed: " + err.message);
    }
  };

  // Trigger autonomous agent re-investigation
  const handleRunInvestigation = async (caseId) => {
    setIsRunningAgent(true);
    try {
      await api.runInvestigation(caseId);
      // Poll briefly for background LangGraph completion
      setTimeout(async () => {
        await loadCaseData(caseId);
        await loadCases();
        setIsRunningAgent(false);
      }, 1500);
    } catch (err) {
      alert("Investigation execution failed: " + err.message);
      setIsRunningAgent(false);
    }
  };

  // Submit human decision
  const handleSubmitDecision = async (payload) => {
    setIsSubmittingDecision(true);
    try {
      const res = await api.submitDecision(selectedCaseId, payload);
      await loadCaseData(selectedCaseId);
      await loadCases();
      return res;
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Ingest new external trigger
  const handleIngestTrigger = async (payload) => {
    const res = await api.ingestTrigger(payload);
    await loadCases();
    if (res.case_id) {
      setSelectedCaseId(res.case_id);
      // Allow background agent run to settle
      setTimeout(async () => {
        await loadCaseData(res.case_id);
        await loadCases();
      }, 2000);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '3px solid rgba(99, 102, 241, 0.2)',
            borderTopColor: '#6366f1',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Connecting to Agent 34 MySQL Database & Policy Knowledge Base...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenTriggerModal={() => setIsTriggerModalOpen(true)}
        onOpenPolicyDrawer={() => setIsPolicyDrawerOpen(true)}
        onRefresh={() => {
          loadCases();
          if (selectedCaseId) loadCaseData(selectedCaseId);
        }}
      />

      {/* Main 3-Column Layout */}
      <main style={{
        flex: 1,
        padding: '0 24px 24px',
        display: 'grid',
        gridTemplateColumns: '310px minmax(0, 1fr) 350px',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* Left Column: Case Queue */}
        <CaseList
          cases={cases}
          selectedCaseId={selectedCaseId}
          onSelectCase={(id) => setSelectedCaseId(id)}
        />

        {/* Center Column: Investigation Analysis & Evidence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <InvestigationDetail
            caseDetail={caseDetail}
            isRunningAgent={isRunningAgent}
            onRunInvestigation={handleRunInvestigation}
          />

          <EvidenceTabs
            evidenceRecords={caseDetail?.evidence || []}
          />

          <AuditTimeline
            auditEvents={auditEvents}
          />
        </div>

        {/* Right Column: Decision Gateway & Action Service */}
        <DecisionPanel
          caseDetail={caseDetail}
          currentUser={currentUser}
          onSubmitDecision={handleSubmitDecision}
          isSubmitting={isSubmittingDecision}
        />
      </main>

      {/* Modals & Drawers */}
      <TriggerModal
        isOpen={isTriggerModalOpen}
        onClose={() => setIsTriggerModalOpen(false)}
        onIngestTrigger={handleIngestTrigger}
      />

      <PolicyDrawer
        isOpen={isPolicyDrawerOpen}
        onClose={() => setIsPolicyDrawerOpen(false)}
        policies={policies}
      />
    </div>
  );
}
