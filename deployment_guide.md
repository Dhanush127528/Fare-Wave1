# Deploying Fare Wave

To deploy this MERN stack application so that anyone in the world can use it, we will split the deployment into two parts: the **Backend** (Node.js) and the **Frontend** (Vite/React).

Since you already have MongoDB Atlas hosted in the cloud, you don't need to deploy a database!

## Step 1: Deploy the Backend (Using Render.com)
Render is the easiest platform for deploying Node.js servers for free.

1. Go to [Render.com](https://render.com) and sign in with GitHub.
2. Click **New +** and select **Web Service**.
3. Connect your `Fare-Wave1` GitHub repository.
4. **Configuration:**
   - Name: `fare-wave-backend`
   - Root Directory: `backend` *(crucial!)*
   - Build Command: `npm install`
   - Start Command: `npm start` (or `node server.js`)
5. **Environment Variables:** Scroll down to the Advanced section and add all the variables from your local `.env` file (`MONGO_URI`, `JWT_SECRET`, `RAZORPAY_KEY`, etc.).
   - *Important:* Since you didn't push `dialogflow-key.json` to GitHub (for security), you must paste the raw JSON contents of that key into a new environment variable on Render, and update `chatbotController.js` to read from the environment variable instead of the file.
6. Click **Create Web Service**. 
7. Once deployed, Render will give you a live URL like `https://fare-wave-backend.onrender.com`.

## Step 2: Deploy the Frontend (Using Vercel)
Vercel is the absolute best platform for hosting React/Vite applications.

1. Go to [Vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New** -> **Project**.
3. Import your `Fare-Wave1` GitHub repository.
4. **Configuration:**
   - Framework Preset: Vite
   - Root Directory: `frontend` *(crucial!)*
5. **Environment Variables:** Expand the environment variables section and add:
   - Name: `VITE_API_URL`
   - Value: `https://fare-wave-backend.onrender.com/api` *(replace with your actual Render URL!)*
6. Click **Deploy**.

## Step 3: Configure CORS (Crucial)
Right now, your backend `server.js` only allows requests from `http://localhost:5173`. Once your frontend is live on Vercel (e.g., `https://fare-wave.vercel.app`), the backend will block it!

Before deploying, update `backend/server.js`:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'https://fare-wave.vercel.app'], // Add your Vercel URL
  credentials: true,
}));
```
Commit and push this change to GitHub, and Render will automatically re-deploy your backend to allow traffic from Vercel!
