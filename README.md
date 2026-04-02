# Finance Data Processing & Access Control Backend

A production-ready REST API for a Finance Dashboard system featuring role-based access control, financial record management, and aggregated analytics.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Language | TypeScript + Node.js | Type safety, industry standard |
| Framework | Express.js | Lightweight, clean middleware model |
| Database (local) | SQLite via Prisma | Zero setup, fully relational |
| Database (prod) | PostgreSQL | Scalable, Railway free tier |
| Auth | JWT (stateless) | No external service required |
| Validation | Zod | Schema-first, great error messages |
| Docs | Swagger UI | Interactive, auto-generated from JSDoc |
| Testing | Jest + Supertest | Integration-level coverage |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 8

### Installation

```bash
# Clone the repo
git clone <your-repo-url>
cd backendassignment

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | Prisma DB connection string | `file:./dev.db` (SQLite) |
| `JWT_SECRET` | Secret key for JWT signing | *(must be set)* |
| `JWT_EXPIRES_IN` | JWT expiration duration | `7d` |

For local development, the default SQLite URL requires no setup.
For production (Railway), set `DATABASE_URL` to your PostgreSQL URL and change `prisma/schema.prisma` provider to `"postgresql"`.

### Database Setup

```bash
# Push schema to local SQLite (dev)
npm run db:push

# Or run migrations
npm run db:migrate
```

### Run the Server

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

The API will be available at `http://localhost:3000`.
Swagger UI docs at `http://localhost:3000/api/docs`.

---

## Role Model

| Role | Permissions |
|---|---|
| `VIEWER` | View own profile, read all financial records |
| `ANALYST` | Everything VIEWER can do + access all dashboard analytics |
| `ADMIN` | Full access: user management, create/update/delete records |

> **Assumption**: All roles can call `GET /api/records` and `GET /api/records/:id`. Dashboard analytics (`/api/dashboard/*`) requires ANALYST or ADMIN. All write operations on records require ADMIN.

---

## API Overview

### Authentication
> Public endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user (role defaults to VIEWER) |
| POST | `/api/auth/login` | Login — returns JWT token |

### User Management
> Requires: `ADMIN` role
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/:id/role` | Update user role |
| PATCH | `/api/users/:id/status` | Activate/deactivate user |
| DELETE | `/api/users/:id` | Delete user |

### Financial Records
> Read: all authenticated users | Write: ADMIN only
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/records` | Create a financial record |
| GET | `/api/records` | List records (filters + pagination) |
| GET | `/api/records/:id` | Get single record |
| PATCH | `/api/records/:id` | Update a record |
| DELETE | `/api/records/:id` | Soft delete a record |

**GET /api/records query params:**
- `type=INCOME\|EXPENSE`
- `category=...`
- `startDate=2024-01-01&endDate=2024-12-31`
- `page=1&limit=10`

### Dashboard Analytics
> Requires: `ANALYST` or `ADMIN` role
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Total income, expenses, net balance |
| GET | `/api/dashboard/by-category` | Category-level breakdown |
| GET | `/api/dashboard/trends` | Monthly totals (last 12 months) |
| GET | `/api/dashboard/recent` | Last 10 transactions |

---

## Sample Requests & Responses

### Register
```bash
POST /api/auth/register
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "securepassword",
  "role": "ADMIN"
}
```

**Response 201:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully.",
  "data": {
    "user": { "id": "...", "name": "Alice", "email": "alice@example.com", "role": "ADMIN" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Create Record (ADMIN)
```bash
POST /api/records
Authorization: Bearer <token>
{
  "amount": 5000,
  "type": "INCOME",
  "category": "Salary",
  "date": "2024-01-15T00:00:00.000Z",
  "notes": "January salary"
}
```

### Dashboard Summary (ANALYST+)
```bash
GET /api/dashboard/summary
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalIncome": 50000.00,
    "totalExpenses": 18500.00,
    "netBalance": 31500.00,
    "totalTransactions": 23
  }
}
```

---

## Running Tests

```bash
# Run all tests
npm test

# With coverage
npm run test:coverage
```

Tests use a separate `test.db` database with a clean schema reset before each suite. Test files are in `/tests/`.

---

## Deployment (Railway)

1. Push to GitHub
2. Create a new Railway project → connect your repo
3. Add **PostgreSQL** plugin to the project
4. Set environment variables:
   - `JWT_SECRET` (generate a strong secret)
   - `DATABASE_URL` is auto-injected by Railway
5. Change `prisma/schema.prisma` `provider` from `"sqlite"` to `"postgresql"`
6. Set start command: `npx prisma migrate deploy && npm start`

---

## Design Decisions

- **Soft delete on records**: `isDeleted: true` flag — records are never hard-deleted to preserve audit trails
- **Self-protection**: Admins cannot delete/deactivate/change role on their own account
- **Consistent response envelope**: Every response uses `{ success, statusCode, message, data }` 
- **Centralized error handling**: All errors propagate to the global `errorHandler` — no bare try/catch responses
- **No password in responses**: Explicitly excluded from all user select statements
