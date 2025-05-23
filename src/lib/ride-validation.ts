import { supabase } from './supabase';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export async function validateClientForRide(clientId: string): Promise<ValidationResult> {
  const errors: string[] = [];

  try {
    // Get client details from Supabase
    const { data: client, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) {
      throw error;
    }

    if (!client) {
      throw new Error('Client not found');
    }

    // 1. Check client status
    if (client.status !== 'Active') {
      errors.push('Client status must be Active');
    }

    // 2. Check contract assignment
    if (!client.contract) {
      errors.push('Client must have an assigned contract');
    }

    // 3. Check phone number
    if (!client.phone) {
      errors.push('Client must have a registered phone number');
    }

    // 4. Check review status
    if (!client.reviewed) {
      errors.push('Client review process must be completed');
    }

    // 5. Check registered addresses
    const { data: addresses, error: addressError } = await supabase
      .from('addresses')
      .select('*')
      .eq('profile_id', clientId)
      .eq('status', 'Active');

    if (addressError) {
      throw addressError;
    }

    if (!addresses || addresses.length < 2) {
      errors.push('Client must have at least 2 registered active addresses');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    console.error('Error validating client:', error);
    return {
      isValid: false,
      errors: ['Failed to validate client eligibility']
    };
  }
}