import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

const COLORS = ['#0d9488', '#3AD6C5', '#b7950b', '#dc2626', '#7c3aed', '#ea580c', '#16a34a', '#3b82f6', '#f59e0b'];
const JIRA_BASE = 'https://engjira.int.kronos.com';

const PRIORITY_COLOR = { P1: '#dc2626', P2: '#ea580c', P3: '#b7950b', P4: '#6b7280', P5: '#9ca3af', None: '#9ca3af' };
const SEVERITY_COLOR = { S1: '#dc2626', S2: '#ea580c', S3: '#b7950b', S4: '#6b7280' };

function StatCard({ label, value, sublabel, color = '#0d9488' }) {
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

function DefectTable({ defects, showType = false }) {
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
                    className="font-medium hover:underline flex items-center gap-1"
                    style={{ color: '#0d9488' }}
                  >
                    {d.key}
                    <ExternalLink size={11} className="text-gray-400 flex-shrink-0" />
                  </a>
                  {showType && d._sfType && (
                    <span style={{ padding: '1px 5px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: d._sfType === 'Non-Code' ? '#ede9fe' : '#dbeafe', color: d._sfType === 'Non-Code' ? '#6d28d9' : '#1d4ed8', whiteSpace: 'nowrap' }}>
                      {d._sfType}
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

function CollapsibleSection({ title, count, children, defaultOpen = false }) {
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
            <span className="bg-[#0d9488] text-white text-xs px-2 py-0.5 rounded-full">{count}</span>
          )}
          {open
            ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
            : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
        </div>
      </button>
      {open && <div className="border-t border-gray-100 p-4">{children}</div>}
    </div>
  );
}

export default function UTMDashboard() {
  const [stats, setStats] = useState(null);
  const [defects, setDefects] = useState([]);
  const [sfEscalations, setSfEscalations] = useState([]);
  const [sfEscLoading, setSfEscLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getStats('utm'),
      api.getDefects('utm'),
    ])
      .then(([statsData, defectsData]) => {
        setStats(statsData);
        setDefects(defectsData.defects || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

    api.getUTMSFEscalationsNonCode()
      .then(data => setSfEscalations(data.defects || []))
      .catch(() => setSfEscalations([]))
      .finally(() => setSfEscLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading UTM dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!stats) return <div className="p-8 text-center text-gray-500">No data</div>;

  // Split defects into sections (exclude closed/canceled)
  const openDefects = defects.filter(d => !['Closed', 'Canceled'].includes(d.status));
  const customerDefects = openDefects.filter(d => d.is_customer_reported === 1 || d.is_customer_reported === true || d.customer_count > 0);
  const internalDefects = openDefects.filter(d => !d.is_customer_reported && !(d.customer_count > 0));

  // Chart data
  const priorityData = Object.entries(stats.byPriority || {}).filter(([k, v]) => k !== 'Unknown' && v > 0).map(([k, v]) => ({ name: k, value: v }));
  const severityData = Object.entries(stats.bySeverity || {}).filter(([k, v]) => k !== 'Unknown' && v > 0).map(([k, v]) => ({ name: k, value: v }));
  const ageData = Object.entries(stats.byAge || {}).map(([k, v]) => ({ name: k, value: v }));
  const areaData = Object.entries(stats.byArea || {}).map(([k, v]) => ({ name: k, value: v })).sort((a, b) => b.value - a.value);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0d9488]">UTM Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">ProTime UTM — Defect Health</p>
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
        {/* SF Escalations — combined */}
        {(() => {
          const sfCombined = [
            ...sfEscalations.map(d => ({ ...d, _sfType: 'Non-Code' })),
            ...customerDefects.map(d => ({ ...d, _sfType: 'Code-Defect' })),
          ];
          return (
            <CollapsibleSection
              title="SF Escalations"
              count={sfEscLoading ? null : sfCombined.length}
              defaultOpen={true}
            >
              {sfEscLoading
                ? <p className="text-sm text-gray-400 italic">Loading…</p>
                : sfCombined.length > 0
                  ? <DefectTable defects={sfCombined} showType />
                  : <p className="text-sm text-gray-400 italic">No open SF escalations found.</p>
              }
            </CollapsibleSection>
          );
        })()}

        {/* Internal Defects */}
        <CollapsibleSection title="Internal Defects (Code-Defects)" count={internalDefects.length}>
          <DefectTable defects={internalDefects} />
        </CollapsibleSection>

        {/* Security Vulnerabilities */}
        <CollapsibleSection title="Security Vulnerabilities" count={null}>
          <p className="text-sm text-gray-400 italic">Security defects — see the <a href="/security" className="text-[#0d9488] underline">Security dashboard</a>.</p>
        </CollapsibleSection>
      </div>
    </div>
  );
}
