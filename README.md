# Finance Data Processing & Access Control Backend

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://fintechapi-production.up.railway.app/health)
[![API Docs](https://img.shields.io/badge/API-Docs-blue)](https://fintechapi-production.up.railway.app/api/docs)

A production-ready REST API for a Finance Dashboard system featuring role-based access control (RBAC), financial record management, and aggregated analytics.

---

## 🚀 Live Links
- **API Health Check:** [https://fintechapi-production.up.railway.app/health](https://fintechapi-production.up.railway.app/health)
- **Interactive Swagger Docs:** [https://fintechapi-production.up.railway.app/api/docs](https://fintechapi-production.up.railway.app/api/docs)

---

## 🛠️ Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Language** | TypeScript + Node.js | Provides robust type safety and industry-standard performance. |
| **Framework** | Express.js | Lightweight and flexible middleware model for clean RBAC implementation. |
| **Database** | PostgreSQL (Production) / SQLite (Local) | Reliable relational storage managed via Prisma ORM. |
| **ORM** | Prisma | Type-safe database queries and automated schema migrations. |
| **Auth** | JWT (JSON Web Tokens) | Stateless authentication with role-based payload. |
| **Validation** | Zod | Schema-first validation for all API inputs and environment variables. |
| **Docs** | Swagger (OpenAPI 3.0) | Auto-generated interactive documentation for easy testing. |
| **Testing** | Jest + Supertest | Full integration testing suite with 30+ passing tests. |

---

## ⚙️ How it Works (Project Architecture)

The application follows a modular architecture organized by feature sets:

1.  **Middleware Layer:**
    *   `auth.ts`: Verifies JWT tokens and attaches user details to requests.
    *   `rbac.ts`: A higher-order function that restricts access based on user roles (`ADMIN`, `ANALYST`, `VIEWER`).
    *   `validate.ts`: Intercepts requests and validates the `req.body` against Zod schemas before reaching controllers.
    *   `errorHandler.ts`: A centralized error handler that catches all exceptions (including Prisma database errors) and returns consistent JSON responses.

2.  **Module Layer (Auth, Users, Records, Dashboard):**
    *   Each module contains its own **Routes**, **Controller**, and **Schema**.
    *   **Controllers** handle the business logic, interacting with the database through the Prisma singleton.
    *   **Schemas** define the data requirements for creates/updates.

3.  **Data Layer:**
    *   Uses **Prisma** as the abstraction layer. 
    *   Implements **Soft Deletes** for financial records—data is never permanently removed, ensuring audit trails are preserved.

---

## 🔑 Role Model & Permissions

| Role | Permissions |
|---|---|
| **VIEWER** | Can view their own profile and read all financial records. Cannot see analytics or edit data. |
| **ANALYST** | Includes all VIEWER permissions + access to all Dashboard Analytics (Summary, Trends, Categories). |
| **ADMIN** | Full access: User management (role/status updates), full CRUD on financial records, and analytics. |

---

## 🛠️ Getting Started Locally

### 1. Installation
```bash
git clone https://github.com/Dexter-2005/fintechapi.git
cd fintechapi
npm install
```

### 2. Environment Setup
Create a `.env` file in the root:
```env
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_secret_here"
JWT_EXPIRES_IN="7d"
```

### 3. Database & Run
```bash
npx prisma db push
npm run dev
```

---

## 🧪 Testing
The project includes a robust testing suite. To run tests:
```bash
npm test
```
*Tests use an isolated `test.db` and automatically reset the database state before each suite.*

---

## 📝 Design Decisions & Trade-offs
- **Soft Deletes:** Chose to use an `isDeleted` flag for financial records to prevent accidental data loss and support potential "Undo" features.
- **Stateless Auth:** Used JWT for scalability. While this makes individual token revocation harder, the middleware specifically checks the user's `status` (ACTIVE/INACTIVE) in the DB on every request to mitigate this.
- **Zod over Joi/Class-Validator:** Selected Zod for its superior TypeScript integration and ability to infer types directly from schemas.

---

## 📞 Contact
**Himanshu Chaudhary**  
📧 [pchimanshu02@gmail.com](mailto:pchimanshu02@gmail.com)
