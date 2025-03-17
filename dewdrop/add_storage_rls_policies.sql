-- Add RLS policies for the card-images storage bucket
-- Run this SQL file in your Supabase SQL Editor after creating the bucket

-- First, enable RLS on the storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for inserting files: Allow authenticated users to upload files to the card-images bucket
-- but only in their own user directory (user_id/)
CREATE POLICY "Users can upload files to their own folder" ON storage.objects
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id = 'card-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for selecting/reading files: Allow authenticated users to read files from the card-images bucket
-- but only files in their own user directory
CREATE POLICY "Users can read their own files" ON storage.objects
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'card-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for updating files: Allow authenticated users to update files in the card-images bucket
-- but only files in their own user directory
CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'card-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for deleting files: Allow authenticated users to delete files from the card-images bucket
-- but only files in their own user directory
CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'card-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
