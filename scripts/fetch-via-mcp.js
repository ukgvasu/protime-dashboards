#!/usr/bin/env node

/**
 * Fetch defect data via MCP Jira integration (since direct API auth doesn't work)
 * This script is a placeholder - data should be fetched via Claude MCP tools
 * and manually saved to mcp-defects.json
 */

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   📥 Fetch Defects via MCP Integration                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

This script is a placeholder. To fetch defect data:

1. Use Claude MCP Jira integration to fetch board issues:
   - Board 3097 (UTA)
   - Board 3057 (UTM)
   - Board 3106 (WFM Classic)

2. Use JQL: (issuetype in (Bug, Defect) OR labels = "RCA-Type-Defect")
            AND NOT labels in (Checkmarx, SCA, bitsight, automation, SAST, DAST)
            AND statusCategory != Done

3. Save results to scripts/mcp-defects.json in format:
   {
     "uta": { "total": N, "issues": [...] },
     "utm": { "total": N, "issues": [...] },
     "wfmClassic": { "total": N, "issues": [...] }
   }

4. Run: node scripts/import-mcp-data.js
`);

process.exit(0);
