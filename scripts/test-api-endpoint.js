#!/usr/bin/env node

import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';

async function test() {
  await dbManager.initialize();

  // Simulate the API endpoint logic
  const product = 'uta';
  const filters = {}; // No filters from query params

  console.log('Step 1: Call DefectModel.getByProduct()');
  const allDefects = DefectModel.getByProduct(product, filters);
  console.log(`  Returned: ${allDefects.length} defects`);

  console.log('\nStep 2: Filter out Closed/Canceled');
  const defects = allDefects.filter(d => d.status !== 'Closed' && d.status !== 'Canceled');
  console.log(`  After filter: ${defects.length} defects`);

  console.log('\nStep 3: Get stats');
  const stats = DefectModel.getStats(product);
  console.log(`  stats.total: ${stats.total}`);
  console.log(`  stats.customer_impacting: ${stats.customer_impacting}`);
  console.log(`  stats.internal_only: ${stats.internal_only}`);

  console.log('\nStep 4: Check customer breakdown in defects array');
  const customerDefects = defects.filter(d => d.is_customer_reported || d.customer_count > 0).length;
  const internalDefects = defects.filter(d => !d.is_customer_reported && d.customer_count === 0).length;
  console.log(`  Customer-facing: ${customerDefects}`);
  console.log(`  Internal: ${internalDefects}`);

  console.log('\nStep 5: What would be in the response');
  const response = {
    product,
    count: defects.length,
    stats,
    defects: defects
  };
  console.log(`  response.count: ${response.count}`);
  console.log(`  response.defects.length: ${response.defects.length}`);
}

test();
