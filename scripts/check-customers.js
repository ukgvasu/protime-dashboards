#!/usr/bin/env node

import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';

await dbManager.initialize();

const allUta = DefectModel.getByProduct('uta');

console.log('Checking customer data for all UTA defects:\n');

const customerDefects = allUta.filter(d => d.customers && d.customers.length > 0);
console.log(`Total defects with customers: ${customerDefects.length}\n`);

// Aggregate customers across all defects
const customerCounts = {};
customerDefects.forEach(defect => {
  console.log(`${defect.key}: ${defect.customers.join(', ')} (${defect.customers.length} customers)`);

  defect.customers.forEach(customer => {
    customerCounts[customer] = (customerCounts[customer] || 0) + 1;
  });
});

console.log('\nTop customers by defect count:');
Object.entries(customerCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([customer, count]) => {
    console.log(`  ${customer}: ${count} defects`);
  });

dbManager.close();
