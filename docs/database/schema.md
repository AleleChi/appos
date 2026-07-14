# AppOS Database Schema Specifications

This document outlines the detailed user schema structure, database authentication fields, and Google authentication lifecycle for the AppOS SaaS platform.

---

## 1. Users Table Structure

The `users` table holds the principal user identity and authentication records. Below is the full specification of the `users` table structure containing password authentication fields and the newly migrated Google OAuth integration fields:

| Column Name | Data Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(255)` | `PRIMARY KEY` | Cryptographically secure random unique user identifier (e.g. `usr_...`). |
| `email` | `VARCHAR(255)` | `UNIQUE`, `NOT NULL` | Normalized lowercase email address. |
| `password_hash` | `VARCHAR(255)` | `NULLABLE` | Secure Bcrypt password hash. Set to `NULL` for pure OAuth users. |
| `provider` | `VARCHAR(50)` | `DEFAULT 'email'` | Identity provider used (`email`, `google`). |
| `provider_id` | `VARCHAR(255)` | `NULLABLE` | The unique subject ID returned by Google OAuth (`sub`). |
| `provider_email` | `VARCHAR(255)` | `NULLABLE` | Verified email address returned by the Google identity provider. |
| `email_verified` | `BOOLEAN` | `DEFAULT FALSE` | High-level boolean indicating if user identity has been verified. |
| `email_verified_at`| `VARCHAR(255)` | `NULLABLE` | Explicit ISO timestamp representing activation or Google OAuth signup. |
| `created_at` | `VARCHAR(255)` | `NOT NULL` | ISO timestamp of record creation. |
| `updated_at` | `VARCHAR(255)` | `NOT NULL` | ISO timestamp of last update. |
| `last_login_at` | `VARCHAR(255)` | `NULLABLE` | ISO timestamp of the last session hydration. |
| `name` | `VARCHAR(255)` | `NULLABLE` | Full name parsed from email or Google OAuth profile metadata. |
| `profile_image` | `TEXT` | `NULLABLE` | Secure URL linking to the user avatar (e.g., Google user info picture). |

---

## 2. Authentication Fields Specification

### Password Authentication Fields
* **`email`**: The primary login username. Must be normalized via low-casing and trimmed of spaces before queries.
* **`password_hash`**: Computed using high-entropy Bcrypt hash algorithms. Checked securely using secure password verifiers during standard sign-in. For Google OAuth signups, this remains `NULL` to prevent unauthorized credential hijacking.

### Google Authentication Fields
* **`provider`**: Set to `'google'` to identify Google OAuth account linkages.
* **`provider_id`**: Stores the Google account's unique `sub` attribute, guaranteeing durable client identity tracking.
* **`provider_email`**: Caches Google's returned user email to verify ownership.
* **`email_verified`**: Checked and set to `true` on successful Google sign-in since Google accounts require email ownership validation.

---

## 3. Google Authentication Lifecycle

Google OAuth callbacks proceed sequentially through the following 7 stages inside the AppOS backend to ensure absolute transaction security:

```
[User clicks Sign-In] -> [Google Consent] -> [Stage 1: Callback Received]
                                                         |
[Stage 3: Token Exchange] <- [Stage 2: State Validation (Stateless)]
         |
         v
[Stage 4: Profile Retrieval] -> [Stage 5: Database Lookup & Create]
                                             |
[Stage 7: Dashboard Redirect] <- [Stage 6: Session Cookie Generation]
```

### Stage 1: Callback Received
* **Operation**: Endpoint intercepts OAuth callback code and state parameters.
* **Security Check**: Immediately verifies that zero OAuth-level parameters (like user cancellation errors) exist.

### Stage 2: State Validation (Stateless)
* **Strategy**: Express processes callbacks statelessly. Horizontally scaling container instances (on multi-pod clouds like Render) make memory-based state checks fragile. The callback bypasses transient memory checks for resilient, high-availability horizontal scaling.

### Stage 3: Google Token Exchange
* **Operation**: Swaps Google code for authorization tokens via secure `POST https://oauth2.googleapis.com/token`.
* **Details**: Explicitly registers and matches target `client_id`, `client_secret`, and `redirect_uri` variables.

### Stage 4: Google Profile Retrieval
* **Operation**: Contacts Google userinfo endpoint to verify `sub`, `email`, `name`, and `picture` attributes.

### Stage 5: Database User Lookup & Create
* **Scenario A (New Google User)**: Inserts user with `provider_id` (`sub`), `provider_email`, `email_verified = true`, `profile_image`, and a null password hash.
* **Scenario B (Existing Password User)**: Detects email conflicts and prevents silent mergers. Directs user securely to the verification page to link accounts.
* **Scenario C (Existing Google User)**: Locates matching `provider_id` and logs the session.

### Stage 6: Session Cookie Generation
* **Attributes**: Sets secure session identifier cookie `session_id`:
  * `HttpOnly = true`
  * `Secure = true`
  * `SameSite = None`
  * `maxAge = 7 days`

### Stage 7: Destination Redirection
* **Operation**: Performs an absolute redirection targeting `${FRONTEND_URL}/dashboard` or passes success messages to parent windows on popup modes.
