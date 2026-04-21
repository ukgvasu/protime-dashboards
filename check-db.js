import Database from 'better-sqlite3';

const db = new Database('./database/protime.db');

const total = db.prepare('SELECT COUNT(*) as count FROM defects').get();
const customerReported = db.prepare('SELECT COUNT(*) as count FROM defects WHERE is_customer_reported = 1 AND customer_count > 0').get();
const byStatus = db.prepare(`
  SELECT status, COUNT(*) as count
  FROM defects
  WHERE is_customer_reported = 1 AND customer_count > 0
  GROUP BY status
  ORDER BY count DESC
`).all();

const resolutions = db.prepare(`
  SELECT resolution, COUNT(*) as count
  FROM defects
  WHERE is_customer_reported = 1 AND customer_count > 0
  GROUP BY resolution
  ORDER BY count DESC
`).all();

console.log('Total defects in DB:', total.count);
console.log('Customer-reported defects (RCA-Type-Defect + customers):', customerReported.count);
console.log('\nBreakdown by status:');
byStatus.forEach(row => console.log(`  ${row.status}: ${row.count}`));
console.log('\nBreakdown by resolution:');
resolutions.forEach(row => console.log(`  ${row.resolution || 'Unresolved'}: ${row.count}`));

db.close();
