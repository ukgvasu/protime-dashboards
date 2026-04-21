#!/usr/bin/env node

/**
 * Import customer ARR data from CSV to JSON config
 *
 * Usage: node scripts/import-arr-from-csv.js path/to/customer-arr.csv
 *
 * Expected CSV columns (flexible - will auto-detect):
 * - Customer Name (or "Account", "Name")
 * - ARR (or "Annual Revenue", "Revenue")
 * - Tier (optional - "Segment", "Class")
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Parse a CSV line respecting quoted fields
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

async function importFromCSV(csvPath) {
  console.log('📊 Importing ARR data from CSV...');
  console.log(`   Source: ${csvPath}\n`);

  try {
    // Read CSV file
    const csvContent = await fs.readFile(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      throw new Error('CSV file appears to be empty or has no data rows');
    }

    // Parse header using proper CSV parsing
    const headers = parseCSVLine(lines[0]);
    console.log(`   Headers: ${headers.join(', ')}\n`);

    // Find column indices (flexible column naming)
    const nameIdx = headers.findIndex(h =>
      /customer|name|account/i.test(h)
    );
    const arrIdx = headers.findIndex(h =>
      /arr|revenue|annual/i.test(h)
    );
    const tierIdx = headers.findIndex(h =>
      /tier|segment|class/i.test(h)
    );

    if (nameIdx === -1) {
      throw new Error(`Could not find customer name column. Found: ${headers.join(', ')}`);
    }

    if (arrIdx === -1) {
      throw new Error(`Could not find ARR column. Found: ${headers.join(', ')}`);
    }

    console.log(`   Using columns: Name="${headers[nameIdx]}", ARR="${headers[arrIdx]}"${tierIdx >= 0 ? `, Tier="${headers[tierIdx]}"` : ''}\n`);

    // Parse data rows
    const customers = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = parseCSVLine(lines[i]);

      const customerName = values[nameIdx]?.trim();
      // Remove $, commas, and quotes, then parse to float
      const arrValue = parseFloat(values[arrIdx]?.replace(/[$,"]/g, '')) || 0;
      const tier = tierIdx >= 0 ? values[tierIdx]?.trim() : null;

      if (!customerName || customerName === '') continue;

      customers.push({
        name: customerName,
        arr: arrValue,
        tier: tier || null,
        aliases: [],
        notes: ""
      });
    }

    if (customers.length === 0) {
      throw new Error('No valid customer data found in CSV file');
    }

    // Sort by ARR descending
    customers.sort((a, b) => b.arr - a.arr);

    // Write to config file
    console.log('💾 Writing to config...');

    const config = {
      version: "1.0",
      last_updated: new Date().toISOString().split('T')[0],
      source: path.basename(csvPath),
      customers: customers
    };

    const configPath = path.join(__dirname, '../../config/customer-arr-mapping.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    // Summary
    const totalARR = customers.reduce((sum, c) => sum + c.arr, 0);
    const topCustomers = customers.slice(0, 10);

    console.log('\n✅ Import complete!');
    console.log(`   Imported ${customers.length} customers`);
    console.log(`   Total ARR: $${(totalARR / 1000000).toFixed(2)}M`);
    console.log(`   Config saved to: ${configPath}`);
    console.log('\n📊 Top 10 customers by ARR:');
    topCustomers.forEach((c, idx) => {
      console.log(`   ${(idx + 1).toString().padStart(2)}. ${c.name}: $${(c.arr / 1000000).toFixed(2)}M`);
    });

    console.log('\n💡 Next steps:');
    console.log('   1. Review config file and add any customer aliases');
    console.log('   2. Run validation: node scripts/validate-arr-mapping.js');
    console.log('   3. Restart backend server to load new ARR data');

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Main execution
const csvPath = process.argv[2];

if (!csvPath) {
  console.error('Usage: node scripts/import-arr-from-csv.js path/to/customer-arr.csv');
  console.error('\nTo create a CSV from Excel:');
  console.error('  1. Open the Excel file');
  console.error('  2. Save As > CSV (Comma delimited)');
  console.error('  3. Run this script with the CSV path');
  process.exit(1);
}

importFromCSV(csvPath).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
