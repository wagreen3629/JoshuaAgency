/*
  # Create admin user

  1. New Data
    - Creates an admin user with email williamagreen@gmail.com
    - Sets the user role to 'admin' in the profiles table
  
  2. Security
    - Uses secure password hashing through Supabase Auth
*/

-- First, check if the user already exists to avoid errors
DO $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'williamagreen@gmail.com'
  ) INTO user_exists;

  IF NOT user_exists THEN
    -- Insert the user into auth.users table with a hashed password
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'williamagreen@gmail.com',
      crypt('Marla123$', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Update the profiles table to set the user as admin
    -- This relies on the trigger we created earlier to insert the basic profile
    UPDATE profiles 
    SET role = 'admin' 
    WHERE email = 'williamagreen@gmail.com';
  END IF;
END $$;