#!/usr/bin/env node

/**
 * Quick script to check Claude API usage and costs
 * Run: node scripts/check-usage.js [days]
 */

import { getUsageSummary } from '../src/utils/usage-logger.js';

const days = parseInt(process.argv[2]) || 7;
const summary = getUsageSummary(days);

if (!summary) {
  console.log('❌ No usage data available yet.');
  process.exit(1);
}

console.log(`
┌─────────────────────────────────────────────────────────┐
│ 💬 Claude Chat Usage Summary                           │
│ ${summary.period.padEnd(55)} │
├─────────────────────────────────────────────────────────┤
│ Total requests:     ${summary.totalRequests.toString().padStart(6)}                         │
│ Total tokens:       ${summary.totalTokens.toLocaleString().padStart(12)}                     │
│ Total cost:         $${summary.totalCost.toFixed(4).padStart(7)}                        │
│ Avg cost/request:   $${summary.avgCostPerRequest.toFixed(4).padStart(7)}                        │
└─────────────────────────────────────────────────────────┘

Usage log: backend/logs/chat-usage.jsonl
`);

// Estimate monthly cost if this usage continues
if (summary.totalRequests > 0) {
  const dailyAvg = summary.totalCost / days;
  const monthlyEstimate = dailyAvg * 30;

  console.log(`📊 Projections:`);
  console.log(`   Daily average:   $${dailyAvg.toFixed(4)}`);
  console.log(`   Monthly estimate: $${monthlyEstimate.toFixed(2)}\n`);
}
