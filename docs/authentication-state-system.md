# AppOS State-Based Authentication & Error Architecture

This document describes the design philosophy, state machines, UX requirements, and transition behaviors of the AppOS same-origin authentication and callback views.

---

## 1. UX Design Philosophy

To deliver an absolute enterprise-grade experience, AppOS adheres to **Defensive Design Patterns**:
- **Zero Raw Exceptions**: The client or backend will never output blank pages, raw SQL strings, stack traces, Vercel 404s, or Render HTML error pages.
- **Micro-Animations**: Uses staggered entrance motions from `motion/react` to transition users naturally across authentication states.
- **Clean Negative Space**: Promotes focus during verification or recovery states through minimal, typography-driven layouts.

---

## 2. Google OAuth Callback State Machine

The callback view (`/auth/callback`) operates as a strict state machine to prevent endless spinners or raw technical logs.

```
       [Idle]
         |
         v
  [Checking Session] <----+ (One-time network retry)
         |                |
         +----------------+
         | (Success)      | (Timeout after 8s / Error)
         v                v
  [Authenticated]     [Error View]
```

### State Machine Lifecycle
* **`idle`**: Page loaded. Ref guards prevent duplicate duplicate checking on React 18 strict mode mount.
* **`checking_session`**: Outbound same-origin session liveness verification triggers.
* **`authenticated`**: User session validated. Smooth transition redirects to the workspace dashboard.
* **`unauthenticated`**: Explicitly unauthenticated. Clean redirection back to the login view.
* **`error`**: Displays user-friendly assistance screens, offering secure manual fallback links.

### Critical Safety Guards
1. **8-Second Timeout**: If the check takes longer than 8 seconds, the UI automatically transitions to the `error` state.
2. **Deterministic Network Retry**: Network/5xx failures are allowed exactly one retry attempt to mitigate transient cloud network routing issues.
3. **No Slop**: Avoids displaying endless spinners, technical console metrics, port numbers, or raw backend hostnames.

---

## 3. Email Submission Button Experience

All form-based action controls implement immediate visual feedback and prevent multiple clicks.

### Dynamic Mode Labels
* **Sign In**: Displays **Signing in…** during loading.
* **Create Account**: Displays **Creating account…** during loading.
* **Forgot Password**: Displays **Sending reset link…** during loading.
* **Reset Password**: Displays **Updating password…** during loading.

### Button Requirements
1. **Aria Busy**: Adds `aria-busy="true"` on the HTML element during async processes.
2. **Layout Preservation**: Button width, height, and paddings are strictly preserved (`min-h-[44px]`) to completely avoid visual jumps or container layout shift.
3. **Restrained Inline Spinner**: Uses exactly one small inline loader spinner next to the descriptive loading text.

---

## 4. Human-Readable Error Resolution

In accordance with strict application security policies, technical exceptions are translated into clear, helpful, and secure human-readable messages.

| Cause | User-Facing Text |
| :--- | :--- |
| **400 Validation** | Show field-level validation (or general message). |
| **401 Unauthorized** | Credentials were not accepted. |
| **409 Duplicate Account** | Unable to create this account. Try signing in instead. |
| **429 Rate Limit** | Too many attempts. Please wait before trying again. |
| **500 Internal Error** | AppOS could not complete the request. |
| **502/503 Gateway Error** | AppOS is temporarily unavailable. |
| **Fetch/Network Failure** | We could not reach AppOS. Check your connection and try again. |
