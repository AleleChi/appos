# AppOS Identity & Access Security Mandates

This documentation details the advanced security layers, mitigations, and protocols established across the AppOS Identity framework.

---

## 1. Input Sanitization & Validation Rules

Security begins with strict inputs. We use a zero-trust dual-validation methodology: frontend validation ensures fast user feedback, and server-side validation enforces database invariants.

### Email Format & Normalization Rules
* **Truncation Bounds**: Absolute maximum of 254 characters (RFC 5321). Inputs exceeding this are immediately dropped before hitting DB pipelines.
* **Normalization**: Trimming leading/trailing whitespace, lowercase conversion, and domain space resolution before database querying.
* **Multi-Layer Validation Pipeline**:
  1. **Layer 1 (Syntax Validation)**: Strict email RFC regex coupled with a TLD check.
  2. **Layer 2 (Normalized Protection)**: Rejects duplicate registrations securely. Any duplicate email identity yields a generic error message to maintain account enumeration protection.

### Password Complexity Rules
* **Length bounds**: Minimum 12 characters, maximum 128 characters.
* **Blocklists**: Rejects simple standard sequence keyboard patterns (`qwerty`, `asdfg`) and common variations (`password123`).

---

## 2. Attack Prevention & OAuth Protections

### Rate Limiting & Bot Detection (Honeypot Trap)
* A hidden input field `website_url_honeypot` is injected in the registration form.
* Styled via Tailwind CSS `.hidden` so standard screen layouts ignore it.
* If any signup payload contains a non-empty honeypot field, the request is dropped with a generic success or 400 status to prevent scanner enumeration.

### Secure Account Linking & Conflict Resolution
To prevent hijacking of pre-existing verified email accounts via social identity providers (Google, Apple):
* **No Silent Merges**: If a Google OAuth login matches an existing local email/password account, AppOS does **not** silently merge them.
* **Active Validation**: The user is redirected to a custom confirmation screen asking for their existing password.
* **Cryptographic Linking**: Once verified, the Google OAuth metadata is securely linked inside the database record under the same secure tenant ID.

---

## 3. Same-Origin Session Cookie Hardening

AppOS implements strict session security using host-only cookie policies made possible by the Vercel Reverse Proxy architecture.

### Hardened Session Cookie Parameters
All sessions use a single unified session cookie (`session_id`) configured with maximum browser safeguards:
* `HttpOnly`: Prevents client-side scripts from reading the cookie (mitigating XSS attacks).
* `Secure`: Enforces cookie transmission exclusively over encrypted HTTPS protocols.
* `SameSite=Lax`: Standardized to `SameSite=Lax` for all production authentication points. This blocks cross-site request forgery (CSRF) on cross-site navigations while maintaining high cookie acceptance rates.
* `Domain` (Unset): Left intentionally **unset** so the browser registers it as a **host-only** cookie. This locks the cookie strictly to the Vercel host (`appos-ten.vercel.app`) and completely blocks any cross-domain leaks or multi-subdomain exposure.

### Single-Hop Transaction Architecture (No Handoff-Code System)
Because all browser calls route through the same-origin proxy, we have eliminated the complex server-to-server BFF database handoff-code model.
- Sessions are set directly on the client response by the proxy backend.
- Eliminates replay vulnerability risk, database overhead, and stale-code security cleanups.

---

## 4. Cryptographic Handshakes

* **Cryptographic Randomness**: Password-reset and email-verification tokens are generated using `crypto.randomBytes(32).toString('hex')`.
* **SHA-256 Hashing**: Stored tokens are hashed using SHA-256 before insertion into the database to prevent direct token lookup in case of read-only database compromise.
* **Expiration Threshold**: All password reset tokens and email verification links expire strictly after **24 hours**.

---

## 5. Security Incident Management

All failed authentication handshakes, suspected credential stuffing, and duplicate signup attempts are captured with anonymized logs. Suspicious IPs are quarantined automatically through ingress security rules.
