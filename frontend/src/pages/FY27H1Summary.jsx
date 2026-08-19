import { useState, useEffect } from 'react';
import { ChevronRight, ExternalLink, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { api } from '../services/api';

const JIRA_BASE = 'https://engjira.int.kronos.com';
const PRODUCT_INFO = {
  uta: { name: 'UTA', color: '#059669' },
  utm: { name: 'UTM', color: '#2563eb' },
  wfmClassic: { name: 'WFM Classic', color: '#7c3aed' }
};

const STATUS_COLORS = {
  'Not Started': '#9ca3af',
  'In Progress': '#f59e0b',
  'At Risk': '#dc2626',
  'Completed': '#10b981',
  'On Track': '#3b82f6'
};

const STATUS_ICONS = {
  'Not Started': Clock,
  'In Progress': Clock,
  'At Risk': AlertCircle,
  'Completed': CheckCircle,
  'On Track': CheckCircle
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

function EpicCard({ epic, product }) {
  const statusColor = STATUS_COLORS[epic.status] || '#6b7280';
  const StatusIcon = STATUS_ICONS[epic.status] || Clock;
  const healthColor = HEALTH_COLORS[epic.health] || '#9ca3af';
  const HealthIcon = HEALTH_ICONS[epic.health] || Clock;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <a
            href={`${JIRA_BASE}/browse/${epic.key}`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-gray-900 hover:text-[#005151] flex items-center gap-2 mb-1"
          >
            {epic.key}
            <ExternalLink size={14} className="text-gray-400" />
          </a>
          <p className="text-sm text-gray-600 leading-snug mb-2">{epic.name}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          {/* Health Indicator */}
          <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: healthColor + '18' }}>
            <HealthIcon size={14} style={{ color: healthColor }} />
            <span className="text-xs font-semibold" style={{ color: healthColor }}>
              {epic.health}
            </span>
          </div>
          {/* Status Badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: statusColor + '18' }}>
            <StatusIcon size={14} style={{ color: statusColor }} />
            <span className="text-xs font-semibold" style={{ color: statusColor }}>
              {epic.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-500 mb-0.5">PROGRESS</div>
          <div className="text-lg font-bold text-gray-900">{epic.progress || 0}%</div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-500 mb-0.5">SWAG</div>
          <div className="text-lg font-bold text-gray-900">{epic.swag || 0}</div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-500 mb-0.5">OWNER</div>
          <div className="text-xs font-medium text-gray-700 truncate">{epic.owner || '—'}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{
              width: `${epic.progress || 0}%`,
              background: statusColor
            }}
          ></div>
        </div>
      </div>

      {epic.dueDate && (
        <div className="text-xs text-gray-500">
          <strong>Due:</strong> {new Date(epic.dueDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

export default function FY27H1Summary({ product = 'uta' }) {
  const [epics, setEpics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalEpics: 0,
    completedEpics: 0,
    atRiskEpics: 0,
    plannedSWAG: 0
  });

  const productInfo = PRODUCT_INFO[product];

  useEffect(() => {
    const fetchEpics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/fy27/${product}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch FY27 H1 epics: ${response.statusText}`);
        }

        const data = await response.json();

        setEpics(data.epics || []);
        setStats({
          totalEpics: data.stats?.totalEpics || 0,
          completedEpics: data.stats?.completedEpics || 0,
          atRiskEpics: data.stats?.atRiskEpics || 0,
          plannedSWAG: data.stats?.plannedSWAG || 0
        });

        setError(null);
      } catch (err) {
        console.error('Error fetching FY27 H1 epics:', err);
        setError(err.message || 'Failed to load FY27 H1 epics');
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
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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
          {productInfo.name} FY27 H1 Planning
        </h1>
        <p className="text-gray-600">Business Epics and Strategic Initiatives</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Business Epics"
          value={stats.totalEpics}
          color="#005151"
        />
        <StatCard
          label="Completed"
          value={stats.completedEpics}
          color="#10b981"
        />
        <StatCard
          label="At Risk"
          value={stats.atRiskEpics}
          color="#dc2626"
        />
        <StatCard
          label="Planned SWAG"
          value={stats.plannedSWAG || '—'}
          color={productInfo.color}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Epics Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Epics</h2>
        {epics.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
            <p className="text-gray-600">No epics found for this period.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {epics.map(epic => (
              <EpicCard key={epic.key} epic={epic} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
