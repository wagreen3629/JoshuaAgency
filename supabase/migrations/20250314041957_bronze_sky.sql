/*
  # Create referrals storage bucket and tables

  1. New Tables
    - `referrals`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references profiles.id)
      - `file_path` (text)
      - `file_name` (text)
      - `file_size` (bigint)
      - `mime_type` (text)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `processed_at` (timestamptz)

  2. Security
    - Enable RLS on `referrals` table
    - Add policies for authenticated users to:
      - View their own referrals
      - Upload new referrals
      - Update their own referrals
    - Add policy for admins to view all referrals

  3. Storage
    - Create storage bucket for referral documents
    - Add storage policies for secure access
*/

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Create policies for referrals table
CREATE POLICY "Users can view their own referrals"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Users can create referrals"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update their own referrals"
  ON referrals
  FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Admins can view all referrals"
  ON referrals
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Create storage bucket for referrals
INSERT INTO storage.buckets (id, name, public)
VALUES ('referrals', 'referrals', false);

-- Enable storage bucket policies
CREATE POLICY "Authenticated users can upload referrals"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'referrals' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own referrals"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'referrals' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can access all referrals"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'referrals' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to update referral timestamps
CREATE OR REPLACE FUNCTION update_referral_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER update_referral_timestamp
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_timestamp();
