import Airtable from 'airtable';
import { supabase } from './supabase';

// Initialize Airtable with API key
const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
const tableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME;

if (!apiKey || !baseId || !tableName) {
  throw new Error('Missing Airtable credentials. Please check your environment variables.');
}

// Configure Airtable
export const base = new Airtable({ apiKey }).base(baseId);

// Address interface
export interface Address {
  id: string;
  address: string;
  title: string;
  status: 'Active' | 'Inactive';
  notes: string;
  clientId: string;
  createdAt: string;
  thumbnail?: string;
}

// Address functions
export const fetchClientAddresses = async (clientId: string): Promise<Address[]> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    // First get the Client ID from the Clients table
    const clientRecords = await base(tableName).select({
      maxRecords: 1,
      view: "Grid view",
      filterByFormula: `RECORD_ID() = '${clientId}'`
    }).all();

    if (!clientRecords.length) {
      throw new Error('Client not found');
    }

    const clientAirtableId = clientRecords[0].get('Client ID') as string;

    if (!clientAirtableId) {
      console.warn('No Client ID found for client');
      return [];
    }

    // Then fetch addresses using the Client ID
    const records = await base('Addresses').select({
      filterByFormula: `{Client} = '${clientAirtableId}'`,
      sort: [{ field: 'createdDate', direction: 'desc' }]
    }).all();

    return records.map(record => ({
      id: record.id,
      address: record.get('Address') as string,
      title: record.get('Title') as string,
      status: record.get('Status') as 'Active' | 'Inactive',
      notes: record.get('Notes') as string,
      clientId: record.get('Client') as string,
      createdAt: record.get('createdDate') as string,
      thumbnail: record.get('Thumbnail') as string,
      latitude: record.get('Latitude') as string,
      longitude: record.get('Longitude') as string
    }));
  } catch (error) {
    console.error('Error fetching client addresses:', error);
    throw error;
  }
};

