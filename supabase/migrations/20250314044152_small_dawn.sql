/*
  # Remove client_id column from referrals table
  
  1. Changes
    - Drop existing policies that depend on client_id
    - Drop client_id column
    - Create new simplified policies without client_id dependency
  
  2. Security
    - Maintain basic authentication checks
    - Allow authenticated users to perform CRUD operations
  
  3. Notes
    - Client identification now handled through webhook payload only
    - All policies updated to work without client_id references
*/

-- First drop the existing policies that depend on client_id
DROP POLICY IF EXISTS "Users can view their own referrals" ON referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON referrals;
DROP POLICY IF EXISTS "Users can update their own referrals" ON referrals;

-- Now we can safely drop the foreign key constraint and column
ALTER TABLE referrals
DROP CONSTRAINT IF EXISTS referrals_client_id_fkey;

ALTER TABLE referrals
DROP COLUMN IF EXISTS client_id;

-- Create new simplified policies that don't depend on client_id
CREATE POLICY "Authenticated users can create referrals"
  ON referrals
  FOR INSERT
  TO authenticated;

CREATE POLICY "Users can view referrals"
  ON referrals
  FOR SELECT
  TO authenticated;

CREATE POLICY "Users can update referrals"
  ON referrals
  FOR UPDATE
  TO authenticated;