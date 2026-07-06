CREATE TABLE IF NOT EXISTS orders (
    id          BIGSERIAL PRIMARY KEY,
    user_id     VARCHAR(255) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status      VARCHAR(50) NOT NULL,
    created_at  TIMESTAMP NOT NULL,
    updated_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_lines (
    id          BIGSERIAL PRIMARY KEY,
    order_id    BIGINT NOT NULL REFERENCES orders(id),
    product_id  BIGINT NOT NULL,
    quantity    INT NOT NULL,
    unit_price  DECIMAL(10, 2) NOT NULL
);
