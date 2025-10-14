# Deployment Guide for Nøtteknektene

## Prerequisites

- GitHub account with repository access
- Vercel account (sign up at vercel.com)
- Firebase project configured
- Node.js 18+ installed locally

## Environment Variables Required

The following environment variables must be configured in Vercel:

### Firebase Configuration
- `VITE_FIREBASE_API_KEY` - Your Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain (project-id.firebaseapp.com)
- `VITE_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID` - Firebase measurement ID (optional)

### Application Configuration
- `VITE_ADMIN_EMAIL` - Email address for admin access
- `VITE_NODE_ENV` - Set to `production`

## Deployment Steps

### 1. Initial Setup

1. Ensure all code is committed and pushed to GitHub:
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin main
   ```

### 2. Vercel Deployment

1. **Sign up/Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

2. **Import Project**
   - Click "Add New Project"
   - Select "Import Git Repository"
   - Choose your `Elnan/Notteknektene` repository
   - Click "Import"

3. **Configure Build Settings**
   Vercel should auto-detect these settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add each variable listed above
   - Select "Production", "Preview", and "Development" for each variable
   - Click "Save"

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (2-5 minutes)
   - Your app will be available at `https://your-project.vercel.app`

### 3. Firebase Configuration

After deployment, update your Firebase project:

1. **Add Vercel Domain to Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Go to Authentication → Settings → Authorized domains
   - Click "Add domain"
   - Add your Vercel URL (e.g., `your-project.vercel.app`)
   - If using custom domain, add that too

2. **Verify Firestore Rules**
   - Go to Firestore Database → Rules
   - Ensure rules are configured for production security
   - Example rules should require authentication for read/write

### 4. Post-Deployment Testing

Test the following features:

- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Games load and function properly
- [ ] Admin panel is accessible (with admin credentials)
- [ ] Save states persist correctly
- [ ] Mobile responsiveness
- [ ] All routes work (no 404 errors)

### 5. Custom Domain (Optional)

To add a custom domain:

1. Go to Vercel Project Settings → Domains
2. Click "Add"
3. Enter your domain (e.g., `notteknektene.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (can take up to 48 hours)
6. Add custom domain to Firebase authorized domains

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:

- **Production:** Pushes to `main` branch
- **Preview:** Pull requests and other branches

## Troubleshooting

### Build Fails

**Error:** "Module not found"
- **Solution:** Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error:** "Build exceeded time limit"
- **Solution:** Check for infinite loops or heavy computations during build
- Review build logs in Vercel dashboard

### Environment Variables Not Working

**Symptom:** Firebase connection fails
- **Solution:** 
  1. Verify all environment variables are set in Vercel
  2. Ensure variable names start with `VITE_` prefix
  3. Redeploy after adding/changing variables
  4. Check for typos in variable names

### 404 Errors on Routes

**Symptom:** Direct navigation to routes shows 404
- **Solution:** 
  1. Verify `vercel.json` has proper rewrites configuration
  2. Ensure all routes are defined in React Router
  3. Check that `vercel.json` is committed to repository

### Firebase Authentication Issues

**Symptom:** Login/registration fails
- **Solution:**
  1. Verify Vercel domain is in Firebase authorized domains
  2. Check Firebase API key is correct
  3. Ensure Firebase project is in production mode (Blaze plan)
  4. Check browser console for specific error messages

## Monitoring

### Vercel Analytics
- Go to your project → Analytics
- Monitor page views, performance metrics
- Check for errors in the logs

### Firebase Console
- Monitor authentication activity
- Check Firestore usage
- Review Cloud Functions logs (if applicable)
- Monitor costs and quotas

## Rollback

If you need to rollback to a previous version:

1. Go to Vercel Dashboard → Deployments
2. Find the working deployment
3. Click the three dots → "Promote to Production"

## Support

For issues:
- Check Vercel deployment logs
- Review Firebase console for errors
- Check GitHub repository issues
- Contact support@notteknektene.com

