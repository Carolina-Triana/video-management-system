-- Supabase Storage Policy for Frontend Uploads
-- This allows the frontend to upload thumbnails directly to Supabase Storage

-- Enable INSERT (upload) for anon role on thumbnails bucket
CREATE POLICY "Allow anon to upload thumbnails"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'thumbnails');

-- Note: The SELECT policy already exists from previous configuration
-- If you need to verify, run:
-- SELECT * FROM storage.policies WHERE bucket_id = 'thumbnails';
