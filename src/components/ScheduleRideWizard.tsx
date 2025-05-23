import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Clock, Calendar, Zap, CalendarClock, CalendarCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from './Button';
import { 
  fetchClients, 
  fetchClientAddresses, 
  fetchUberZones, 
  Client, 
  Address,
  createAddress
} from '../lib/airtable';
import { createInitialRideData, updateRideData } from '../lib/ride-tracking';
import { submitRideRequest } from '../lib/ride-submission';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';

// List of supported languages
const LANGUAGES = [
  'English',
  'Spanish',
  'Arabic',
  'Chinese',
  'French',
  'Vietnamese',
  'Korean',
  'Russian',
  'Tagalog',
  'Other'
];

interface ScheduleRideWizardProps {
  defaultClientId?: string;
  onCancel: () => void;
  onComplete: () => void;
}

const ScheduleRideWizard = ({ defaultClientId, onCancel, onComplete }: ScheduleRideWizardProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;
      setProfile(profileData);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [language, setLanguage] = useState('English');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [selectedStops, setSelectedStops] = useState<string[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [returnTrip, setReturnTrip] = useState(false);
  const [zones, setZones] = useState<Array<{
    id: string;
    label: string;
    instruction: string;
    note: string;
  }>>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [masterZoneName, setMasterZoneName] = useState<string>('');
  const [loadingZones, setLoadingZones] = useState(false);
  const [zoneToken, setZoneToken] = useState<string>('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [zoneError, setZoneError] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [products, setProducts] = useState<Array<{
    product: {
      display_name: string;
      short_desc: string;
      capacity: number;
      image: string;
      product_id: string;
      vehicle_view_id: string;
    };
    estimate: {
      fare_id: string;
      fare_currency: string;
      fare_estimate: string;
      fare_value: number;
      distance: number;
      distance_unit: string;
      duration: number;
      travel_distance: number;
    };
  }>>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedFareId, setSelectedFareId] = useState<string>('');
  const [rideType, setRideType] = useState('on-demand');
  const [rideDate, setRideDate] = useState(() => new Date().toISOString().split('T')[0]);

  const getCurrentTimeString = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  const [rideTime, setRideTime] = useState(getCurrentTimeString());
  const [rideTimezone, setRideTimezone] = useState('America/Chicago');

  const [driverNote, setDriverNote] = useState('');
  const [newAddress, setNewAddress] = useState({
    address: '',
    title: '',
    notes: '',
    status: 'Active' as const
  });
  
  // Data state
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [availablePickupAddresses, setAvailablePickupAddresses] = useState<Address[]>([]);
  const [availableDropoffAddresses, setAvailableDropoffAddresses] = useState<Address[]>([]);
  const [selectedPickupAddress, setSelectedPickupAddress] = useState<Address | null>(null);
  const [selectedDropoffAddress, setSelectedDropoffAddress] = useState<Address | null>(null);
  const [availableStopAddresses, setAvailableStopAddresses] = useState<Address[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [bookReturnTrip, setBookReturnTrip] = useState(false);
  const [returnPickupLocation, setReturnPickupLocation] = useState('');
  const [returnDropoffLocation, setReturnDropoffLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Fetch clients and their addresses
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch all clients first
        const allClientsData = await fetchClients();

        // Filter clients based on basic criteria
        const eligibleClients = allClientsData.filter(client => 
          client.status === 'Active' && // Active status
          client.contract && // Has contract assigned
          client.clientTelephone && // Has phone number
          client.reviewed === true // Has been reviewed
        );

        // For each eligible client, check if they have at least 2 active addresses
        const fullyEligibleClients = await Promise.all(
          eligibleClients.map(async (client) => {
            const addresses = await fetchClientAddresses(client.id);
            const activeAddresses = addresses.filter(addr => addr.status === 'Active');
            return { client, hasEnoughAddresses: activeAddresses.length >= 2 };
          })
        ).then(results => 
          results
            .filter(({ hasEnoughAddresses }) => hasEnoughAddresses)
            .map(({ client }) => client)
        );

        setClients(fullyEligibleClients);
        setFilteredClients(fullyEligibleClients);
        
        // If defaultClientId is provided, select that client
        if (defaultClientId) {
          const defaultClient = clientsData.find(c => c.id === defaultClientId);
          if (defaultClient) {
            setSelectedClient(defaultClient);
            // Split the client name into first and last name
            const nameParts = defaultClient.name.split(' ');
            setFirstName(nameParts[0] || '');
            setLastName(nameParts.slice(1).join(' ') || '');
            setPhoneNumber(defaultClient.phone || '');
            setIsDropdownOpen(false);
            handleClientSelect(defaultClient.id);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading clients:', err);
        setError('Failed to load clients. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [defaultClientId]);

  // Load client addresses when a client is selected
  useEffect(() => {
    const loadAddresses = async () => {
      if (!selectedClient?.id) return;

      try {
        setLoading(true);
        const addressesData = await fetchClientAddresses(selectedClient.id);
        // Only include active addresses
        const activeAddresses = addressesData.filter(addr => addr.status === 'Active');
        setAddresses(activeAddresses);
        setAvailablePickupAddresses(activeAddresses);
        setAvailableDropoffAddresses(activeAddresses);
        setAvailableStopAddresses(activeAddresses);
        setError(null);
      } catch (err) {
        console.error('Error loading addresses:', err);
        setError('Failed to load addresses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadAddresses();
  }, [selectedClient]);

  // Filter clients based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = clients.filter(client => {
      const name = (client.name || '').toLowerCase();
      const email = (client.email || '').toLowerCase();
      const phone = (client.phone || '').toLowerCase();
      
      return (
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(term)
      );
    });
    
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  // Handle client selection
  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    try {
      setSelectedClient(client);
      // Split the client name into first and last name
      const nameParts = client.name.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setPhoneNumber(client.phone || '');
    } catch (err) {
      console.error('Error setting client details:', err);
      setError('Failed to load client details');
    }
  };

  // Handle pickup location selection
  const handlePickupSelect = (addressId: string) => {
    setPickupLocation(addressId);
    const address = addresses.find(addr => addr.id === addressId);
    setSelectedPickupAddress(address || null);
    
    // Update available addresses
    const updatedDropoffAddresses = addresses.filter(addr => addr.id !== addressId);
    setAvailableDropoffAddresses(updatedDropoffAddresses);
    setAvailableStopAddresses(addresses.filter(addr => 
      addr.id !== addressId && addr.id !== dropoffLocation
    ));
  };

  // Handle dropoff location selection
  const handleDropoffSelect = (addressId: string) => {
    setDropoffLocation(addressId);
    const address = addresses.find(addr => addr.id === addressId);
    setSelectedDropoffAddress(address || null);
    
    // Update available addresses
    const updatedPickupAddresses = addresses.filter(addr => addr.id !== addressId);
    setAvailablePickupAddresses(updatedPickupAddresses);
    setAvailableStopAddresses(addresses.filter(addr => 
      addr.id !== addressId && addr.id !== pickupLocation
    ));
  };

  // Handle stop selection
  const handleStopToggle = (addressId: string) => {
    setSelectedStops(prev => {
      if (prev.includes(addressId)) {
        return prev.filter(id => id !== addressId);
      } else {
        return [...prev, addressId];
      }
    });
  };

  // Handle new address submission
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient?.id) {
      setError('No client selected');
      return;
    }

    try {
      setError(null);
      
      const result = await createAddress({
        address: newAddress.address,
        title: newAddress.title,
        notes: newAddress.notes,
        status: newAddress.status,
        clientId: selectedClient.id
      });

      // Update all address lists
      const updatedAddresses = [result, ...addresses];
      setAddresses(updatedAddresses);
      
      // Update available addresses lists
      if (!pickupLocation) {
        setAvailablePickupAddresses(updatedAddresses);
      }
      if (!dropoffLocation) {
        setAvailableDropoffAddresses(updatedAddresses);
      }
      
      // Update available stops
      setAvailableStopAddresses(updatedAddresses.filter(addr => 
        addr.id !== pickupLocation && addr.id !== dropoffLocation
      ));

      // Reset form
      setNewAddress({
        address: '',
        title: '',
        notes: '',
        status: 'Active'
      });
      setShowAddAddress(false);
      setError(null);
    } catch (err) {
      console.error('Error adding address:', err);
      setError(err instanceof Error ? err.message : 'Failed to add address');
    }
  };

  // Handle return trip toggle
  const handleReturnTripToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBookReturnTrip(e.target.checked);
    if (e.target.checked && dropoffLocation) {
      // Auto-populate return pickup with initial dropoff
      setReturnPickupLocation(dropoffLocation);
    } else {
      // Clear return trip selections
      setReturnPickupLocation('');
      setReturnDropoffLocation('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any existing error messages when submitting
    setError(null);
    console.log('CurrentStep:', currentStep);
    
    if (currentStep === 1) {
      // Validate required fields for step 1
      if (!firstName || !lastName || !phoneNumber || !pickupLocation || !dropoffLocation || (bookReturnTrip && !returnDropoffLocation)) {
        setError('Please fill in all required fields');
        return;
      }
        

      // Get zones for pickup location when moving to step 2
      try {
        console.log('=== Starting zone fetch process ===');
        setIsSubmitting(true);
        setError(null);
        
        // Get coordinates from the address record
        const addressRecord = addresses.find(addr => addr.id === pickupLocation);
        console.log('Found address record:', {
          found: !!addressRecord,
          addressId: pickupLocation,
          latitude: addressRecord?.latitude,
          longitude: addressRecord?.longitude
        });

        if (!addressRecord) {
          throw new Error('Could not find pickup location details');
        }
        
        // Get latitude and longitude from the address record
        const latitude = addressRecord.latitude ? parseFloat(String(addressRecord.latitude)) : null;
        const longitude = addressRecord.longitude ? parseFloat(String(addressRecord.longitude)) : null;
        
        console.log('Parsed coordinates:', {
          latitude,
          longitude
        });
        
        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
          console.error('Invalid coordinates:', {
            latitude,
            longitude,
            isLatitudeNaN: isNaN(latitude),
            isLongitudeNaN: isNaN(longitude)
          });
          throw new Error('This pickup location does not have valid coordinates. Please select a different location or update the address coordinates.');
        }
        
        console.log('Calling fetchUberZones with coordinates:', { latitude, longitude });
        const zones = await fetchUberZones(latitude, longitude);
        console.log('Received zones:', zones);

        // Transform zones data to match expected format
        const transformedZones = zones.map(zone => {
          // Store the token when transforming zones
          if (zone.token) {
            setZoneToken(zone.token);
          }
          return {
          id: zone.id,
          label: zone.name,
          instruction: zone.access_points?.[0]?.name || zone.name,
          note: zone.access_points?.[0]?.description || '',
          token: zone.token
          };
        });

        console.log('Transformed zones:', transformedZones);
        setZones(transformedZones);

        // Move to step 2
        setCurrentStep(2);
        
      } catch (err) {
        console.error('Error in zone fetch process:', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          pickupLocation: selectedPickupAddress?.address,
          addressId: selectedPickupAddress?.id,
          latitude: selectedPickupAddress?.latitude,
          longitude: selectedPickupAddress?.longitude
        });
        setError(err instanceof Error ? err.message : 'Failed to load pickup zones. Please try again.');
        return;
      } finally {
        setIsSubmitting(false);
      }
    }
    
    else if (currentStep === 2) {
      // Validate zone selection
      if (!selectedZone) {
        setError('Please select a pickup zone');
        return;
      }    
      
      setCurrentStep(3);
      
    }
    else if (currentStep === 3) {
      // Validate zone selection
      console.log('CurrentStep:', currentStep);
      if (!rideType) {
        setError('Please select a ride type');
        return;
      }      

      try {
        setIsSubmitting(true);
        setProductError(null);

        console.log('=== Starting product fetch process ===');
        

        // Get coordinates for API call
        const pickupAddr = addresses.find(addr => addr.id === pickupLocation);
        const dropoffAddr = addresses.find(addr => addr.id === dropoffLocation);
        const stopAddrs = selectedStops.map(id => addresses.find(addr => addr.id === id)).filter(Boolean);

        console.log('Address details:', {
          pickup: {
            address: pickupAddr?.address,
            latitude: pickupAddr?.latitude,
            longitude: pickupAddr?.longitude
          },
          dropoff: {
            address: dropoffAddr?.address,
            latitude: dropoffAddr?.latitude,
            longitude: dropoffAddr?.longitude
          },
          stops: stopAddrs.map(addr => ({
            address: addr?.address,
            latitude: addr?.latitude,
            longitude: addr?.longitude
          }))
        });

        if (!pickupAddr || !dropoffAddr) {
          throw new Error('Could not find address details');
        }

        // Prepare waypoints array
        const waypoints = stopAddrs.map(addr => ({
          latitude: parseFloat(String(addr?.latitude)),
          longitude: parseFloat(String(addr?.longitude))
        }));

        // Log stored zone token
        console.log('Using stored zone token:', { zoneId: selectedZone, token: zoneToken });
    
        //Scheduling and ride variables
        const rideProductData = [{
            rideType: rideType as 'immediate' | 'scheduled' | 'flexible' | 'hourly',
            scheduledDate: rideType === 'immediate'
              ? undefined
              : {
                  date: rideDate,
                  time: rideTime,
                  timezone: rideTimezone
                }
          }];
        
        console.log('Ride Data Info:', rideProductData);

        // Prepare request payload
        const payload = [{
          rideType: String(rideType),
          deferred_pickup_date: String(rideDate),
          scheduling_pickup_time: String(rideTime),
          token: zoneToken,
          pickupAddress: String(pickupAddr.address),
          pickupLat: String(pickupAddr.latitude),
          pickupLong: String(pickupAddr.longitude),
          dropoffLat: parseFloat(String(dropoffAddr.latitude)),
          dropOffAddress: String(dropoffAddr.address),
          dropoffLong: parseFloat(String(dropoffAddr.longitude)),
          waypoints: waypoints
        }];

        console.log('API request payload:', payload);

        // Make API call to get products and estimates
        const response = await fetch('https://hook.us1.make.com/lifsgtibgl55sif9bqvbsdpycln0ov0u', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        console.log('API response status:', response.status);
      

        if (!response.ok) {
          console.error('API response not OK:', {
            status: response.status,
            statusText: response.statusText
          });
          throw new Error('Failed to fetch product details');
        }

        const data = await response.json();
        console.log('API response data:', data);

        setProducts(data);
        setCurrentStep(4);

      } catch (err) {
        console.error('Error fetching products:', err);
        console.error('Full error details:', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          pickup: selectedPickupAddress?.address,
          dropoff: selectedDropoffAddress?.address
        });
        setError(err instanceof Error ? err.message : 'Failed to load product details. Please try again.');
        return;
      } finally {
        setIsSubmitting(false);
        console.log('=== Product fetch process completed ===');
      }
    } else if (currentStep === 4) {
      console.log('CurrentStep:', currentStep);
      // Validate product selection
      if (!selectedProduct) {
        setError('Please select a product to continue');
        return;
      }
      
      // Progress to step 5
      
      setCurrentStep(5);
      
    } 

      
    else if (currentStep === 3) {
      // Validate required fields for step 4
      if (!rideDate) {
        setError('Please select a date for the ride');
        return;
      }
      
      setCurrentStep(4);
      
    }
      
    else if (currentStep === 4) {
      console.log('CurrentStep:', currentStep);
      if (!selectedProduct) {
        setError('Please select a service type');
        return;
      }
      
      setCurrentStep(5);
      
    }
    else if (currentStep === 3) {
      console.log('CurrentStep:', currentStep);
      if (!rideType) {
        setError('Please select a ride type');
        return;
      }      
      setCurrentStep(4);      
    }
    else if (currentStep === 5) {
      // Handle final submission
      try {
        setIsSubmitting(true);

        console.log('Processing Final submission');
        console.log('selectedClient: ',selectedClient);
        console.log('selectedPickupAddress: ',selectedPickupAddress);
        console.log('selectedDropoffAddress: ',selectedDropoffAddress);
        console.log('selectedProduct: ',selectedProduct);
        console.log('selectedFareId: ',selectedFareId);
        
        if (!selectedClient || !selectedPickupAddress || !selectedDropoffAddress || !selectedProduct) {
          throw new Error('Missing required information to submit the ride.');
        }
    
        const rideSubmissionData = {
          clientId: selectedClient.id,
          contactPhone: profile?.phone || '',
          guest: {
            email: selectedClient.email || '',
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber
          },
          fareId: selectedFareId,
          dropoff: {
            latitude: selectedDropoffAddress.latitude!,
            longitude: selectedDropoffAddress.longitude!
          },
          pickup: {
            latitude: selectedPickupAddress.latitude!,
            longitude: selectedPickupAddress.longitude!
          },
          driverNote: driverNote,
          productId: selectedProduct,
          stops: selectedStops.map(id => {
            const stop = addresses.find(a => a.id === id);
            return {
              latitude: stop?.latitude!,
              longitude: stop?.longitude!
            };
          }),
          rideType: rideType as 'immediate' | 'scheduled' | 'flexible' | 'hourly',
          scheduledDate: rideType === 'immediate'
            ? undefined
            : {
                date: rideDate,
                time: rideTime,
                timezone: rideTimezone
              }
        };
                  
        const response = await submitRideRequest(rideSubmissionData);
    
        if (response.status === 'failure') {
          setError(response.message || 'Failed to schedule ride. Please try again.');
          return;
        }

        console.log('Status:', response.status);
        console.log('Status:', response.message);
        
        navigate('/rides/confirmation', {
          state: {
            rideData: {
              ...rideSubmissionData,
              status: response.status,
              message: response.message,
              webhookStatus: response.webhookStatus,
              webhookMessage: response.webhookMessage
            }
          }
        });

      } catch (err) {
        console.error('Error submitting ride:', err);
        setError('Failed to submit ride. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Clear error when changing steps manually
  useEffect(() => {
    setError(null);
  }, [currentStep]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {currentStep === 1 ? 'Step 1: Enter Client Information' : 
               currentStep === 2 ? 'Step 2: Choose Zone' :
               currentStep === 3 ? 'Step 3: Schedule Ride' :
               currentStep === 4 ? 'Step 4: Select Product' :
               'Step 5: Review Ride'}
            </h2>
            <div className="text-sm font-medium text-gray-500">Step {currentStep} of 5</div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${currentStep * 20}%` }}
            ></div>
          </div>
          
          {/* Step labels */}
          <div className="flex justify-between text-xs text-gray-500 px-1">
            <span>Client Info</span>
            <span>Choose Zone</span>
            <span>Create Trip</span>
            <span>View Estimates</span>
            <span>Review</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {currentStep === 1 && (
        <>
        {/* Client Selection */}
        <div>
          <label htmlFor="client-search" className="block text-sm font-medium text-gray-700 mb-1">
            Select Client
          </label>
          <div className="relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="client-search"
                className="w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={(e) => {
                  // Only close if not clicking on a dropdown item
                  const relatedTarget = e.relatedTarget as HTMLElement;
                  if (!relatedTarget?.closest('.client-dropdown')) {
                    setTimeout(() => setIsDropdownOpen(false), 200);
                  }
                }}
              />
            </div>
            
            {/* Selected client display */}
            {selectedClient && !isDropdownOpen && (
              <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-800">
                        {selectedClient.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{selectedClient.name}</p>
                    <p className="text-sm text-gray-500">{selectedClient.email}</p>
                  </div>
                  <button
                    type="button"
                    className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      setSelectedClient(null);
                      setSearchTerm('');
                      setIsDropdownOpen(true);
                    }}
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
            
            {/* Dropdown */}
            {isDropdownOpen && !selectedClient && (
              <div className="client-dropdown absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                {filteredClients.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No clients found
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {filteredClients.map((client) => (
                      <li
                        key={client.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          handleClientSelect(client.id);
                          setIsDropdownOpen(false);
                          setSearchTerm('');
                        }}
                      >
                        <div className="flex items-center px-4 py