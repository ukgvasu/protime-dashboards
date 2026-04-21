import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpCircle, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

const JIRA_BASE = 'https://engjira.int.kronos.com/browse';

function MetricCard({ label, value, sublabel, color = '#005151', icon }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
        {icon && <div style={{ color }}>{icon}</div>}
      </div>
      <div className="text-4xl font-bold mb-1" style={{ color }}>{value ?? '—'}</div>
      {sublabel && <div className="text-xs text-gray-400">{sublabel}</div>}
    </div>
  );
}

function UpgradeCard({ data, label, color }) {
  if (!data) return null;
  const rate = parseFloat(data.resolution_rate || 0);
  const rateColor = rate >= 70 ? '#16a34a' : rate >= 50 ? '#ca8a04' : '#dc2626';

  return (
    <div className="bg-white rounded-lg shadow-sm border-2 p-5" style={{ borderColor: color }}>
      <div className="flex items-center gap-2 mb-4">
        <ArrowUpCircle size={20} style={{ color }} />
        <h2 className="font-bold text-lg" style={{ color }}>{label}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-3xl font-bold text-gray-800">{data.total}</div>
          <div className="text-xs text-gray-500 mt-1">Total Issues</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-3xl font-bold" style={{ color: rateColor }}>{data.resolution_rate}%</div>
          <div className="text-xs text-gray-500 mt-1">Resolution Rate</div>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Resolved: {data.resolved}</span>
          <span>Open: {data.open}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div className="h-3 rounded-full transition-all" style={{ width: `${rate}%`, backgroundColor: rateColor }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>Avg: <strong>{data.avg_resolution_days ?? '—'}d</strong></span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>Median: <strong>{data.median_resolution_days ?? '—'}d</strong></span>
        </div>
      </div>
    </div>
  );
}

export default function UTAUpgradeTracker() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getUpgradeTracker('uta')
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Upgrade Tracker...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-8 text-center text-gray-500">No upgrade tracker data available</div>;

  const resolutionData = Object.entries(data.resolution_breakdown || {}).map(([k, v]) => ({ name: k, value: v }));
  const PIE_COLORS = ['#16a34a', '#dc2626', '#ca8a04', '#3b82f6', '#7c3aed'];

  const defectRate = parseFloat(data.true_defects?.defect_rate || 0);
  const defectRateColor = defectRate < 30 ? '#16a34a' : defectRate < 50 ? '#ca8a04' : '#dc2626';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <ArrowUpCircle className="text-[#005151]" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-[#005151]">UTA Upgrade Issues Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tracking UTAUPGRADE25 and UTAUPGRADE26 labeled issues
            {data.generated_at && ` • Updated ${new Date(data.generated_at).toLocaleString()}`}
          </p>
        </div>
      </div>

      {/* 3-column grid: Upgrade 25, Upgrade 26, True Defects */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <UpgradeCard data={data.upgrade25} label="Upgrade 25 (UTAUPGRADE25)" color="#005151" />
        <UpgradeCard data={data.upgrade26} label="Upgrade 26 (UTAUPGRADE26)" color="#0d9488" />

        {/* True Defects Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-orange-500" />
            <h2 className="font-bold text-lg text-orange-600">True Defects</h2>
          </div>
          <div className="text-5xl font-bold text-gray-800 mb-2">{data.true_defects?.total ?? '—'}</div>
          <div className="text-sm text-gray-500 mb-4">RCA-Type-Defect labeled</div>
          <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: `${defectRateColor}15` }}>
            <div className="text-2xl font-bold" style={{ color: defectRateColor }}>{data.true_defects?.defect_rate}%</div>
            <div className="text-xs text-gray-500">Defect Rate</div>
          </div>
          {data.baseline && (
            <div className="text-xs text-gray-500">
              Baseline avg: <strong>{data.baseline.avg_resolution_days ?? '—'}d</strong> ({data.baseline.total} issues)
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Resolution Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Resolution Breakdown</h2>
          {resolutionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={resolutionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {resolutionData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-gray-400">No resolution data yet</div>
          )}
        </div>

        {/* Baseline Comparison */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Resolution Days Comparison</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: 'Upgrade 25', days: data.upgrade25?.avg_resolution_days || 0, fill: '#005151' },
              { name: 'Upgrade 26', days: data.upgrade26?.avg_resolution_days || 0, fill: '#0d9488' },
              { name: 'Baseline', days: data.baseline?.avg_resolution_days || 0, fill: '#9ca3af' },
            ]}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'Days', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} days`]} />
              <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                {[{ fill: '#005151' }, { fill: '#0d9488' }, { fill: '#9ca3af' }].map((c, i) => <Cell key={i} fill={c.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Aging Issues Table */}
      {data.aging_issues && data.aging_issues.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-orange-500" />
            Aging Issues (Top {data.aging_issues.length} Oldest Open)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-2 font-semibold text-gray-500 text-xs">Key</th>
                  <th className="pb-2 font-semibold text-gray-500 text-xs">Summary</th>
                  <th className="pb-2 font-semibold text-gray-500 text-xs">Age</th>
                  <th className="pb-2 font-semibold text-gray-500 text-xs">Priority</th>
                  <th className="pb-2 font-semibold text-gray-500 text-xs">Severity</th>
                  <th className="pb-2 font-semibold text-gray-500 text-xs">Assignee</th>
                  <th className="pb-2 font-semibold text-gray-500 text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.aging_issues.map(issue => (
                  <tr key={issue.key} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2">
                      <a href={`${JIRA_BASE}/${issue.key}`} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-xs text-[#005151] hover:underline">{issue.key}</a>
                    </td>
                    <td className="py-2 text-xs max-w-xs truncate" title={issue.summary}>{issue.summary}</td>
                    <td className="py-2 text-xs font-semibold text-red-600">{issue.age_days}d</td>
                    <td className="py-2 text-xs font-semibold">{issue.priority || '—'}</td>
                    <td className="py-2 text-xs">{issue.severity || '—'}</td>
                    <td className="py-2 text-xs text-gray-500">{issue.assignee || 'Unassigned'}</td>
                    <td className="py-2 text-xs text-gray-500">{issue.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
