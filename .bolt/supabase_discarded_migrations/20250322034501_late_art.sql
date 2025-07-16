/*
  # Add addresses table and geocoding functionality

  1. New Tables
    - `addresses`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references profiles.id)
      - `street` (text)
      - `city` (text)
      - `state` (text)
      - `postal_code` (text)
      - `country` (text, default 'USA')
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `status` (text, default 'Active')
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `processed_at` (timestamptz)

  2. Security
    - Enable RLS on `addresses` table
    - Add policies for authenticated users to:
      - View addresses they have access to
      - Create new addresses
      - Update addresses they have access to
    - Add policy for admins to manage all addresses

  3. Functions
    - Add function to validate address components
    - Add function to update address timestamps
*/

-- Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id),
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'USA',
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  CONSTRAINT valid_coordinates CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
);

-- Enable Row Level Security
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Create function to validate address components
CREATE OR REPLACE FUNCTION validate_address()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate state format (2 uppercase letters)
  IF NOT NEW.state ~ '^[A-Z]{2}$' THEN
    RAISE EXCEPTION 'State must be a valid two-letter code';
  END IF;

  -- Basic street validation (must start with number)
  IF NOT NEW.street ~ '^\d+.*' THEN
    RAISE EXCEPTION 'Street address must start with a number';
  END IF;

  -- Optional postal code validation (if provided)
  IF NEW.postal_code IS NOT NULL AND NOT NEW.postal_code ~ '^\d{5}(-\d{4})?$' THEN
    RAISE EXCEPTION 'Invalid postal code format';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for address validation
CREATE TRIGGER validate_address_trigger
  BEFORE INSERT OR UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION validate_address();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_address_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER update_address_timestamp
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_address_timestamp();

-- Create policies for address access

-- Allow users to view addresses they have access to
CREATE POLICY "Users can view addresses"
  ON addresses FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow users to create addresses
CREATE POLICY "Users can create addresses"
  ON addresses FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow users to update addresses they have access to
CREATE POLICY "Users can update addresses"
  ON addresses FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to delete addresses
CREATE POLICY "Admins can delete addresses"
  ON addresses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_addresses_client_id ON addresses(client_id);
CREATE INDEX idx_addresses_status ON addresses(status);
CREATE INDEX idx_addresses_coordinates ON addresses(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
