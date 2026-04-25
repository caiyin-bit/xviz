CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  placed_at TIMESTAMP NOT NULL,
  customer_region TEXT NOT NULL,
  product_category TEXT NOT NULL,
  units INTEGER NOT NULL,
  revenue NUMERIC(10, 2) NOT NULL
);
