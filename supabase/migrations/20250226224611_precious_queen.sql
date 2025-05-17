/*
  # Add full_name column to profiles table

  1. Changes
    - Add `full_name` column to the `profiles` table
    - This allows storing the user's full name for display purposes

  2. Notes
    - Uses a safe migration approach with IF NOT EXISTS check
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN full_name TEXT;
  END IF;
END $$;