# AppOS Cloud Infrastructure & Service Architecture

This document describes the production cloud architecture for the AppOS SaaS platform, designed for high security, linear scaling, and low latency under peak user loads.

## 1. High-Level Architectural Flow

```
                      +------------------+
                      |    End Users     |
                      +--------+---------+
                               |
                               | (HTTPS / static assets)
                               v
                      +------------------+
                      | Netlify CDN edge |
                      +--------+---------+
                               |
                               | (API Requests)
                               v
                     +--------------------+
                     | Render Backend API |
                     +---------+----------+
                               |
       +-----------------------+-----------------------+
       | (Queries)             | (Signed uploads)      | (Enqueue jobs)
       v                       v                       v
+---------------+      +---------------+      +-------------------+
|     Neon      |      |  Cloudinary   |      |      Render       |
|  PostgreSQL   |      | Media Server  |      | Background Worker |
+---------------+      +---------------+      +-------------------+
```

---

## 2. Service Responsibilities

### Frontend: Netlify CDN Edge
* **Role**: Serves the React SPA static assets close to the user using worldwide CDN edge networks.
* **Benefits**: 
  * Near-zero cold start times.
  * Native secure headers configuration.
  * Staged pull-request previews (Netlify deploy previews) for rapid integration testing.
  * Decoupled server scaling limits the attack surface of the client.

### Backend: Render API Web Service
* **Role**: Runs the secure Express.js API server handling authentication, CRUD operations, background task triggering, and Cloudinary upload signing.
* **Benefits**:
  * Managed TLS termination with automated certificate renewals.
  * Seamless auto-deployments linked directly to git main branch merges.
  * Internal private network addressing for secure database/worker access.
  * Direct health check monitoring (`/api/health`) for zero-downtime rolling updates.

### Database: Neon Serverless PostgreSQL
* **Role**: Acts as the primary relational database storing users, workspaces, applications, assets, and security audit logs.
* **Benefits**:
  * Instant scale-to-zero compute (completely free tier compatible) which scales up seamlessly under load.
  * Branching databases (copy schema and data in seconds) for safe testing on preview environments.
  * Integrated connection pooling to survive high connection spikes.

### Storage: Cloudinary Media Server
* **Role**: Manages all user avatars, workspace logos, platform icons, website screenshots, and static assets.
* **Benefits**:
  * Secure, backend-signed upload requests preventing client-side API key leaks.
  * Dynamic, real-time image optimization, resizing, and format conversions at the CDN level.

### Queue & Background Worker: Render Background Worker
* **Role**: Executes long-running tasks asynchronously (website crawling, security auditing, and native app bundling) without locking API requests.
* **Benefits**:
  * Completely isolated CPU/memory limits preventing compilation memory leaks from crashing the core API.
  * Clean scaleout capabilities to increase concurrent job throughput without redeploying Web Services.

---

## 3. Communication Security Matrix

| Source | Target | Protocol | Description | Security Controls |
| :--- | :--- | :--- | :--- | :--- |
| End User | Netlify | HTTPS (TLS 1.3) | Client rendering & state management | Strict-Transport-Security, CSRF protection |
| Netlify | Render API | HTTPS (TLS 1.3) | Secure JSON API Requests | CORS rules, JSON payload limits, IP Rate Limiting |
| Render API | Neon DB | PostgreSQL (SSL) | Relational SQL transaction management | SSL Mode require, parameterized query variables |
| Render API | Cloudinary | HTTPS (TLS 1.3) | Signed metadata signature exchanges | Server-only private secrets, strict folder regexes |
| Render Worker | Render API | HTTP (Private) | Local internal service handshakes | Non-exposed internal VPN networking |
