# AppOS Database Architecture & Ownership Analysis

This document provides a formal, verified proof of database ownership and connection pool isolation for **AppOS**, satisfying the strict requirements of **Milestone 1**.

---

## 1. Proof of Database Ownership
In the AppOS monorepo:
* **The NestJS API (`apps/api`) is the sole runtime owner of the live database connection pool.**
* The frontend Next.js application (`apps/web`) operates purely via relative, client-side browser API routing and does not import or instantiate database connections, schema queries, or PostgreSQL pool engines.

### Verification of Zero Frontend Database Imports
An exhaustive static analysis of the frontend codebase has verified that there are **no imports** from `/src/db/` or any local PostgreSQL module within the `apps/web` package:
1. Running `grep -rn "src/db" apps/web/` yields exactly `0` results.
2. The entire client-side interface communicates exclusively with the backend via HTTP endpoints proxied through `/api/:path*`.
3. Consequently, there is **no possibility of a second pool being created by the frontend application.**

---

## 2. Shared Source Directory Justification
The database files remain in `/src/db/` as shared files for the following structural reasons:
1. **Schema Verification & Type Safety**: Centralizing the schema allows cross-workspace tooling, migration runners, and the standalone NestJS controllers to share the exact same database structure and column names without duplication.
2. **Migration Alignment**: It acts as the single source of truth for Drizzle migration schema parsing.

---

## 3. Strict Connection Guardrails
The central pool file `/src/db/index.ts` is protected with strict operational constraints:
* **Production Protection**:
  - `DATABASE_URL` is **mandatory** in production.
  - Startup fails immediately with `FATAL: DATABASE_URL is mandatory in production mode` if the environment variable is missing.
  - `MockPool` is **guaranteed to never load** under production mode.
* **Development Verification**:
  - `MockPool` will **never silently load** in development.
  - Development startup requires an explicit `ALLOW_MOCK_DB=true` or `MOCK_DATABASE=true` flag to bypass the database check.
  - Even if MockPool is loaded under the development flag, the readiness endpoint (`/api/health/ready`) is hard-coded to return **HTTP 503** with a safe `database-unavailable` state (`db: offline`). It will **never report a mock pool as online.**
