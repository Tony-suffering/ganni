-- Add image_analysis column to photo_scores table for detailed image analysis data
-- This column stores JSON data with detailed image analysis information

ALTER TABLE photo_scores 
ADD COLUMN IF NOT EXISTS image_analysis JSONB;

-- Add comment to explain the column
COMMENT ON COLUMN photo_scores.image_analysis IS 'Detailed image analysis data including colors, composition, subjects, and technical features in JSON format';

-- Create index on specific JSON fields for better query performance
CREATE INDEX IF NOT EXISTS idx_photo_scores_image_analysis_main_colors 
ON photo_scores USING GIN ((image_analysis->'mainColors'));

CREATE INDEX IF NOT EXISTS idx_photo_scores_image_analysis_composition 
ON photo_scores USING GIN ((image_analysis->'compositionType'));

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'photo_scores' 
AND column_name = 'image_analysis';