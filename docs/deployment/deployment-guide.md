# AppOS Enterprise SaaS Deployment Guide

This guide provides step-by-step instructions for preparing, deploying, and connecting the AppOS platform on production free-tier and enterprise cloud environments.

## 1. Neon PostgreSQL Database Provisioning

1. Go to the [Neon Console](https://console.neon.tech/) and create a new project named `appos`.
2. Choose **PostgreSQL v16** and select your nearest cloud region (e.g., `us-east-2`).
3. Under the **Dashboard**, copy your primary connection string (`DATABASE_URL`).
   * It will look like: `postgresql://[user]:[password]@[hostname]/appos?sslmode=require`
4. Store this URL securely; you will use it as an environment variable in Render.

---

## 2. Backend Deployment: Render Web Service

Render hosts the Node.js Express.js backend server.

### Setup Steps:
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New > Web Service**.
2. Connect your Git repository containing the AppOS project.
3. Configure the following service settings:
   * **Name**: `appos-backend`
   * **Region**: `us-east` (Must match your Neon database region for optimal performance!)
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start` (This launches the compiled `dist/server.cjs` bundle)
4. Under **Environment Variables**, click **Add Environment Variable** and configure:
   * `NODE_ENV` = `production`
   * `PORT` = `3000`
   * `DATABASE_URL` = *[Your Neon Connection URL]*
   * `SESSION_SECRET` = *[A long, secure random string]*
   * `INTERNAL_BFF_SECRET` = *[A strong shared secret key used for server-to-server BFF validation]*
   * `CLOUDINARY_CLOUD_NAME` = *[Your Cloudinary Cloud Name]*
   * `CLOUDINARY_API_KEY` = *[Your Cloudinary API Key]*
   * `CLOUDINARY_API_SECRET` = *[Your Cloudinary API Secret]*
   * `GOOGLE_CLIENT_ID` = *[Google Cloud OAuth Client ID]*
   * `GOOGLE_CLIENT_SECRET` = *[Google Cloud OAuth Client Secret]*
   * `GOOGLE_CALLBACK_URL` = `https://appos.onrender.com/api/auth/google/callback`
   * `FRONTEND_URL` = `https://appos-ten.vercel.app`
5. Under **Advanced**, add a health check path:
   * **Health Check Path** = `/api/health`
6. Click **Deploy Web Service**. Render will build and expose your backend API on a URL like `https://appos.onrender.com`.

---

## 3. Frontend & BFF Deployment: Vercel

Vercel hosts the static React SPA frontend and execution handlers for the serverless BFF (Backend-for-Frontend) endpoints.

### Setup Steps:
1. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New > Project**.
2. Authenticate and select your AppOS repository.
3. Configure the project parameters:
   * **Framework Preset**: `Vite` (Vercel automatically detects this)
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Under **Environment Variables**, define:
   * `VITE_API_URL` = `https://appos.onrender.com` (Your Render API URL, with no trailing slash)
   * `INTERNAL_BFF_SECRET` = *[MUST EXACTLY MATCH the Render INTERNAL_BFF_SECRET variable!]*
5. Click **Deploy**. Vercel will compile the static assets and deploy the serverless BFF handlers located under the `/api` directory according to the `vercel.json` routing configuration. Your application will be accessible at `https://appos-ten.vercel.app`.

---

## 4. Post-Deployment Verification

Once both deployments complete successfully, complete these validation tasks:
1. Load `https://appos-ten.vercel.app/api/health` and verify the static assets and paths load properly.
2. Load the `/api/health` endpoint on your Render API (`https://appos.onrender.com/api/health`) to verify that:
   * Database connection is verified.
   * PostgreSQL table migrations (including `auth_handoff_codes`) ran on startup without issue.
3. Open the registration page, trigger a Google OAuth login, and verify the redirect, BFF session handoff, and cookie generation perform successfully!
