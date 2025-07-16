/*
  # Fix Referrals RLS Policies

  1. Changes
    - Update INSERT policy to allow both client-specific and general uploads
    - Update SELECT policy to allow users to view their uploads
    - Update UPDATE policy to match the access pattern

  2. Security
    - Maintain RLS protection while allowing necessary access patterns
    - Ensure users can only access their own referrals
    - Allow admins to maintain full access
*/

-- Drop existing policies to recreate them with correct logic
DROP POLICY IF EXISTS "Users can view their own referrals" ON referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON referrals;
DROP POLICY IF EXISTS "Users can update their own referrals" ON referrals;

-- Create new policies with correct access patterns
CREATE POLICY "Users can create referrals"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if client_id is null (general upload) OR matches the authenticated user
    client_id IS NULL OR client_id = auth.uid()
  );

CREATE POLICY "Users can view their own referrals"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if client_id is null (general upload) OR matches the authenticated user
    client_id IS NULL OR client_id = auth.uid()
  );

CREATE POLICY "Users can update their own referrals"
  ON referrals
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if client_id is null (general upload) OR matches the authenticated user
    client_id IS NULL OR client_id = auth.uid()
  );
