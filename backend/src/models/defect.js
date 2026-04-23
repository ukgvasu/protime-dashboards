import { dbManager } from './database.js';
import { differenceInDays, parseISO } from 'date-fns';

export class DefectModel {
  static getAll(product) {
    const productFilter = product === 'all' ? '1=1' : `product = '${product}'`;
    return dbManager.all(
      `SELECT * FROM defects WHERE ${productFilter} ORDER BY priority ASC, created_at DESC`
    );
  }

  static getStats(product) {
    const productFilter = product === 'all' ? '1=1' : `product = ?`;
    const params = product === 'all' ? [] : [product];

    const allOpen = dbManager.all(
      `SELECT * FROM defects WHERE ${productFilter} AND status NOT IN ('Closed', 'Canceled')`,
      params
    );

    const now = new Date();
    const stale = allOpen.filter(d => {
      const updated = d.updated_at ? new Date(d.updated_at) : null;
      if (!updated) return (d.age_days || 0) >= 30;
      return differenceInDays(now, updated) >= 30;
    });

    const byPriority = { P1: 0, P2: 0, P3: 0, P4: 0, P5: 0, Unknown: 0 };
    const bySeverity = { S1: 0, S2: 0, S3: 0, S4: 0, Unknown: 0 };
    const byArea = {};

    allOpen.forEach(d => {
      const p = d.priority || 'Unknown';
      byPriority[p] = (byPriority[p] || 0) + 1;
      const s = d.severity || 'Unknown';
      bySeverity[s] = (bySeverity[s] || 0) + 1;
      const area = d.area || 'Unknown';
      byArea[area] = (byArea[area] || 0) + 1;
    });

    // Top 8 areas + Other
    const sortedAreas = Object.entries(byArea).sort((a, b) => b[1] - a[1]);
    const topAreas = sortedAreas.slice(0, 8);
    const otherCount = sortedAreas.slice(8).reduce((sum, [, v]) => sum + v, 0);
    if (otherCount > 0) topAreas.push(['Other', otherCount]);

    const byAge = {
      '0-7 days': allOpen.filter(d => (d.age_days || 0) <= 7).length,
      '8-30 days': allOpen.filter(d => (d.age_days || 0) > 7 && (d.age_days || 0) <= 30).length,
      '31-90 days': allOpen.filter(d => (d.age_days || 0) > 30 && (d.age_days || 0) <= 90).length,
      '90+ days': allOpen.filter(d => (d.age_days || 0) > 90).length,
    };

    return {
      total: allOpen.length,
      customerImpacting: allOpen.filter(d => d.is_customer_reported === 1 || d.is_customer_reported === true).length,
      internalOnly: allOpen.filter(d => !d.is_customer_reported || d.is_customer_reported === 0).length,
      p1p2: allOpen.filter(d => ['P1', 'P2'].includes(d.priority)).length,
      s1s2: allOpen.filter(d => ['S1', 'S2'].includes(d.severity)).length,
      highSeverityCustomer: allOpen.filter(d => ['S1', 'S2'].includes(d.severity) && (d.customer_count > 0 || d.is_customer_reported === 1)).length,
      highSeverityInternal: allOpen.filter(d => ['S1', 'S2'].includes(d.severity) && !(d.customer_count > 0 || d.is_customer_reported === 1)).length,
      customerFacingHighPriority: allOpen.filter(d => ['P1', 'P2'].includes(d.priority) && d.is_customer_reported === 1).length,
      unassigned: allOpen.filter(d => !d.assignee || d.assignee === 'Unassigned').length,
      stale: stale.length,
      byPriority,
      bySeverity,
      byArea: Object.fromEntries(topAreas),
      byAge,
    };
  }

  static getCustomerFacingStats(product) {
    const productFilter = product === 'all' ? '1=1' : `product = ?`;
    const params = product === 'all' ? [] : [product];

    const customerFacing = dbManager.all(
      `SELECT * FROM defects WHERE ${productFilter} AND is_customer_reported = 1 AND status NOT IN ('Closed', 'Canceled')`,
      params
    );

    return {
      total: customerFacing.length,
      p1p2: customerFacing.filter(d => ['P1', 'P2'].includes(d.priority)).length,
      s1s2: customerFacing.filter(d => ['S1', 'S2'].includes(d.severity)).length,
    };
  }

