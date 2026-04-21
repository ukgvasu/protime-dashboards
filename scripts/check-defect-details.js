#!/usr/bin/env node

import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';

await dbManager.initialize();

const allUta = DefectModel.getByProduct('uta');
console.log('Total UTA defects in DB:', allUta.length);

const statuses = {};
allUta.forEach(d => {
  statuses[d.status] = (statuses[d.status] || 0) + 1;
});

console.log('\nBy status:');
Object.entries(statuses).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
  console.log('  ', status, ':', count);
});

const customerReported = allUta.filter(d => d.is_customer_reported === 1).length;
const notCustomerReported = allUta.length - customerReported;

console.log('\nBy customer-reported (RCA label):');
console.log('   Customer-reported:', customerReported);
console.log('   Not customer-reported:', notCustomerReported);

const openDefects = allUta.filter(d => d.status !== 'Closed' && d.status !== 'Canceled');
console.log('\nOpen defects (excluding Closed/Canceled):', openDefects.length);

dbManager.close();
