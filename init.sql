-- PostgreSQL-compatible database initialization
-- This script runs once when the Postgres container is first created.

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'keycloak_db') THEN
        PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE keycloak_db');
    END IF;
END
$$;

-- The remaining databases are created using a simpler approach:
-- PostgreSQL's initdb scripts run as superuser, so we use a
-- conditional CREATE via psql \gexec (handled by the shell wrapper below).

SELECT 'CREATE DATABASE order_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'order_db')\gexec
SELECT 'CREATE DATABASE inventory_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'inventory_db')\gexec
SELECT 'CREATE DATABASE payment_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'payment_db')\gexec
SELECT 'CREATE DATABASE finance_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'finance_db')\gexec
SELECT 'CREATE DATABASE product_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'product_db')\gexec
