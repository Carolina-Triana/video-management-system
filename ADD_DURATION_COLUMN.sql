-- Add duration column to videos table
-- Duration is stored in seconds (integer)

ALTER TABLE videos 
ADD COLUMN duration INTEGER NOT NULL DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN videos.duration IS 'Video duration in seconds';
