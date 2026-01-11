# 🚀 Free Deployment Guide

Follow these steps to deploy **JobBot AI** for free using standard cloud providers.

## 1. Prerequisites
- A **GitHub** account.
- A **MongoDB Atlas** account (Free Shared Cluster).

---

## 2. Backend Deployment (Render.com)

[Render](https://render.com/) offers a generous free tier for Node.js web services.

1. **Push Code**: Push your `backend` folder to a GitHub repository.
2. **Create Web Service**: In Render Dashboard, click `New +` > `Web Service`.
3. **Connect Repo**: Connect your GitHub repository.
4. **Configure**:
   - **Root Directory**: `backend` (if you push the whole project, set this to `backend`).
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. **Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `PORT`: `10000` (Render's default).
   - `NODE_ENV`: `production`

---

## 3. Frontend Deployment (Vercel)

[Vercel](https://vercel.com/) is perfect for React applications.

1. **Connect Vercel to GitHub**: Import your repository.
2. **Configure**:
   - **Framework Preset**: `Vite` or `Create React App`.
   - **Root Directory**: `frontend`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist` (if using Vite) or `build`.
3. **API Configuration**:
   - In your frontend code (`Dashboard.jsx`, `Profile.jsx`), ensure the API URL points to your Render backend URL instead of `localhost:5000`.

---

## 4. Real Data & Automation Notes

> [!IMPORTANT]
> **Headless Browsers**: Free tiers on Render/Vercel have limited resources.
> - The `playwright` scrapers might be slow or hit memory limits.
> - **Recommendation**: For production-grade scraping, consider a specialized service or a paid VPS (like DigitalOcean, starting at $5/mo).

## 5. Summary Checklist
- [ ] Database connected to Atlas.
- [ ] Backend URL updated in Frontend.
- [ ] CORS allowed for your production frontend domain.
- [ ] API keys (if any) added to Environment Variables.

Need help with a specific step? Just ask!
