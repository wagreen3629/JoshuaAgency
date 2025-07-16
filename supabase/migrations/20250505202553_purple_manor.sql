/*
  # Add cleanup trigger for deleted profiles

  1. Changes
    - Add trigger to delete auth.users when profile is deleted
    - Ensure complete user cleanup on deletion
  
  2. Security
    - Maintain referential integrity
    - Prevent orphaned auth records
*/

-- Create function to handle profile deletion
CREATE OR REPLACE FUNCTION public.handle_profile_deleted()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the corresponding auth.users record
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run after profile deletion
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_deleted();
