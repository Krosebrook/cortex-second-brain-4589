-- Drop e-commerce related tables in correct order (due to foreign key constraints)
DROP TABLE IF EXISTS api_key_access_logs CASCADE;
DROP VIEW IF EXISTS api_key_access_stats CASCADE;
DROP TABLE IF EXISTS store_sync_logs CASCADE;
DROP TABLE IF EXISTS synced_inventory CASCADE;
DROP TABLE IF EXISTS synced_customers CASCADE;
DROP TABLE IF EXISTS synced_orders CASCADE;
DROP TABLE IF EXISTS synced_products CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- Drop e-commerce related functions
DROP FUNCTION IF EXISTS log_api_key_access(uuid, text, inet, text, jsonb);
DROP FUNCTION IF EXISTS detect_unusual_api_key_access(uuid, integer, integer);