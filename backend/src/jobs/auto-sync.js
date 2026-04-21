import cron from 'node-cron';
import { syncProduct } from '../api/sync.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let BOARDS_CONFIG;
try {
  BOARDS_CONFIG = JSON.parse(fs.readFileSync(join(__dirname, '../../../config/jira-boards.json'), 'utf-8'));
} catch { BOARDS_CONFIG = { boards: {} }; }

export function startAutoSync() {
  // Run every 4 hours
  cron.schedule('0 */4 * * *', async () => {
    console.log('⏰ Auto-sync starting...');
    const products = Object.keys(BOARDS_CONFIG.boards || {});
    for (const product of products) {
      try {
        await syncProduct(product, false);
      } catch (err) {
        console.error(`Auto-sync failed for ${product}:`, err.message);
      }
    }
    console.log('✅ Auto-sync complete');
  });

  console.log('⏰ Auto-sync scheduled (every 4 hours)');
}
