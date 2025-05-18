/*
  # Add phone column to users table
  
  1. Changes
     - Add phone column to auth.users table
     - Update trigger function to sync phone field between tables
*/

-- Add phone column to auth.users table
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS phone text;

-- Update the trigger function to sync phone field
CREATE OR REPLACE FUNCTION handle_profile_update()
RETURNS trigger AS $$
BEGIN
  -- Update auth.users when profile is updated
  UPDATE auth.users
  SET 
    raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{phone}',
      to_jsonb(NEW.phone)
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'sync_profile_to_user'
  ) THEN
    CREATE TRIGGER sync_profile_to_user
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_profile_update();
  END IF;
END
$$;