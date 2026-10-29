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

export interface PersonaUser {
  id: string;
  identity_subject: string;
  display_name: string;
  email: string;
  role: string;
  avatar: string;
  badge: string;
  badge_color: string;
  description: string;
  demo_password?: string;
}

export interface CompanyPolicy {
  id: string;
  document_key: string;
  title: string;
  version: string;
  category: string;
  action_impact: string;
  description: string;
  content: string;
  status: string;
  source_reference?: string;
  effective_from?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FraudParameter {
  id: string;
  parameter_key: string;
  name: string;
  section: string;
  data_type: string;
  threshold_value: string;
  risk_weight: string;
  description: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SectionSummary {
  section: string;
  total_parameters: number;
  active_parameters: number;
}

const API_BASE = '/api/v1';

export const apiClient = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health/ready`);
    return res.json();
  },

  // -------------------------------------------------------------
  // Authentication & Persona endpoints
  // -------------------------------------------------------------
  async getPersonas(): Promise<PersonaUser[]> {
    const res = await fetch(`${API_BASE}/auth/personas`);
    if (!res.ok) throw new Error('Failed to load personas from database');
    return res.json();
  },

  async login(credentials: { email: string; password: string }): Promise<{
    status: string;
    message: string;
    user: PersonaUser;
    token: string;
  }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Authentication failed');
    }
    return res.json();
  },

  // -------------------------------------------------------------
  // Dashboard & Investigation endpoints
  // -------------------------------------------------------------
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

  async uploadCaseEvidence(caseId: string, formData: FormData): Promise<{
    message: string;
    case_id: string;
    evidence: any;
  }> {
    const res = await fetch(`${API_BASE}/investigations/${caseId}/evidence-upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to upload evidence file');
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
  },

  // -------------------------------------------------------------
  // Admin Policies CRUD
  // -------------------------------------------------------------
  async getPolicies(params: { category?: string; status?: string } = {}): Promise<CompanyPolicy[]> {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'ALL') query.set('category', params.category);
    if (params.status && params.status !== 'ALL') query.set('status', params.status);

