# AppOS Relational Database Architecture

This document outlines the database schema design, entity relations, indexes, and version-controlled migration strategy for the AppOS SaaS platform.

## 1. Database Schema Definitions

```
                     +-----------------------+
                     |         users         |
                     +-----------------------+
                     | id (PK)               |
                     | email (Unique)        |
                     | password_hash         |
                     | email_verified_at     |
                     | created_at            |
                     | updated_at            |
                     | last_login_at         |
                     +-----------+-----------+
                                 |
         +-----------------------+-----------------------+
         | (1)                                           | (1)
         v (1..N)                                        v (1..N)
+--------+--------------+                       +--------+--------------+
|      workspaces       |                       |  verification_tokens  |
+-----------------------+                       +-----------------------+
| id (PK)               |                       | id (PK)               |
| owner_id (FK)         |                       | user_id (FK)          |
| name                  |                       | token_hash            |
| industry              |                       | expires_at            |
| created_at            |                       | used                  |
| updated_at            |                       | created_at            |
+--------+--------------+                       +-----------------------+
         |
         +-----------------------+
         | (1)                   | (1)
         v (1..N)                v (1..N)
+--------+--------------++-------+---------------+
|   workspace_members  ||     applications      |
+-----------------------++-----------------------+
| id (PK)               || id (PK)               |
| workspace_id (FK)     || workspace_id (FK)     |
| user_id (FK)          || name                  |
| role                  || website_url           |
| created_at            || status                |
| updated_at            || created_at            |
+-----------------------+| updated_at            |
                         +-------+---------------+
                                 |
                                 | (1)
                                 v (1..N)
                        +--------+--------------+
                        |        assets         |
                        +-----------------------+
                        | id (PK)               |
                        | application_id (FK)   |
                        | cloudinary_url        |
                        | asset_type            |
                        | created_at            |
                        +-----------------------+
```

---

## 2. Table Specifications

### Table: `users`
Represents corporate tenants on the AppOS platform.
* `id` (VARCHAR(255), PRIMARY KEY): Cryptographically secure random UUID.
* `email` (VARCHAR(255), UNIQUE, NOT NULL): Normalized lowercase email address.
* `password_hash` (VARCHAR(255), NOT NULL): Secure Bcrypt password hash (Salt factor: 12).
* `email_verified_at` (TIMESTAMP WITH TIME ZONE): Marks registration activation status.
* `created_at` (TIMESTAMP WITH TIME ZONE): Row creation timestamp.
* `updated_at` (TIMESTAMP WITH TIME ZONE): Row modification timestamp.
* `last_login_at` (TIMESTAMP WITH TIME ZONE): Last session hydration timestamp.

### Table: `workspaces`
Encapsulates team limits, role access, and billing metrics.
* `id` (VARCHAR(255), PRIMARY KEY): Custom prefix string (e.g. `ws_a3b2c1`).
* `owner_id` (VARCHAR(255), NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE).
* `name` (VARCHAR(255), NOT NULL): Plain text sanitized name of the business workspace.
* `industry` (VARCHAR(255)): Business category for tailored mobile component layouts.
* `created_at` / `updated_at` (TIMESTAMP WITH TIME ZONE).

### Table: `workspace_members`
Connects multiple users to shared workspaces with role-based policies.
* `id` (VARCHAR(255), PRIMARY KEY).
* `workspace_id` (VARCHAR(255), NOT NULL, REFERENCES `workspaces(id)` ON DELETE CASCADE).
* `user_id` (VARCHAR(255), NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE).
* `role` (VARCHAR(50), NOT NULL, DEFAULT `'member'`): Access bounds (`owner`, `admin`, `member`, `viewer`).
* Unique Constraint: `(workspace_id, user_id)` (A user cannot join the same workspace twice).

### Table: `applications`
Native build manifests converted from website targets.
* `id` (VARCHAR(255), PRIMARY KEY).
* `workspace_id` (VARCHAR(255), NOT NULL, REFERENCES `workspaces(id)` ON DELETE CASCADE).
* `name` (VARCHAR(255), NOT NULL): Target app title.
* `website_url` (TEXT, NOT NULL): Live source domain for native wrappers.
* `status` (VARCHAR(50), NOT NULL, DEFAULT `'pending'`): Compilation state (`pending`, `analyzing`, `generated`, `failed`).

### Table: `assets`
Contains references to media stored securely on Cloudinary.
* `id` (VARCHAR(255), PRIMARY KEY).
* `application_id` (VARCHAR(255), NOT NULL, REFERENCES `applications(id)` ON DELETE CASCADE).
* `cloudinary_url` (TEXT, NOT NULL): Direct secure CDN link to the asset.
* `asset_type` (VARCHAR(100), NOT NULL): Identifies asset usage (`logo`, `screenshot`, `icon`, `splash`).

---

## 3. Database Migration Strategy

AppOS implements a strict **version-controlled, schema-first SQL migration framework** to guarantee clean rollouts and rolling-back of production database tables.

### Rule 1: Every Change is Version-Controlled
All database changes must be represented by a sequential SQL migration file created under the `/migrations/` directory.
* Format: `[four-digit-index]_[short_descriptive_name].sql`
* Example: `/migrations/0001_initial_schema.sql`

### Rule 2: SQL Files are Immutable
Once a migration file is committed to the main production repository, it **must never be edited**. Any modification to existing columns or additional indices must be done by committing a *new* migration file.

### Rule 3: Zero-Downtime Schema Modifications
To prevent downtime during rapid application deployments on Render:
1. **Adding columns**: Columns should be nullable or carry default values so existing application pods continue to operate during transition stages.
2. **Renaming columns**: Implement a two-step release (Deploy DB change with fallback -> deploy code change -> remove legacy DB column).
