#!/bin/bash

# This script updates mcp-defects.json with the latest data
# Data is fetched via Claude MCP Jira integration

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   📥 Update MCP Defects Data                              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  This requires Claude MCP Jira integration"
echo ""
echo "Boards to fetch:"
echo "  - 3097 (UTA)"
echo "  - 3057 (UTM)"
echo "  - 3106 (WFM Classic)"
echo ""
echo "JQL: (issuetype in (Bug, Defect) OR labels = \"RCA-Type-Defect\")"
echo "     AND NOT labels in (Checkmarx, SCA, bitsight, automation, SAST, DAST)"
echo "     AND statusCategory != Done"
echo ""
