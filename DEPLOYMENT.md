# Deploying Bringer to Production

This guide explains how to sync your local development environment with your hosted Supabase project and deploy to production.

---

## Prerequisites

1. A Supabase account at [supabase.com](https://supabase.com)
2. A Supabase project created (or create a new one)
3. Supabase CLI installed (`npx supabase` works)

---

## Step 1: Link to Remote Supabase Project

### 1.1 Get your project reference ID

Visit your Supabase project dashboard at:
```
https://supabase.com/dashboard/project/<your-project-id>
```

Your project reference ID is in the URL and in Project Settings → General.

### 1.2 Link your local project to remote

```bash
npx supabase link --project-ref <your-project-ref-id>
```

You'll be prompted for:
- **Database password**: Found in Project Settings → Database → Connection String
- Confirm the link

This creates a `.supabase/` directory (gitignored) with your project connection info.

---

## Step 2: Push Migrations to Production

### 2.1 Review migrations to push

Check which migrations will be applied:

```bash
npx supabase db push --dry-run
```

This shows you what will be executed on your remote database.

### 2.2 Push migrations to production

```bash
npx supabase db push
```

This will:
- Apply all migrations in `supabase/migrations/` to your remote database
- Execute them in order (by timestamp)
- Create the exact same schema as your local development

**Important**: This will modify your production database! Make sure you're ready.

---

## Step 3: Configure Production Environment Variables

### 3.1 Get your production Supabase credentials

From your Supabase dashboard:

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (the long JWT token)

### 3.2 Update environment variables for production

Create a `.env.production` or `.env` file (for Vercel/production):

```bash
# Production Supabase settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key-here
```

**Never commit this file!** It should be in `.gitignore` (already configured).

### 3.3 Configure deployment platform

#### For Vercel:

1. Go to your project settings
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

#### For other platforms (Netlify, Railway, etc.):

Add the same environment variables in their respective dashboards.

---

## Step 4: Update Supabase Auth Configuration

### 4.1 Add your production URL to allowed redirects

In Supabase dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Add your production URL to **Site URL**:
   ```
   https://your-app.vercel.app
   ```
3. Add to **Redirect URLs**:
   ```
   https://your-app.vercel.app
   https://your-app.vercel.app/auth/callback
   ```

### 4.2 Update local login redirect (optional)

In `src/app/login/page.tsx:57`, the auth redirect URL is hardcoded to `localhost`:

```typescript
emailRedirectTo: 'http://localhost:3000/auth/callback',
```

For production, you can make this dynamic:

```typescript
emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
```

Then add `NEXT_PUBLIC_SITE_URL` to your environment variables.

---

## Step 5: Deploy Your Next.js App

### 5.1 Push to Git

```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 5.2 Deploy to Vercel (recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

Or connect your GitHub repo to Vercel dashboard for automatic deployments.

---

## Keeping Local and Production in Sync

### Workflow for future changes:

1. **Develop locally** with `npx supabase start`
2. **Create migrations** when you change the schema:
   ```bash
   npx supabase migration new your_migration_name
   ```
3. **Test locally** with `npx supabase db reset`
4. **Push to production** when ready:
   ```bash
   npx supabase db push
   ```

### Pull remote changes (if needed):

If you make changes directly in production (not recommended):

```bash
npx supabase db pull
```

This generates a new migration file with the differences.

---

## Verifying Production Database

### Check migrations status:

```bash
npx supabase migration list
```

This shows which migrations are applied locally vs. remotely.

### Verify schema:

Use Supabase dashboard → **Database** → **Schema Visualizer** to see your tables.

---

## Common Issues & Solutions

### Issue: "Migration already applied"

**Solution**: Your production database already has that migration. This is normal if you've pushed before.

### Issue: Auth not working in production

**Solution**: Check these:
1. Redirect URLs in Supabase dashboard include your production domain
2. Environment variables are set correctly in Vercel/hosting platform
3. Magic link emails are working (check Supabase Auth logs)

### Issue: RLS policies blocking access

**Solution**:
1. Check that users are in `workspace_members` table
2. Verify `auth.uid()` matches user IDs in database
3. Use Supabase SQL Editor to test RLS:
   ```sql
   SELECT * FROM items WHERE workspace_id = 'your-workspace-id';
   ```

---

## Environment Variable Summary

### Local Development (`.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from npx supabase status>
```

### Production (Vercel/Netlify/etc.):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

---

## Quick Reference Commands

```bash
# Link to remote project
npx supabase link --project-ref <project-ref>

# Check migration status
npx supabase migration list

# Preview migrations (dry run)
npx supabase db push --dry-run

# Push migrations to production
npx supabase db push

# Pull production schema changes
npx supabase db pull

# Reset local database
npx supabase db reset

# Get local credentials
npx supabase status

# Generate TypeScript types from remote
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

---

## Next Steps

1. ✅ Create a Supabase project at supabase.com
2. ✅ Link your local project: `npx supabase link`
3. ✅ Push migrations: `npx supabase db push`
4. ✅ Configure production environment variables
5. ✅ Update auth redirect URLs in Supabase dashboard
6. ✅ Deploy to Vercel/your hosting platform
7. ✅ Test authentication and data access

Your local and production databases will now have identical schemas! 🎉
