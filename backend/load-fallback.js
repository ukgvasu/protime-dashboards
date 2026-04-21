import { dbManager } from './src/models/database.js';
import { DefectModel } from './src/models/defect.js';
import { getUTAFallbackData } from './src/services/fallback-data.js';

async function loadFallback() {
  try {
    console.log('🔧 Initializing database...');
    await dbManager.initialize();

    const fallbackDefects = getUTAFallbackData();
    console.log('📦 Loading', fallbackDefects.length, 'fallback defects...');

    // Clear existing UTA defects
    DefectModel.deleteByProduct('uta');

    // Insert fallback data
    DefectModel.bulkInsert(fallbackDefects);

    // Verify
    const stats = DefectModel.getStats('uta');
    console.log('✅ Loaded successfully!');
    console.log('   Total defects:', stats.total);
    console.log('   P1:', stats.p1, 'P2:', stats.p2, 'P3:', stats.p3);
    console.log('   Customer-reported:', stats.customer_reported);
    console.log('   Avg age:', Math.round(stats.avg_age), 'days');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to load fallback data:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

loadFallback();
