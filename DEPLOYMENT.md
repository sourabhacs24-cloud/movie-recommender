# 🚀 Deployment Guide for Movie Recommender

## Architecture Overview

| Component | Platform | URL Pattern |
|-----------|----------|-------------|
| **Backend API** | Render | `https://movie-recom-ekts.onrender.com` |
| **Frontend** | Vercel | `https://movie-recom-q786iidf4-surendra-vishwakarmas-projects.vercel.app` |

---

## 📦 Step 1: Deploy Backend to Render

### 1.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/movie-recommender.git
git push -u origin main
```

### 1.2 Create Render Web Service
1. Go to [render.com](https://render.com) and sign up
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `movie-recommender-api`
   - **Environment**: `Python 3`
   - **Build Command**: 
     ```
     apt-get update && apt-get install -y gcc && cd c_engine && gcc -o recommender recommender.c -lm && gcc -o movie_system system_main.c auth.c comments.c chat.c mylist.c utils.c -lm && pip install -r requirements.txt
     ```
   - **Start Command**: `gunicorn --chdir backend app:app --bind 0.0.0.0:$PORT`
5. Click **Create Web Service**
6. Note your URL: `https://movie-recommender-api.onrender.com`

---

## 🌐 Step 2: Deploy Frontend to Vercel

### 2.1 Update API URL in Frontend
Before deploying, update `backend/static/script.js`:
```javascript
const API_BASE_URL = 'https://movie-recommender-api.onrender.com';
```

### 2.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `backend/static`
   - **Build Command**: (leave empty)
   - **Output Directory**: `.`
5. Click **Deploy**

---

## ⚙️ Environment Configuration

### Render Environment Variables
Add these in Render dashboard if needed:
- `PYTHON_VERSION`: `3.9.0`

### CORS Configuration
The backend already has CORS enabled for all origins. For production, update `app.py`:
```python
CORS(app, origins=['https://your-app.vercel.app'])
```

---

## 🔄 Deployment Workflow

After making changes:

```bash
git add .
git commit -m "Your changes"
git push
```

Both Vercel and Render will auto-deploy from your GitHub repo!

---

## 🔧 Troubleshooting

### C Engine Not Compiling
- Ensure `gcc` is installed in build command
- Check Render build logs for errors

### CORS Errors
- Verify API_BASE_URL in frontend matches Render URL
- Check CORS configuration in app.py

### "Unknown" Directors
- Ensure movies.txt has 5 fields: `id,title,genre,rating,director`
- Verify backend reload after changes

---

## 📱 Test Your Deployment

1. Open your Vercel URL
2. Search for a movie (e.g., "Inception")
3. Verify recommendations show director names
4. Test login, comments, and My List features
