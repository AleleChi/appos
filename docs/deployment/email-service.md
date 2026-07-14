# Transactional Email Service & Delivery (Resend API)

This guide documents the integration of the transactional email dispatch layer in the AppOS Platform.

---

## 1. Core Service Architecture

AppOS utilizes the modern, secure [Resend API](https://resend.com) to distribute critical identity flows:
- **Email Address Verification**: Dispatched instantly on new user registrations.
- **Security Reset Credentials**: Initiated via the recovery options.

---

## 2. Environment Configuration

The email pipeline automatically reads parameters from environment configuration files:

```env
# .env (Never check into source control)
RESEND_API_KEY=re_1234567890abcdef...
```

### Local Dev Fallback (Strict Output)
If `RESEND_API_KEY` is omitted or left empty:
- The system gracefully defaults to logging transactional URLs (verification links, reset links) directly to standard output (`stdout`).
- No SMTP exceptions crash the runtime application.
- Development workflows continue flawlessly without external network calls.

---

## 3. Domain Verification & DNS Setup

To run email dispatches under custom company domain masks (e.g., `noreply@appos.com`):

1. **Verify Domain in Resend Dashboard**:
   - Add your sending domain inside Resend settings.
2. **Apply DNS Records**:
   - **DKIM (DomainKeys Identified Mail)**: Configure the requested TXT records to cryptographically sign emails on behalf of the domain.
   - **SPF (Sender Policy Framework)**: Append `include:amazonses.com` or Resend custom pointers to your DNS SPF configurations.
   - **DMARC**: Protect domains against spoofing.

---

## 4. Email Templates

AppOS emails utilize clean, pre-styled, mobile-responsive HTML layouts:
* **Subject Accents**: Marked with AppOS branding identifiers to prevent spam classifier drops.
* **Symmetric Styles**: Soft shadows, rounded border cards, and custom indigo primary color highlights matching the application theme.
