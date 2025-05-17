/*
  # Address Processing System Implementation

  1. New Tables
    - `addresses`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references profiles.id)
      - `address` (text, full formatted address)
      - `street` (text)
      - `city` (text)
      - `state` (text)
      - `postal_code` (text)
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `status` (text, default 'Active')
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `geocoded_at` (timestamptz)
      - `geocoding_attempts` (integer)
      - `last_error` (text)

  2. Functions
    - Address validation function
    - Geocoding retry function
    - Address processing trigger function

  3. Security
    - Enable RLS
    - Add appropriate access policies
*/

-- Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  address text NOT NULL,
  street text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  latitude numeric(10,8),
  longitude numeric(11,8),
  status text NOT NULL DEFAULT 'Active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  geocoded_at timestamptz,
  geocoding_attempts integer DEFAULT 0,
  last_error text,
  
  -- Add constraints
  CONSTRAINT valid_coordinates CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  ),
  CONSTRAINT valid_status CHECK (status IN ('Active', 'Inactive')),
  CONSTRAINT valid_postal_code CHECK (postal_code ~ '^\d{5}(-\d{4})?$'),
  CONSTRAINT max_geocoding_attempts CHECK (geocoding_attempts <= 3)
);

-- Enable RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Create address validation function
CREATE OR REPLACE FUNCTION validate_address()
RETURNS trigger AS $$
BEGIN
  -- Validate required fields
  IF NEW.street IS NULL OR NEW.city IS NULL OR NEW.state IS NULL OR NEW.postal_code IS NULL THEN
    RAISE EXCEPTION 'Missing required address components';
  END IF;

  -- Validate state format (2 uppercase letters)
  IF NOT NEW.state ~ '^[A-Z]{2}$' THEN
    RAISE EXCEPTION 'Invalid state format. Must be 2 uppercase letters.';
  END IF;

  -- Validate street address format (must start with number)
  IF NOT NEW.street ~ '^\d+.*' THEN
    RAISE EXCEPTION 'Street address must start with a number';
  END IF;

  -- Set the full formatted address
  NEW.address := NEW.street || ', ' || NEW.city || ', ' || NEW.state || ' ' || NEW.postal_code;

  -- Ensure address length is within limits
  IF length(NEW.address) > 1000 THEN
    RAISE EXCEPTION 'Address exceeds maximum length of 1000 characters';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create geocoding function with retry logic
CREATE OR REPLACE FUNCTION process_address_geocoding()
RETURNS trigger AS $$
DECLARE
  retry_count INTEGER := 0;
  max_retries CONSTANT INTEGER := 3;
  retry_interval CONSTANT INTEGER := 2; -- seconds
BEGIN
  -- Only process if coordinates are not set
  IF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
    -- Update attempt counter
    NEW.geocoding_attempts := COALESCE(NEW.geocoding_attempts, 0) + 1;
    
    -- Check if max attempts exceeded
    IF NEW.geocoding_attempts > max_retries THEN
      NEW.last_error := 'Maximum geocoding attempts reached';
      RETURN NEW;
    END IF;

    -- Record geocoding attempt
    NEW.geocoded_at := now();
    
    -- Note: Actual geocoding API call would be handled by external service
    -- This function sets up the structure for the geocoding process
    
    -- For now, we'll just update the status to indicate processing
    NEW.last_error := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER validate_address_trigger
  BEFORE INSERT OR UPDATE OF street, city, state, postal_code
  ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION validate_address();

CREATE TRIGGER process_address_geocoding_trigger
  BEFORE INSERT OR UPDATE OF street, city, state, postal_code
  ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION process_address_geocoding();

-- Create update timestamp trigger
CREATE OR REPLACE FUNCTION update_address_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_address_timestamp
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_address_timestamp();

-- Create RLS policies
CREATE POLICY "Users can view their own addresses"
  ON addresses FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Users can create addresses"
  ON addresses FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update their own addresses"
  ON addresses FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Admins have full access to addresses"
  ON addresses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_addresses_client_id ON addresses(client_id);
CREATE INDEX idx_addresses_status ON addresses(status);
CREATE INDEX idx_addresses_coordinates ON addresses(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_addresses_postal_code ON addresses(postal_code);

-- Add audit logging
CREATE TABLE IF NOT EXISTS address_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address_id uuid REFERENCES addresses(id) ON DELETE CASCADE,
  action text NOT NULL,
  changes jsonb,
  performed_by uuid REFERENCES auth.users(id),
  performed_at timestamptz DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE address_audit_log ENABLE ROW LEVEL SECURITY;

-- Create audit log trigger
CREATE OR REPLACE FUNCTION log_address_changes()
RETURNS trigger AS $$
BEGIN
  INSERT INTO address_audit_log (
    address_id,
    action,
    changes,
    performed_by
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE
      WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old_data', row_to_json(OLD))
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old_data', row_to_json(OLD), 'new_data', row_to_json(NEW))
      ELSE jsonb_build_object('new_data', row_to_json(NEW))
    END,
    auth.uid()
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER address_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION log_address_changes();

-- Create RLS policies for audit log
CREATE POLICY "Admins can view audit logs"
  ON address_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );