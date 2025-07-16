/*
  # Fix profiles table RLS policies for proper access

  1. Changes
    - Drop existing policies
    - Create new policies with proper access control
    - Fix admin access and public read permissions
  
  2. Security
    - Allow public read access to profiles
    - Allow authenticated users to read all profiles
    - Allow users to update their own profile
    - Allow admins full access to all profiles
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles read access" ON profiles;
DROP POLICY IF EXISTS "Authenticated profiles read access" ON profiles;
DROP POLICY IF EXISTS "Self profile update access" ON profiles;
DROP POLICY IF EXISTS "Admin profile update access" ON profiles;
DROP POLICY IF EXISTS "Admin profile delete access" ON profiles;
DROP POLICY IF EXISTS "Admin profile insert access" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to profiles
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
USING (role = 'admin');

-- Allow admins to delete profiles
CREATE POLICY "Admin profile delete access"
ON profiles FOR DELETE
TO authenticated
USING (role = 'admin');

-- Allow admins to insert new profiles
CREATE POLICY "Admin profile insert access"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (role = 'admin');
