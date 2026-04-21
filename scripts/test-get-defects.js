#!/usr/bin/env node

import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';

async function test() {
  await dbManager.initialize();

  const defects = DefectModel.getByProduct('uta', {});
  console.log('DefectModel.getByProduct returned:', defects.length, 'defects');

  const withCustomers = defects.filter(d => d.customer_count > 0).length;
  const withoutCustomers = defects.filter(d => d.customer_count === 0).length;

  console.log('With customers:', withCustomers);
  console.log('Without customers:', withoutCustomers);

  // Check if there are any with status Closed or Canceled
  const closedOrCanceled = defects.filter(d => d.status === 'Closed' || d.status === 'Canceled').length;
  console.log('Closed/Canceled:', closedOrCanceled);

  // Show a few internal defects
  console.log('\nFirst few internal defects:');
  defects.filter(d => d.customer_count === 0).slice(0, 5).forEach(d => {
    console.log(`  ${d.key}: ${d.summary.substring(0, 60)}... (status: ${d.status})`);
  });
}

test();
