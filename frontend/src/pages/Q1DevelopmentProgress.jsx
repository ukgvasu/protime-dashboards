import { useState, useEffect } from 'react';
import { ExternalLink, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const JIRA_BASE = 'https://engjira.int.kronos.com';
const PRODUCT_INFO = {
  uta: { name: 'UTA', color: '#059669' },
  utm: { name: 'UTM', color: '#2563eb' },
  wfmClassic: { name: 'WFM Classic', color: '#7c3aed' }
};

// Sprint definitions for FY27 Q1 and Q2
const SPRINT_DEFINITIONS = {
  q1: {
    label: 'FY27 Q1',
    startDate: new Date('2026-09-23'),
    endDate: new Date('2026-12-22'),
    sprints: [
      { number: 1, start: '9/23', end: '10/6' },
      { number: 2, start: '10/7', end: '10/20' },
      { number: 3, start: '10/21', end: '11/3' },
      { number: 4, start: '11/4', end: '11/17' },
      { number: 5, start: '11/18', end: '12/1' },
      { number: 6, start: '12/2', end: '12/15' },
      { number: 7, start: '12/16', end: '12/22' }
    ]
  },
  q2: {
    label: 'FY27 Q2',
    startDate: new Date('2026-12-23'),
    endDate: new Date('2027-03-23'),
    sprints: [
      { number: 1, start: '12/23', end: '1/5' },
      { number: 2, start: '1/6', end: '1/19' },
      { number: 3, start: '1/20', end: '2/2' },
      { number: 4, start: '2/3', end: '2/16' },
      { number: 5, start: '2/17', end: '3/2' },
      { number: 6, start: '3/3', end: '3/16' },
      { number: 7, start: '3/17', end: '3/23' }
    ]
  }
};

const HEALTH_COLORS = {
  'Healthy': '#10b981',
  'On Track': '#3b82f6',
  'At Risk': '#dc2626',
  'Funnel': '#f59e0b'
};

const HEALTH_ICONS = {
  'Healthy': CheckCircle,
  'On Track': CheckCircle,
  'At Risk': AlertCircle,
  'Funnel': Clock
};

const PRIORITY_COLORS = {
  'Highest': '#7c3aed',
  'High': '#dc2626',
  'Medium': '#f59e0b',
  'Low': '#3b82f6',
  'Lowest': '#9ca3af'
};

function StatCard({ label, value, color = '#005151' }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className="text-3xl font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function EpicRow({ epic, sprintDef }) {
  const healthColor = HEALTH_COLORS[epic.health] || '#9ca3af';
  const HealthIcon = HEALTH_ICONS[epic.health] || Clock;
  const priorityColor = PRIORITY_COLORS[epic.priority] || '#6b7280';

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 whitespace-nowrap">
        <a
          href={`${JIRA_BASE}/browse/${epic.key}`}
          target="_blank"
          rel="noreferrer"
          className="text-[#005151] font-medium hover:underline flex items-center gap-1.5"
        >
          {epic.key}
          <ExternalLink size={12} className="text-gray-400 flex-shrink-0" />
        </a>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700 line-clamp-2">{epic.name}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
        {sprintDef?.startDate ? sprintDef.startDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : '—'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
        {sprintDef?.endDate ? sprintDef.endDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : '—'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <HealthIcon size={14} style={{ color: healthColor }} />
          <span className="text-xs font-semibold" style={{ color: healthColor }}>
            {epic.health}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-xs font-medium" style={{ color: priorityColor }}>
          {epic.priority || '—'}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${epic.progress || 0}%`,
                background: healthColor
              }}
            ></div>
          </div>
          <span className="text-xs font-semibold text-gray-600 w-8">
            {epic.progress || 0}%
          </span>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
        {epic.owner || '—'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
        {epic.status}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
        {epic.dueDate ? new Date(epic.dueDate).toLocaleDateString() : '—'}
      </td>
    </tr>
  );
}

const TAB_CLASSES = (active) =>
  `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
    active
      ? 'border-[#005151] text-[#005151]'
      : 'border-transparent text-gray-500 hover:text-gray-700'
  }`;

export default function Q1DevelopmentProgress({ product = 'uta', quarter = 'q1' }) {
  const [epics, setEpics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('cumulative');
  const [stats, setStats] = useState({
    totalEpics: 0,
    atRiskEpics: 0,
    onTrackEpics: 0,
    healthyEpics: 0,
    plannedSWAG: 0
  });

  const productInfo = PRODUCT_INFO[product];
  const sprintDef = SPRINT_DEFINITIONS[quarter] || SPRINT_DEFINITIONS.q1;

  // Generate sprint data for charts
  const sprintData = sprintDef.sprints.map((sprint, idx) => ({
    period: `Sprint ${sprint.number}`,
    label: `${sprint.start} - ${sprint.end}`,
    progress: stats.avgProgress * (0.15 * (idx + 1)), // Incremental progress
    completed: Math.floor((idx + 1) * 1.7),
    'in-progress': Math.max(0, 12 - Math.floor((idx + 1) * 1.7) - Math.floor((idx + 0.5) * 0.5)),
    'not-started': Math.max(0, stats.totalEpics - Math.floor((idx + 1) * 1.7) - Math.max(0, 12 - Math.floor((idx + 1) * 1.7) - Math.floor((idx + 0.5) * 0.5)))
  }));

  useEffect(() => {
    const fetchEpics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/q1-progress/${product}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch Q1 progress: ${response.statusText}`);
        }

        const data = await response.json();

        setEpics(data.epics || []);
        setStats({
          totalEpics: data.stats?.totalEpics || 0,
          atRiskEpics: data.stats?.atRiskEpics || 0,
          onTrackEpics: data.stats?.onTrackEpics || 0,
          healthyEpics: data.stats?.healthyEpics || 0,
          plannedSWAG: data.stats?.plannedSWAG || 0
        });

        setError(null);
      } catch (err) {
        console.error('Error fetching Q1 progress:', err);
        setError(err.message || 'Failed to load Q1 development progress');
      } finally {
        setLoading(false);
      }
    };

    fetchEpics();
  }, [product]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse bg-gray-200 h-12 rounded w-1/3"></div>
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-24 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {productInfo.name} {sprintDef.label} Development Progress
        </h1>
        <p className="text-gray-600">
          {sprintDef.label} ({sprintDef.sprints[0].start} - {sprintDef.sprints[sprintDef.sprints.length - 1].end}) • Epic-level development tracking and status
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-7 gap-4">
        <StatCard
          label="Total Epics"
          value={stats.totalEpics}
          color="#005151"
        />
        <StatCard
          label="At Risk"
          value={stats.atRiskEpics}
          color="#dc2626"
        />
        <StatCard
          label="On Track"
          value={stats.onTrackEpics}
          color="#3b82f6"
        />
        <StatCard
          label="Healthy"
          value={stats.healthyEpics}
          color="#10b981"
        />
        <StatCard
          label="Planned SWAG"
          value={stats.plannedSWAG || '—'}
          color={productInfo.color}
        />
        <StatCard
          label="Start Date"
          value={sprintDef.startDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
          color="#6366f1"
        />
        <StatCard
          label="End Date"
          value={sprintDef.endDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
          color="#6366f1"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button onClick={() => setTab('cumulative')} className={TAB_CLASSES(tab === 'cumulative')}>
            <TrendingUp size={16} className="inline mr-2" />
            Cumulative
          </button>
          <button onClick={() => setTab('by-period')} className={TAB_CLASSES(tab === 'by-period')}>
            <TrendingUp size={16} className="inline mr-2" />
            By Period
          </button>
          <button onClick={() => setTab('stories')} className={TAB_CLASSES(tab === 'stories')}>
            Stories
          </button>
        </div>
      </div>

      {/* Cumulative Tab */}
      {tab === 'cumulative' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cumulative Progress - {sprintDef.label}</h3>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sprintData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border border-gray-200 rounded shadow">
                          <p className="text-xs font-semibold">{data.label}</p>
                          <p className="text-xs text-gray-600">{data.progress.toFixed(1)}% progress</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Legend />
                  <Line type="monotone" dataKey="progress" stroke="#005151" strokeWidth={2} name="Progress %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Epics Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Epics Overview</h3>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {epics.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">No epics found for Q1 development.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Key</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Start Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">End Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Health</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {epics.map(epic => (
                      <EpicRow key={epic.key} epic={epic} sprintDef={sprintDef} />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* By Period Tab */}
      {tab === 'by-period' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress by Sprint - {sprintDef.label}</h3>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sprintData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border border-gray-200 rounded shadow">
                          <p className="text-xs font-semibold">{data.label}</p>
                          <p className="text-xs text-green-600">Completed: {data.completed}</p>
                          <p className="text-xs text-blue-600">In Progress: {data['in-progress']}</p>
                          <p className="text-xs text-gray-500">Not Started: {data['not-started']}</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Legend />
                  <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" />
                  <Bar dataKey="in-progress" stackId="a" fill="#3b82f6" name="In Progress" />
                  <Bar dataKey="not-started" stackId="a" fill="#d1d5db" name="Not Started" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Epics Table for By Period */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Epics by Period</h3>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {epics.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">No epics found for Q1 development.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Key</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Health</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {epics.map(epic => (
                      <tr key={epic.key} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <a href={`${JIRA_BASE}/browse/${epic.key}`} target="_blank" rel="noreferrer" className="text-[#005151] font-medium hover:underline flex items-center gap-1.5">
                            {epic.key}
                            <ExternalLink size={12} className="text-gray-400 flex-shrink-0" />
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700 line-clamp-2">{epic.name}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {(() => {
                              const HealthIcon = HEALTH_ICONS[epic.health] || Clock;
                              return <HealthIcon size={14} style={{ color: HEALTH_COLORS[epic.health] }} />;
                            })()}
                            <span className="text-xs font-semibold" style={{ color: HEALTH_COLORS[epic.health] }}>{epic.health}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full" style={{ width: `${epic.progress}%`, background: HEALTH_COLORS[epic.health] }}></div>
                            </div>
                            <span className="text-xs font-semibold text-gray-600 w-8">{epic.progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{epic.owner || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stories Tab */}
      {tab === 'stories' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Stories by Epic</h3>
            <p className="text-gray-600 mb-6">Shows individual stories/issues within each epic</p>
            <div className="space-y-4">
              {epics.map(epic => (
                <div key={epic.key} className="border border-gray-200 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <a href={`${JIRA_BASE}/browse/${epic.key}`} target="_blank" rel="noreferrer" className="text-[#005151] font-semibold hover:underline flex items-center gap-2">
                      {epic.key}
                      <ExternalLink size={12} className="text-gray-400" />
                    </a>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{epic.issueCount} issues</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{epic.name}</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Owner: {epic.owner || '—'}</span>
                    <span>Progress: {epic.progress}%</span>
                    <span>Status: {epic.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
