import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine,
} from 'recharts';
import { ExternalLink } from 'lucide-react';
import { api } from '../services/api';

const JIRA_BASE = 'https://engjira.int.kronos.com';

const EPIC_COLORS = [
  '#005151', '#0d9488', '#0369a1', '#7c3aed',
  '#b45309', '#be185d', '#1d4ed8', '#065f46',
];

function StatCard({ label, value, sublabel, color = '#005151' }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-3xl font-bold" style={{ color }}>{value ?? '—'}</div>
      {sublabel && <div className="text-xs text-gray-400 mt-1">{sublabel}</div>}
    </div>
  );
}

const TAB_CLASSES = (active) =>
  `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
    active
      ? 'border-[#005151] text-[#005151]'
      : 'border-transparent text-gray-500 hover:text-gray-700'
  }`;

export default function SwagActualsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('cumulative');
  const [storyFilter, setStoryFilter] = useState('');
  const [storySort, setStorySort] = useState({ key: 'resolutionDate', dir: 'desc' });
  const [expanded, setExpanded] = useState(new Set());
  const toggleExpand = (key) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });
  const expandAll = () => setExpanded(new Set(data?.epics?.map(e => e.key) || []));
  const collapseAll = () => setExpanded(new Set());

  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const toggleGroup = (key) => setCollapsedGroups(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getSwagActualsUTAQ3()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading UTA Q3 SWAG vs Actuals…</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!data) return null;

  const { periods, periodDates, totalSwag, asOf, timeElapsed, epics, stories } = data;

  const totalActuals = epics.reduce((s, e) => s + e.totalActuals, 0);
  const pctDelivered = totalSwag > 0 ? Math.round((totalActuals / totalSwag) * 100) : 0;
  const remaining = Math.max(0, totalSwag - totalActuals);
  const variance = totalActuals - totalSwag;

  // Find which period index is "current" (today falls in)
  const todayStr = asOf;
  const currentPeriodIdx = periodDates.findIndex(p => todayStr >= p.start && todayStr <= p.end);

  // ── By Period chart data ──────────────────────────────────────────────────
  const byPeriodData = periods.map((label, pi) => {
    const row = { period: label };
    epics.forEach(e => { row[e.summary] = e.actuals[pi] || 0; });
    row._total = epics.reduce((s, e) => s + (e.actuals[pi] || 0), 0);
    return row;
  });

  // ── Cumulative chart data ─────────────────────────────────────────────────
  let cumActuals = 0;
  // Evenly distribute SWAG across periods as a "plan" line
  const swagPerPeriod = totalSwag / periods.length;
  let cumPlan = 0;
  const cumulativeData = periods.map((label, pi) => {
    const isFuture = pi > currentPeriodIdx && currentPeriodIdx >= 0;
    const periodActuals = epics.reduce((s, e) => s + (e.actuals[pi] || 0), 0);
    cumActuals += periodActuals;
    cumPlan += swagPerPeriod;
    return {
      period: label,
      Actuals: Math.round(cumActuals * 10) / 10,
      Plan: Math.round(cumPlan),
      // Remaining: only plot for periods up to and including today; null hides the dot/line segment
      Remaining: !isFuture ? Math.round((totalSwag - cumActuals) * 10) / 10 : null,
      _isFuture: isFuture,
    };
  });

  // ── Story table helpers ───────────────────────────────────────────────────
  const epicKeyToSummary = {};
  epics.forEach(e => { epicKeyToSummary[e.key] = e.summary; });

  const filteredStories = stories
    .filter(s => {
      if (!storyFilter) return true;
      const f = storyFilter.toLowerCase();
      return (
        s.key.toLowerCase().includes(f) ||
        s.summary.toLowerCase().includes(f) ||
        (s.assignee || '').toLowerCase().includes(f) ||
        (epicKeyToSummary[s.beKey] || '').toLowerCase().includes(f)
      );
    })
    .sort((a, b) => {
      const { key, dir } = storySort;
      let av = a[key] ?? '';
      let bv = b[key] ?? '';
      if (key === 'sp') { av = parseFloat(av) || 0; bv = parseFloat(bv) || 0; }
      return dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const toggleSort = (key) =>
    setStorySort(prev => ({ key, dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc' }));

  const SortHdr = ({ col, label }) => (
    <th
      className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none whitespace-nowrap hover:text-[#005151]"
      onClick={() => toggleSort(col)}
    >
      {label} {storySort.key === col ? (storySort.dir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#005151]">UTA Q3 — SWAG vs Actuals</h1>
        <p className="text-sm text-gray-500 mt-1">
          FY26 Q3 (Apr 1 – Jun 30) · As of {asOf} · {timeElapsed}% of quarter elapsed
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total SWAG" value={`${totalSwag} pts`} sublabel="Committed capacity" color="#005151" />
        <StatCard label="Actuals to Date" value={`${Math.round(totalActuals * 10) / 10} pts`} sublabel="Story points resolved" color="#0d9488" />
        <StatCard label="% Delivered" value={`${pctDelivered}%`} sublabel={`vs ${timeElapsed}% time elapsed`} color={pctDelivered >= timeElapsed ? '#16a34a' : '#dc2626'} />
        <StatCard label="Remaining" value={`${Math.round(remaining)} pts`} sublabel="SWAG – Actuals" color="#0369a1" />
        <StatCard label="Variance" value={`${variance >= 0 ? '+' : ''}${Math.round(variance)} pts`} sublabel={variance >= 0 ? 'Ahead of plan' : 'Behind plan'} color={variance >= 0 ? '#16a34a' : '#dc2626'} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-5 flex gap-1">
        {[
          { id: 'cumulative', label: 'Cumulative' },
          { id: 'epics', label: 'Business Epic Breakdown' },
          { id: 'period', label: 'By Period' },
          { id: 'stories', label: `Stories (${stories.length})` },
        ].map(t => (
          <button key={t.id} className={TAB_CLASSES(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── By Period ── */}
      {tab === 'period' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-1">Story Points Delivered — By 2-Week Period</h2>
          <p className="text-xs text-gray-400 mb-4">Each bar shows points resolved per business epic in that bi-weekly window</p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={byPeriodData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {currentPeriodIdx >= 0 && (
                <ReferenceLine x={periods[currentPeriodIdx]} stroke="#CCFF00" strokeWidth={2} strokeDasharray="4 2" label={{ value: 'Today', fontSize: 10, fill: '#888' }} />
              )}
              {epics.map((e, i) => (
                <Bar key={e.key} dataKey={e.summary} stackId="a" fill={EPIC_COLORS[i % EPIC_COLORS.length]} radius={i === epics.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Cumulative ── */}
      {tab === 'cumulative' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-1">Cumulative Story Points — Actuals vs Plan · Remaining Burndown</h2>
          <p className="text-xs text-gray-400 mb-4">Plan = SWAG ({totalSwag} pts) distributed evenly across {periods.length} periods · Remaining starts at {totalSwag} pts and falls as work is completed</p>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} domain={[0, totalSwag]} />
              <Tooltip formatter={(val, name) => [val === null ? '—' : `${val} pts`, name]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {currentPeriodIdx >= 0 && (
                <ReferenceLine x={periods[currentPeriodIdx]} stroke="#CCFF00" strokeWidth={2} strokeDasharray="4 2" label={{ value: 'Today', fontSize: 10, fill: '#888' }} />
              )}
              <ReferenceLine y={0} stroke="#e5e7eb" />
              <Line type="monotone" dataKey="Plan" stroke="#94a3b8" strokeDasharray="5 3" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Actuals" stroke="#005151" strokeWidth={2.5} dot={{ r: 4, fill: '#005151' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Remaining" stroke="#dc2626" strokeWidth={2} dot={{ r: 4, fill: '#dc2626' }} activeDot={{ r: 6 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Business Epic Breakdown ── */}
      {tab === 'epics' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Business Epic Breakdown — SWAG vs Actuals by Period</h2>
            <div className="flex gap-2">
              <button onClick={expandAll} className="text-xs px-2.5 py-1 rounded border border-gray-200 text-gray-500 hover:border-[#005151] hover:text-[#005151]">Expand all</button>
              <button onClick={collapseAll} className="text-xs px-2.5 py-1 rounded border border-gray-200 text-gray-500 hover:border-[#005151] hover:text-[#005151]">Collapse all</button>
            </div>
          </div>
          <div className="overflow-x-auto rounded border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Epic</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase text-right">SWAG</th>
                  {periods.map((p, pi) => (
                    <th key={pi} className={`px-3 py-2 text-xs font-semibold uppercase text-right whitespace-nowrap ${pi === currentPeriodIdx ? 'text-[#005151]' : 'text-gray-500'}`}>
                      {p}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase text-right">Total</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {epics.map((e, i) => {
                  const pct = e.swag > 0 ? Math.round((e.totalActuals / e.swag) * 100) : 0;
                  const isOpen = expanded.has(e.key);
                  const epicColor = EPIC_COLORS[i % EPIC_COLORS.length];
                  return (
                    <>
                      {/* ── Business Epic row ── */}
                      <tr
                        key={e.key}
                        className="border-t border-gray-100 cursor-pointer hover:bg-teal-50/20 transition-colors"
                        onClick={() => toggleExpand(e.key)}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs w-3 flex-shrink-0 select-none">
                              {isOpen ? '▼' : '▶'}
                            </span>
                            <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: epicColor }} />
                            <a
                              href={`${JIRA_BASE}/browse/${e.key}`}
                              target="_blank" rel="noreferrer"
                              onClick={ev => ev.stopPropagation()}
                              className="text-[#005151] hover:underline font-semibold text-xs flex items-center gap-1"
                            >
                              {e.key} <ExternalLink size={10} className="text-gray-400" />
                            </a>
                            <span className="text-gray-700 text-xs font-medium truncate max-w-[220px]">{e.summary}</span>
                            {e.psEpics?.length > 0 && (
                              <span className="text-xs text-gray-400 flex-shrink-0">({e.psEpics.length} epics)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs font-semibold text-gray-700">{e.swag}</td>
                        {periods.map((_, pi) => (
                          <td key={pi} className={`px-3 py-2.5 text-right text-xs ${pi === currentPeriodIdx ? 'font-semibold text-[#005151]' : 'text-gray-600'}`}>
                            {e.actuals[pi] > 0 ? e.actuals[pi] : <span className="text-gray-300">—</span>}
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-right text-xs font-bold text-gray-800">{Math.round(e.totalActuals * 10) / 10}</td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={`text-xs font-semibold ${pct >= 100 ? 'text-green-600' : pct >= timeElapsed ? 'text-blue-600' : 'text-amber-600'}`}>
                            {pct}%
                          </span>
                        </td>
                      </tr>

                      {/* ── PS Epic child rows ── */}
                      {isOpen && e.psEpics?.map((p, pi2) => (
                        <tr key={p.key} className="border-t border-gray-50 bg-gray-50/60 hover:bg-teal-50/10">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2 pl-8">
                              <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: epicColor, opacity: 0.5 }} />
                              <a
                                href={`${JIRA_BASE}/browse/${p.key}`}
                                target="_blank" rel="noreferrer"
                                className="text-[#005151]/80 hover:underline font-medium text-xs flex items-center gap-1 flex-shrink-0"
                              >
                                {p.key} <ExternalLink size={9} className="text-gray-400" />
                              </a>
                              <span className="text-gray-500 text-xs truncate max-w-[220px]">{p.summary}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-gray-300">—</td>
                          {periods.map((_, pi) => (
                            <td key={pi} className={`px-3 py-2 text-right text-xs ${pi === currentPeriodIdx ? 'font-medium text-[#005151]/70' : 'text-gray-500'}`}>
                              {p.actuals[pi] > 0 ? p.actuals[pi] : <span className="text-gray-200">—</span>}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right text-xs font-semibold text-gray-600">{Math.round(p.totalActuals * 10) / 10 || <span className="text-gray-300">—</span>}</td>
                          <td className="px-3 py-2 text-right text-xs text-gray-300">—</td>
                        </tr>
                      ))}
                    </>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#13352C' }}>
                  <td className="px-3 py-2 text-xs font-bold" style={{ color: '#CCFF00' }}>Total</td>
                  <td className="px-3 py-2 text-right text-xs font-bold" style={{ color: '#CCFF00' }}>{totalSwag}</td>
                  {periods.map((_, pi) => {
                    const periodTotal = epics.reduce((s, e) => s + (e.actuals[pi] || 0), 0);
                    return (
                      <td key={pi} className="px-3 py-2 text-right text-xs font-bold" style={{ color: '#CCFF00' }}>
                        {periodTotal > 0 ? periodTotal : <span style={{ color: '#4a7a5a' }}>—</span>}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right text-xs font-bold" style={{ color: '#CCFF00' }}>{Math.round(totalActuals * 10) / 10}</td>
                  <td className="px-3 py-2 text-right text-xs font-bold" style={{ color: '#CCFF00' }}>{pctDelivered}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Stories ── */}
      {tab === 'stories' && (() => {
        // Group filtered stories by business epic, in epic order, unattributed last
        // Build ordered PS epic list (inheriting color from parent BE)
        const psEpicList = [];
        epics.forEach((e, i) => {
          const color = EPIC_COLORS[i % EPIC_COLORS.length];
          (e.psEpics || []).forEach(p => {
            psEpicList.push({ key: p.key, summary: p.summary, color, beKey: e.key, beSummary: e.summary });
          });
        });

        // Group filtered stories by epicLink (PS epic), in PS epic order
        const storyGroups = psEpicList
          .map(p => ({
            groupKey: p.key,
            epicKey: p.key,
            summary: p.summary,
            color: p.color,
            beKey: p.beKey,
            beSummary: p.beSummary,
            stories: filteredStories.filter(s => s.epicLink === p.key),
          }))
          .filter(g => g.stories.length > 0);
        const unattributed = filteredStories.filter(s => !s.epicLink);
        if (unattributed.length > 0) {
          storyGroups.push({ groupKey: '__none__', epicKey: null, summary: 'Unattributed', color: '#94a3b8', stories: unattributed });
        }

        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-700">Resolved Stories</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {data.storiesWithPoints} of {data.storiesAnalyzed} stories have story points · grouped by epic
                </p>
              </div>
              <input
                type="text"
                placeholder="Filter by key, summary, assignee, or epic…"
                value={storyFilter}
                onChange={e => setStoryFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded px-3 py-1.5 w-72 focus:outline-none focus:border-[#005151]"
              />
            </div>
            <div className="overflow-x-auto rounded border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <SortHdr col="key" label="Key" />
                    <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Summary</th>
                    <SortHdr col="assignee" label="Assignee" />
                    <SortHdr col="sp" label="SP" />
                    <SortHdr col="resolutionDate" label="Resolved" />
                    <SortHdr col="status" label="Status" />
                  </tr>
                </thead>
                <tbody>
                  {filteredStories.length === 0 ? (
                    <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400 text-xs italic">No stories match.</td></tr>
                  ) : storyGroups.map(group => {
                    const isOpen = !collapsedGroups.has(group.groupKey);
                    const groupSP = group.stories.reduce((s, st) => s + (st.sp || 0), 0);
                    return (
                      <>
                        {/* ── Epic group header ── */}
                        <tr
                          key={`grp-${group.groupKey}`}
                          className="cursor-pointer select-none"
                          style={{ background: group.color + '18' }}
                          onClick={() => toggleGroup(group.groupKey)}
                        >
                          <td colSpan={6} className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 text-xs w-3 flex-shrink-0">
                                {isOpen ? '▼' : '▶'}
                              </span>
                              <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: group.color }} />
                              {group.epicKey ? (
                                <a
                                  href={`${JIRA_BASE}/browse/${group.epicKey}`}
                                  target="_blank" rel="noreferrer"
                                  onClick={ev => ev.stopPropagation()}
                                  className="text-xs font-bold hover:underline flex items-center gap-1 flex-shrink-0"
                                  style={{ color: group.color }}
                                >
                                  {group.epicKey} <ExternalLink size={10} className="opacity-60" />
                                </a>
                              ) : null}
                              <span className="text-xs font-semibold text-gray-700">{group.summary}</span>
                              {group.beSummary && (
                                <span className="text-xs text-gray-400">· {group.beSummary}</span>
                              )}
                              <span className="text-xs text-gray-400 ml-1">
                                {group.stories.length} {group.stories.length === 1 ? 'story' : 'stories'}
                                {groupSP > 0 ? ` · ${Math.round(groupSP * 10) / 10} pts` : ''}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* ── Story rows ── */}
                        {isOpen && group.stories.map((s, i) => (
                          <tr key={s.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                            <td className="px-3 py-2 whitespace-nowrap pl-8">
                              <a href={`${JIRA_BASE}/browse/${s.key}`} target="_blank" rel="noreferrer"
                                className="text-[#005151] font-medium hover:underline flex items-center gap-1 text-xs">
                                {s.key} <ExternalLink size={10} className="text-gray-400" />
                              </a>
                            </td>
                            <td className="px-3 py-2 max-w-xs">
                              <span className="text-xs text-gray-700 line-clamp-2" title={s.summary}>{s.summary}</span>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`text-xs ${s.assignee === 'Unassigned' ? 'text-amber-500' : 'text-gray-600'}`}>
                                {s.assignee}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className={`text-xs font-semibold ${s.sp > 0 ? 'text-[#005151]' : 'text-gray-300'}`}>
                                {s.sp > 0 ? s.sp : '—'}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{s.resolutionDate || '—'}</td>
                            <td className="px-3 py-2 text-xs text-gray-500">{s.status}</td>
                          </tr>
                        ))}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredStories.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">{filteredStories.length} of {stories.length} stories shown across {storyGroups.length} epics</p>
            )}
          </div>
        );
      })()}
    </div>
  );
}
