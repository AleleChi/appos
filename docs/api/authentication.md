# AppOS Authentication API Specifications

This document catalogs the exact REST request, response, and error payloads for AppOS Authentication endpoints.

---

## 1. Sign Up Endpoint (`POST /api/auth/signup`)

* **Content-Type**: `application/json`

### Request Payload Format
```json
{
  "email": "user@company.com",
  "password": "SecureComplexity123!",
  "provider": "email",
  "website_url_honeypot": ""
}
```

### Success Response Format (201 Created)
```json
{
  "success": true,
  "message": "Your AppOS account has been successfully created. Please check your email to verify your address.",
  "userCreated": true,
  "verificationRequired": true
}
```

---

## 2. Sign In Endpoint (`POST /api/auth/login`)

* **Content-Type**: `application/json`

### Request Payload Format
```json
{
  "email": "user@company.com",
  "password": "SecureComplexity123!"
}
```

### Success Response (200 OK)
Sets cookies `session_id` as HttpOnly, Secure, SameSite=None and returns user details:
```json
{
  "success": true,
  "user": {
    "id": "usr_9b1deb4d3b7d4c2",
    "email": "user@company.com"
  }
}
```

---

## 3. Session Check Endpoint (`GET /api/auth/me`)

* **Cookies**: `session_id` required.

### Success Response (200 OK)
```json
{
  "user": {
    "id": "usr_9b1deb4d3b7d4c2",
    "email": "user@company.com",
    "provider": "email"
  }
}
```

---

## 4. Sign Out Endpoint (`POST /api/auth/logout`)

* **Cookies**: Clears the `session_id` cookie parameter.

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 5. Password Reset Request (`POST /api/auth/forgot-password`)

* **Content-Type**: `application/json`

### Request Payload Format
```json
{
  "email": "user@company.com"
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "If an account exists, a secure password reset link has been dispatched."
}
```

---

## 6. Password Reset Confirmation (`POST /api/auth/reset-password`)

* **Content-Type**: `application/json`

### Request Payload Format
```json
{
  "token": "raw_cryptographic_token",
  "password": "NewSecureComplexity123!"
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Password successfully updated. You may now sign in."
}
```

---

## 7. Google OAuth URL Endpoint (`GET /api/auth/google/url`)

### Success Response (200 OK)
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

---

## 8. Confirm Google Account Linking (`POST /api/auth/google/link`)

* **Content-Type**: `application/json`

### Request Payload Format
```json
{
  "email": "user@company.com",
  "password": "ExistingSecureComplexity123!",
  "provider": "google",
  "provider_id": "google_123456789"
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Google authentication successfully linked to your existing profile."
}
```
