import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { createClient, updateClient, Client, ClientDetails, fetchContracts, Contract } from '../lib/airtable';
import { AlertCircle } from 'lucide-react';

// Define available programs and activities with the specific values
const PROGRAMS = [
  'TANF/JOBS',
  'SNAP',
  'OTHER'
];

const ACTIVITIES = [
  'DHR Appointment',
  'CEMP',
  'Job Skills Training',
  'Employment',
  'Job Relations',
  'Vocational Education',
  'Subsidized Employment',
  'Job Search - Fair',
  'Other'
];

interface ClientFormProps {
  client?: Partial<ClientDetails> & { id?: string };
  onSuccess: () => void;
  onCancel: () => void;
}

function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  console.log('ClientForm received client data:', client);
  
  // Basic client info
  const [name, setName] = useState(client?.clientName || client?.name || '');
  const [email, setEmail] = useState(client?.clientEmail || client?.email || '');
  const [phone, setPhone] = useState(client?.clientTelephone || client?.phone || '');
  const [status, setStatus] = useState(client?.status || 'Active');
  const [reviewed, setReviewed] = useState(client?.reviewed || false);
  
  // Case information
  const [county, setCounty] = useState(client?.county || '');
  const [caseManager, setCaseManager] = useState(client?.caseManager || '');
  const [casePhone, setCasePhone] = useState(client?.telephone || '');
  const [caseEmail, setCaseEmail] = useState(client?.email || '');
  const [paymentResponsibility, setPaymentResponsibility] = useState(client?.paymentResponsibility || '');
  
  // Client details
  const [ssn, setSsn] = useState(client?.ssn || '');
  const [address, setAddress] = useState(client?.address || '');
  const [city, setCity] = useState(client?.city || '');
  const [zipCode, setZipCode] = useState(client?.zipCode || '');
  const [otherPhone, setOtherPhone] = useState(client?.otherTelephone || '');
  const [additionalInfo, setAdditionalInfo] = useState(client?.additionalInformation || '');
  
  // Activity information
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>(() => {
    if (!client?.program) return [];
    
    // Handle both string and array formats
    if (typeof client.program === 'string') {
      return client.program.split(',').map(p => p.trim()).filter(p => p !== '');
    } else if (Array.isArray(client.program)) {
      return client.program;
    }
    return [];
  });
  
  const [selectedActivities, setSelectedActivities] = useState<string[]>(() => {
    if (!client?.activity) return [];
    
    // Handle both string and array formats
    if (typeof client.activity === 'string') {
      return client.activity.split(',').map(a => a.trim()).filter(a => a !== '');
    } else if (Array.isArray(client.activity)) {
      return client.activity;
    }
    return [];
  });
  
  const [dateNeeded, setDateNeeded] = useState(client?.dateNeeded || '');
  const [notes, setNotes] = useState(client?.notes || '');
  
  // Contract state
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<string>(client?.contract || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter active contracts
  const activeContracts = useMemo(() => {
    return contracts.filter(contract => contract.status === 'Active');
  }, [contracts]);

  // Fetch contracts
  useEffect(() => {
    const getContracts = async () => {
      setLoading(true);
      try {
        const contractsData = await fetchContracts();
        setContracts(contractsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching contracts:', err);
        setError('Failed to load contracts. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    getContracts();
  }, []);

  // Update selected contract ID when contract changes
  useEffect(() => {
    if (client) {
      setSelectedContract(client.contract || '');
    }
  }, [client]);

  // Log contract selection changes
  useEffect(() => {
    console.log('Selected contract changed:', selectedContract);
    console.log('Available contracts:', activeContracts.map(c => ({
      number: c.contractNumber,
      name: c.name
    })));
  }, [selectedContract, activeContracts]);
  
  // Log initial state values
  useEffect(() => {
    console.log('Initial form state values:');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Phone:', phone);
    console.log('Status:', status);
    console.log('Reviewed:', reviewed);
    console.log('County:', county);
    console.log('Case Manager:', caseManager);
    console.log('Case Phone:', casePhone);
    console.log('Case Email:', caseEmail);
    console.log('Payment Responsibility:', paymentResponsibility);
    console.log('SSN:', ssn);
    console.log('Address:', address);
    console.log('City:', city);
    console.log('Zip Code:', zipCode);
    console.log('Other Phone:', otherPhone);
    console.log('Additional Info:', additionalInfo);
    console.log('Selected Programs:', selectedPrograms);
    console.log('Selected Activities:', selectedActivities);
    console.log('Date Needed:', dateNeeded);
    console.log('Notes:', notes);
    console.log('Selected Contract:', selectedContract);
  }, []);

  // Update form values when client prop changes
  useEffect(() => {
    console.log('Client prop changed:', client);
    
    if (client) {
      console.log('Updating form values from client data');
      
      // Basic client info
      setName(client.clientName || client.name || '');
      setEmail(client.clientEmail || client.email || '');
      setPhone(client.clientTelephone || client.phone || '');
      setStatus(client.status || 'Active');
      setReviewed(client.reviewed || false);
      
      // Case information
      setCounty(client.county || '');
      setCaseManager(client.caseManager || '');
      setCasePhone(client.telephone || '');
      setCaseEmail(client.email || '');
      setPaymentResponsibility(client.paymentResponsibility || '');
      
      // Client details
      setSsn(client.ssn || '');
      setAddress(client.address || '');
      setCity(client.city || '');
      setZipCode(client.zipCode || '');
      setOtherPhone(client.otherTelephone || '');
      setAdditionalInfo(client.additionalInformation || '');
      
      // Activity information - handle program data
      if (client.program) {
        console.log('Program data:', client.program);
        let programs: string[] = [];
        
        if (typeof client.program === 'string') {
          programs = client.program.split(',').map(p => p.trim()).filter(p => p !== '');
        } else if (Array.isArray(client.program)) {
          programs = client.program;
        }
        
        console.log('Parsed programs:', programs);
        setSelectedPrograms(programs);
      }
      
      // Activity information - handle activity data
      if (client.activity) {
        console.log('Activity data:', client.activity);
        let activities: string[] = [];
        
        if (typeof client.activity === 'string') {
          activities = client.activity.split(',').map(a => a.trim()).filter(a => a !== '');
        } else if (Array.isArray(client.activity)) {
          activities = client.activity;
        }
        
        console.log('Parsed activities:', activities);
        setSelectedActivities(activities);
      }
      
      setDateNeeded(client.dateNeeded || '');
      setNotes(client.notes || '');
      
      // Set contract
      setSelectedContract(client.contract || '');
      
      // Log updated values
      console.log('Updated form values:');
      console.log('Name:', client.clientName || client.name || '');
      console.log('Email:', client.clientEmail || client.email || '');
      console.log('Phone:', client.clientTelephone || client.phone || '');
      console.log('Status:', client.status || 'Active');
      console.log('Reviewed:', client.reviewed || false);
      console.log('Address:', client.address || '');
      console.log('Date Needed:', client.dateNeeded || '');
    }
  }, [client]);

  const isEditing = !!client?.id;

  const handleProgramChange = (program: string) => {
    setSelectedPrograms(prev => 
      prev.includes(program) 
        ? prev.filter(p => p !== program) 
        : [...prev, program]
    );
  };

  const handleActivityChange = (activity: string) => {
    setSelectedActivities(prev => 
      prev.includes(activity) 
        ? prev.filter(a => a !== activity) 
        : [...prev, activity]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !phone || !selectedContract) {
      setError('Please fill in all required fields.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Define arrays before the conditional block
      const programArray = Array.isArray(selectedPrograms) ? selectedPrograms : [selectedPrograms];
      const activityArray = Array.isArray(selectedActivities) ? selectedActivities : [selectedActivities];
      
      if (isEditing && client?.id) {
        // Create a complete update object with all fields
        const updateData = {
          // Client basic info
          clientName: name,
          clientEmail: email,
          clientTelephone: phone,
          status,
          reviewed,
          
          // Case information
          county,
          caseManager,
          telephone: casePhone,
          email: caseEmail,
          paymentResponsibility,
          
          // Client details
          ssn,
          address,
          city,
          zipCode,
          otherTelephone: otherPhone,
          additionalInformation: additionalInfo,
          
          // Activity information - send as arrays for Multiple Select fields
          program: programArray,
          activity: activityArray,
          dateNeeded,
          contract: selectedContract, // Use the contract number directly
          notes
        };
        
        console.log('Updating client with data:', updateData);
        
        await updateClient(client.id, updateData);
      } else {
        // Create new client with all fields
        const createData = {
          // Client basic info
          clientName: name,
          clientEmail: email,
          clientTelephone: phone,
          status,
          reviewed,
          
          // Case information
          county,
          caseManager,
          telephone: casePhone,
          email: caseEmail,
          paymentResponsibility,
          
          // Client details
          ssn,
          address,
          city,
          zipCode,
          otherTelephone: otherPhone,
          additionalInformation: additionalInfo,
          
          // Activity information
          program: selectedPrograms,
          activity: selectedActivities,
          dateNeeded,
          contract: selectedContract,
          notes
        };
        
        console.log('Creating client with data:', createData);
        await createClient(createData);
      }
      
      onSuccess();
    } catch (err) {
      console.error('Error saving client:', err);
      setError('Failed to save client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {isEditing ? 'Edit Client' : 'Add New Client'}
      </h2>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Case Information Section */}
        <div>
          <h3 className="text-md font-bold text-gray-900 mb-4 pb-2 border-b">Case Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-1">
                County
              </label>
              <input
                type="text"
                id="county"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="caseManager" className="block text-sm font-medium text-gray-700 mb-1">
                DHR Case Manager
              </label>
              <input
                type="text"
                id="caseManager"
                value={caseManager}
                onChange={(e) => setCaseManager(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="casePhone" className="block text-sm font-medium text-gray-700 mb-1">
                Case Manager Phone
              </label>
              <input
                type="tel"
                id="casePhone"
                value={casePhone}
                onChange={(e) => setCasePhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="caseEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Case Manager Email
              </label>
              <input
                type="email"
                id="caseEmail"
                value={caseEmail}
                onChange={(e) => setCaseEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="paymentResponsibility" className="block text-sm font-medium text-gray-700 mb-1">
                Program Responsible for Payment
              </label>
              <input
                type="text"
                id="paymentResponsibility"
                value={paymentResponsibility}
                onChange={(e) => setPaymentResponsibility(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Client Information Section */}
        <div>
          <h3 className="text-md font-bold text-gray-900 mb-4 pb-2 border-b">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="ssn" className="block text-sm font-medium text-gray-700 mb-1">
                SSN
              </label>
              <input
                type="text"
                id="ssn"
                value={ssn}
                onChange={(e) => setSsn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Zip Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="zipCode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="otherPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Other Phone Number
              </label>
              <input
                type="tel"
                id="otherPhone"
                value={otherPhone}
                onChange={(e) => setOtherPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="flex flex-col space-y-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={status || ''}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="reviewed"
                  checked={reviewed}
                  onChange={(e) => setReviewed(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="reviewed" className="ml-2 block text-sm text-gray-700">
                  Mark as reviewed
                </label>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Information
              </label>
              <textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Activity Information Section */}
        <div>
          <h3 className="text-md font-bold text-gray-900 mb-4 pb-2 border-b">Activity Information</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Program (select all that apply)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
              {PROGRAMS.map(program => (
                <div key={program} className="flex items-center bg-white p-2 rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <input
                    type="checkbox"
                    id={`program-${program}`}
                    checked={selectedPrograms.includes(program)}
                    onChange={() => handleProgramChange(program)}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`program-${program}`} className="ml-2 text-sm text-gray-700 font-medium">
                    {program}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type of Activity (select all that apply)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
              {ACTIVITIES.map(activity => (
                <div key={activity} className="flex items-center bg-white p-2 rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <input
                    type="checkbox"
                    id={`activity-${activity}`}
                    checked={selectedActivities.includes(activity)}
                    onChange={() => handleActivityChange(activity)}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`activity-${activity}`} className="ml-2 text-sm text-gray-700 font-medium">
                    {activity}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dateNeeded" className="block text-sm font-medium text-gray-700 mb-1">
                Date(s) client needs transportation
              </label>
              <input
                type="text"
                id="dateNeeded"
                value={dateNeeded}
                onChange={(e) => setDateNeeded(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Every Monday, 3/15/2025, etc."
              />
            </div>
          </div>
          
          <div className="mt-4">
            <div className="mb-4">
              <label htmlFor="contract" className="block text-sm font-medium text-gray-700 mb-1">
                Contract <span className="text-red-500">*</span>
              </label>
              <select
                id="contract"
                value={selectedContract || ''}
                onChange={(e) => {
                  console.log('Contract selection changed to:', e.target.value);
                  setSelectedContract(e.target.value); 
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a contract</option>
                {activeContracts.map((contract) => (
                  <option key={contract.id} value={contract.contractNumber || ''}>
                    {contract.name} ({contract.contractNumber})
                  </option>
                ))}
              </select>
            </div>
            
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Saving...' : isEditing ? 'Update Client' : 'Add Client'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export { ClientForm };
