import { useState, useEffect } from 'react';
import { Search, Flag, CheckCircle, XCircle, Archive, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';

const PRODUCT_COLORS = {
  UTA: '#005151',
  UTM: '#0d9488',
  UTC: '#2563eb',
  'WFM-Classic': '#b7950b',
  'Migration-Tool': '#7c3aed',
  Other: '#6b7280',
};

function parseCSV(text) {
  const lines = text.split('\n').filter(Boolean);
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (values[i] || '').trim(); });
    return obj;
  }).filter(r => r['Flag Key']);
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function isExpiringSoon(dateStr) {
  if (!dateStr || dateStr === '12/31/99' || dateStr === '12/31/30' || dateStr === '12/31/27') return false;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return false;
  const expiry = new Date(`20${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
  const now = new Date();
  const diff = (expiry - now) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 60;
}

function isExpired(dateStr) {
  if (!dateStr || dateStr === '12/31/99' || dateStr === '12/31/30' || dateStr === '12/31/27') return false;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return false;
  const expiry = new Date(`20${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
  return expiry < new Date();
}

function normalizeProduct(p) {
  if (!p || p.trim() === '') return 'Other';
  return p.trim();
}

export default function LaunchDarklyDashboard() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState('Product');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    fetch('/launchdarklydata/ld-flag-inventory-2026-06-08.csv')
      .then(r => r.text())
      .then(text => {
        setFlags(parseCSV(text));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const products = ['All', ...Array.from(new Set(flags.map(f => normalizeProduct(f.Product)))).sort()];

  const filtered = flags
    .filter(f => {
      const prod = normalizeProduct(f.Product);
      if (productFilter !== 'All' && prod !== productFilter) return false;
      if (statusFilter === 'Enabled' && f['Enabled In Prod'] !== 'TRUE') return false;
      if (statusFilter === 'Disabled' && f['Enabled In Prod'] !== 'FALSE') return false;
      if (statusFilter === 'Archived' && f['Archived'] !== 'TRUE') return false;
      if (statusFilter === 'Expiring Soon' && !isExpiringSoon(f['ukg-expiry-date'])) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!f['Flag Key'].toLowerCase().includes(q) &&
            !f['Description'].toLowerCase().includes(q) &&
            !(f['jira issues'] || '').toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let av = a[sortField] || '';
      let bv = b[sortField] || '';
      if (sortField === 'Product') { av = normalizeProduct(av); bv = normalizeProduct(bv); }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const totalFlags = flags.length;
  const enabledInProd = flags.filter(f => f['Enabled In Prod'] === 'TRUE').length;
  const archived = flags.filter(f => f['Archived'] === 'TRUE').length;
  const expiringSoon = flags.filter(f => isExpiringSoon(f['ukg-expiry-date'])).length;
  const expired = flags.filter(f => isExpired(f['ukg-expiry-date'])).length;

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading flag inventory...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#005151]">LaunchDarkly Flag Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">As of 2026-06-08 · {totalFlags} total flags</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flag size={16} className="text-[#005151]" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Flags</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{totalFlags}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Enabled in Prod</span>
          </div>
          <div className="text-2xl font-bold text-green-700">{enabledInProd}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle size={16} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Disabled in Prod</span>
          </div>
          <div className="text-2xl font-bold text-gray-600">{totalFlags - enabledInProd - archived}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Archive size={16} className="text-purple-500" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Archived</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{archived}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Expiring Soon</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{expiringSoon}</div>
          {expired > 0 && <div className="text-xs text-red-500 mt-0.5">{expired} past expiry</div>}
        </div>
      </div>

      {/* Product breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Flags by Product</div>
        <div className="flex flex-wrap gap-3">
          {products.filter(p => p !== 'All').map(prod => {
            const count = flags.filter(f => normalizeProduct(f.Product) === prod).length;
            const color = PRODUCT_COLORS[prod] || PRODUCT_COLORS.Other;
            return (
              <button
                key={prod}
                onClick={() => setProductFilter(productFilter === prod ? 'All' : prod)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors ${productFilter === prod ? 'text-white border-transparent' : 'text-gray-700 border-gray-200 hover:border-gray-300 bg-white'}`}
                style={productFilter === prod ? { backgroundColor: color, borderColor: color } : {}}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                {prod}
                <span className={`font-semibold ${productFilter === prod ? 'text-white' : 'text-gray-500'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search flag key, description, Jira issue..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#005151]/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#005151]/30"
        >
          <option value="All">All Statuses</option>
          <option value="Enabled">Enabled in Prod</option>
          <option value="Disabled">Disabled in Prod</option>
          <option value="Archived">Archived</option>
          <option value="Expiring Soon">Expiring Soon</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-100 text-xs text-gray-500">
          Showing {filtered.length} of {totalFlags} flags
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700" onClick={() => handleSort('Product')}>
                  Product <SortIcon field="Product" />
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700" onClick={() => handleSort('Flag Key')}>
                  Flag Key <SortIcon field="Flag Key" />
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700" onClick={() => handleSort('ukg-expiry-date')}>
                  Expiry <SortIcon field="ukg-expiry-date" />
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jira</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((flag, i) => {
                const prod = normalizeProduct(flag.Product);
                const color = PRODUCT_COLORS[prod] || PRODUCT_COLORS.Other;
                const enabled = flag['Enabled In Prod'] === 'TRUE';
                const isArchived = flag['Archived'] === 'TRUE';
                const expiry = flag['ukg-expiry-date'];
                const expiring = isExpiringSoon(expiry);
                const expired_ = isExpired(expiry);
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-medium text-xs" style={{ color }}>{prod}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700 max-w-[280px]">
                      <span className="block truncate" title={flag['Flag Key']}>{flag['Flag Key']}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        {isArchived ? (
                          <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full w-fit">
                            <Archive size={10} /> Archived
                          </span>
                        ) : enabled ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                            <CheckCircle size={10} /> Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full w-fit">
                            <XCircle size={10} /> Disabled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      {expiry ? (
                        <span className={`font-medium ${expired_ ? 'text-red-600' : expiring ? 'text-amber-600' : 'text-gray-500'}`}>
                          {expiry}
                          {expiring && <span className="ml-1 text-amber-500">⚠</span>}
                          {expired_ && <span className="ml-1 text-red-500">!</span>}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      {flag['jira issues'] ? (
                        <span className="text-blue-600 font-medium">{flag['jira issues']}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 max-w-[320px]">
                      <span className="block truncate" title={flag['Description']}>{flag['Description']}</span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">No flags match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
