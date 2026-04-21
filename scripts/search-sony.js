#!/usr/bin/env node

import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';

await dbManager.initialize();

const allUta = DefectModel.getByProduct('uta');

console.log('Searching ALL UTA defects for "SONY"...\n');

const sonyMentions = allUta.filter(d => {
  const summaryMatch = d.summary?.toLowerCase().includes('sony');
  const customerMatch = d.customers?.some(c => c.toUpperCase().includes('SONY'));
  const descMatch = d.raw?.description?.toLowerCase().includes('sony');

  return summaryMatch || customerMatch || descMatch;
});

console.log(`Found ${sonyMentions.length} defect(s) mentioning SONY:\n`);

sonyMentions.forEach(d => {
  console.log(`Key: ${d.key}`);
  console.log(`Summary: ${d.summary}`);
  console.log(`Status: ${d.status}`);
  console.log(`Customers: ${JSON.stringify(d.customers)}`);
  console.log(`Customer Count: ${d.customer_count}`);
  console.log(`Created: ${d.created_at}`);
  console.log('');
});

dbManager.close();
