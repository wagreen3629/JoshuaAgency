/*
  # Add phone sync trigger

  1. Changes
    - Add trigger to sync phone field between profiles and users tables
    - Create trigger function to handle phone updates
  
  2. Security
    - Function runs with SECURITY DEFINER to ensure proper permissions
*/

-- Create function to sync phone updates
CREATE OR REPLACE FUNCTION sync_phone_to_users()
RETURNS trigger AS $$
BEGIN
  -- Update the phone in auth.users when it changes in profiles
  UPDATE auth.users 
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{phone}',
    to_jsonb(NEW.phone)
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync phone updates
CREATE TRIGGER sync_phone_on_update
  AFTER UPDATE OF phone ON public.profiles
  FOR EACH ROW
  WHEN (OLD.phone IS DISTINCT FROM NEW.phone)
  EXECUTE FUNCTION sync_phone_to_users();