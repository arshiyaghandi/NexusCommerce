CREATE TABLE IF NOT EXISTS t_orders (
                                        id BIGSERIAL PRIMARY KEY,
                                        order_number VARCHAR(255) NOT NULL,
    sku_code VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL
    );