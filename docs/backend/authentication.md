# AppOS Identity Backend Architecture

This document describes the design, schema, and API structure of the AppOS Identity & Access Management backend.

---

## 1. Database Model (Unified Dual-Engine Schema)

The database persistent layer is structured in `src/lib/db.ts` using parameterized methods. It supports dual-engine transparent routing: falling back to secure, structured JSON file persistence if no active Cloud PostgreSQL instance is connected, ensuring development and staging reliability.

### Unified Tables:
1. **Users Table (`users`)**
   * `id`: VARCHAR(36), PRIMARY KEY. Secure `usr_` prefix followed by UUIDv4.
   * `email`: VARCHAR(254), UNIQUE, INDEX. Normalized email address.
   * `password_hash`: VARCHAR(255). Cryptographically secure hash computed via `bcryptjs` (salt factor: 12).
   * `email_verified_at`: TIMESTAMP, NULLABLE. Set when email verification finishes.
   * `google_id` & `google_linked`: Metadata tracking Google OAuth mapping.
   * `created_at` & `updated_at`: UTC timestamps.

2. **Verification & Reset Tokens Table**
   * `token_hash`: SHA-256 secure hash.
   * `user_id`: VARCHAR(36) referencing `users.id`.
   * `type`: One of `verification` or `password_reset`.
   * `expires_at`: Validity bounds (24-hour TTL).

3. **Audit Logs Table**
   * `event_type`: Security logs (`signup_success`, `login_failure`, `account_linked`, `verification_resent`).

---

## 2. API Endpoints

### Signup Endpoint (`POST /api/auth/signup`)
1. **Bot Trap**: Rejects immediately if the `website_url_honeypot` field contains any characters.
2. **Sanitization**: Trims whitespace and normalizes the email address to lowercase.
3. **Multi-Layer Validation**: Checks syntax regex and performs domain validation. Rejects common domain typos.
4. **Uniqueness Check**: Queries existing emails. If found, returns generic `Unable to create account. Please check your details.` to prevent scanning.
5. **Hash & Insert**: Hashes the password via `bcryptjs` and inserts the user.
6. **Token Generation**: Generates verification tokens and outputs them safely.

### Login Endpoint (`POST /api/auth/login`)
1. **Credentials Matching**: Compares submitted passwords against the hashed password via `bcryptjs.compareSync`.
2. **Verification State Check**: If `email_verified_at` is null, returns a payload indicating email verification is still pending.
3. **Session Cookie Initialization**: Generates a secure session token and signs the HTTP response.

### Google OAuth Handler (`GET /api/auth/google/url`)
* Generates the secure redirect URI with matching parameters (client id, redirect uri, and scope).
* Opens popup authentication windows.

### Google OAuth Callback Handler (`GET /auth/callback`)
* Receives verification code parameters.
* Validates codes against OAuth providers.
* If the OAuth email already exists as a password-based tenant: **prevents silent merges**. Returns a postMessage configuration containing `OAUTH_CONFLICT` to ask for password confirmation before linking.

### Secure Account Linking Endpoint (`POST /api/auth/google/link`)
* Validates existing local password credentials.
* On successful confirmation, updates database profile to link Google OAuth login identities.

---

## 3. Email Verification Process

### Lifecycle Transition
```
Signup -> Verification Pending -> Verification Email Dispatched -> Click Callback -> Verified Active
```

1. **Dispatched Link**: Binds to `GET /api/auth/verify?token=<raw_token>`.
2. **Hash & Match**: The endpoint hashes the parameter via SHA-256, matches the database records, validates token expiration bounds, and marks the user as verified.
