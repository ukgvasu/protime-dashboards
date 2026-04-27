import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import UTADashboard from './pages/UTADashboard';
import UTAUpgradeTracker from './pages/UTAUpgradeTracker';
import SwagActualsDashboard from './pages/SwagActualsDashboard';
import SwagActualsLeadershipDashboard from './pages/SwagActualsLeadershipDashboard';
import UTMDashboard from './pages/UTMDashboard';
import WFMClassicDashboard from './pages/WFMClassicDashboard';
import LeadershipDashboard from './pages/LeadershipDashboard';
import SecurityDashboard from './pages/SecurityDashboard';
import KTLOAnalysisDashboard from './pages/KTLOAnalysisDashboard';
import CustomerImpactDashboard from './pages/CustomerImpactDashboard';
import AllProductsDashboard from './pages/AllProductsDashboard';
import CustomerTrends from './pages/CustomerTrends';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LeadershipDashboard />} />
          <Route path="customer-trends" element={<CustomerTrends />} />
          <Route path="all-products" element={<AllProductsDashboard />} />
          <Route path="uta" element={<UTADashboard />} />
          <Route path="uta/upgrade-tracker" element={<UTAUpgradeTracker />} />
          <Route path="swag-actuals" element={<SwagActualsDashboard product="uta" />} />
          <Route path="swag-actuals-leadership" element={<SwagActualsLeadershipDashboard />} />
          <Route path="ktlo-analysis" element={<KTLOAnalysisDashboard />} />
          <Route path="customer-impact" element={<CustomerImpactDashboard product="uta" />} />
          <Route path="utm" element={<UTMDashboard />} />
          <Route path="utm/swag-actuals" element={<SwagActualsDashboard product="utm" />} />
          <Route path="utm/customer-impact" element={<CustomerImpactDashboard product="utm" />} />
          <Route path="wfm-classic" element={<WFMClassicDashboard />} />
          <Route path="wfm-classic/swag-actuals" element={<SwagActualsDashboard product="wfmClassic" />} />
          <Route path="wfm-classic/customer-impact" element={<CustomerImpactDashboard product="wfmClassic" />} />
          <Route path="leadership" element={<LeadershipDashboard />} />
          <Route path="security" element={<SecurityDashboard />} />
          <Route path="security/uta" element={<SecurityDashboard product="uta" />} />
          <Route path="security/utm" element={<SecurityDashboard product="utm" />} />
          <Route path="security/wfm-classic" element={<SecurityDashboard product="wfmClassic" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
