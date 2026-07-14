# AppOS Asset Storage & Media Architecture

This document describes how AppOS stores, manages, and serves media assets (app logos, screenshots, splash screens) and large binary archives (APK/IPA builds) in production environments.

## 1. Cloudinary Asset Management

To prevent client-side security leaks, AppOS enforces a strict **Signed Upload Protocol**. Clients are forbidden from storing static API credentials or uploading directly to Cloudinary without central authentication.

### Secure Signed Upload Sequence

```
[ Client App (Vite React) ]                   [ AppOS Backend (Render API) ]             [ Cloudinary Media CDN ]
             |                                              |                                        |
             | 1. Request Signature { folder }              |                                        |
             +--------------------------------------------->|                                        |
             |                                              | 2. Verify folder layout regex          |
             |                                              | 3. Create SHA-1 signature with Secret  |
             |                                              |                                        |
             | 4. Return { signature, timestamp, apiKey }   |                                        |
             |<---------------------------------------------+                                        |
             |                                                                                       |
             | 5. Upload File (form-data with signature)                                             |
             +--------------------------------------------------------------------------------------+-->|
             |                                                                                       |   | 6. Save Asset & Optimize
             |<-----------------------------------------------------------------------------------------+ 7. Return URL
```

---

## 2. Directory & Folder Layout

All assets on Cloudinary are stored under a unified root folder named `appos/`. Path access boundaries are structured by entity identifiers to simplify cleanup and audit routines:

```
appos/
  ├── users/
  │     └── {user_id}/
  │           └── avatars/             <-- User profile avatars
  ├── workspaces/
  │     └── {workspace_id}/
  │           ├── logos/               <-- Business brand icons
  │           └── screenshots/         <-- Mobile viewport previews
  └── applications/
        └── {application_id}/
              └── assets/              <-- Generated launch assets & splash screens
```

### Folder Regex Security Rule
The backend signature generator `/api/v1/assets/sign-upload` strictly validates requested folder names against this exact regular expression to prevent path traversal and unapproved storage usage:
```typescript
const allowedFolderRegex = /^appos\/(users\/[a-zA-Z0-9_-]+\/avatars|workspaces\/[a-zA-Z0-9_-]+\/(logos|screenshots)|applications\/[a-zA-Z0-9_-]+\/assets)$/;
```

---

## 3. Future Object Storage Strategy (Build Archives)

While Cloudinary is the optimal choice for optimized media delivery (images, videos, vector assets), it is not designed to store large binary deployment packages like:
* Android APK files (~40MB - 120MB)
* iOS IPA packages (~60MB - 180MB)
* Large intermediate build zip files of web directories.

### Proposed Object Storage Stack
For these bulky binary archives, AppOS will integrate a standard **S3-compatible bucket** (such as Cloudflare R2, AWS S3, or Google Cloud Storage) using the AWS SDK v3 for Node.js.

### S3 Integration Lifecycle:
1. **Private Builds**: Generated APKs/IPAs are initially saved in a private bucket with no public read access.
2. **Presigned Download URLs**: When a user clicks "Download APK" inside the dashboard, the backend generates a short-lived **Presigned URL** (valid for 15 minutes) using `getSignedUrl()` from `@aws-sdk/s3-request-presigner`.
3. **Automatic Expiry**: Old build versions are automatically removed or transitioned to Glacier cold storage after 30 days via Object Lifecycle rules, preventing database-bloat or unneeded cloud storage bills.
