import Database from 'better-sqlite3';
import { parseISO, differenceInDays } from 'date-fns';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../database/protime.db');

// Fresh data from Jira MCP queries (just executed)
const utaDefects = [/* UTA data will be inserted here */];
const utmDefects = [/* UTM data will be inserted here */];
const wfmDefects = [/* WFM Classic data will be inserted here */];

function initializeDatabase() {
  const db = new Database(DB_PATH);

  // Clear existing data
  db.prepare('DELETE FROM defects').run();
  console.log('✅ Cleared existing defects');

  return db;
}

function transformDefect(issue, product) {
  const now = new Date();
  const createdDate = parseISO(issue.created);
  const ageDays = differenceInDays(now, createdDate);

  // Determine if customer-reported (basic heuristic based on labels)
  const labels = issue.labels || [];
  const isCustomerReported = labels.some(label =>
    label.toLowerCase().includes('cust-') ||
    label.toLowerCase().includes('rca-')
  ) ? 1 : 0;

  return {
    id: issue.key,
    product: product,
    key: issue.key,
    summary: issue.summary,
    priority: issue.priority?.name || 'None',
    severity: 'S3', // Default, would need custom field mapping
    status: issue.status?.name || 'Unknown',
    assignee: issue.assignee?.display_name || 'Unassigned',
    assignee_email: issue.assignee?.email || null,
    created_at: issue.created,
    updated_at: issue.updated,
    age_days: ageDays,
    is_customer_reported: isCustomerReported,
    labels: labels.join(','),
    deployment_version: issue.customfield_25700?.value?.[0] || null
  };
}

function insertDefects(db, defects, product) {
  const insert = db.prepare(`
    INSERT INTO defects (
      id, product, key, summary, priority, severity, status,
      assignee, assignee_email, created_at, updated_at, age_days,
      is_customer_reported, labels, deployment_version
    ) VALUES (
      @id, @product, @key, @summary, @priority, @severity, @status,
      @assignee, @assignee_email, @created_at, @updated_at, @age_days,
      @is_customer_reported, @labels, @deployment_version
    )
  `);

  let count = 0;
  for (const defect of defects) {
    const transformed = transformDefect(defect, product);
    insert.run(transformed);
    count++;
  }

  return count;
}

async function main() {
  console.log('🔄 Refreshing ProTime Dashboard data from Jira...\n');

  const db = initializeDatabase();

  // Note: In production, this would pull from the actual MCP results
  // For now, we're using inline data from the queries we just executed

  console.log('📊 Current data summary:');
  console.log(`  UTA: ${utaDefects.length} defects`);
  console.log(`  UTM: ${utmDefects.length} defects`);
  console.log(`  WFM Classic: ${wfmDefects.length} defects`);
  console.log();

  const utaCount = insertDefects(db, utaDefects, 'uta');
  console.log(`✅ Imported ${utaCount} UTA defects`);

  const utmCount = insertDefects(db, utmDefects, 'utm');
  console.log(`✅ Imported ${utmCount} UTM defects`);

  const wfmCount = insertDefects(db, wfmDefects, 'wfm-classic');
  console.log(`✅ Imported ${wfmCount} WFM Classic defects`);

  const total = utaCount + utmCount + wfmCount;
  console.log(`\n🎉 Total defects imported: ${total}`);

  db.close();
}

main().catch(console.error);
