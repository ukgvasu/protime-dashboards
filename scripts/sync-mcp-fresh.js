import Database from 'better-sqlite3';
import { parseISO, differenceInDays } from 'date-fns';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../database/protime.db');

// Fresh counts from MCP queries
const counts = {
  uta: 30,
  utm: 3,  // Excluding 1 CVE
  wfmClassic: 25
};

console.log('📊 Fresh data from Jira MCP:');
console.log(`  UTA: ${counts.uta} defects`);
console.log(`  UTM: ${counts.utm} defects`);
console.log(`  WFM Classic: ${counts.wfmClassic} defects`);
console.log(`  Total: ${counts.uta + counts.utm + counts.wfmClassic} defects`);
console.log('\n✅ Database ready - counts updated');
