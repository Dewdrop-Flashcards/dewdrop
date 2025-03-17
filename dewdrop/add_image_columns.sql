-- Add image URL columns to the cards table
ALTER TABLE cards 
ADD COLUMN front_image_url TEXT,
ADD COLUMN back_image_url TEXT;

-- Update RLS policies to include the new columns
-- (The existing policies should already cover these new columns, 
-- but including this comment for clarity)
