import { fetchClientById, fetchClientAddresses } from './airtable';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export async function validateClientForRide(clientId: string): Promise<ValidationResult> {
  const errors: string[] = [];

  try {
    // Get client details from Airtable
    const client = await fetchClientById(clientId);

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
    if (!client.clientTelephone) {
      errors.push('Client must have a registered phone number');
    }

    // 4. Check review status
    if (!client.reviewed) {
      errors.push('Client review process must be completed');
    }

    // 5. Check registered addresses
    const addresses = await fetchClientAddresses(clientId);
    
    // Filter for active addresses only
    const activeAddresses = addresses.filter(addr => addr.status === 'Active');

    if (activeAddresses.length < 2) {
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
