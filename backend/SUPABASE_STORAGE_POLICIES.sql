-- Supabase Storage Policies for Thumbnails Bucket
-- Run this SQL in your Supabase SQL Editor

-- First, ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow Anon Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow Anon Deletes" ON storage.objects;

-- Policy 1: Allow public read access to thumbnails bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

-- Policy 2: Allow anon role to upload to thumbnails bucket
-- This is CRITICAL for the API to work with SUPABASE_ANON_KEY
CREATE POLICY "Allow Anon Uploads"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'thumbnails');

-- Policy 3: Allow authenticated users to upload to thumbnails bucket
CREATE POLICY "Allow Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

-- Policy 4: Allow anon role to delete from thumbnails bucket
CREATE POLICY "Allow Anon Deletes"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'thumbnails');

-- Policy 5: Allow authenticated users to delete from thumbnails bucket
CREATE POLICY "Allow Authenticated Deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'thumbnails');

-- Policy 6: Allow authenticated users to update in thumbnails bucket
CREATE POLICY "Allow Authenticated Updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'thumbnails')
WITH CHECK (bucket_id = 'thumbnails');

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;
