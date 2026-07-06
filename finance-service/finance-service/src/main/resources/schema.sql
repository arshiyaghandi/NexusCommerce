-- Ledger of financial transactions. The UNIQUE constraint on order_id enforces the
-- one-to-one relationship between an order and its payment transaction at the DB level:
-- because order↔payment↔transaction is 1:1, the column is a natural dedup key and a
-- redelivered PaymentCompletedEvent cannot insert a second ledger row.
-- NOTE: this schema is applied by a ConnectionFactoryInitializer guarded by @Profile("!test")
-- and uses CREATE TABLE IF NOT EXISTS, so the UNIQUE constraint takes effect only on a
-- fresh database. Existing environments must add it manually: ALTER TABLE transactions ADD CONSTRAINT transactions_order_id_key UNIQUE (order_id);
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    user_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

-- Idempotency ledger for processed payment events. The primary key on order_id is the
-- atomic dedup gate: a redelivered PaymentCompletedEvent (Kafka at-least-once) fails to
-- insert a second row, so the transaction is recorded exactly once. Mirrors the
-- processed_compensations pattern used by inventory-service.
CREATE TABLE IF NOT EXISTS processed_payments (
    order_id     BIGINT PRIMARY KEY,
    processed_at TIMESTAMP NOT NULL DEFAULT now()
);
