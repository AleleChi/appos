# Legacy Authentication Audit - AppOS

## 1. Overview of Legacy Architecture
The legacy authentication system of AppOS was a split-domain, multi-step backend-for-frontend (BFF) system. It involved:
1. **Vercel Frontend / BFF Routing (`https://appos-ten.vercel.app`)**: Served pages and provided lightweight proxy serverless functions in the `/api/auth` directory.
2. **Render Custom Server Backend (`https://appos.onrender.com`)**: Handled real database reads/writes, OAuth code exchange, custom token issues, and audit logs.
3. **Session Handoff Engine**: Used a custom table `auth_handoff_codes` to safely bridge domains after a Google OAuth callback landed, sending users back and forth with temporary handoff codes.

## 2. Legacy Files and Endpoints Registered
The following endpoints and files were identified as part of the legacy authentication system:

### A. Vercel BFF Endpoints (under `/api/auth/*`):
- `api/auth/signup.ts`: Proxied sign-up requests to Render, receiving user objects.
- `api/auth/login.ts`: Proxied login requests, receiving a session token, and setting an HTTP-only cookie on Vercel.
- `api/auth/me.ts`: Proxied token introspection or session status checks to Render.
- `api/auth/logout.ts`: Deleted the `appos_session` cookie.
- `api/auth/forgot-password.ts`: Proxied forgot password email dispatch triggers.
- `api/auth/reset-password.ts`: Proxied password update payloads.
- `api/auth/resend-verification.ts`: Triggered verification email retries.
- `api/auth/complete.ts`: Processed the final auth handoff, exchanging code for the final Vercel session cookie.

### B. Render Custom Server Paths (`server.ts`):
- `/api/auth/google`: Initiated standard Google auth, generating a state record and redirecting to Google.
- `/api/auth/google/callback`: Handled Google callback, validated state, executed custom token exchange, registered users, and redirected to `/api/auth/complete`.
- `/api/auth/handoff/exchange`: Exchanged temporary handoff codes for a session.
- `/api/auth/test/flow`: Self-testing diagnostic route for custom OAuth state verification.

### C. Frontend Service Layer:
- `src/lib/authService.ts`: Standard client-side helper calling Vercel `/api/auth/*` routes and storing user profiles in React context or state.

## 3. Discovered Vulnerabilities & Operational Risks
- **Cross-site Cookie Issues**: Split-domain configuration (Vercel + Render) required complex `SameSite=None; Secure` cookies, which are frequently blocked by modern browsers.
- **Callback Loop Risks**: The handoff code exchange required multiple redirects, leading to callback loading loops if cookies were rejected.
- **Leaked Simulator Logics**: Developer mode simulators were present in production OAuth callback files, posing severe bypass risks.
- **Fragile State Validations**: Custom state verification required complex database queries and claim locks that easily fell out of sync.

---
**Status: REPLACING WITH BETTER AUTH (Canonical same-origin authentication library)**
