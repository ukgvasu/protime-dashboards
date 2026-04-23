import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, Shield, TrendingUp, Users, RefreshCw, ChevronDown, ChevronRight, ArrowUpCircle, Clock } from 'lucide-react';
import { api } from '../services/api';

function formatDateTime(date) {
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export default function Layout() {
  const [syncing, setSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [expandedSections, setExpandedSections] = useState({ uta: true, utm: false, wfm: false, security: false });
  const navigate = useNavigate();

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.triggerSync('all');
      setTimeout(() => {
        setSyncing(false);
        setLastUpdated(new Date());
      }, 3000);
    } catch (err) {
      console.error('Sync error:', err);
      setSyncing(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
      isActive ? 'bg-[#005151] text-white font-medium' : 'text-gray-600 hover:bg-gray-100'
    }`;

  const subNavLinkClass = ({ isActive }) =>
    `flex items-center gap-2 pl-6 pr-3 py-1.5 rounded-md text-sm transition-colors ${
      isActive ? 'bg-[#005151] text-white font-medium' : 'text-gray-500 hover:bg-gray-100'
    }`;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto flex-shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#005151] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">PT</span>
          </div>
          <div>
            <div className="font-bold text-[#005151] text-sm">ProTime</div>
            <div className="text-xs text-gray-500">Defect Dashboard</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/leadership" className={navLinkClass}>
            <LayoutDashboard size={16} /> Leadership
          </NavLink>
          <NavLink to="/all-products" className={navLinkClass}>
            <TrendingUp size={16} /> All Products
          </NavLink>
          <div>
            <button onClick={() => toggleSection('security')} className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100">
              <span className="flex items-center gap-2"><Shield size={16} /> Security</span>
              {expandedSections.security ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {expandedSections.security && (
              <div className="space-y-0.5 mt-0.5">
                <NavLink to="/security" end className={subNavLinkClass}>Overview</NavLink>
                <NavLink to="/security/uta" className={subNavLinkClass}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#059669' }} /> UTA
                </NavLink>
                <NavLink to="/security/utm" className={subNavLinkClass}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#2563eb' }} /> UTM
                </NavLink>
                <NavLink to="/security/wfm-classic" className={subNavLinkClass}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#7c3aed' }} /> WFM Classic
                </NavLink>
              </div>
            )}
          </div>
          <NavLink to="/ktlo-analysis" className={navLinkClass}>
            <TrendingUp size={16} /> KTLO Analysis
          </NavLink>

          <div className="pt-2 pb-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">Products</div>
          </div>

          {/* UTA */}
          <div>
            <button onClick={() => toggleSection('uta')} className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100">
              <span className="font-medium text-[#005151]">UTA</span>
              {expandedSections.uta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {expandedSections.uta && (
              <div className="space-y-0.5 mt-0.5">
                <NavLink to="/uta" end className={subNavLinkClass}>Dashboard</NavLink>
                <NavLink to="/uta/upgrade-tracker" className={subNavLinkClass}><ArrowUpCircle size={12} /> Upgrade Tracker</NavLink>
                <NavLink to="/customer-impact" className={subNavLinkClass}><Users size={12} /> Customer Impact</NavLink>
                <NavLink to="/swag-actuals" className={subNavLinkClass}>SWAG vs Actuals</NavLink>
                <NavLink to="/swag-actuals-leadership" className={subNavLinkClass}>SWAG Leadership</NavLink>
              </div>
            )}
          </div>

          {/* UTM */}
          <div>
            <button onClick={() => toggleSection('utm')} className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100">
              <span className="font-medium text-[#0d9488]">UTM</span>
              {expandedSections.utm ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {expandedSections.utm && (
              <div className="space-y-0.5 mt-0.5">
                <NavLink to="/utm" end className={subNavLinkClass}>Dashboard</NavLink>
                <NavLink to="/utm/swag-actuals" className={subNavLinkClass}>SWAG vs Actuals</NavLink>
                <NavLink to="/utm/customer-impact" className={subNavLinkClass}>Customer Impact</NavLink>
              </div>
            )}
          </div>

          {/* WFM Classic */}
          <div>
            <button onClick={() => toggleSection('wfm')} className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100">
              <span className="font-medium text-[#b7950b]">WFM Classic</span>
              {expandedSections.wfm ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {expandedSections.wfm && (
              <div className="space-y-0.5 mt-0.5">
                <NavLink to="/wfm-classic" end className={subNavLinkClass}>Dashboard</NavLink>
                <NavLink to="/wfm-classic/swag-actuals" className={subNavLinkClass}>SWAG vs Actuals</NavLink>
                <NavLink to="/wfm-classic/customer-impact" className={subNavLinkClass}>Customer Impact</NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* Last updated + Sync button */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-start gap-1.5 mb-2 px-1">
            <Clock size={11} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-0.5">Last Updated</div>
              <div className="text-[11px] text-gray-500 leading-tight">{formatDateTime(lastUpdated)}</div>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#005151] text-white rounded-md text-sm hover:bg-[#004040] disabled:opacity-60 transition-colors"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Jira'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
