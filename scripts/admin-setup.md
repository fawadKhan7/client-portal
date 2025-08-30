# 🛠️ Admin User Setup Guide

This guide shows you how to create admin users for your client portal using JSON configuration.

## 🚀 Quick Start Options

### Option 1: JSON Configuration Script (Recommended)

**Prerequisites:**
1. Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Get your Service Role Key:
   - Go to Supabase Dashboard → Settings → API
   - Copy the `service_role` key (not the `anon` key)
   - **⚠️ IMPORTANT:** Never expose this key in client-side code!

**Configure Admins:**
Edit `lib/adminConfig.json`:
```json
{
  "admins": [
    {
      "email": "admin@yourcompany.com",
      "password": "SecurePass123!",
      "name": "System Administrator",
      "role": "admin"
    },
    {
      "email": "manager@yourcompany.com", 
      "password": "ManagerPass123!",
      "name": "Project Manager",
      "role": "admin"
    }
  ],
  "settings": {
    "autoConfirmEmail": true,
    "skipIfExists": true,
    "logDetails": true
  }
}
```

**Run the Script:**
```bash
npm run add-admin
```

**Features:**
- ✅ JSON-based configuration (no prompts)
- ✅ Batch processing of multiple admins
- ✅ Creates both auth user and profile record
- ✅ Auto-confirms email (no confirmation needed)
- ✅ Validation and error handling
- ✅ Cleanup on failure
- ✅ Skip existing users option
- ✅ Detailed summary reports

### Option 2: SQL Script (Database Direct)

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Open `scripts/add-admin.sql`
3. Follow the instructions to create admin users
4. Replace placeholder values with real data

**Use Cases:**
- ✅ Bulk admin creation
- ✅ When you prefer database control
- ✅ No Node.js environment needed

## 🔧 Environment Setup

Add to your `.env.local`:

```env
# Existing keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key

# Add this for admin script
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
```

## 👥 Admin User Features

Once created, admin users get:

- ✅ **Access to Clients page** (`/admin`) - not visible to regular users
- ✅ **"Clients" link in sidebar** - role-based navigation
- ✅ **Full dashboard access** - same as regular users
- ✅ **Admin-specific functionality** (when implemented)

## 🔍 Verification

**Check if admin was created:**

```sql
-- Run in Supabase SQL Editor
SELECT 
  p.id,
  p.name,
  p.email,
  p.role,
  p.created_at
FROM profiles p
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;
```

**Test admin login:**
1. Go to `/auth` page
2. Login with admin credentials
3. Verify "Clients" appears in sidebar
4. Navigate to `/admin` page

## 🛡️ Security Notes

- **Service Role Key** has full database access - keep it secure!
- **Never commit** `.env.local` to version control
- **Rotate keys** periodically in production
- **Use RLS policies** to control admin data access
- **Monitor admin activities** in production

## 🚨 Troubleshooting

**Script fails with "Missing environment variables":**
- Check `.env.local` exists in project root
- Verify all required keys are present
- Restart your development server after adding env vars

**"User already exists" error:**
- Use Option 2 (promote existing user) instead
- Or delete existing user and try again

**Admin can't see Clients page:**
- Verify `role` is set to `'admin'` in profiles table
- Check browser console for errors
- Refresh the page to reload user session

**Permission denied errors:**
- Verify Service Role Key is correct
- Check RLS policies allow admin operations
- Ensure profiles table exists and is accessible

## 📋 Next Steps

After creating an admin:

1. **Test the admin login flow**
2. **Verify role-based navigation works**
3. **Implement admin-specific features** in future modules
4. **Set up proper admin permissions** for your use case

---

**Happy admin management!** 🎉
