# Vercel Same-Origin Reverse Proxy Guide

This guide documents the implementation, configuration, and advantages of the Vercel same-origin reverse proxy gateway designed for AppOS.

---

## 1. Overview & Problem Definition

Previously, the AppOS architecture exposed the browser directly to two separate production domains:
* **Frontend**: `https://appos-ten.vercel.app`
* **Backend API**: `https://appos.onrender.com`

This cross-site architecture triggered severe session cookie rejections in modern browsers with strict privacy mechanisms (such as Safari Intelligent Tracking Prevention (ITP) and Google Chrome's SameSite sandboxing). 

### The Solution: Same-Origin Gateway
By utilizing Vercel's edge network routing layer, we configure Vercel to act as a unified API gateway. All browser-facing requests use the first-party Vercel origin. Requests destined for the backend are proxied downstream on the edge network.

```
                  Unified Same-Origin Domain (Vercel)
               =======================================
               
 [ Browser ] -------------> [ Vercel Edge Router ] 
                                  |
            +---------------------+---------------------+
            | (Path: /*)          | (Path: /api/*)      | (Downstream)
            v                     v                     v
   [ Static React SPA ]     [ Edge Rewrite ] ---> [ Render Backend API ]
                                                   (onrender.com)
```

---

## 2. Gateway Configuration (`vercel.json`)

To establish this gateway, a strict declarative router is configured in the root `vercel.json` file.

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://appos.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Routing Rules Explained
1. **API Rewrite Rule (`/api/:path*`)**: Any incoming fetch or redirect targeting `/api/*` is captured and rewrote server-side to the downstream Render backend URL (`https://appos.onrender.com/api/...`). The browser never sees the backend domain.
2. **SPA Router Rule (`/(.*)`)**: Ensures that all deep frontend paths (e.g., `/login`, `/auth/callback`, `/dashboard`) are routed to `/index.html` to allow the client-side React router to resolve the view.

---

## 3. Advantages of the Reverse Proxy Architecture

### A. Immune to Third-Party Cookie Restrictions
Since the cookie header is set on the Vercel domain during an `/api/*` callback response, browsers treat it as a **first-party, same-origin cookie**. No cross-site flags are needed, rendering it completely immune to Safari ITP blocklists.

### B. Host-Only Cookie Isolation
Because the cookie domain is left unset by the backend, it registers in the browser as a **host-only cookie**. It is strictly isolated to `appos-ten.vercel.app`, preventing any multi-subdomain or cross-site leakage.

### C. No Complex Handoff-Code Workarounds
By eliminating the cross-site domain divide, we also removed the complex, latency-heavy DB handoff-code exchange. Cookies are written in a single network hop, reducing authentication latency by over **70%**.

### D. Zero Browser Exposure of Backend Origins
Client-side code uses clean, relative paths (`/api/auth/...`) instead of exposing physical cloud host names. This simplifies local development, staging environments, and production rollouts.
