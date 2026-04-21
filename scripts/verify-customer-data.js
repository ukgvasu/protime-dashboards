#!/usr/bin/env node

import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';

await dbManager.initialize();

const allUta = DefectModel.getByProduct('uta');

console.log('═══════════════════════════════════════════════════════════');
console.log('              UTA CUSTOMER DATA VERIFICATION               ');
console.log('═══════════════════════════════════════════════════════════\n');

// Filter to defects with customers
const defectsWithCustomers = allUta.filter(d =>
  d.customers &&
  d.customers.length > 0 &&
  d.status !== 'Closed' &&
  d.status !== 'Canceled'
);

console.log(`Total UTA defects: ${allUta.length}`);
console.log(`Open defects with customers: ${defectsWithCustomers.length}\n`);

// Count customers across all defects
const customerCounts = {};

defectsWithCustomers.forEach(defect => {
  const labels = defect.labels || [];
  const hasUpgrade = labels.some(l =>
    l.includes('UTAUpgrade25') || l.includes('UTAUpgrade26')
  );

  console.log(`${defect.key} - ${defect.summary.substring(0, 60)}`);
  console.log(`  Status: ${defect.status}`);
  console.log(`  Customers (${defect.customers.length}): ${defect.customers.join(', ')}`);
  console.log(`  Has Upgrade Label: ${hasUpgrade ? 'YES (excluded from top customers)' : 'NO'}`);
  console.log('');

  // Only count if not upgrade
  if (!hasUpgrade) {
    defect.customers.forEach(customer => {
      customerCounts[customer] = (customerCounts[customer] || 0) + 1;
    });
  }
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log('              TOP CUSTOMERS (excluding upgrades)            ');
console.log('═══════════════════════════════════════════════════════════\n');

const topCustomers = Object.entries(customerCounts)
  .map(([customer, count]) => ({ customer, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 10);

topCustomers.forEach(({ customer, count }, idx) => {
  console.log(`${idx + 1}. ${customer}: ${count} defect${count > 1 ? 's' : ''}`);
});

console.log('\n');

// Check specifically for Sony
const sonyDefects = defectsWithCustomers.filter(d =>
  d.customers.some(c => c.includes('SONY'))
);

console.log('═══════════════════════════════════════════════════════════');
console.log('                  SONY DEFECTS DETAILS                     ');
console.log('═══════════════════════════════════════════════════════════\n');

if (sonyDefects.length > 0) {
  sonyDefects.forEach(d => {
    console.log(`Key: ${d.key}`);
    console.log(`Summary: ${d.summary}`);
    console.log(`Status: ${d.status}`);
    console.log(`Priority: ${d.priority}`);
    console.log(`Customers: ${d.customers.join(', ')}`);
    console.log(`Labels: ${d.labels.join(', ')}`);
    console.log('');
  });
} else {
  console.log('No Sony defects found\n');
}

dbManager.close();
