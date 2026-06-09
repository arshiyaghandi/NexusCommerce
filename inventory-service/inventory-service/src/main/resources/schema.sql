CREATE TABLE IF NOT EXISTS t_inventory (
    id BIGSERIAL PRIMARY KEY,
    sku_code VARCHAR(255) NOT NULL UNIQUE,
    quantity INTEGER NOT NULL
);

INSERT INTO t_inventory (sku_code, quantity)
VALUES ('SKU001', 100),
       ('SKU002', 50),
       ('SKU003', 25)
ON CONFLICT (sku_code) DO NOTHING;
