import { dbManager } from './database.js';

export class SnapshotModel {
  static insert(snapshot) {
    dbManager.run(`
      INSERT OR REPLACE INTO snapshots (product, date, total_open, opened_today, closed_today, p1_count, p2_count, customer_facing, snapshot_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      snapshot.product, snapshot.date, snapshot.total_open || 0, snapshot.opened_today || 0,
      snapshot.closed_today || 0, snapshot.p1_count || 0, snapshot.p2_count || 0,
      snapshot.customer_facing || 0, JSON.stringify(snapshot.data || {})
    ]);
  }

  static getMonthlyFlow(product, months = 6) {
    return dbManager.all(
      `SELECT month, opened_count, closed_count, net_change FROM monthly_snapshots
       WHERE product = ? ORDER BY month DESC LIMIT ?`,
      [product, months]
    ).reverse();
  }

  static insertMonthlySnapshot(data) {
    dbManager.run(`
      INSERT OR REPLACE INTO monthly_snapshots (product, month, opened_count, closed_count, net_change, snapshot_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [data.product, data.month, data.opened_count || 0, data.closed_count || 0, data.net_change || 0, data.snapshot_date]);
  }

  static getLastSprintClosure(product) {
    const row = dbManager.get(
      `SELECT closed_today FROM snapshots WHERE product = ? ORDER BY date DESC LIMIT 1`,
      [product]
    );
    return row ? row.closed_today : 0;
  }

  static getRecent(product, days = 30) {
    try {
      return dbManager.all(
        `SELECT * FROM snapshots WHERE product = ? ORDER BY created_at DESC LIMIT ?`,
        [product, days]
      );
    } catch { return []; }
  }
}
