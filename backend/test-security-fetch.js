import { jiraService } from './src/services/jira-service.js';

console.log('=== Testing Security Defects Fetch ===\n');

try {
  const securityDefects = await jiraService.getSecurityDefects();

  console.log(`Total security defects fetched: ${securityDefects.length}\n`);

  // Group by product
  const byProduct = {};
  securityDefects.forEach(d => {
    if (!byProduct[d.product]) byProduct[d.product] = [];
    byProduct[d.product].push(d);
  });

  Object.keys(byProduct).forEach(product => {
    console.log(`\n${product.toUpperCase()}: ${byProduct[product].length} security defects`);
    byProduct[product].slice(0, 5).forEach(d => {
      console.log(`  ${d.key}: ${d.summary.substring(0, 60)}...`);
      console.log(`    Components: ${d.components.join(', ')}`);
      console.log(`    Labels: ${d.labels.slice(0, 3).join(', ')}`);
    });
  });

} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}
