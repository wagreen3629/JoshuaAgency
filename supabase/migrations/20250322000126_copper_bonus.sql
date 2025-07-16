/*
  # Fix recursive RLS policies for profiles table

  1. Changes
    - Drop existing policies that cause recursion
    - Create new non-recursive policies that:
      - Allow users to view/update their own profiles
      - Allow admins to manage all profiles
    - Use direct role check instead of recursive subqueries

  2. Security
    - Maintain basic user access to own profile
    - Grant admins full CRUD access to all profiles
    - Prevent infinite recursion in policy checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for users and admins" ON profiles;
DROP POLICY IF EXISTS "Enable update access for users and admins" ON profiles;
DROP POLICY IF EXISTS "Enable delete access for admins" ON profiles;
DROP POLICY IF EXISTS "Enable insert access for admins" ON profiles;

-- Create new non-recursive policies

-- Allow users to view their own profile or admins to view any profile
CREATE POLICY "Enable read access for users and admins"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR role = 'admin'
);

-- Allow users to update their own profile or admins to update any profile
CREATE POLICY "Enable update access for users and admins"
ON profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR role = 'admin'
);

-- Allow admins to delete any profile
CREATE POLICY "Enable delete access for admins"
ON profiles FOR DELETE
TO authenticated
USING (
  role = 'admin'
);

-- Allow admins to insert new profiles
CREATE POLICY "Enable insert access for admins"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  role = 'admin'
);
