#!/usr/bin/env node

/**
 * Validate customer ARR mapping quality
 *
 * Reports match confidence and lists unmapped customers
 * Helps identify customers that need aliases added to config
 *
 * Usage: node scripts/validate-arr-mapping.js
 */

import { DefectModel } from '../src/models/defect.js';
import { dbManager } from '../src/models/database.js';
import { getCustomerARR, getAllCustomers } from '../src/utils/arr-lookup.js';
import { normalizeCustomerName } from '../src/utils/string-utils.js';

async function validateMatching() {
  console.log('🔍 Validating customer ARR mapping...\n');

  // Initialize database
  await dbManager.initialize();

  // Get all unique customers from defects
  const allDefects = DefectModel.getAll();
  const uniqueCustomers = new Set();

  allDefects.forEach(defect => {
    if (defect.customer_count > 0) {
      try {
        const customers = JSON.parse(defect.customers || '[]');
        customers.forEach(name => uniqueCustomers.add(name));
      } catch (e) {
        // Skip malformed customer data
      }
    }
  });

  console.log(`📋 Found ${uniqueCustomers.size} unique customers in Jira defects\n`);

  // Test matching for each
  const matched = [];
  const unmapped = [];

  uniqueCustomers.forEach(name => {
    const arr = getCustomerARR(name);
    if (arr !== null) {
      matched.push({ name, arr });
    } else {
      // Count defects for this unmapped customer
      const defectCount = allDefects.filter(d => {
        try {
          const customers = JSON.parse(d.customers || '[]');
          return customers.includes(name);
        } catch (e) {
          return false;
        }
      }).length;

      unmapped.push({ name, defectCount });
    }
  });

  // Calculate match rate
  const matchRate = uniqueCustomers.size > 0
    ? Math.round((matched.length / uniqueCustomers.size) * 100)
    : 0;

  // Report results
  console.log('═'.repeat(60));
  console.log('MATCHING RESULTS');
  console.log('═'.repeat(60));
  console.log(`✅ ${matched.length} customers matched (${matchRate}%)`);
  console.log(`❌ ${unmapped.length} customers unmapped (${100 - matchRate}%)`);
  console.log('');

  // Show ARR coverage
  const totalARR = matched.reduce((sum, c) => sum + c.arr, 0);
  const arrConfig = getAllCustomers();
  const configTotalARR = arrConfig.reduce((sum, c) => sum + c.arr, 0);

  console.log('💰 ARR Coverage:');
  console.log(`   Matched ARR: $${(totalARR / 1000000).toFixed(2)}M`);
  console.log(`   Config Total: $${(configTotalARR / 1000000).toFixed(2)}M`);
  console.log('');

  // List unmapped customers (sorted by defect impact)
  if (unmapped.length > 0) {
    console.log('═'.repeat(60));
    console.log('UNMAPPED CUSTOMERS (add to config or aliases)');
    console.log('═'.repeat(60));

    unmapped
      .sort((a, b) => b.defectCount - a.defectCount)
      .slice(0, 20)
      .forEach((c, idx) => {
        console.log(`${(idx + 1).toString().padStart(2)}. "${c.name}" (${c.defectCount} defects)`);
      });

    if (unmapped.length > 20) {
      console.log(`\n   ... and ${unmapped.length - 20} more\n`);
    } else {
      console.log('');
    }
  }

  // Show top matched customers
  if (matched.length > 0) {
    console.log('═'.repeat(60));
    console.log('TOP MATCHED CUSTOMERS BY ARR');
    console.log('═'.repeat(60));

    matched
      .sort((a, b) => b.arr - a.arr)
      .slice(0, 10)
      .forEach((c, idx) => {
        console.log(`${(idx + 1).toString().padStart(2)}. ${c.name}: $${(c.arr / 1000000).toFixed(2)}M`);
      });
    console.log('');
  }

  // Recommendations
  console.log('═'.repeat(60));
  console.log('RECOMMENDATIONS');
  console.log('═'.repeat(60));

  if (matchRate >= 90) {
    console.log('✅ Excellent match rate! ARR data is ready to use.');
  } else if (matchRate >= 70) {
    console.log('⚠️  Good match rate, but consider adding aliases for unmapped customers.');
    console.log('   Edit config/customer-arr-mapping.json and add common variations to "aliases" array.');
  } else {
    console.log('❌ Low match rate. Review unmapped customers and add aliases to config.');
    console.log('   Common issues:');
    console.log('   - Inc./LLC/Corp variations');
    console.log('   - Abbreviations vs full names');
    console.log('   - Spacing or punctuation differences');
  }
  console.log('');

  // Example alias JSON
  if (unmapped.length > 0) {
    const example = unmapped[0].name;
    console.log('Example alias entry in config:');
    console.log(`{
  "name": "Official Customer Name",
  "arr": 1500000,
  "aliases": ["${example}", "Variation 2"],
  "tier": "Enterprise",
  "notes": ""
}`);
    console.log('');
  }
}

console.log('');
validateMatching()
  .then(() => {
    console.log('✨ Validation complete\n');
  })
  .catch(err => {
    console.error('❌ Validation failed:', err.message);
    process.exit(1);
  });
