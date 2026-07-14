# Google OAuth 2.0 Integration & Same-Origin Proxy Security Guide

This document describes the design, configuration, and security of the same-origin backend-directed Google OAuth 2.0 flow implemented for AppOS using the Vercel Reverse Proxy architecture.

---

## 1. OAuth Architecture (Same-Origin Proxy)

AppOS uses a secure, same-origin, backend-directed OAuth 2.0 flow to authenticate users using their Google accounts. The browser is never exposed to the cross-site Render API domain directly, which prevents cookie blocking issues in modern privacy-focused browsers.

```
+---------+               +--------------------+               +-------------------+              +---------------+
| Browser |               | Vercel Proxy (BFF) |               | Render Backend    |              | Google OAuth  |
+----+----+               +---------+----------+               +---------+---------+              +-------+-------+
     |                              |                                    |                                |
     | GET /api/auth/google         |                                    |                                |
     +----------------------------->|                                    |                                |
     |                              | Rewrite /api/* -> onrender.com     |                                |
     |                              +----------------------------------->|                                |
     |                              |                                    | Redirect to Google Consent     |
     |<------------------------------------------------------------------+                                |
     |                                                                                                    |
     | Google Consent Screen Interaction                                                                  |
     +--------------------------------------------------------------------------------------------------->|
     |                                                                                                    |
     | Authorization Callback with Code                                                                   |
     |<---------------------------------------------------------------------------------------------------+
     |                                                                                                    |
     | GET /api/auth/google/callback?code=xyz                                                             |
     +----------------------------->|                                                                     |
     |                              | Rewrite /api/* -> onrender.com     |                                |
     |                              +----------------------------------->|                                |
     |                              |                                    | POST /token (Exchange Code)    |
     |                              |                                    +------------------------------->|
     |                              |                                    |<-------------------------------+
     |                              |                                    | Token Response                 |
     |                              |                                    |                                |
     |                              |                                    | GET /userinfo (Fetch Profile)  |
     |                              |                                    +------------------------------->|
     |                              |                                    |<-------------------------------+
     |                              |                                    | Profile (Email, ID, Image)     |
     |                              |                                    |                                |
     |                              |                                    | [DB validation / linking]      |
     |                              |                                    |                                |
     |                              | Set Host-Only HttpOnly Cookie      |                                |
     |                              | (SameSite=Lax, Secure, Path=/)     |                                |
     |<-----------------------------+------------------------------------+                                |
     |                                                                                                    |
```

### Flow Walkthrough
1. **Redirection Initiate (`GET /api/auth/google`)**: The Google button on the AppOS frontend triggers a location redirect to `/api/auth/google`. The Vercel proxy rewrites this to the Render backend, which constructs the Google OAuth authorization URL.
2. **Google Consent Screen**: The user authenticates with Google and approves permissions.
3. **Authorization Callback (`GET /api/auth/google/callback`)**: Google redirects the browser to the callback URL on Vercel: `https://appos-ten.vercel.app/api/auth/google/callback`.
4. **Token Exchange**: The Vercel proxy routes the request to Render, which exchanges the authorization code for tokens and fetches the Google user profile.
5. **Session Initiation**: The backend performs account resolution, sets an `HttpOnly`, `Secure`, `SameSite=Lax` session cookie, and issues a 302 redirect sending the user to `/auth/callback?status=success` on the Vercel origin.

---

## 2. Google Cloud Console Configuration

To enable Google Sign-In, the client application must be configured in the [Google Cloud Console](https://console.cloud.google.com/).

### Credentials Configuration

1. Go to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. Select **Web application** as the application type.
4. Configure the following URIs:

#### Authorized JavaScript Origins
* **Development (Local)**: `http://localhost:3000`
* **Production**: `https://appos-ten.vercel.app`

#### Authorized Redirect URIs
These are the callback endpoints to which Google is allowed to send authorization codes:
* **Production**: `https://appos-ten.vercel.app/api/auth/google/callback`
* **Development**: `http://localhost:3000/api/auth/google/callback`

---

## 3. Environment Variables & Same-Origin Proxy Configuration

Because Vercel acts as the proxy gateway, the browser communicates strictly with Vercel (`https://appos-ten.vercel.app`). No cross-site or cross-domain issues occur.

### Server-Side Variables (Render Backend)
These environment variables must be configured securely inside your Render service:

```env
PORT="3000"
NODE_ENV="production"
SESSION_SECRET="your-session-secret"
DATABASE_URL="your-postgresql-url"
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
GOOGLE_CALLBACK_URL="https://appos-ten.vercel.app/api/auth/google/callback"
FRONTEND_URL="https://appos-ten.vercel.app"
```

---

## 4. Production OAuth Routing Audit

### A. Routing Map
1. **Frontend Origin (Vercel)**: `https://appos-ten.vercel.app`
2. **Backend Host (Render)**: `https://appos.onrender.com` (Never called directly by browser)
3. **Initiation Action (Button Click)**:
   * **Target**: `/api/auth/google`
   * **Rule**: Always use relative paths; do not hardcode the backend URL.
4. **Backend Redirect Callback**:
   * **Endpoint**: `GET /api/auth/google/callback`
   * **Google Cloud Console Callback URL (`GOOGLE_CALLBACK_URL`)**: `https://appos-ten.vercel.app/api/auth/google/callback`
5. **Success Post-Auth Destination**:
   * **Exact Destination**: `/auth/callback?status=success` (Redirected to Vercel origin by the backend callback)

---

## 5. Account Linking & Security Resolution Rules

To prevent account takeover and email spoofing, AppOS implements rigid linking rules:

### Rule 1: Direct Google Login
If the user clicks "Sign in with Google" and they **already** have an AppOS user record with a matching `provider_id` and `provider = 'google'`:
* Log the user in directly.
* Return a secure `session_id` cookie.

### Rule 2: Email Conflict Check (Security Hardening)
If the user logs in via Google, but their email **already exists** in the database under an `email` (password) account:
* **DO NOT** silently merge or automatically log them in. Doing so opens a critical vulnerability if an attacker gains control over a matching Google email but does not know the account password.
* **Resolution**: The callback responds with a secure redirect or popup message initiating an **Account Linking Handshake**.
* The frontend transitions to the `Secure Account Linking` view (`link-conflict` mode), requesting the existing account's password.
* Once the correct password is provided, the backend links the Google identifier to the user's account by setting `provider = 'google'` and `provider_id = sub` under strict cryptographic verification.

### Rule 3: Direct Registration
If the email and Google ID do not match any existing user record:
* Register a new user record.
* Populate the `name` and `profile_image` fields dynamically from the Google profile payload.
* Mark `email_verified_at` automatically.
* Set the session cookie and redirect to the callback page.

---

## 6. Google AI Studio Sandbox Preview Isolation

The Google AI Studio preview environment runs in a sandboxed iframe. This environment prevents third-party OAuth redirect flows from successfully setting cookies inside the iframe.

To prevent friction, AppOS automatically isolates the sandbox preview from production:
* **Detection**: The frontend checks if it is running inside an iframe or an unsupported sandbox origin.
* **Sandbox Behavior**: When a user clicks "Continue with Google" in the preview pane, it avoids completing OAuth inside the iframe. Instead, it opens the deployed production sign-in page in a new browser tab:
  `https://appos-ten.vercel.app/login?provider=google`
* **Notice Display**: In the preview sandbox, a clear notice and fallback manual link is displayed:
  *“Google sign-in opens in the deployed AppOS application for secure authentication. Open AppOS Sign-In”*
* **Production Handshake**: The top-level tab automatically triggers the redirect to the backend to complete authentication.
