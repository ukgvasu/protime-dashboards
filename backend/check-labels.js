import { dbManager } from './src/models/database.js';

await dbManager.initialize();
const db = dbManager.getDatabase();

console.log('\n=== Checking Labels in Database ===\n');

const defects = db.prepare(`
  SELECT key, labels, is_security, is_customer_reported, issue_type
  FROM defects
  WHERE product = 'uta'
  LIMIT 20
`).all();

defects.forEach(d => {
  const labels = JSON.parse(d.labels || '[]');
  console.log(`${d.key}:`);
  console.log(`  Labels: ${labels.join(', ')}`);
  console.log(`  is_security: ${d.is_security}, is_customer_reported: ${d.is_customer_reported}`);
  console.log(`  issue_type: ${d.issue_type}`);
  console.log('');
});

// Check security defects specifically
console.log('\n=== Security Defects ===');
const securityDefects = db.prepare(`
  SELECT key, labels
  FROM defects
  WHERE product = 'uta'
    AND (labels LIKE '%security%' OR labels LIKE '%Security%')
`).all();

console.log(`Found ${securityDefects.length} defects with "security" in labels`);
securityDefects.forEach(d => {
  const labels = JSON.parse(d.labels || '[]');
  console.log(`${d.key}: ${labels.join(', ')}`);
});

// Check RCA defects
console.log('\n=== RCA Defects ===');
const rcaDefects = db.prepare(`
  SELECT key, labels
  FROM defects
  WHERE product = 'uta'
    AND (labels LIKE '%RCA%' OR labels LIKE '%rca%')
`).all();

console.log(`Found ${rcaDefects.length} defects with "RCA" in labels`);
rcaDefects.forEach(d => {
  const labels = JSON.parse(d.labels || '[]');
  console.log(`${d.key}: ${labels.join(', ')}`);
});

dbManager.close();
