export interface DashboardSummary {
  total_investigations: number;
  pending_review_count: number;
  actions_executed_count: number;
  status_distribution: Record<string, number>;
  priority_distribution: Record<string, number>;
  recent_activity: any[];
  is_empty: boolean;
}

export interface InvestigationCase {
  id: string;
  trigger_type: string;
  trigger_source: string;
  trigger_reason: string;
  priority: string;
  status: string;
  transaction_id?: string;
  user_id_ref?: string;
  merchant_id_ref?: string;
  created_by: string;
  idempotency_key: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  evidence_items?: any[];
  recommendations?: any[];
  decisions?: any[];
  action_requests?: any[];
}

export interface PaginatedCases {
  items: InvestigationCase[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface IntegrationItem {
  name: string;
  type: string;
  status: string;
  description: string;
}

const API_BASE = '/api/v1';

export const apiClient = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health/ready`);
    return res.json();
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    return res.json();
  },

  async getInvestigations(params: {
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<PaginatedCases> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.priority && params.priority !== 'ALL') query.set('priority', params.priority);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page.toString());
    if (params.page_size) query.set('page_size', params.page_size.toString());

    const res = await fetch(`${API_BASE}/investigations?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch investigations');
    return res.json();
  },

  async getInvestigationDetails(caseId: string): Promise<InvestigationCase> {
    const res = await fetch(`${API_BASE}/investigations/${caseId}`);
    if (!res.ok) throw new Error(`Case ${caseId} not found`);
    return res.json();
  },

  async submitDecision(caseId: string, decisionData: {
    decision: string;
    reason: string;
    reviewer_id: string;
    policy_reference?: string;
  }) {
    const res = await fetch(`${API_BASE}/investigations/${caseId}/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(decisionData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to submit decision');
    }
    return res.json();
  },

  async triggerInvestigation(payload: {
    trigger_type: string;
    trigger_source: string;
    trigger_reason: string;
    priority: string;
    idempotency_key: string;
    transaction_id?: string;
    user_id?: string;
    merchant_id?: string;
  }) {
    const res = await fetch(`${API_BASE}/investigations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok && res.status !== 409) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to dispatch trigger');
    }
    return res.json();
  },

  async getActions() {
    const res = await fetch(`${API_BASE}/actions`);
    if (!res.ok) throw new Error('Failed to fetch action history');
    return res.json();
  },

  async getAuditEvents(caseId?: string) {
    const url = caseId ? `${API_BASE}/audit?case_id=${caseId}` : `${API_BASE}/audit`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch audit events');
    return res.json();
  },

  async getIntegrationsStatus(): Promise<{ integrations: IntegrationItem[] }> {
    const res = await fetch(`${API_BASE}/integrations/status`);
    if (!res.ok) throw new Error('Failed to fetch integration statuses');
    return res.json();
  }
};
