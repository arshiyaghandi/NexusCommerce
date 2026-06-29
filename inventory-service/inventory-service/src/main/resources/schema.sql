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

-- Idempotency ledger for Saga compensations. The primary key on order_id is the
-- atomic dedup gate: a redelivered payment.failed event fails to insert a second
-- row, so stock is released exactly once.
CREATE TABLE IF NOT EXISTS processed_compensations (
    order_id     BIGINT PRIMARY KEY,
    processed_at TIMESTAMP NOT NULL DEFAULT now()
);
