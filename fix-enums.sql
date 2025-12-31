-- Fix OrderStatus enum by adding new values
-- Run this in your PostgreSQL database

-- Add new status values to the enum
ALTER TYPE orders_status_enum ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE orders_status_enum ADD VALUE IF NOT EXISTS 'PLACED';
ALTER TYPE orders_status_enum ADD VALUE IF NOT EXISTS 'VOIDED';
ALTER TYPE orders_status_enum ADD VALUE IF NOT EXISTS 'HELD';
ALTER TYPE orders_status_enum ADD VALUE IF NOT EXISTS 'READY';

-- Note: PostgreSQL doesn't support removing enum values easily
-- If you need to remove old values, you'd need to recreate the enum
-- But keeping old values is fine for backward compatibility

-- Verify the enum values
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'orders_status_enum'::regtype ORDER BY enumsortorder;
