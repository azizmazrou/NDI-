-- Migration: Remove organization references and update schema
-- Date: 2026-01-03
-- Description: Updates schema for single-organization model

-- ============================================================================
-- Step 1: Remove foreign key constraints
-- ============================================================================

-- Remove organization_id foreign key from assessments
ALTER TABLE "public"."assessments"
DROP CONSTRAINT IF EXISTS "assessments_organization_id_fkey";

-- ============================================================================
-- Step 2: Modify assessments table
-- ============================================================================

-- Drop organization_id column (no longer needed - single org model)
ALTER TABLE "public"."assessments"
DROP COLUMN IF EXISTS "organization_id";

-- Change current_score from int4 to float
ALTER TABLE "public"."assessments"
ALTER COLUMN "current_score" TYPE float USING current_score::float;

-- Add maturity_score column
ALTER TABLE "public"."assessments"
ADD COLUMN IF NOT EXISTS "maturity_score" float;

-- Add compliance_score column
ALTER TABLE "public"."assessments"
ADD COLUMN IF NOT EXISTS "compliance_score" float;

-- ============================================================================
-- Step 3: Modify users table
-- ============================================================================

-- Drop organization_id column from users (no longer needed)
ALTER TABLE "public"."users"
DROP COLUMN IF EXISTS "organization_id";

-- Add missing columns to users
ALTER TABLE "public"."users"
ADD COLUMN IF NOT EXISTS "department_en" varchar(255);

ALTER TABLE "public"."users"
ADD COLUMN IF NOT EXISTS "department_ar" varchar(255);

ALTER TABLE "public"."users"
ADD COLUMN IF NOT EXISTS "job_title_en" varchar(255);

ALTER TABLE "public"."users"
ADD COLUMN IF NOT EXISTS "job_title_ar" varchar(255);

ALTER TABLE "public"."users"
ADD COLUMN IF NOT EXISTS "phone" varchar(50);

-- ============================================================================
-- Step 4: Ensure organization_settings has default record
-- ============================================================================

INSERT INTO "public"."organization_settings" (id, name_en, name_ar)
SELECT 1, 'Organization Name', 'اسم الجهة'
WHERE NOT EXISTS (SELECT 1 FROM "public"."organization_settings" WHERE id = 1);

-- ============================================================================
-- Done!
-- ============================================================================
