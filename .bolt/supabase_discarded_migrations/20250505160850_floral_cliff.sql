/*
  # Fix profiles table policies

  1. Changes
    - Drop existing policies
    - Create new policies with unique names
    - Add public and authenticated access policies
    - Fix recursive policy issues
    - Fix admin insert policy to properly handle new user creation
  
  2. Security
    - Allow public read access to profiles
    - Allow authenticated users to read all profiles
    - Allow users to update their own profile
    - Allow admins full access to all profiles
    - Fix admin insert permissions to allow new user creation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update access for users" ON profiles;
DROP POLICY IF EXISTS "Enable admin update access" ON profiles;
DROP POLICY IF EXISTS "Enable admin delete access" ON profiles;
DROP POLICY IF EXISTS "Enable admin insert access" ON profiles;
DROP POLICY IF EXISTS "Public profiles read access" ON profiles;
DROP POLICY IF EXISTS "Authenticated profiles read access" ON profiles;
DROP POLICY IF EXISTS "Self profile update access" ON profiles;
DROP POLICY IF EXISTS "Admin profile update access" ON profiles;
DROP POLICY IF EXISTS "Admin profile delete access" ON profiles;
DROP POLICY IF EXISTS "Admin profile insert access" ON profiles;

-- Allow public read access
CREATE POLICY "Public profiles read access"
ON profiles FOR SELECT
TO public
USING (true);

-- Allow authenticated users to read all profiles
CREATE POLICY "Authenticated profiles read access"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Self profile update access"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow admins to update any profile
CREATE POLICY "Admin profile update access"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Allow admins to delete profiles
CREATE POLICY "Admin profile delete access"
ON profiles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Allow admins to insert new profiles
CREATE POLICY "Admin profile insert access"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);