export const createAddress = async (address: Omit<Address, 'id' | 'createdAt'>): Promise<Address> => {
  try {
    console.log('Starting address creation:', { address });
    
    if (!base) {
      console.error('Database connection not initialized');
      return Promise.reject('Unable to connect to database. Please try again.');
    }

    // Validate address format
    if (!address.address.match(/^\d+.*,.*,.*$/)) {
      console.warn('Invalid address format:', address.address);
      return Promise.reject(
        'Please ensure the address includes:\n' +
        '• Street number and name\n' +
        '• City\n' +
        '• State/province\n\n' +
        'Example: "123 Main St, Montgomery, AL"'
      );
    }

    // Geocode the address
    const encodedAddress = encodeURIComponent(address.address);
    console.log('Geocoding address:', { encodedAddress });
    const serpApiKey = import.meta.env.VITE_SERPAPI_KEY;
    try {
      const serpApiResponse = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(
          `https://serpapi.com/search?engine=google_maps&q=${encodedAddress}&type=search&api_key=${serpApiKey}`
        )}`
      );

      if (!serpApiResponse.ok) {
        console.error('SerpAPI response not OK:', { status: serpApiResponse.status });
        return Promise.reject(
          'Unable to validate address location.\n' +
          'The geocoding service is currently unavailable.\n\n' +
          'Please try again later.'
        );
      }

      const proxyResponse = await serpApiResponse.json();
      console.log('Received proxy response');
      const searchResults = JSON.parse(proxyResponse.contents);
      console.log('Parsed search results:', { hasPlaceResults: !!searchResults.place_results });

      if (!searchResults.place_results) {
        return Promise.reject(
          'The provided address could not be found.\n\n' +
          'Please ensure:\n' +
          '• The address is complete with street number, street name, city, and state\n' +
          '• The address exists and is spelled correctly\n' +
          '• Do not include apartment or office numbers\n' +
          '• For international addresses, include the country name'
        );
      }

      const { latitude, longitude } = searchResults.place_results.gps_coordinates;
      const thumbnail = searchResults.place_results.thumbnail;
      console.log('Extracted coordinates and thumbnail:', { latitude, longitude, hasThumbnail: !!thumbnail });

      // Validate coordinates
      if (!latitude || !longitude || 
          isNaN(parseFloat(latitude)) || 
          isNaN(parseFloat(longitude))) {
        return Promise.reject(
          'Valid geolocation coordinates could not be obtained.\n\n' +
          'Please ensure:\n' +
          '• The address is complete with street number, street name, city, and state\n' +
          '• The address exists and is spelled correctly\n' +
          '• For international addresses, include the country name'
        );
      }

      console.log('Creating Airtable record with data:', { address: address.address, status: address.status, latitude, longitude });
      const record = await base('Addresses').create({
        Address: address.address,
        Title: address.title,
        Status: address.status,
        Notes: address.notes,
        Client: [address.clientId],
        Latitude: String(latitude),
        Longitude: String(longitude),
        Thumbnail: thumbnail
      });

      console.log('Successfully created address record:', { id: record.id });
      return {
        id: record.id,
        address: record.get('Address') as string,
        title: record.get('Title') as string,
        status: record.get('Status') as 'Active' | 'Inactive',
        notes: record.get('Notes') as string,
        clientId: record.get('Client') as string,
        createdAt: record.get('createdDate') as string,
        thumbnail: record.get('Thumbnail') as string
      };
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Network error during address creation:', error);
        return Promise.reject(
          'Unable to connect to the address validation service.\n\n' +
          'Please check your internet connection and try again.'
        );
      }
      // Pass through other errors
      console.error('Unexpected error during address creation:', error);
      return Promise.reject(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    }
  } catch (error) {
    console.error('Error creating address:', error);
    throw error;
  }
};

export const updateAddressStatus = async (id: string, status: 'Active' | 'Inactive'): Promise<boolean> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    await base('Addresses').update(id, {
      'Status': status
    });

    return true;
  } catch (error) {
    console.error('Error updating address status:', error);
    return false;
  }
};

export const deleteAddress = async (id: string): Promise<boolean> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    await base('Addresses').destroy(id);
    return true;
  } catch (error) {
    console.error('Error deleting address:', error);
    return false;
  }
};

// Contract interface
export interface Contract {
  id: string;
  name: string;
  contractNumber: string;
  signature: string;
  entity: string;
  city: string;
  county: string;
  state: string;
  mileageFee: number;
  tripFee: number;
  childFee: number;
  waitFee: number;
  wheelchairFee: number;
  notes: string;
  status: 'Active' | 'Inactive';
  contractUrl?: string;
  contractExpiration?: string;
}

// Contract functions
export const fetchContracts = async (): Promise<Contract[]> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    const records = await base('Contracts').select({
      maxRecords: 100,
      view: "Grid view"
    }).all();

    return records.map(record => ({
      id: record.id,
      name: record.get('Contract Name') as string,
      contractNumber: record.get('Contract Num') as string,
      entity: record.get('Entity') as string,
      city: record.get('City') as string,
      county: record.get('County') as string,
      state: record.get('State') as string,
      signature: record.get('Signature') as string,
      mileageFee: record.get('Mileage Fee') as number,
      tripFee: record.get('Trip Fee') as number,
      childFee: record.get('Child Fee') as number,
      waitFee: record.get('Wait Fee') as number,
      wheelchairFee: record.get('Wheelchair Fee') as number,
      notes: record.get('Notes') as string,
      status: record.get('Status') as 'Active' | 'Inactive',
      contractUrl: record.get('Contract') ? (record.get('Contract') as any)[0].url : undefined,
      contractExpiration: record.get('Contract Expiration') as string
    }));
  } catch (error) {
    console.error('Error fetching programs:', error);
    throw error;
  }
};

export const createContract = async (contractData: Omit<Contract, 'id'>): Promise<Contract | null> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    const record = await base('Contracts').create({
      'Contract Name': contractData.name,
      'Contract Number': contractData.contractNumber,
      'Entity': contractData.entity,
      'City': contractData.city,
      'County': contractData.county,
      'State': contractData.state,
      'Mileage Fee': contractData.mileageFee,
      'Trip Fee': contractData.tripFee,
      'Child Fee': contractData.childFee,
      'Wait Fee': contractData.waitFee,
      'Wheelchair Fee': contractData.wheelchairFee,
      'Notes': contractData.notes,
      'Status': contractData.status,
      'Contract Expiration': contractData.contractExpiration
    });

    return {
      id: record.id,
      name: record.get('Contract Name') as string,
      contractNumber: record.get('Contract Number') as string,
      entity: record.get('Entity') as string,
      city: record.get('City') as string,
      county: record.get('County') as string,
      state: record.get('State') as string,
      signature: record.get('Signature') as string,
      mileageFee: record.get('Mileage Fee') as number,
      tripFee: record.get('Trip Fee') as number,
      childFee: record.get('Child Fee') as number,
      waitFee: record.get('Wait Fee') as number,
      wheelchairFee: record.get('Wheelchair Fee') as number,
      notes: record.get('Notes') as string,
      status: record.get('Status') as 'Active' | 'Inactive',
      contractUrl: record.get('Contract') ? (record.get('Contract') as any)[0].url : undefined,
      contractExpiration: record.get('Contract Expiration') as string
    };
  } catch (error) {
    console.error('Error creating contract:', error);
    return null;
  }
};

export const updateContract = async (id: string, contractData: Partial<Contract>): Promise<Contract | null> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    const record = await base('Contracts').update(id, {
      'Contract Name': contractData.name,
      'Entity': contractData.entity,
      'City': contractData.city,
      'County': contractData.county,
      'State': contractData.state,
      'Signature': contractData.signature,
      'Mileage Fee': contractData.mileageFee,
      'Trip Fee': contractData.tripFee,
      'Child Fee': contractData.childFee,
      'Wait Fee': contractData.waitFee,
      'Wheelchair Fee': contractData.wheelchairFee,
      'Notes': contractData.notes,
      'Status': contractData.status,
      'Contract Expiration': contractData.contractExpiration
    });

    return {
      id: record.id,
      name: record.get('Contract Name') as string,
      contractNumber: record.get('Contract Number') as string,
      entity: record.get('Entity') as string,
      city: record.get('City') as string,
      county: record.get('County') as string,
      state: record.get('State') as string,
      signature: record.get('Signature') as string,
      mileageFee: record.get('Mileage Fee') as number,
      tripFee: record.get('Trip Fee') as number,
      childFee: record.get('Child Fee') as number,
      waitFee: record.get('Wait Fee') as number,
      wheelchairFee: record.get('Wheelchair Fee') as number,
      notes: record.get('Notes') as string,
      status: record.get('Status') as 'Active' | 'Inactive',
      contractUrl: record.get('Contract') ? (record.get('Contract') as any)[0].url : undefined,
      contractExpiration: record.get('Contract Expiration') as string
    };
  } catch (error) {
    console.error('Error updating contract:', error);
    return null;
  }
};

export const deleteContract = async (id: string): Promise<boolean> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    await base('Contracts').destroy(id);
    return true;
  } catch (error) {
    console.error('Error deleting contract:', error);
    return false;
  }
};

// Signature interface
export interface Signature {
  id: string;
  rideId: string;
  clientName: string;
  clientEmail: string;
  city: string;
  pickupAddress: string;
  dropoffAddress: string;
  dropoffDateTime: string;
  googleDistance: string;
  duration: number;
  status: string;
  requestedDate: string;
  guestName?: string;
  createdTime: string;
  contractNum: number;
  contractName: string;
  signature?: {
    url: string;
    filename: string;
  }[];
}

// Extended signature interface for export
export interface SignatureExport extends Signature {
  stops: string[];
  uberDistance: string;
}

// Fetch signatures from Airtable
export const fetchSignatures = async (): Promise<Signature[]> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    const allRecords: any[] = [];

    await base('Signatures').select({
      view: "Grid view",
      pageSize: 100 // you can increase this to 1000 max
    }).eachPage((records, fetchNextPage) => {
      allRecords.push(...records);
      fetchNextPage();
    });

    return allRecords.map(record => ({
      id: record.id,
      rideId: record.get('Ride ID') as string,
      signatureId: record.get('Signature ID') as number,
      clientName: record.get('Client Name (from Client)') as string,
      clientEmail: record.get('Client Email (from Client)') as string,
      city: record.get('City (from Ride)') as string,
      pickupAddress: record.get('Pickup Address (from Ride)') as string,
      dropoffAddress: record.get('Drop-off Address (from Ride)') as string,
      dropoffDateTime: record.get('Drop-Off Date and Time (Local) (from Ride)') as string,
      googleDistance: record.get('Google Distance (mi) (from Ride)') as string,
      duration: record.get('Duration (min) (from Ride)') as number,
      status: record.get('Status') as string,
      requestedDate: record.get('Requested Date') as string,
      guestName: record.get('Guest Name (from Ride)') as string,
      createdTime: record.createdTime,
      contractNum: record.get('Contract (from Client)') as number,
      contractName: record.get('Contract Name (from Contract) (from Client)') as string,
      signature: record.get('Signature') as { url: string; filename: string }[]
    }));
  } catch (error) {
    console.error('Error fetching signatures:', error);
    throw error;
  }
};


// Fetch signatures with additional fields for export
export const fetchSignaturesForExport = async (): Promise<SignatureExport[]> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    const records = await base('Signatures').select({
      maxRecords: 5000,
      view: "Grid view",
      filterByFormula: "{Status} = 'Prepared'"
    }).all();

    return records.map(record => ({
      id: record.id,
      rideId: record.get('Ride ID') as string,
      clientName: record.get('Client Name (from Client)') as string,
      clientEmail: record.get('Client Email (from Client)') as string,
      city: record.get('City (from Ride)') as string,
      pickupAddress: record.get('Pickup Address (from Ride)') as string,
      dropoffAddress: record.get('Drop-off Address (from Ride)') as string,
      dropoffDateTime: record.get('Drop-Off Date (Local) (from Ride)') as string,
      googleDistance: record.get('Google Distance (mi) (from Ride)') as string,
      duration: record.get('Duration (min) (from Ride)') as number,
      status: record.get('Status') as string,
      requestedDate: record.get('Request Date and Time (Local) (from Ride)') as string,
      guestName: record.get('Guest Name (from Ride)') as string,
      createdTime: record.createdTime,
      signature: record.get('Signature') as { url: string; filename: string }[],
      stops: record.get('Stops') as string[],
      uberDistance: record.get('Uber Distance (mi) (from Ride)') as string,
      contractNum: record.get('Contract (from Client)') as number,
      contractName: record.get('Contract Name (from Contract) (from Client)') as string
    }));
  } catch (error) {
    console.error('Error fetching signatures for export:', error);
    throw error;
  }
};

// Client interfaces
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  reviewed: boolean;
  createdDate: string;
  contract: string | null;
}

export interface ClientDetails extends Client {
  clientName: string;
  clientEmail: string;
  clientTelephone: string;
  county: string;
  caseManager: string;
  telephone: string;
  email: string;
  paymentResponsibility: string;
  ssn: string;
  address: string;
  city: string;
  zipCode: string;
  otherTelephone: string;
  additionalInformation: string;
  program: string | string[];
  activity: string | string[];
  dateNeeded: string;
  contract: string;
  notes: string;
  createdDate: string;
  referralFile?: { url: string; filename: string }[];
  attachments?: { url: string; filename: string }[];
}

// Client functions
export const createClient = async (clientData: Partial<Client>): Promise<Client | null> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    // If contract is specified, find its record ID first
    let contractRecordId = null;
    if (clientData.contract) {
      const contractRecords = await base('Contracts').select({
        maxRecords: 1,
        filterByFormula: `{Contract Num} = '${clientData.contract}'`
      }).all();
      
      if (contractRecords.length === 0) {
        throw new Error('Contract not found');
      }
      
      contractRecordId = contractRecords[0].id;
    }

    const record = await base(tableName).create({
      'Name': clientData.name || '',
      'Email': clientData.email || '',
      'Client Telephone': clientData.clientTelephone || '',
      'Status': clientData.status || 'Active', 
      'Reviewed': clientData.reviewed || false,
      'Client Name': clientData.clientName || clientData.name || '',
      'Client Email': clientData.clientEmail || clientData.email || '',
      'County': clientData.county || '',
      'Case Manager': clientData.caseManager || '',
      'Telephone': clientData.telephone || '',
      'Payment Responsibility': clientData.paymentResponsibility || '',
      'SSN': clientData.ssn || '',
      'Address': clientData.address || '',
      'City': clientData.city || '',
      'Zip Code': clientData.zipCode || '',
      'Other Telephone': clientData.otherTelephone || '',
      'Additional Information': clientData.additionalInformation || '',
      'Program': Array.isArray(clientData.program) ? clientData.program : clientData.program ? [clientData.program] : [],
      'Activity': Array.isArray(clientData.activity) ? clientData.activity : clientData.activity ? [clientData.activity] : [],
      'Date Needed': clientData.dateNeeded || '',
      'Contract': contractRecordId ? [contractRecordId] : null,
      'Notes': clientData.notes || ''
    });

    return {
      id: record.id,
      name: record.get('Client Name') as string,
      email: record.get('Client Email') as string,
      phone: record.get('Client Telephone') as string,
      status: record.get('Status') as string,
      reviewed: record.get('Reviewed') as boolean,
      createdDate: record.createdTime
    };
  } catch (error) {
    console.error('Error creating client:', error);
    return null;
  }
};

export const updateClient = async (id: string, clientData: Partial<ClientDetails>): Promise<boolean> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }
    
    // If contract is specified, find its record ID first
    let contractRecordId = null;
    if (clientData.contract) {
      const contractRecords = await base('Contracts').select({
        maxRecords: 1,
        filterByFormula: `{Contract Num} = '${clientData.contract}'`
      }).all();
      
      if (contractRecords.length === 0) {
        throw new Error('Contract not found');
      }
      
      contractRecordId = contractRecords[0].id;
    }

    await base(tableName).update(id, {
      'Name': clientData.name,
      'Email': clientData.email,
      'Phone': clientData.phone,
      'Status': clientData.status,
      'Reviewed': clientData.reviewed,
      'Client Name': clientData.clientName,
      'Client Email': clientData.clientEmail,
      'Client Telephone': clientData.clientTelephone,
      'County': clientData.county,
      'Case Manager': clientData.caseManager,
      'Telephone': clientData.telephone,
      'Payment Responsibility': clientData.paymentResponsibility,
      'SSN': clientData.ssn,
      'Address': clientData.address,
      'City': clientData.city,
      'Zip Code': clientData.zipCode,
      'Other Telephone': clientData.otherTelephone,
      'Additional Information': clientData.additionalInformation,
      'Program': Array.isArray(clientData.program) ? clientData.program : [clientData.program],
      'Activity': Array.isArray(clientData.activity) ? clientData.activity : [clientData.activity],
      'Date Needed': clientData.dateNeeded,
      'Contract': contractRecordId ? [contractRecordId] : null,
      'Notes': clientData.notes
    });

    return true;
  } catch (error) {
    console.error('Error updating client:', error);
    return false;
  }
};

export const fetchClients = async (): Promise<Client[]> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    // Initialize arrays to store all records and contract data
    let allRecords = [];

    await base(tableName).select({
      view: "Grid view",
      pageSize: 100
    }).eachPage(function page(records, fetchNextPage) {
      allRecords = [...allRecords, ...records];
      fetchNextPage(); // this handles the offset for you
    });


    // Get all contracts first
    const contractRecords = await base('Contracts').select({
      maxRecords: 100,
      view: "Grid view"
    }).all();

    // Create a map of contract IDs to contract numbers
    const contractMap = new Map(
      contractRecords.map(record => [
        record.id,
        record.get('Contract Num') as string || null
      ])
    );

    return allRecords.map(record => ({
      id: record.id,
      name: record.get('Client Name') as string,
      email: record.get('Client Email') as string,
      phone: record.get('Client Telephone') as string,
      status: record.get('Status') as string,
      reviewed: record.get('Reviewed') as boolean,
      createdDate: record.get('createdDate') as string,
      contract: record.get('Contract') ? contractMap.get((record.get('Contract') as string[])[0]) || null : null
    }));
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

export const fetchClientById = async (id: string): Promise<ClientDetails | null> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    const record = await base(tableName).find(id);

    if (!record) {
      return null;
    }

    // Get the contract number directly from the Contract field
    let contractNumber = '';
    let contractName = '';
    const contractIds = record.get('Contract');
    if (contractIds && Array.isArray(contractIds) && contractIds.length > 0) {
      const contractRecord = await base('Contracts').find(contractIds[0]);
      if (contractRecord) {
        contractNumber = contractRecord.get('Contract Num') as string;
        contractName = contractRecord.get('Contract Name') as string;
      }
    }

    return {
      id: record.id,
      name: record.get('Client Name') as string,
      email: record.get('Email') as string,
      phone: record.get('Client Telephone') as string,
      status: record.get('Status') as string,
      reviewed: record.get('Reviewed') as boolean,
      clientName: record.get('Client Name') as string,
      clientEmail: record.get('Client Email') as string,
      clientTelephone: record.get('Client Telephone') as string,
      county: record.get('County') as string,
      caseManager: record.get('Case Manager') as string,
      telephone: record.get('Telephone') as string,
      paymentResponsibility: record.get('Payment Responsibility') as string,
      ssn: record.get('SSN') as string,
      address: record.get('Address') as string,
      city: record.get('City') as string,
      zipCode: record.get('Zip Code') as string,
      otherTelephone: record.get('Other Telephone') as string,
      additionalInformation: record.get('Additional Information') as string,
      program: record.get('Program') as string,
      activity: record.get('Activity') as string,
      dateNeeded: record.get('Date Needed') as string,
      contract: contractNumber,
      contractName: contractName,
      notes: record.get('Notes') as string,
      createdDate: record.createdTime,
      referralFile: record.get('Referral File') as { url: string; filename: string }[],
      attachments: record.get('Attachments') as { url: string; filename: string }[]
    };
  } catch (error) {
    console.error('Error fetching client:', error);
    return null;
  }
};

export const toggleClientReviewed = async (id: string, reviewed: boolean): Promise<boolean> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    await base(tableName).update(id, {
      'Reviewed': reviewed
    });

    return true;
  } catch (error) {
    console.error('Error toggling client reviewed status:', error);
    return false;
  }
};

// Add the missing deleteClient function
export const deleteClient = async (id: string): Promise<boolean> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    // First get the Client ID from the Clients table
    const clientRecords = await base(tableName).select({
      maxRecords: 1,
      view: "Grid view",
      filterByFormula: `RECORD_ID() = '${id}'`
    }).all();

    if (!clientRecords.length) {
      throw new Error('Client not found');
    }

    const clientAirtableId = clientRecords[0].get('Client ID') as string;
    
    console.log('Deleting Client Num: ',clientAirtableId);

    if (!clientAirtableId) {
      console.warn('No Client ID found for client');
      return false;
    }

    // Delete associated rides
    const rides = await base('Rides').select({
      filterByFormula: `{Client ID} = '${clientAirtableId}'`
    }).all();
    
    for (const ride of rides) {
      await base('Rides').destroy(ride.id);
    }

    // Delete associated signatures
    const signatures = await base('Signatures').select({
      filterByFormula: `{Client} = '${clientAirtableId}'`
    }).all();
    
    for (const signature of signatures) {
      await base('Signatures').destroy(signature.id);
    }

    // Delete associated addresses
    const addresses = await base('Addresses').select({
      filterByFormula: `{Client} = '${clientAirtableId}'`
    }).all();
    
    for (const address of addresses) {
      await base('Addresses').destroy(address.id);
    }

    // Finally delete the client
    await base(tableName).destroy(id);
    return true;
  } catch (error) {
    console.error('Error deleting client:', error);
    return false;
  }
};

// Note interface
export interface Note {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  clientId: string;
}

// Fetch client notes from Airtable
export const fetchClientNotes = async (clientId: string): Promise<Note[]> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    // First get the Client ID from the Clients table
    const clientRecords = await base(tableName).select({
      maxRecords: 1,
      view: "Grid view",
      filterByFormula: `RECORD_ID() = '${clientId}'`
    }).all();

    if (!clientRecords.length) {
      throw new Error('Client not found');
    }

    const clientAirtableId = clientRecords[0].get('Client ID') as string;

    if (!clientAirtableId) {
      console.warn('No Client ID found for client');
      return [];
    }

    // Then fetch notes using the Client ID
    const records = await base('Notes').select({
      filterByFormula: `{ClientID} = '${clientAirtableId}'`,
      sort: [{ field: 'Created Date', direction: 'desc' }]
    }).all();

    return records.map(record => ({
      id: record.id,
      content: record.get('Note') as string,
      createdBy: record.get('Created By') as string,
      createdAt: record.get('Created Date') as string,
      clientId: record.get('ClientID') as string
    }));
  } catch (error) {
    console.error('Error fetching client notes:', error);
    return [];
  }
};

// Create a new note
export const createClientNote = async (clientId: string, content: string, createdBy: string): Promise<Note | null> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    // First get the Client ID from the Clients table
    const clientRecords = await base(tableName).select({
      maxRecords: 1,
      view: "Grid view",
      filterByFormula: `RECORD_ID() = '${clientId}'`
    }).all();

    if (!clientRecords.length) {
      throw new Error('Client not found');
    }

    const clientAirtableId = clientRecords[0].get('Client ID') as string;

    console.log('clientAirtableId: ', clientAirtableId);

    if (!clientAirtableId) {
      throw new Error('No Client ID found for client');
    }

    // Get current user from Supabase auth
    const { data: { session } } = await supabase.auth.getSession();
    let userFullName = createdBy; // Default to passed name if auth fails
    
    if (session?.user) {
      // Try to get user's profile from Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', session.user.id)
        .single();
      
      // Use full name if available, otherwise email, otherwise default
      userFullName = profile?.full_name || profile?.email || createdBy;
    }

    console.log('content: ', content);
    console.log('userFullName: ', userFullName);
    console.log('clientAirtableId: ', clientAirtableId);
    console.log('clientId: ', clientId);
    
    const record = await base('Notes').create({
      'Note': content,
      'Created By': userFullName,
      'ClientID': [clientId]
    });

    return {
      id: record.id,
      content: record.get('Note') as string,
      createdBy: record.get('Created By') as string,
      createdAt: record.get('Created Date') as string,
      clientId: record.get('Client Name') as string
    };
  } catch (error) {
    console.error('Error creating note:', error);
    return null;
  }
};

// Delete a note
export const deleteClientNote = async (noteId: string): Promise<boolean> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }
    
    await base('Notes').destroy(noteId);
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    return false;
  }
};

// Ride interface
export interface Ride {
  id: string;
  OrgID: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  driver: string;
  status: string;
  service: string;
  program: string;
  group: string;
  city: string;
  pickupAddress: string;
  dropoffAddress: string;
  dropoffDateTime: string;
  requestDateTime: string;
  duration: number;
  googleDistance: string;
  uberDistance: string;
  fare: number;
  taxes: number;
  totalFare: number;
  paymentMethod: string;
  transactionType: string;
  signatureRequested: string;
  noShow: string;
  guestName: string;
  createdTime: string;
  RideNum: number;
  sigStatus: string;
  tripID: string;
  contractNum: number;
  contractName: string;
  pickupTime: string;
  pickupDay: string;
}

// Fetch rides from Airtable
export const fetchRides = async (): Promise<Ride[]> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    const allRecords: any[] = [];

    await base('Rides').select({
      view: "Grid view",
      pageSize: 100
    }).eachPage((records, fetchNextPage) => {
      allRecords.push(...records);
      fetchNextPage();
    });

    return allRecords.map(record => ({
      id: record.id,
      OrgID: record.get('OrgID') as string,      
      clientId: record.get('Client ID') as string,
      rideNum: record.get('RideNum') as number,
      clientName: record.get('Client Name (from Client ID)') as string,
      clientEmail: record.get('Client Email (from Client ID)') as string,
      driver: record.get('Driver') as string,
      status: record.get('Status') as string,
      service: record.get('Service') as string,
      program: record.get('Program') as string,
      group: record.get('Group') as string,
      city: record.get('City') as string,
      pickupAddress: record.get('Pickup Address') as string,
      dropoffAddress: record.get('Drop-off Address') as string,
      dropoffDateTime: record.get('Drop-Off Date and Time (Local)') as string,
      requestDateTime: record.get('Request Date and Time (Local)') as string,
      duration: record.get('Duration (min)') as number,
      googleDistance: record.get('Google Distance (mi)') as string,
      uberDistance: record.get('Uber Distance (mi)') as string,
      fare: record.get('Fare') as number,
      taxes: record.get('Taxes') as number,
      totalFare: record.get('Total Fare') as number,
      paymentMethod: record.get('Payment Method') as string,
      transactionType: record.get('Transaction Type') as string,
      signatureRequested: record.get('Signature Requested') as string,
      sigStatus: record.get('Status (from Signatures)') as string,
      noShow: record.get('No Show') as string,
      guestName: record.get('Guest Name') as string,
      createdTime: record.createdTime,
      tripID: record.get('Trip ID') as string,
      contractNum: record.get('Contract (from Client ID)') as number,
      contractName: record.get('Contract Name (from Contract) (from Client ID)') as string,
      pickupTime: record.get('Pickup Time') as string,
      pickupDay: record.get('Pickup Day') as string
    }));
  } catch (error) {
    console.error('Error fetching rides:', error);
    throw error;
  }
};


// Fetch ride by ID from Airtable
export const fetchRideById = async (id: string): Promise<Ride | null> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    const record = await base('Rides').find(id);

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      OrgID: record.get('OrgID') as string,   
      clientId: record.get('Client ID') as string,
      rideNum: record.get('RideNum') as number,
      clientName: record.get('Client Name (from Client ID)') as string,
      clientEmail: record.get('Client Email (from Client ID)') as string,
      driver: record.get('Driver') as string,
      status: record.get('Status') as string,
      service: record.get('Service') as string,
      program: record.get('Program') as string,
      group: record.get('Group') as string,
      city: record.get('City') as string,
      pickupAddress: record.get('Pickup Address') as string,
      dropoffAddress: record.get('Drop-off Address') as string,
      dropoffDateTime: record.get('Drop-Off Date and Time (Local)') as string,
      requestDateTime: record.get('Request Date and Time (Local)') as string,
      duration: record.get('Duration (min)') as number,
      googleDistance: record.get('Google Distance (mi)') as string,
      uberDistance: record.get('Uber Distance (mi)') as string,
      fare: record.get('Fare') as number,
      taxes: record.get('Taxes') as number,
      totalFare: record.get('Total Fare') as number,
      paymentMethod: record.get('Payment Method') as string,
      transactionType: record.get('Transaction Type') as string,
      signatureRequested: record.get('Signature Requested') as string,
      sigStatus: record.get('Status (from Signatures)') as string,
      noShow: record.get('No Show') as string,
      guestName: record.get('Guest Name') as string,
      createdTime: record.createdTime,
      tripID: record.get('Trip ID') as string,
      contractNum: record.get('Contract (from Client ID)') as number,
      contractName: record.get('Contract Name (from Contract) (from Client ID)') as string,
      pickupTime: record.get('Pickup Time') as string,
      pickupDay: record.get('Pickup Day') as string
    };
  } catch (error) {
    console.error('Error fetching ride:', error);
    return null;
  }
};

// Fetch client rides from Airtable
export const fetchClientRides = async (clientId: string): Promise<Ride[]> => {
  try {
    if (!base) {
      throw new Error('Airtable base not initialized');
    }

    // First get the Client ID from the Clients table
    const clientRecords = await base(tableName).select({
      maxRecords: 1,
      view: "Grid view",
      filterByFormula: `RECORD_ID() = '${clientId}'`
    }).all();

    if (!clientRecords.length) {
      throw new Error('Client not found');
    }

    const clientAirtableId = clientRecords[0].get('Client ID') as string;

    if (!clientAirtableId) {
      console.warn('No Client ID found for client');
      return [];
    }

    // Then fetch rides using the Client ID
    const records = await base('Rides').select({
      maxRecords: 100,
      view: "Grid view",
      filterByFormula: `{Client ID} = '${clientAirtableId}'`
    }).all();

    return records.map(record => ({
      id: record.id,
      OrgID: record.get('OrgID') as string,         
      clientId: record.get('Client ID') as string,
      rideNum: record.get('RideNum') as number,
      clientName: record.get('Client Name (from Client ID)') as string,
      clientEmail: record.get('Client Email (from Client ID)') as string,
      driver: record.get('Driver') as string,
      status: record.get('Status') as string,
      service: record.get('Service') as string,
      program: record.get('Program') as string,
      group: record.get('Group') as string,
      city: record.get('City') as string,
      pickupAddress: record.get('Pickup Address') as string,
      dropoffAddress: record.get('Drop-off Address') as string,
      dropoffDateTime: record.get('Drop-Off Date and Time (Local)') as string,
      requestDateTime: record.get('Request Date and Time (Local)') as string,
      duration: record.get('Duration (min)') as number,
      googleDistance: record.get('Google Distance (mi)') as string,
      uberDistance: record.get('Uber Distance (mi)') as string,
      fare: record.get('Fare') as number,
      taxes: record.get('Taxes') as number,
      totalFare: record.get('Total Fare') as number,
      paymentMethod: record.get('Payment Method') as string,
      transactionType: record.get('Transaction Type') as string,
      signatureRequested: record.get('Signature Requested') as string,
      sigStatus: record.get('Status (from Signatures)') as string,
      noShow: record.get('No Show') as string,
      guestName: record.get('Guest Name') as string,
      createdTime: record.createdTime,
      tripID: record.get('Trip ID') as string,
      contractNum: record.get('Contract (from Client ID)') as number,
      contractName: record.get('Contract Name (from Contract) (from Client ID)') as string,
      pickupTime: record.get('Pickup Time') as string,
      pickupDay: record.get('Pickup Day') as string
    }));
  } catch (error) {
    console.error('Error fetching client rides:', error);
    return [];
  }
};

// UberZone interfaces
export interface UberZone {
  id: string;
  name: string;
  type: 'hierarchical' | 'non-hierarchical';
  access_points?: UberAccessPoint[];
  sub_zones?: UberSubZone[];
  token?: string;
}

// Fetch Uber zones
export const fetchUberZones = async (latitude: number, longitude: number): Promise<UberZone[]> => {
  try {
    console.log('=== fetchUberZones called ===');
    console.log('Input coordinates:', { latitude, longitude });
    
    // Get bearer token from UberTokens table
    const tokenRecords = await base('UberTokens').select({
      maxRecords: 1,
      view: "Grid view",
      filterByFormula: `AND(
        {TokenType} = 'Bearer',
        FIND('health.sandbox', {Scope}) > 0,
        {Status} = 'Active',
        NOW() < {expDate}
      )`
    }).all();

    console.log('Token records found:', {
      count: tokenRecords.length,
      hasValidToken: tokenRecords.length > 0
    });

    if (!tokenRecords.length) {
      throw new Error('No valid bearer token found');
    }

    const token = tokenRecords[0].get('Token') as string;
    console.log('Token status:', token ? 'Valid token retrieved' : 'No token found');

    // Make request to webhook
    const response = await fetch('https://hook.us1.make.com/8riqa7g7hso1ie2qud03j5ygl8pct758', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        latitude,
        longitude,
        token
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Uber API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Uber API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Webhook response:', data);

    if (!data.zones || !Array.isArray(data.zones)) {
      throw new Error('Invalid response format from Uber API');
    }

    // Transform response to match expected format
    const transformedZones = data.zones.map((zone: any) => ({
      id: zone.id || zone.label,
      name: zone.label,
      type: 'non-hierarchical',
      token: token,
      access_points: [{
        id: zone.id || zone.label,
        name: zone.instruction || zone.label,
        description: zone.note,
        latitude: parseFloat(zone.lat),
        longitude: parseFloat(zone.long)
      }]
    }));

    console.log('=== fetchUberZones completed successfully ===');

    return transformedZones;
  } catch (error) {
    console.error('Error in fetchUberZones:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      coordinates: { latitude, longitude }
    });
    throw error;
  }
};