  static getByCategory(product, category) {
    const rows = dbManager.all(
      `SELECT * FROM defects WHERE product = ? AND status NOT IN ('Closed', 'Canceled') AND (issue_type = 'Defect' OR issue_type = 'Bug') ORDER BY priority ASC, created_at DESC`,
      [product]
    );

    const filtered = rows.filter(d => {
      const labels = d.labels ? d.labels.split(',').map(l => l.trim()) : [];
      switch (category) {
        case 'sf-non-code':
          return labels.some(l => l.toLowerCase().includes('sf')) && !d.is_customer_reported;
        case 'sf-code':
          return labels.some(l => l.toLowerCase().includes('sf')) && d.is_customer_reported;
        case 'internal':
          return d.is_customer_reported && d.customer_count === 0;
        case 'security':
          return labels.some(l => ['checkmarx', 'sca', 'sast', 'dast', 'cve', 'security', 'bitsight'].includes(l.toLowerCase()));
        default:
          return true;
      }
    });

    return filtered;
  }

  static getTopCustomers(product, limit = 5) {
    const rows = dbManager.all(
      `SELECT * FROM defects WHERE product = ? AND status NOT IN ('Closed', 'Canceled') AND customer_count > 0`,
      [product]
    );

    // Exclude upgrade issues
    const filtered = rows.filter(d => {
      const labels = d.labels ? d.labels.split(',').map(l => l.trim().toUpperCase()) : [];
      return !labels.includes('UTAUPGRADE25') && !labels.includes('UTAUPGRADE26');
    });

    // Parse and aggregate customers
    const customerMap = {};
    filtered.forEach(defect => {
      let customers = [];
      try {
        customers = defect.customers ? JSON.parse(defect.customers) : [];
      } catch {
        customers = defect.customers ? [defect.customers] : [];
      }
      customers.forEach(c => {
        const name = typeof c === 'string' ? c : (c.name || c.displayName || String(c));
        if (!name) return;
        customerMap[name] = (customerMap[name] || 0) + 1;
      });
    });

    return Object.entries(customerMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }

  static getSecurityDefects() {
    return dbManager.all(
      `SELECT * FROM defects WHERE status NOT IN ('Closed', 'Canceled') AND (
        labels LIKE '%checkmarx%' OR labels LIKE '%sca%' OR labels LIKE '%CVE%' OR labels LIKE '%security%' OR labels LIKE '%bitsight%'
      ) ORDER BY priority ASC, created_at DESC`
    );
  }

  static insert(defect) {
    const existing = dbManager.get('SELECT id FROM defects WHERE key = ?', [defect.key]);
    if (existing) {
      dbManager.run(`
        UPDATE defects SET
          summary = ?, status = ?, priority = ?, severity = ?, assignee = ?,
          reporter = ?, area = ?, labels = ?, customer_count = ?, customers = ?,
          is_customer_reported = ?, age_days = ?, updated_at = ?, resolution_date = ?,
          resolution = ?, issue_type = ?, raw_json = ?, is_upgrade_25 = ?, is_upgrade_26 = ?,
          resolution_time_days = ?, synced_at = CURRENT_TIMESTAMP
        WHERE key = ?
      `, [
        defect.summary, defect.status, defect.priority, defect.severity, defect.assignee,
        defect.reporter, defect.area, defect.labels, defect.customer_count,
        JSON.stringify(defect.customers || []), defect.is_customer_reported ? 1 : 0,
        defect.age_days, defect.updated_at, defect.resolution_date,
        defect.resolution, defect.issue_type, JSON.stringify(defect.raw || {}),
        defect.is_upgrade_25 ? 1 : 0, defect.is_upgrade_26 ? 1 : 0,
        defect.resolution_time_days, defect.key
      ]);
    } else {
      dbManager.run(`
        INSERT INTO defects (
          id, key, product, summary, status, priority, severity, assignee, reporter,
          area, labels, customer_count, customers, is_customer_reported, age_days,
          created_at, updated_at, resolution_date, resolution, issue_type, raw_json,
          is_upgrade_25, is_upgrade_26, resolution_time_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        defect.id, defect.key, defect.product, defect.summary, defect.status,
        defect.priority, defect.severity, defect.assignee, defect.reporter,
        defect.area, defect.labels, defect.customer_count,
        JSON.stringify(defect.customers || []), defect.is_customer_reported ? 1 : 0,
        defect.age_days, defect.created_at, defect.updated_at, defect.resolution_date,
        defect.resolution, defect.issue_type, JSON.stringify(defect.raw || {}),
        defect.is_upgrade_25 ? 1 : 0, defect.is_upgrade_26 ? 1 : 0,
        defect.resolution_time_days
      ]);
    }
  }

  static getWeeklyCustomerImpactTrend(product, days = 60) {
    // substr(created_at,1,10) extracts YYYY-MM-DD from Jira's ISO string (which has timezone offsets
    // that SQLite's strftime cannot parse, causing NULL results without this slice)
    if (product === 'all') {
      return dbManager.all(
        `SELECT strftime('%Y-%W', substr(created_at,1,10)) as week,
                MIN(substr(created_at,1,10)) as week_start,
                COUNT(*) as count
         FROM defects
         WHERE customer_count > 0 AND substr(created_at,1,10) >= date('now', '-${days} days')
         GROUP BY week ORDER BY week ASC`
      );
    }
    return dbManager.all(
      `SELECT strftime('%Y-%W', substr(created_at,1,10)) as week,
              MIN(substr(created_at,1,10)) as week_start,
              COUNT(*) as count
       FROM defects
       WHERE product = ? AND customer_count > 0 AND substr(created_at,1,10) >= date('now', '-${days} days')
       GROUP BY week ORDER BY week ASC`,
      [product]
    );
  }

  static getUpgradeIssues(label) {
    const col = label.toUpperCase().includes('25') ? 'is_upgrade_25' : 'is_upgrade_26';
    return dbManager.all(`SELECT * FROM defects WHERE ${col} = 1 AND product = 'uta'`);
  }

  static getTrueDefects() {
    return dbManager.all(
      `SELECT * FROM defects WHERE is_customer_reported = 1 AND (is_upgrade_25 = 1 OR is_upgrade_26 = 1) AND product = 'uta'`
    );
  }

  static getBaselineIssues(teamId) {
    return dbManager.all(
      `SELECT * FROM defects WHERE product = 'uta' AND status NOT IN ('Closed', 'Canceled') AND (julianday('now') - julianday(created_at)) <= 365`
    );
  }

  static getMonthlyFlow(product, months = 6) {
    const now = new Date();
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      let openedSql, closedSql, oParams, cParams;
      if (product === 'all') {
        openedSql = `SELECT COUNT(*) as cnt FROM defects WHERE substr(created_at,1,7)=?`;
        closedSql = `SELECT COUNT(*) as cnt FROM defects WHERE resolution_date IS NOT NULL AND substr(resolution_date,1,7)=?`;
        oParams = [month]; cParams = [month];
      } else {
        openedSql = `SELECT COUNT(*) as cnt FROM defects WHERE product=? AND substr(created_at,1,7)=?`;
        closedSql = `SELECT COUNT(*) as cnt FROM defects WHERE product=? AND resolution_date IS NOT NULL AND substr(resolution_date,1,7)=?`;
        oParams = [product, month]; cParams = [product, month];
      }
      const opened = dbManager.all(openedSql, oParams)[0]?.cnt || 0;
      const closed = dbManager.all(closedSql, cParams)[0]?.cnt || 0;
      result.push({ month, opened_count: opened, closed_count: closed, net_change: opened - closed });
    }
    return result;
  }

  static calculateResolutionMetrics(issues) {
    const total = issues.length;
    const resolved = issues.filter(i => ['Closed', 'Resolved', 'Done'].includes(i.status)).length;
    const open = total - resolved;
    const resolution_rate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;

    const resTimes = issues
      .filter(i => i.resolution_time_days != null && i.resolution_time_days > 0)
      .map(i => i.resolution_time_days);

    const avg_resolution_days = resTimes.length > 0
      ? (resTimes.reduce((a, b) => a + b, 0) / resTimes.length).toFixed(1)
      : null;

    const sorted = [...resTimes].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median_resolution_days = sorted.length > 0
      ? (sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid])
      : null;

    return { total, resolved, open, resolution_rate: parseFloat(resolution_rate), avg_resolution_days: parseFloat(avg_resolution_days), median_resolution_days };
  }
}
