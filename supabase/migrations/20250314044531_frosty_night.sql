/*
  # Fix RLS policies for referrals table
  
  1. Changes
    - Drop existing policies
    - Create new policies with proper permissions
    - Add admin policy for full access
  
  2. Security
    - Allow authenticated users to create and view referrals
    - Allow admins full access to all referrals
    - Maintain basic authentication checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can create referrals" ON referrals;
DROP POLICY IF EXISTS "Users can view referrals" ON referrals;
DROP POLICY IF EXISTS "Users can update referrals" ON referrals;

-- Create new policies with proper permissions
CREATE POLICY "Authenticated users can create referrals"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view referrals"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update referrals"
  ON referrals
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add admin policy for full access
CREATE POLICY "Admins have full access to referrals"
  ON referrals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );