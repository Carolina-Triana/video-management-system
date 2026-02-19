# Supabase Storage Configuration Fix

## Issue

The integration tests are failing with the error:

```
Failed to upload thumbnail: new row violates row-level security policy
```

This means the Supabase storage bucket needs proper Row Level Security (RLS) policies configured.

## Solution

You need to configure the storage bucket policies in your Supabase dashboard. Here are two options:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** > **Policies**
3. Select the `thumbnails` bucket
4. Click **New Policy**
5. Create the following policies:

#### Policy 1: Allow Public Reads

- **Policy Name**: `Public Access`
- **Allowed Operation**: `SELECT`
- **Target Roles**: `public`
- **Policy Definition**: `true` (or leave as default)

#### Policy 2: Allow Authenticated Uploads

- **Policy Name**: `Allow Authenticated Uploads`
- **Allowed Operation**: `INSERT`
- **Target Roles**: `authenticated`, `anon`
- **Policy Definition**: `true`

#### Policy 3: Allow Authenticated Deletes

- **Policy Name**: `Allow Authenticated Deletes`
- **Allowed Operation**: `DELETE`
- **Target Roles**: `authenticated`, `anon`
- **Policy Definition**: `true`

### Option 2: Using SQL (Alternative)

Run this SQL in the Supabase SQL Editor:

```sql
-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to thumbnails bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

-- Allow authenticated users to upload to thumbnails bucket
CREATE POLICY "Allow Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'thumbnails');

-- Allow authenticated users to delete from thumbnails bucket
CREATE POLICY "Allow Authenticated Deletes"
ON storage.objects FOR DELETE
TO authenticated, anon
USING (bucket_id = 'thumbnails');

-- Allow authenticated users to update in thumbnails bucket
CREATE POLICY "Allow Authenticated Updates"
ON storage.objects FOR UPDATE
TO authenticated, anon
USING (bucket_id = 'thumbnails')
WITH CHECK (bucket_id = 'thumbnails');
```

### Option 3: Disable RLS (Not Recommended for Production)

If you're just testing locally and want to quickly bypass this:

1. Go to **Storage** > **Policies**
2. Select the `thumbnails` bucket
3. Click **Disable RLS** (if available)

**Warning**: This is NOT secure for production use!

## Verification

After applying the policies, test the upload:

```bash
cd backend
node integration-test.js
```

All tests should now pass.

## Why This Happens

Supabase uses Row Level Security (RLS) to control access to storage buckets. By default, even "public" buckets require explicit policies to allow:

- Reading files (SELECT)
- Uploading files (INSERT)
- Deleting files (DELETE)

The anon key used by the API needs these permissions to interact with the storage bucket.

## Additional Resources

- [Supabase Storage Policies Documentation](https://supabase.com/docs/guides/storage/security/access-control)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
