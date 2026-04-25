# Example: Postgres → pie chart

Render a donut pie of revenue-by-region from a PostgreSQL database.

## What this shows

`xviz query` connects to Postgres, runs an aggregation, and pipes the
result straight into the renderer. No intermediate file, no Python,
no Superset.

![Output](./chart.png)

## Run it

### 1. Start a local Postgres (Docker)

```bash
docker run --rm -d \
  --name xviz-pg-demo \
  -e POSTGRES_PASSWORD=demo \
  -p 5432:5432 \
  postgres:16
```

### 2. Load the schema and seed data

```bash
PGPASSWORD=demo psql -h localhost -U postgres \
  -f schema.sql -f seed.sql
```

### 3. Install the CLI and the Postgres driver

```bash
npm i -g xviz-cli
npm i -g pg            # peer driver for the postgres:// URL
```

(The `pg` install only needs to be done once per machine — `xviz-cli`
uses it dynamically, so it's listed under `optionalDependencies`.)

### 4. Render

```bash
xviz query \
  --db 'postgres://postgres:demo@localhost:5432/postgres' \
  --sql 'SELECT customer_region, SUM(revenue) AS revenue FROM orders GROUP BY 1' \
  -f form.json \
  -o chart.png \
  --width 700 --height 500
```

Open `chart.png` — the donut you see in this folder is exactly what
gets produced.

## Cleanup

```bash
docker stop xviz-pg-demo
```

## Notes

- The same recipe works for MySQL (`--db 'mysql://user:pass@host:3306/db'`) — install the `mysql2` driver instead of `pg`.
- Want a bar chart instead? Swap `form.json` for one of the bar-shaped forms in `examples/bar-form.json`.
