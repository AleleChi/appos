# AppOS Production Neon Database Architecture & Schema Verification

This document specifies the database infrastructure, connection parameters, diagnostics, and resilience strategies implemented for AppOS production data services.

## 1. Connection & Diagnostics Engine

AppOS accesses our distributed **Neon PostgreSQL Server** through a hardened pool driver with built-in telemetry:

- **State Diagnostics (`checkHealth()`)**: Performs continuous liveness probes (`SELECT 1`) to classify connection health, tracking latency, database names, and schema validity.
- **Fail-Safe Recovery**: Employs non-blocking pooling with automated connection retries under failure conditions.

## 2. Production Database Schema State

The core production schema has been verified and fully aligned with standard OAuth and security requirements. 

### Core Table: `users`
Tracks standard identity, login audit parameters, and secure Google OAuth federated fields:

| Column | PostgreSQL Data Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(255)` | `PRIMARY KEY` | Cryptographically secure unique user ID (`usr_...`) |
| `email` | `VARCHAR(255)` | `UNIQUE`, `NOT NULL` | Normalized lowercase registration email |
| `password_hash` | `VARCHAR(255)` | `NULLABLE` | Secure `bcryptjs` hash for credentials (null for OAuth-only users) |
| `name` | `VARCHAR(255)` | `NULLABLE` | Display name synced from profile |
| `profile_image` | `VARCHAR(255)` | `NULLABLE` | Remote avatar URL |
| `provider` | `VARCHAR(50)` | `NULLABLE` | Identity provider name (e.g., `'google'`) |
| `provider_id` | `VARCHAR(255)` | `NULLABLE` | Unique federated provider subject key |
| `provider_email`| `VARCHAR(255)` | `NULLABLE` | Normalized provider-asserted email address |
| `email_verified`| `BOOLEAN` | `DEFAULT FALSE` | Flag signifying email validation status |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | Record last updated timestamp |

### Auxiliary Security Tables
- **`verification_tokens`**: Stores secure cryptographic SHA-256 hashes of verification codes, tracking `expires_at` and `used` flags.
- **`audit_logs`**: Fully isolated security audit tracker capturing `event_type`, `email`, `ip_address`, and detailed session metadata.

## 3. Classifying Database Exceptions

To maintain a secure surface area, raw database queries never bubble up to user-facing layers. Error classification translates driver errors into safe internal identifiers:

```typescript
export function classifyDatabaseError(err: any): { safeCode: string; redirectCode: string } {
  const msg = err?.message || "";
  
  if (msg.includes("ECONNREFUSED") || msg.includes("timeout") || msg.includes("pool")) {
    return { 
      safeCode: "DB_CONNECTION_FAILED", 
      redirectCode: "database_unavailable" 
    };
  }
  if (msg.includes("relation") || msg.includes("column") || msg.includes("type")) {
    return { 
      safeCode: "DB_SCHEMA_MISMATCH", 
      redirectCode: "service_configuration_error" 
    };
  }
  if (msg.includes("violates unique constraint") || msg.includes("duplicate key")) {
    return { 
      safeCode: "DB_CONSTRAINT_VIOLATION", 
      redirectCode: "account_conflict" 
    };
  }
  return { 
    safeCode: "DB_QUERY_EXCEPTION", 
    redirectCode: "unknown_error" 
  };
}
```
This guarantees user sessions end up on highly polished frontend error pages with safe tracking codes instead of raw SQL dump screens.
