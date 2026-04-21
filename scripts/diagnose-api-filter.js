#!/usr/bin/env node

import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';

async function diagnose() {
  await dbManager.initialize();

  const allDefects = DefectModel.getByProduct('uta', {});
  console.log('Total from getByProduct:', allDefects.length);

  // Apply the same filter as the API endpoint
  const filteredDefects = allDefects.filter(d => d.status !== 'Closed' && d.status !== 'Canceled');
  console.log('After Closed/Canceled filter:', filteredDefects.length);

  // Show which defects were filtered out
  const removed = allDefects.filter(d => d.status === 'Closed' || d.status === 'Canceled');
  console.log('Removed defects:', removed.length);
  if (removed.length > 0) {
    console.log('\nRemoved:');
    removed.forEach(d => console.log(`  ${d.key}: ${d.status}`));
  }

  // Check what statuses we have
  const statuses = {};
  allDefects.forEach(d => {
    statuses[d.status] = (statuses[d.status] || 0) + 1;
  });
  console.log('\nAll statuses:');
  Object.entries(statuses).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  // Check if there are any defects with statusCategory = Done
  console.log('\nLooking for statusCategory...');
  const withDone = allDefects.filter(d => {
    const raw = typeof d.raw_json === 'string' ? JSON.parse(d.raw_json) : d.raw_json;
    return raw?.status?.statusCategory?.key === 'done';
  });
  console.log('Defects with statusCategory=done:', withDone.length);
  if (withDone.length > 0) {
    console.log('First few:');
    withDone.slice(0, 5).forEach(d => {
      console.log(`  ${d.key}: ${d.status}`);
    });
  }
}

diagnose();
