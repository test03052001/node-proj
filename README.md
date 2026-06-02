# Enterprise Platform Node API

Express + MySQL demo project built from `mysql-schema.sql`. It has a layered structure with routes, controllers, services, repositories, validation, migrations, seed data, and join-heavy reporting endpoints.

## Setup

1. Copy `.env.example` to `.env` and set the required environment variables with runtime-specific values.
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_CONNECTION_LIMIT`
   - `PORT`
   - `ALLOWED_ORIGINS`
2. Install dependencies:

```bash
npm install
```

3. Create the database and tables:

```bash
npm run db:migrate
```

4. Add sample data:

```bash
npm run db:seed
```

5. Start the API:

```bash
npm run dev
```

The API runs on `http://localhost:3000` by default.

For production or containerized deployments, inject these values through environment variables at runtime (for example `docker run -e`, Compose `environment:`, Kubernetes Secrets, or CI variables). Do not bake secrets into images or commit a real `.env` file.

## Main Endpoints

- `GET /api/health`
- `GET /api/users`
- `POST /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `GET /api/users/:id/orders`
- `GET /api/categories`
- `POST /api/categories`
- `GET /api/categories/:id`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/products/:id/orders`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/status`
- `DELETE /api/orders/:id`
- `GET /api/reports/dashboard`
- `GET /api/reports/sales-by-category`
- `GET /api/reports/top-products`
- `GET /api/reports/customer-leaderboard`
- `GET /api/security-demo/dependency`

## Example Order Payload

```json
{
  "userId": 1,
  "status": "PAID",
  "lines": [
    { "productId": 1, "quantity": 2 },
    { "productId": 2, "quantity": 1 }
  ]
}
```

Creating an order is transactional: the service validates the user, checks products, decreases stock, writes order lines, and updates the order total.

## Intentional Vulnerable Dependency

This project intentionally pins `lodash@4.17.20` so tools like `npm audit`, Snyk, Dependabot, or other SCA scanners can report a known vulnerable dependency. It is documented in `docs/security-demo.md`.
