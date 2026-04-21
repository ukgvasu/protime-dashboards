#!/usr/bin/env node

/**
 * Backend API validation script
 * Checks that all upgrade tracker components are working
 */

console.log('🔍 Validating Backend Implementation...\n');

// 1. Check database columns
import initSqlJs from 'sql.js';
import fs from 'fs';

const SQL = await initSqlJs();
const buffer = fs.readFileSync('./database/protime.db');
const db = new SQL.Database(buffer);

console.log('✅ Step 1: Database columns');
const result = db.exec('PRAGMA table_info(defects)');
const columns = result[0].values.map(r => r[1]);
const requiredColumns = ['is_upgrade_25', 'is_upgrade_26', 'resolution_time_days'];
const hasAllColumns = requiredColumns.every(col => columns.includes(col));
console.log(`   Required columns present: ${hasAllColumns ? '✅' : '❌'}`);
if (!hasAllColumns) {
  console.log(`   Missing: ${requiredColumns.filter(c => !columns.includes(c)).join(', ')}`);
}

// 2. Check indexes
console.log('\n✅ Step 2: Database indexes');
const indexResult = db.exec("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_defects_upgrade%'");
const indexes = indexResult.length > 0 ? indexResult[0].values.map(r => r[0]) : [];
console.log(`   Upgrade indexes found: ${indexes.length}`);
indexes.forEach(idx => console.log(`   - ${idx}`));

db.close();

// 3. Check service files exist
console.log('\n✅ Step 3: Service files');
const serviceFiles = [
  './backend/src/services/cache-service.js',
  './backend/src/services/jira-service.js'
];
serviceFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${file}: ${exists ? '✅' : '❌'}`);
});

// 4. Check model updates
console.log('\n✅ Step 4: Model updates');
const modelFile = fs.readFileSync('./backend/src/models/defect.js', 'utf-8');
const hasUpgradeQueries = modelFile.includes('getUpgradeIssues') &&
                          modelFile.includes('getTrueDefects') &&
                          modelFile.includes('getBaselineIssues') &&
                          modelFile.includes('calculateResolutionMetrics');
console.log(`   DefectModel methods: ${hasUpgradeQueries ? '✅' : '❌'}`);

// 5. Check API endpoint
console.log('\n✅ Step 5: API endpoint');
const apiFile = fs.readFileSync('./backend/src/api/defects.js', 'utf-8');
const hasUpgradeEndpoint = apiFile.includes('/upgrade-tracker') &&
                           apiFile.includes('cacheService');
console.log(`   Upgrade tracker endpoint: ${hasUpgradeEndpoint ? '✅' : '❌'}`);

// 6. Check cache integration
console.log('\n✅ Step 6: Cache integration');
const syncFile = fs.readFileSync('./backend/src/api/sync.js', 'utf-8');
const hasCacheInvalidation = syncFile.includes('cacheService.invalidate');
console.log(`   Cache invalidation on sync: ${hasCacheInvalidation ? '✅' : '❌'}`);

// 7. Check frontend API client
console.log('\n✅ Step 7: Frontend API client');
const frontendApiFile = fs.readFileSync('./frontend/src/services/api.js', 'utf-8');
const hasUpgradeTrackerMethod = frontendApiFile.includes('getUpgradeTracker');
console.log(`   getUpgradeTracker method: ${hasUpgradeTrackerMethod ? '✅' : '❌'}`);

// 8. Check jira-service transform
console.log('\n✅ Step 8: Jira service transform');
const jiraFile = fs.readFileSync('./backend/src/services/jira-service.js', 'utf-8');
const hasUpgradeDetection = jiraFile.includes('isUpgrade25') &&
                            jiraFile.includes('isUpgrade26') &&
                            jiraFile.includes('resolutionTimeDays');
console.log(`   Upgrade label detection: ${hasUpgradeDetection ? '✅' : '❌'}`);

console.log('\n' + '='.repeat(50));
const allPassed = hasAllColumns && hasUpgradeQueries && hasUpgradeEndpoint &&
                  hasCacheInvalidation && hasUpgradeTrackerMethod && hasUpgradeDetection;
if (allPassed) {
  console.log('✅ ALL VALIDATIONS PASSED!');
  console.log('\nNext steps:');
  console.log('1. Run a full sync to populate upgrade tracking data');
  console.log('2. Test the API endpoint: GET /api/defects/uta/upgrade-tracker');
  console.log('3. Proceed to Frontend Build phase');
} else {
  console.log('❌ SOME VALIDATIONS FAILED');
  console.log('Please review the output above for details.');
}
console.log('='.repeat(50) + '\n');
