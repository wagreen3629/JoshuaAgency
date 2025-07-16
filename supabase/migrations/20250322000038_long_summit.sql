/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing policies
    - Add new policies that:
      - Allow users to view/update their own profiles
      - Allow admins to manage all profiles
    - Use unique policy names to avoid conflicts

  2. Security
    - Maintain basic user access to own profile
    - Grant admins full CRUD access to all profiles
    - Protect against unauthorized access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create new policies with unique names

-- Allow users to view their own profile or admins to view any profile
CREATE POLICY "Enable read access for users and admins"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow users to update their own profile or admins to update any profile
CREATE POLICY "Enable update access for users and admins"
ON profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to delete any profile
CREATE POLICY "Enable delete access for admins"
ON profiles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to insert new profiles
CREATE POLICY "Enable insert access for admins"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
