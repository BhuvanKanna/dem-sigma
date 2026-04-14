# API Key Security — README

## The Problem
The Gemini API key is currently in the HTML file, visible to anyone who views the page source.
This exposes the key to potential misuse (others using your quota, billing charges, etc.).

---

## Option 1 — Environment Variable + Simple Backend (Recommended)

This is the most practical approach if you host the site anywhere that supports server-side code.

### Step 1: Move the key out of HTML
Remove `const GEMINI_API_KEY = '...'` from `dem_dashboard.html` and replace with:
```js
const GEMINI_URL = '/api/chat'; // proxy endpoint instead
```

### Step 2: Create a tiny Node.js/Express proxy
```js
// server.js
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public')); // put dem_dashboard.html in /public

app.post('/api/chat', async (req, res) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
    { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(req.body) }
  );
  const data = await response.json();
  res.json(data);
});

app.listen(3000);
```

### Step 3: Set the environment variable
```bash
# On your server / hosting provider
export GEMINI_API_KEY="your_actual_key_here"
```

Never commit this value to git. Add `.env` to your `.gitignore`.

---

## Option 2 — Netlify / Vercel Serverless Function (Free Hosting)

### Netlify
1. Create `netlify/functions/chat.js`:
```js
const fetch = require('node-fetch');
exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
    { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }
  );
  return { statusCode: 200, body: await resp.text() };
};
```
2. In Netlify dashboard → Site Settings → Environment Variables → add `GEMINI_API_KEY`
3. Update the fetch URL in HTML to `/.netlify/functions/chat`

### Vercel
1. Create `api/chat.js`:
```js
export default async function handler(req, res) {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
    { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(req.body) }
  );
  res.json(await resp.json());
}
```
2. In Vercel dashboard → Project Settings → Environment Variables → add `GEMINI_API_KEY`
3. Update fetch URL in HTML to `/api/chat`

---

## Option 3 — Quick Temporary Fix (Minimal effort, partial protection)

If you just want to reduce obvious exposure immediately without a backend:

1. **Restrict the API key** in Google AI Studio:
   - Go to https://aistudio.google.com/
   - API Keys → Edit your key → Add HTTP referrer restriction
   - Set it to your website domain (e.g., `yoursite.com/*`)
   - This means the key only works from your domain

2. This doesn't hide the key from source view but prevents others from using it from a different domain.

---

## Current State in the File
The placeholder `YOUR_GEMINI_API_KEY_HERE` is in the HTML at:
```js
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
```
Replace this with your actual key for local/demo use, but use one of the options above for any public deployment.
