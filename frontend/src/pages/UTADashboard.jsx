import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

const COLORS = ['#005151', '#3AD6C5', '#b7950b', '#dc2626', '#7c3aed', '#ea580c', '#16a34a', '#3b82f6', '#f59e0b'];
const JIRA_BASE = 'https://engjira.int.kronos.com';

const PRIORITY_COLOR = { P1: '#dc2626', P2: '#ea580c', P3: '#b7950b', P4: '#6b7280', P5: '#9ca3af', None: '#9ca3af' };
const SEVERITY_COLOR = { S1: '#dc2626', S2: '#ea580c', S3: '#b7950b', S4: '#6b7280' };

function StatCard({ label, value, sublabel, color = '#005151' }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-3xl font-bold" style={{ color }}>{value ?? '—'}</div>
      {sublabel && <div className="text-xs text-gray-400 mt-1">{sublabel}</div>}
    </div>
  );
}

function Badge({ text, color = '#6b7280' }) {
  return (
    <span className="inline-block text-xs font-semibold px-1.5 py-0.5 rounded" style={{ color, background: color + '18' }}>
      {text}
    </span>
  );
}

function parseCustomers(raw) {
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
    return arr.filter(Boolean).join(', ') || '—';
  } catch {
    return raw || '—';
  }
}

