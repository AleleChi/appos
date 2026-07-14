# AppOS Identity & Access Management Architecture

## Overview
AppOS implements modern identity standards combining email/password flows with social single-sign-on (SSO) helpers. Security guidelines ensure passwords are never transmitted unencrypted or stored locally.

```
+------------------+     (Form Submit)     +-------------------+
|   Signup/Login   | --------------------> |   authService     |
|   (Client UI)    | <-------------------- |   (Bridge Layer)  |
+------------------+     (Auth Result)     +-------------------+
                                                     |
                                                     | (Secure REST API)
                                                     v
                                           +-------------------+
                                           |  POST /api/signup |
                                           +-------------------+
```

## Signup & Authentication Flow
1. **Intake & Local Security**: Inputs are gathered and validated locally on the frontend. Password strength indicators are checked dynamically in-browser.
2. **Service Gateway**: Submissions pass through the intermediate abstract layer `/src/lib/authService.ts`. This acts as an API proxy.
3. **Payload Dispatch**: Dispatches secure JSON payloads to the gateway endpoint (`/api/auth/signup` or `/api/auth/login`).
4. **Session Hydration**: On successful registration, the backend establishes secure HTTP-only cookies (`Secure`, `HttpOnly`, `SameSite=Strict`) to prevent Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF).
5. **Redirect Trigger**: The client listens for the redirect parameter (e.g. `redirectUrl: "/workspace-creation"`) and pushes the application state forward.

## Future API Requirements

### 1. Registration (`POST /api/auth/signup`)
Accepts credentials and returns a session token or triggers verification.
* **Payload Structure**:
  ```typescript
  interface SignupPayload {
    email: string;
    password?: string;
    provider: "email" | "google" | "apple";
  }
  ```

### 2. Session Handshake (`POST /api/auth/login`)
Signs in existing users securely.
* **Payload Structure**:
  ```typescript
  interface LoginPayload {
    email: string;
    password?: string;
  }
  ```

### 3. Password Reset Request (`POST /api/auth/reset-password`)
Sends password reset sequences to specified accounts.

## Redirect Behaviour
* **Standard Verification-Free**: If `verificationRequired` is `false`, the client transitions to the Workspace onboarding sequence (`/workspace-creation` or custom state toggle).
* **Verification-Blocked**: If verification is required, displays an intermediate confirmation OTP screen, sending a magic verification pin to the user's email.
