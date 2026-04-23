const API_BASE = 'http://localhost:3001/api';

async function fetchAPI(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) throw new Error(`API error ${response.status}: ${response.statusText}`);
  return response.json();
}

export const api = {
  // Defects
  getDefects: (product, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/defects/${product}${query ? '?' + query : ''}`);
  },
  getStats: (product) => fetchAPI(`/defects/${product}/stats`),
  getByCategory: (product, category) => fetchAPI(`/defects/${product}/by-category/${category}`),
  getTopCustomers: (product, limit = 5) => fetchAPI(`/defects/${product}/top-customers?limit=${limit}`),
  getKeyThemes: (product) => fetchAPI(`/defects/${product}/key-themes`),
  getUpgradeTracker: (product) => fetchAPI(`/defects/${product}/upgrade-tracker`),

  // Reports
  getLeadership: () => fetchAPI('/reports/leadership'),
  getSecurity: () => fetchAPI('/reports/security'),
  getSecurityUTA: () => fetchAPI('/reports/security/uta'),
  getSecurityUTM: () => fetchAPI('/reports/security/utm'),
  getSecurityWFM: () => fetchAPI('/reports/security/wfm-classic'),
  getHistory: (product, months = 6) => fetchAPI(`/reports/history/${product}?months=${months}`),

  // Sync
  triggerSync: (product = 'all') => fetchAPI('/sync', { method: 'POST', body: JSON.stringify({ product }) }),
  getSyncStatus: () => fetchAPI('/sync/status'),

  // KTLO
  getKTLO: (product) => fetchAPI(`/ktlo/${product}`),

  // Customer Impact
  getCustomerImpact: (product) => fetchAPI(`/customer-impact/${product}`),

  // Insights
  getInsights: (product) => fetchAPI(`/insights/${product}`),

  // Chat
  chat: (message, context) => fetchAPI('/chat', { method: 'POST', body: JSON.stringify({ message, context }) }),
};