function DefectTable({ defects }) {
  if (!defects || defects.length === 0) {
    return <p className="text-sm text-gray-400 italic py-2">No defects found.</p>;
  }
  return (
    <div className="overflow-x-auto rounded border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Key</th>
            <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</th>
            <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Priority</th>
            <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Severity</th>
            <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assignee</th>
            <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer(s)</th>
            <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Age</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {defects.map((d, i) => (
            <tr key={d.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <a
                    href={`${JIRA_BASE}/browse/${d.key}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#005151] font-medium hover:underline flex items-center gap-1"
                  >
                    {d.key}
                    <ExternalLink size={11} className="text-gray-400 flex-shrink-0" />
                  </a>
                  {(d.labels || '').split(',').map(l => l.trim()).includes('UTA-INFOR-Defect') && (
                    <span style={{ padding: '1px 5px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', whiteSpace: 'nowrap' }}>
                      INFOR
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2 max-w-xs">
                <span className="text-gray-700 text-xs leading-snug line-clamp-2" title={d.summary}>
                  {d.summary}
                </span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <Badge text={d.priority || '—'} color={PRIORITY_COLOR[d.priority] || '#6b7280'} />
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {d.severity ? <Badge text={d.severity} color={SEVERITY_COLOR[d.severity] || '#6b7280'} /> : <span className="text-gray-300">—</span>}
              </td>
              <td className="px-3 py-2">
                <span className="text-xs text-gray-600">{d.status || '—'}</span>
              </td>
              <td className="px-3 py-2">
                <span className="text-xs text-gray-600">{d.assignee || <span className="text-amber-500">Unassigned</span>}</span>
              </td>
              <td className="px-3 py-2 max-w-[180px]">
                <span className="text-xs text-gray-500 break-words">{parseCustomers(d.customers)}</span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className={`text-xs font-medium ${(d.age_days || 0) >= 30 ? 'text-red-500' : 'text-gray-500'}`}>
                  {d.age_days ?? '?'}d
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CollapsibleSection({ title, count, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="font-semibold text-gray-700">{title}</span>
        <div className="flex items-center gap-2">
          {count != null && (
            <span className="bg-[#005151] text-white text-xs px-2 py-0.5 rounded-full">{count}</span>
          )}
          {badge && badge}
          {open
            ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
            : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
        </div>
      </button>
      {open && <div className="border-t border-gray-100 p-4">{children}</div>}
    </div>
  );
}

export default function UTADashboard() {
  const [stats, setStats] = useState(null);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getStats('uta'),
      api.getDefects('uta'),
    ])
      .then(([statsData, defectsData]) => {
        setStats(statsData);
        setDefects(defectsData.defects || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading UTA dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!stats) return <div className="p-8 text-center text-gray-500">No data</div>;

  // Split defects into sections
  const customerDefects = defects.filter(d => d.is_customer_reported === 1 || d.is_customer_reported === true);
  const internalDefects = defects.filter(d => !d.is_customer_reported || d.is_customer_reported === 0);

  // Chart data
  const priorityData = Object.entries(stats.byPriority || {}).filter(([k, v]) => k !== 'Unknown' && v > 0).map(([k, v]) => ({ name: k, value: v }));
  const severityData = Object.entries(stats.bySeverity || {}).filter(([k, v]) => k !== 'Unknown' && v > 0).map(([k, v]) => ({ name: k, value: v }));
  const ageData = Object.entries(stats.byAge || {}).map(([k, v]) => ({ name: k, value: v }));
  const areaData = Object.entries(stats.byArea || {}).map(([k, v]) => ({ name: k, value: v })).sort((a, b) => b.value - a.value);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#005151]">UTA Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">ProTime UTA — Defect Health</p>
      </div>

      {/* Row 1: Customer-Related */}
      <div className="mb-2">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer Related</div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <StatCard label="Customer Impacting" value={stats.customerImpacting} sublabel="RCA-Type-Defect" color="#dc2626" />
          <StatCard label="Customer Facing High Priority" value={stats.customerFacingHighPriority} sublabel="P1+P2 with customers" color="#ea580c" />
          <StatCard label="High Severity (Customer)" value={stats.highSeverityCustomer} sublabel="S1+S2 with customers" color="#b91c1c" />
        </div>
      </div>

      {/* Row 2: Internal & Operational */}
      <div className="mb-2">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Internal & Operational</div>
        <div className="grid grid-cols-5 gap-4 mb-6">
          <StatCard label="Internal Only" value={stats.internalOnly} sublabel="No customer impact" color="#005151" />
          <StatCard label="High Severity (Internal)" value={stats.highSeverityInternal} sublabel="S1+S2 internal" color="#7c3aed" />
          <StatCard label="Stale" value={stats.stale} sublabel="No update 30+ days" color="#6b7280" />
          <StatCard label="Unassigned" value={stats.unassigned} sublabel="Needs owner" color="#ca8a04" />
          <StatCard label="Total Open" value={stats.total} sublabel="All open defects" color="#005151" />
        </div>
      </div>

      {/* Pie Charts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-4">
        <h2 className="font-semibold text-gray-700 mb-4">Defect Breakdown</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { title: 'By Priority', data: priorityData },
            { title: 'By Severity', data: severityData },
            { title: 'By Age', data: ageData },
            { title: 'By Area', data: areaData.slice(0, 9) },
          ].map(({ title, data }) => (
            <div key={title}>
              <div className="text-xs font-semibold text-gray-500 text-center mb-2">{title}</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                    {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>

      {/* Collapsible defect sections */}
      <div className="space-y-3">
        {/* SF Escalations — Customer Escalations (Non-Code) */}
        <CollapsibleSection title="SF Escalations — Customer Escalations (Non-Code)" count={null}>
          <p className="text-sm text-gray-400 italic">
            Non-code SF escalations (config, training, environment) are not tracked as Jira defects.
            See Salesforce cases for these escalations.
          </p>
        </CollapsibleSection>

        {/* SF Escalations — Customer Defects (Code-Defects) */}
        <CollapsibleSection
          title="SF Escalations — Customer Defects (Code-Defects)"
          count={customerDefects.length}
          defaultOpen={true}
        >
          {customerDefects.length > 0 ? (
            <DefectTable defects={customerDefects} />
          ) : (
            <p className="text-sm text-gray-400 italic">No customer-facing code defects. Run Sync Jira to refresh.</p>
          )}
        </CollapsibleSection>

        {/* Internal Defects */}
        <CollapsibleSection title="Internal Defects (Code-Defects)" count={internalDefects.length}>
          <DefectTable defects={internalDefects} />
        </CollapsibleSection>

        {/* Security Vulnerabilities */}
        <CollapsibleSection title="Security Vulnerabilities" count={null}>
          <p className="text-sm text-gray-400 italic">Security defects — see the <a href="/security" className="text-[#005151] underline">Security dashboard</a>.</p>
        </CollapsibleSection>

        {/* All Open Defects */}
        <CollapsibleSection title="All Open Defects" count={defects.length}>
          <DefectTable defects={defects} />
        </CollapsibleSection>
      </div>
    </div>
  );
}
