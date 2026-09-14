# 🚀 Free Live Deployment Guide: REIKAGE WATCH

This guide explains how to deploy **REIKAGE WATCH** live on the web for **100% FREE**.

---

## 💡 Choosing the Right Free Host for a Video Platform

Video platforms require:
1. **Large File Uploads:** Uploading MP4 / WebM video files.
2. **Video Streaming:** HTTP 206 Byte-Range streaming for smooth seeking.
3. **Persistent Database:** Storing user accounts, video metadata, likes, comments, and clan ranks.

| Platform | Best For | Free Tier | Video Uploads Support | Setup Difficulty |
| :--- | :--- | :--- | :--- | :--- |
| **Render.com** (Recommended) | **Full-Stack (Frontend + Backend)** | **100% Free** | ✅ Supported | ⭐ Easiest (1 Click) |
| **Vercel** | **Frontend (or Serverless API)** | **100% Free** | ⚠️ 4.5MB limit on serverless functions | ⭐ Easy |
| **Koyeb / Railway** | **Full-Stack Containers** | **100% Free / Free Trial** | ✅ Supported | ⭐ Easy |

---

## 🌟 Method 1: Deploy Full-Stack to Render.com (Recommended)

Render gives you a free live URL (e.g. `https://reikage-watch.onrender.com`) running both your React frontend and Express backend together.

### Step 1: Push Project to GitHub

Open a terminal in `C:\Users\shelt\.gemini\antigravity-ide\scratch\reikage-watch` and run:

```bash
git init
git add .
git commit -m "Initial commit of Reikage Watch platform"
```

Create a new repository on [github.com](https://github.com) (e.g. `reikage-watch`), then run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/reikage-watch.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to [dashboard.render.com](https://dashboard.render.com/) and sign in for free (with your GitHub account).
2. Click **New +** and select **Web Service**.
3. Choose your `reikage-watch` repository.
4. Fill in the settings:
   - **Name:** `reikage-watch` (or your preferred name)
   - **Environment:** `Node`
   - **Region:** Choose the closest region (e.g. Oregon, Frankfurt, Singapore)
   - **Branch:** `main`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
5. Click **Create Web Service**.

Render will automatically install all dependencies, build the React frontend, start the server, and give you your free live HTTPS URL (e.g. `https://reikage-watch.onrender.com`)!

---

## ⚡ Method 2: Deploy Frontend to Vercel

If you want your frontend hosted on Vercel's global edge network:

### Step 1: Push to GitHub (as in Method 1)

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** -> **Project**.
3. Select your `reikage-watch` repository.
4. In the configuration screen:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click "Edit" and choose `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **Deploy**.

Within 30 seconds, your frontend will be live on a free `.vercel.app` domain!

> **Note on Vercel Backend:**
> To connect your Vercel frontend to the backend API, deploy the backend on Render (Method 1) and add an environment variable in your Vercel dashboard:
> `VITE_API_URL=https://reikage-watch.onrender.com`

---

## 🛠️ Testing Locally Before Deploying

To test the unified production build locally on your machine:

```bash
npm run build
npm start
```

Then visit `http://localhost:5000` in your browser. Both the React application and API will be running seamlessly together on port 5000.
