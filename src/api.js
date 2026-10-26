const API_BASE = "http://localhost:8000/api/v1";

// Default test token for initial view (can be switched dynamically)
let currentToken = null;

export const setAuthToken = (token) => {
  currentToken = token;
};

const getHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  if (currentToken) {
    headers["Authorization"] = `Bearer ${currentToken}`;
  }
  return headers;
};

export const api = {
  // Authentication & RBAC
  login: async (username, password = "Password@2026") => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    setAuthToken(data.access_token);
    return data;
  },

  getCurrentUser: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Cases
  getCases: async (status = "", priority = "") => {
    let url = `${API_BASE}/cases`;
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (priority) params.append("priority", priority);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getCaseDetail: async (caseId) => {
    const res = await fetch(`${API_BASE}/cases/${caseId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  runInvestigation: async (caseId) => {
    const res = await fetch(`${API_BASE}/cases/${caseId}/investigate`, {
      method: "POST",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  submitDecision: async (caseId, payload) => {
    const res = await fetch(`${API_BASE}/cases/${caseId}/decide`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Decision submission failed" }));
      throw new Error(err.detail || "Decision submission failed");
    }
    return res.json();
  },

  // Triggers
  ingestTrigger: async (payload) => {
    const res = await fetch(`${API_BASE}/triggers/ingest`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Policies
  getPolicies: async () => {
    const res = await fetch(`${API_BASE}/policies`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Audit
  getCaseAudit: async (caseId) => {
    const res = await fetch(`${API_BASE}/audit/case/${caseId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
