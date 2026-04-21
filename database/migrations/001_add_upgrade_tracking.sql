-- Migration: Add UTA Upgrade Tracking Columns and Indexes
-- Phase 2: Data Optimization for UTA Upgrade Issues Tracker
-- Date: 2026-04-10

-- Add three new columns for upgrade issue tracking
-- 1. is_upgrade_25: Boolean flag for UTAUPGRADE25 label
ALTER TABLE defects ADD COLUMN is_upgrade_25 BOOLEAN DEFAULT 0;

-- 2. is_upgrade_26: Boolean flag for UTAUPGRADE26 label
ALTER TABLE defects ADD COLUMN is_upgrade_26 BOOLEAN DEFAULT 0;

-- 3. resolution_time_days: Days from creation to resolution (for resolved issues)
ALTER TABLE defects ADD COLUMN resolution_time_days INTEGER DEFAULT NULL;

-- Create indexes for fast filtering on upgrade tracker queries
-- Index 1: Fast lookup of upgrade 25 issues
CREATE INDEX IF NOT EXISTS idx_defects_upgrade_25 ON defects(is_upgrade_25) WHERE is_upgrade_25 = 1;

-- Index 2: Fast lookup of upgrade 26 issues
CREATE INDEX IF NOT EXISTS idx_defects_upgrade_26 ON defects(is_upgrade_26) WHERE is_upgrade_26 = 1;

-- Index 3: Composite index for portfolio team filtering (used for baseline queries)
-- Note: This requires customfield_22500 to be added as a column in future migration
-- For now, we'll rely on raw_json queries with LIKE for portfolio team filtering

-- Migration complete
-- Next steps:
-- 1. Update jira-service.js transformIssue() to populate these fields
-- 2. Run a full sync to backfill existing data