    const res = await fetch(`${API_BASE}/admin/policies?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch policies');
    return res.json();
  },

  async createPolicy(policy: Partial<CompanyPolicy>): Promise<CompanyPolicy> {
    const res = await fetch(`${API_BASE}/admin/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create policy');
    }
    return res.json();
  },

  async updatePolicy(id: string, policy: Partial<CompanyPolicy>): Promise<CompanyPolicy> {
    const res = await fetch(`${API_BASE}/admin/policies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update policy');
    }
    return res.json();
  },

  async deletePolicy(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/policies/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete policy');
    }
  },

  // -------------------------------------------------------------
  // Admin Parameters CRUD
  // -------------------------------------------------------------
  async getParameters(params: { section?: string; is_active?: boolean } = {}): Promise<FraudParameter[]> {
    const query = new URLSearchParams();
    if (params.section && params.section !== 'ALL') query.set('section', params.section);
    if (params.is_active !== undefined) query.set('is_active', params.is_active.toString());

    const res = await fetch(`${API_BASE}/admin/parameters?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch fraud parameters');
    return res.json();
  },

  async createParameter(param: Partial<FraudParameter>): Promise<FraudParameter> {
    const res = await fetch(`${API_BASE}/admin/parameters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(param),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create parameter');
    }
    return res.json();
  },

  async updateParameter(id: string, param: Partial<FraudParameter>): Promise<FraudParameter> {
    const res = await fetch(`${API_BASE}/admin/parameters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(param),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update parameter');
    }
    return res.json();
  },

  async deleteParameter(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/parameters/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete parameter');
    }
  },

  async getParameterSections(): Promise<SectionSummary[]> {
    const res = await fetch(`${API_BASE}/admin/sections`);
    if (!res.ok) throw new Error('Failed to fetch sections summary');
    return res.json();
  },

  // -------------------------------------------------------------
  // Batch Excel/CSV Ingestion & Auto-Trigger
  // -------------------------------------------------------------
  async uploadBatchFile(formData: FormData): Promise<{
    status: string;
    message: string;
    total_rows: number;
    ingested: number;
    triggered_cases: any[];
  }> {
    const res = await fetch(`${API_BASE}/ingest/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to ingest batch file');
    }
    return res.json();
  },

  async uploadBatchFileStream(
    formData: FormData,
    onProgress?: (data: any) => void
  ): Promise<{
    status: string;
    message: string;
    total_rows: number;
    ingested: number;
    triggered_cases: any[];
  }> {
    const res = await fetch(`${API_BASE}/ingest/upload-stream`, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'text/event-stream',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to ingest batch file');
    }

    const result = await readSseStream<{
      status: string;
      message: string;
      total_rows: number;
      ingested: number;
      triggered_cases: any[];
    }>(res, onProgress);

    return result || {
      status: 'SUCCESS',
      message: 'Batch ingestion completed.',
      total_rows: 0,
      ingested: 0,
      triggered_cases: [],
    };
  },

  async getIngestStatus(): Promise<{
    auto_trigger_enabled: boolean;
    poll_interval_seconds: number;
    watch_directory: string;
    is_running: boolean;
    last_polled_at: string | null;
    total_auto_ingested: number;
  }> {
    const res = await fetch(`${API_BASE}/ingest/status`);
    if (!res.ok) throw new Error('Failed to fetch ingest poller status');
    return res.json();
  },

  getSampleTemplateUrl(): string {
    return `${API_BASE}/ingest/template`;
  },

  // -------------------------------------------------------------
  // Knowledge Base & Private Document RAG
  // -------------------------------------------------------------
  async uploadKnowledgeDocument(formData: FormData): Promise<{
    status: string;
    document_key: string;
    title: string;
    category: string;
    total_characters: number;
    chunks_indexed: number;
    filename: string;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/admin/knowledge/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to upload and index document');
    }
    return res.json();
  },

  async uploadKnowledgeDocumentStream(
    formData: FormData,
    onProgress?: (data: any) => void
  ): Promise<{
    status: string;
    document_key: string;
    title: string;
    category: string;
    total_characters: number;
    chunks_indexed: number;
    filename: string;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/admin/knowledge/upload-stream`, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'text/event-stream',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to upload and index document');
    }

    const result = await readSseStream<{
      status: string;
      document_key: string;
      title: string;
      category: string;
      total_characters: number;
      chunks_indexed: number;
      filename: string;
      message: string;
    }>(res, onProgress);

    return result || {
      status: 'SUCCESS',
      document_key: '',
      title: '',
      category: 'GENERAL',
      total_characters: 0,
      chunks_indexed: 0,
      filename: '',
      message: 'Document upload and indexing completed.',
    };
  },

  async reindexKnowledge(): Promise<{
    status: string;
    policies_reindexed: number;
    total_chunks: number;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/admin/knowledge/reindex`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to re-index knowledge base');
    }
    return res.json();
  },

  async getKnowledgeStatus(): Promise<{
    status: string;
    collection_name?: string;
    indexed_vectors_count: number;
  }> {
    const res = await fetch(`${API_BASE}/admin/knowledge/status`);
    if (!res.ok) throw new Error('Failed to fetch knowledge base status');
    return res.json();
  }
};

/**
 * Reads Server-Sent Events (SSE) stream from a response and fires onProgress callbacks.
 */
async function readSseStream<T>(
  response: Response,
  onProgress?: (data: any) => void
): Promise<T | null> {
  const reader = response.body?.getReader();
  if (!reader) {
    return response.json();
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult: any = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const payload = JSON.parse(trimmed.slice(6));
            if (onProgress) {
              onProgress(payload);
            }
            if (payload.event === 'complete') {
              finalResult = payload;
            }
          } catch (e) {
            console.warn('Could not parse SSE line:', trimmed, e);
          }
        }
      }
    }

    if (buffer.trim().startsWith('data: ')) {
      try {
        const payload = JSON.parse(buffer.trim().slice(6));
        if (onProgress) onProgress(payload);
        if (payload.event === 'complete') finalResult = payload;
      } catch (e) {
        // ignore
      }
    }
  } catch (streamErr) {
    console.error('Error reading SSE stream:', streamErr);
  }

  return finalResult;
}

