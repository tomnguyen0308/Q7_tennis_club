# 🎾 Tennis Club Match Log — Setup Guide

## Step 1 — Set up Supabase (free database)

1. Go to **supabase.com** → Sign up free
2. Click **New Project** → name it `tennis-club` → set a password → Create
3. Wait ~1 min for it to load
4. Go to **SQL Editor** → **New Query**
5. Copy everything from `SUPABASE_SETUP.sql` → paste → click **Run**
6. Go to **Project Settings** → **API**
7. Copy your:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (long string)

## Step 2 — Add your Supabase keys

Create a file called `.env.local` in this folder with:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 3 — Deploy to Vercel

1. Push this folder to a GitHub repo (github.com → New repo → upload files)
2. Go to **vercel.com** → New Project → import your repo → Deploy
3. In Vercel, go to your project → **Settings** → **Environment Variables**
4. Add both variables from Step 2
5. Redeploy

Your app is now live at `your-project.vercel.app` 🎉

## Everyone in the club

Just share the Vercel link. Anyone can open it and log matches — all data syncs in real time across all phones.
