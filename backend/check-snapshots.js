import Database from 'better-sqlite3';

const db = new Database('../database/protime.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='monthly_snapshots'").all();
console.log('monthly_snapshots table exists:', tables.length > 0);

if (tables.length > 0) {
  const count = db.prepare('SELECT COUNT(*) as count FROM monthly_snapshots').get();
  console.log('Total rows:', count.count);

  const rows = db.prepare('SELECT * FROM monthly_snapshots WHERE product = ? ORDER BY month').all('uta');
  console.log('\nUTA monthly snapshots (' + rows.length + ' rows):');
  rows.forEach(r => console.log(`  ${r.month}: opened=${r.opened_count}, closed=${r.closed_count}, net=${r.net_change}`));
} else {
  console.log('Table does not exist!');
}

db.close();
