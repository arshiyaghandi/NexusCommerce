CREATE TABLE IF NOT EXISTS t_category (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id   BIGINT REFERENCES t_category(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS t_product (
    id          BIGSERIAL PRIMARY KEY,
    sku_code    VARCHAR(255) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    price       DECIMAL(19, 2) NOT NULL,
    category_id BIGINT REFERENCES t_category(id) ON DELETE SET NULL
);

-- Migration safety for existing tables
ALTER TABLE t_product ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES t_category(id) ON DELETE SET NULL;

-- Seed categories
INSERT INTO t_category (id, name, description, parent_id)
VALUES
    (1, 'Electronics',  'Electronic devices and gadgets', NULL),
    (2, 'Fashion',      'Clothing and accessories',       NULL),
    (3, 'Sports',       'Sports and outdoor equipment',   NULL),
    (4, 'Headphones',   'Over-ear, in-ear headphones',    1),
    (5, 'Wearables',    'Smart watches and fitness bands', 1),
    (6, 'Audio',        'Speakers and audio equipment',   1),
    (7, 'Men''s',       'Men''s clothing and accessories', 2),
    (8, 'Women''s',     'Women''s clothing and accessories', 2)
ON CONFLICT DO NOTHING;

-- Re-sync sequence after manual inserts
SELECT setval('t_category_id_seq', (SELECT COALESCE(MAX(id), 1) FROM t_category));

-- Seed products with categories
INSERT INTO t_product (sku_code, name, description, price, category_id)
VALUES ('SKU001', 'Wireless Headphones', 'Noise-cancelling over-ear headphones', 79.99,  4),
       ('SKU002', 'Smart Watch',         'Fitness tracking smart watch',          149.99, 5),
       ('SKU003', 'Portable Speaker',    'Water-resistant Bluetooth speaker',      59.99,  6)
ON CONFLICT (sku_code) DO NOTHING;
