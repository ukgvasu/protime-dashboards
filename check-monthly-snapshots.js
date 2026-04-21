import Database from 'better-sqlite3';

const db = new Database('./database/protime.db');

// Check if table exists
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='monthly_snapshots'").all();
console.log('monthly_snapshots table exists:', tables.length > 0);

if (tables.length > 0) {
  // Check data
  const count = db.prepare('SELECT COUNT(*) as count FROM monthly_snapshots').get();
  console.log('Total rows in monthly_snapshots:', count.count);

  const utaData = db.prepare('SELECT * FROM monthly_snapshots WHERE product = ? ORDER BY month DESC').all('uta');
  console.log('\nUTA monthly snapshots:');
  utaData.forEach(row => {
    console.log(`  ${row.month}: opened=${row.opened_count}, closed=${row.closed_count}, net=${row.net_change}`);
  });
}

db.close();
