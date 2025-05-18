/*
  # Add phone column to profiles table

  1. Changes
    - Add phone column to profiles table
    - Update trigger function to handle phone field
*/

-- Add phone column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

-- Update the trigger function to handle phone field
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    full_name,
    role,
    status,
    phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'status', 'Active'),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;