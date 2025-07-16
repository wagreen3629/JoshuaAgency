/*
  # Add status column to profiles table

  1. Changes
    - Add status column to profiles table with default value 'Active'
    - Add check constraint to ensure valid status values
    - Update existing profiles to have 'Active' status

  2. Notes
    - Status can only be 'Active' or 'Inactive'
    - Default value is 'Active' for new users
*/

-- Add status column with check constraint
ALTER TABLE profiles 
ADD COLUMN status text NOT NULL DEFAULT 'Active'
CHECK (status IN ('Active', 'Inactive'));

-- Update existing profiles to have 'Active' status
UPDATE profiles SET status = 'Active' WHERE status IS NULL;
