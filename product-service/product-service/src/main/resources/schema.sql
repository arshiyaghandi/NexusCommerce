CREATE TABLE IF NOT EXISTS t_product (
    id BIGSERIAL PRIMARY KEY,
    sku_code VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(19, 2) NOT NULL
);

INSERT INTO t_product (sku_code, name, description, price)
VALUES ('SKU001', 'Wireless Headphones', 'Noise-cancelling over-ear headphones', 79.99),
       ('SKU002', 'Smart Watch', 'Fitness tracking smart watch', 149.99),
       ('SKU003', 'Portable Speaker', 'Water-resistant Bluetooth speaker', 59.99)
ON CONFLICT (sku_code) DO NOTHING;
