-- Reset orders tables and enums for development
-- WARNING: This will delete all order data!

-- Drop all orders-related tables (cascade to handle foreign keys)
DROP TABLE IF EXISTS order_refunds CASCADE;
DROP TABLE IF EXISTS order_payments CASCADE;
DROP TABLE IF EXISTS order_item_modifiers CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Drop the old enums
DROP TYPE IF EXISTS orders_status_enum CASCADE;
DROP TYPE IF EXISTS orders_ordertype_enum CASCADE;
DROP TYPE IF EXISTS orders_paymentstatus_enum CASCADE;
DROP TYPE IF EXISTS order_items_kitchenstatus_enum CASCADE;
DROP TYPE IF EXISTS order_payments_method_enum CASCADE;

-- TypeORM will recreate everything with the new schema when you restart the app
