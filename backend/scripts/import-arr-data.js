#!/usr/bin/env node

/**
 * Import customer ARR data from Excel to JSON config
 *
 * Usage: node scripts/import-arr-data.js path/to/customer-arr.xlsx
 *
 * Expected Excel columns:
 * - Customer Name (required)
 * - ARR (required)
 * - Tier (optional)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);

async function importARRData(excelPath) {
  console.log('📊 Importing ARR data from Excel...');
  console.log(`   Source: ${excelPath}\n`);

  try {
    // 1. Convert Excel to CSV using Python pandas
    const csvPath = '/tmp/customer-arr-temp.csv';

    console.log('🔄 Converting Excel to CSV...');

    const pythonScript = `
import pandas as pd
import sys

try:
    # Read Excel file
    df = pd.read_excel('${excelPath}', sheet_name=0)

    # Write to CSV
    df.to_csv('${csvPath}', index=False)
    print(f"Converted {len(df)} rows")

except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
`;

    try {
      await execAsync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`);
    } catch (pythonError) {
      console.error('❌ Python pandas not available. Trying alternative method...');

      // Fallback: Try using LibreOffice
      try {
        await execAsync(`soffice --headless --convert-to csv:"Text - txt - csv (StarCalc)":"44,34,76,1" --outdir /tmp "${excelPath}"`);
        const csvFilename = path.basename(excelPath, path.extname(excelPath)) + '.csv';
        await execAsync(`mv /tmp/${csvFilename} ${csvPath}`);
      } catch (libreError) {
        throw new Error('Could not convert Excel file. Install pandas (pip install pandas openpyxl) or LibreOffice.');
      }
    }

    // 2. Parse CSV to JSON structure
    console.log('📝 Parsing CSV data...');

    const csvContent = await fs.readFile(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      throw new Error('CSV file appears to be empty or malformed');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log(`   Headers: ${headers.join(', ')}`);

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

    if (nameIdx === -1 || arrIdx === -1) {
      throw new Error(`Could not find required columns. Found: ${headers.join(', ')}`);
    }

    console.log(`   Using columns: Name=${headers[nameIdx]}, ARR=${headers[arrIdx]}${tierIdx >= 0 ? `, Tier=${headers[tierIdx]}` : ''}`);

    // Parse data rows
    const customers = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));

      const customerName = values[nameIdx]?.trim();
      const arrValue = parseFloat(values[arrIdx]?.replace(/[,$]/g, '')) || 0;
      const tier = tierIdx >= 0 ? values[tierIdx]?.trim() : null;

      if (!customerName) continue;

      customers.push({
        name: customerName,
        arr: arrValue,
        tier: tier || null,
        aliases: [],
        notes: ""
      });
    }

    if (customers.length === 0) {
      throw new Error('No valid customer data found in Excel file');
    }

    // 3. Sort by ARR descending
    customers.sort((a, b) => b.arr - a.arr);

    // 4. Write to config file
    console.log('\n💾 Writing to config...');

    const config = {
      version: "1.0",
      last_updated: new Date().toISOString().split('T')[0],
      source: path.basename(excelPath),
      customers: customers
    };

    const configPath = path.join(__dirname, '../../config/customer-arr-mapping.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    // 5. Summary
    const totalARR = customers.reduce((sum, c) => sum + c.arr, 0);
    const topCustomers = customers.slice(0, 5);

    console.log('\n✅ Import complete!');
    console.log(`   Imported ${customers.length} customers`);
    console.log(`   Total ARR: $${(totalARR / 1000000).toFixed(2)}M`);
    console.log(`   Config saved to: ${configPath}`);
    console.log('\n📊 Top 5 customers by ARR:');
    topCustomers.forEach((c, idx) => {
      console.log(`   ${idx + 1}. ${c.name}: $${(c.arr / 1000000).toFixed(2)}M`);
    });

    console.log('\n💡 Next steps:');
    console.log('   1. Review config file and add any customer aliases');
    console.log('   2. Run validation: node scripts/validate-arr-mapping.js');
    console.log('   3. Restart backend server to load new ARR data');

    // Cleanup temp CSV
    await fs.unlink(csvPath).catch(() => {});

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Main execution
const excelPath = process.argv[2];

if (!excelPath) {
  console.error('Usage: node scripts/import-arr-data.js path/to/customer-arr.xlsx');
  console.error('\nExample:');
  console.error('  node scripts/import-arr-data.js "/mnt/c/Users/ian.cowpar/Downloads/Customer Details (13).xlsx"');
  process.exit(1);
}

importARRData(excelPath).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
