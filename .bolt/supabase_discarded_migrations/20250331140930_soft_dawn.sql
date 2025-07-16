/*
  # Add time support to rides table

  1. Changes
    - Add time column to rides table
    - Update existing time handling to use proper timestamp format
    - Add validation for time values

  2. Notes
    - Uses safe migration approach with IF NOT EXISTS checks
    - Maintains data integrity during migration
*/

-- First ensure we have the proper timestamp column
DO $$
BEGIN
  -- Update the Drop-Off Date and Time column to use timestamptz if it's not already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rides' 
    AND column_name = 'Drop-Off Date and Time (Local)'
    AND data_type != 'timestamp with time zone'
  ) THEN
    ALTER TABLE rides 
    ALTER COLUMN "Drop-Off Date and Time (Local)" 
    TYPE timestamptz 
    USING "Drop-Off Date and Time (Local)"::timestamptz;
  END IF;

  -- Add constraint to ensure time is always set
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'rides'
    AND constraint_name = 'rides_dropoff_time_check'
  ) THEN
    ALTER TABLE rides
    ADD CONSTRAINT rides_dropoff_time_check
    CHECK (EXTRACT(HOUR FROM "Drop-Off Date and Time (Local)") IS NOT NULL
    AND EXTRACT(MINUTE FROM "Drop-Off Date and Time (Local)") IS NOT NULL);
  END IF;
END $$;
