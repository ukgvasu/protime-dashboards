import Database from 'better-sqlite3';
import { parseISO, startOfMonth, endOfMonth, format } from 'date-fns';

const db = new Database('/home/iancowpar/protime-dashboard/database/protime.db');

const marchStart = '2026-03-01';
const marchEnd = '2026-04-01';

const rows = db.prepare(`
  SELECT key, summary, created_at, status, is_customer_reported, labels
  FROM defects
  WHERE product = 'wfmClassic'
    AND is_customer_reported = 1
    AND created_at >= ?
    AND created_at < ?
  ORDER BY created_at
`).all(marchStart, marchEnd);

console.log('WFM Classic Customer-Reported Defects in March 2026:');
console.log('Total:', rows.length);
console.log('');

rows.forEach(r => {
  console.log(`${r.key} | ${r.created_at} | ${r.status}`);
  console.log(`  ${r.summary}`);
  console.log(`  Labels: ${r.labels}`);
  console.log('');
});

db.close();
