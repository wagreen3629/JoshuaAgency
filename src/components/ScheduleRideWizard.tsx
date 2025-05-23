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

        const filteredClients = (await fetchClients()).filter((c) => {
        const hasTwoAddressParts = (c: Client): boolean => {
          if (!c.address) return false;               // nothing linked at all
        
          // Linked field is usually an array; handle a single value defensively
          const links = Array.isArray(c.address) ? c.address : [c.address];
        
          return links.filter(Boolean).length >= 2;   // at least two non-empty links
        };
        const hasContract = (c: Client): boolean => {
          if (!c.contract) return false;               // nothing linked at all
        
          // Linked field is usually an array; handle a single value defensively
          const links = Array.isArray(c.contract) ? c.contract : [c.contract];
        
          return links.filter(Boolean).length = 1;   // at least one non-empty links
        };

        console.log('Client Phone:', c);
          
        return (
          c.status === 'Active' &&                      // 1. Active status
          c.reviewed === true &&                        // 4. Reviewed is checked
          hasTwoAddressParts  &&                        // 5. Address has ≥ 2 components
          hasContract &&                                 // 2. Contract present (safely handle null/undefined)
          c.clientPhone != null                          // 3. Phone present
            );
          });

        console.log('Filter Records:', filteredClients);
        
        const clientsData = filteredClients;
        setClients(clientsData);
        setFilteredClients(clientsData);
        
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
                        <div className="flex items-center px-4 py-2">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-800">
                                {client.name.split('').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-500">{client.email}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          
          </div>
        </div>

        {/* Client Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
              Language <span className="text-red-500">*</span>
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Address Selection */}
        <div className="space-y-4">
          <div>
            <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Location <span className="text-red-500">*</span>
            </label>
            <select
              id="pickupLocation"
              value={pickupLocation}
              onChange={(e) => handlePickupSelect(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select pickup location</option>
              {availablePickupAddresses.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.title ? `${addr.title} - ${addr.address}` : addr.address}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dropoffLocation" className="block text-sm font-medium text-gray-700 mb-1">
              Drop-off Location <span className="text-red-500">*</span>
            </label>
            <select
              id="dropoffLocation"
              value={dropoffLocation}
              onChange={(e) => handleDropoffSelect(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select drop-off location</option>
              {availableDropoffAddresses.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.title ? `${addr.title} - ${addr.address}` : addr.address}
                </option>
              ))}
            </select>
          </div>

          {/* Return Trip Fields */}
          {bookReturnTrip && (
            <div className="mt-6 space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Return Trip Details</h3>
              
              <div>
                <label htmlFor="returnPickupLocation" className="block text-sm font-medium text-gray-700 mb-1">
                  Return Pickup Location <span className="text-red-500">*</span>
                </label>
                <select
                  id="returnPickupLocation"
                  value={returnPickupLocation}
                  disabled
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 cursor-not-allowed"
                >
                  <option value={dropoffLocation}>
                    {dropoffLocation ? addresses.find(addr => addr.id === dropoffLocation)?.address : 'Select drop-off location first'}
                  </option>
                </select>
              </div>

              <div>
                <label htmlFor="returnDropoffLocation" className="block text-sm font-medium text-gray-700 mb-1">
                  Return Drop-off Location <span className="text-red-500">*</span>
                </label>
                <select
                  id="returnDropoffLocation"
                  value={returnDropoffLocation}
                  onChange={(e) => setReturnDropoffLocation(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required={bookReturnTrip}
                >
                  <option value="">Select return drop-off location</option>
                  {addresses
                    .filter(addr => addr.status === 'Active' && addr.id !== returnPickupLocation)
                    .map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.title ? `${addr.title} - ${addr.address}` : addr.address}
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* Additional Stops */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Additional Stops</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddAddress(!showAddAddress)}
            >
              {showAddAddress ? 'Cancel' : 'Add New Address'}
            </Button>
          </div>

          {/* Add New Address Form */}
          {showAddAddress && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newAddress.title}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                    placeholder="e.g., Doctor's Office, Pharmacy"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                    placeholder="123 Main St, City, State"
                  />
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={newAddress.notes}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Any special instructions or details"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="button" size="sm" onClick={handleAddAddress}>
                    Add Address
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Stops Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th scope="col" className="w-[20%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="w-[40%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th scope="col" className="w-[30%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {availableStopAddresses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No available addresses for stops
                    </td>
                  </tr>
                ) : (
                  availableStopAddresses.map((addr) => (
                    <tr key={addr.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedStops.includes(addr.id)}
                          onChange={() => handleStopToggle(addr.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 break-words">
                        {addr.title || 'Untitled'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 break-words">
                        {addr.address}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 break-words">
                        {addr.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
            </>
          )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {masterZoneName && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                <h3 className="font-medium">{masterZoneName}</h3>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {zones.map((zone) => (
                // Only show zones that have either instruction or label
                zone.instruction || zone.label ? (
                <div 
                  key={zone.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedZone === zone.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex items-center h-5 mt-1">
                      <input
                        type="radio"
                        id={`zone-${zone.id}`}
                        name="zone"
                        value={zone.id}
                        checked={selectedZone === zone.id}
                        onChange={() => setSelectedZone(zone.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor={`zone-${zone.id}`} className="block cursor-pointer">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                          <h4 className="font-medium text-gray-900">{zone.label}</h4>
                        </div>
                        {zone.instruction && (
                          <p className="text-sm text-gray-600 mt-1">{zone.instruction}</p>
                        )}
                        {typeof zone.note === 'string' && zone.note && (
                          <p className="text-sm text-gray-500 italic mt-1">{zone.note}</p>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
                ) : null
              ))}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            {productError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {productError}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4">
              {products.map((item) => (
                <div 
                  key={item.product.product_id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedProduct === item.product.product_id
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center h-5 mt-1">
                      <input
                        type="radio"
                        id={`product-${item.product.product_id}`}
                        name="product"
                        value={item.product.product_id}
                        checked={selectedProduct === item.product.product_id}
                         onChange={() => {
                            setSelectedProduct(item.product.product_id);
                            setSelectedFareId(item.estimate.fare_id);
                          }}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor={`product-${item.product.product_id}`} className="block cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{item.product.display_name}</h4>
                            <p className="text-sm text-gray-600">{item.product.short_desc}</p>
                          </div>
                          {item.product.image && (
                            <img 
                              src={item.product.image} 
                              alt={item.product.display_name}
                              className="h-20 w-20 object-contain ml-4"
                            />
                          )}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Capacity:</span>
                            <span className="ml-2 text-gray-900">{item.product.capacity} passengers</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Estimated Fare:</span>
                            <span className="ml-2 text-gray-900">
                              {item.estimate.fare_currency} {item.estimate.fare_estimate}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Distance:</span>
                            <span className="ml-2 text-gray-900">
                              {item.estimate.distance} {item.estimate.distance_unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <span className="ml-2 text-gray-900">
                              {Math.round(item.estimate.duration / 60)} minutes
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">Total Travel Distance:</span>
                            <span className="ml-2 text-gray-900">
                              {item.estimate.travel_distance} {item.estimate.distance_unit}
                            </span>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {/* Ride Type Selection */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Select Ride Type</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      rideType === 'on-demand' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center h-5 mt-1">
                        <input
                          type="radio"
                          id="ride-type-on-demand"
                          name="ride-type"
                          value="on-demand"
                          checked={rideType === 'on-demand'}
                          onChange={(e) => {
                            setRideType(e.target.value);
                            // Set date to current date when selecting on-demand
                            setRideDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="ride-type-on-demand" className="block cursor-pointer">
                          <div className="flex items-center">
                            <Zap className="h-5 w-5 text-blue-600 mr-2" />
                            <h4 className="font-medium text-gray-900">Ride on Demand</h4>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Request a driver for immediate pickup.
                          </p>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      rideType === 'scheduled' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center h-5 mt-1">
                        <input
                          type="radio"
                          id="ride-type-scheduled"
                          name="ride-type"
                          value="scheduled"
                          checked={rideType === 'scheduled'}
                          onChange={(e) => {
                            setRideType(e.target.value);
                          }}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="ride-type-scheduled" className="block cursor-pointer">
                          <div className="flex items-center">
                            <CalendarClock className="h-5 w-5 text-blue-600 mr-2" />
                            <h4 className="font-medium text-gray-900">Scheduled Ride</h4>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Automatically send a driver at a specific time in advance. Clients cannot change the pickup time for a scheduled ride without contacting the Joshua Agency.
                          </p>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      rideType === 'flexible' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center h-5 mt-1">
                        <input
                          type="radio"
                          id="ride-type-flexible"
                          name="ride-type"
                          value="flexible"
                          checked={rideType === 'flexible'}
                          onChange={(e) => {
                            setRideType(e.target.value);
                          }}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="ride-type-flexible" className="block cursor-pointer">
                          <div className="flex items-center">
                            <CalendarCheck className="h-5 w-5 text-blue-600 mr-2" />
                            <h4 className="font-medium text-gray-900">Flexible Ride</h4>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Set up for riders to redeem on a specific day in advance. A text is sent to provide the client the ability to request a ride when ready on the specified day. Available everywhere with Uber coverage. Note: Flexible trips now have an extended expiration time until 6 AM the next morning.
                          </p>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

             {/* Date Selection */}
              <div>
                <label htmlFor="ride-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Requested Date
                </label>
              
                {/* Flex container for all inputs on the same line */}
                <div className="flex gap-4 mb-2">
              
                  {/* Date Input */}
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="ride-date"
                      value={rideDate}
                      onChange={(e) => {
                        setRideDate(e.target.value);
                        const selectedDate = e.target.value;
                        const today = new Date().toISOString().split('T')[0];
                        if (rideType === 'on-demand' && selectedDate > today) {
                          setRideType('scheduled');
                        } else if (rideType === 'on-demand' && selectedDate !== today) {
                          setRideDate(today);
                        }
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      max={(() => {
                        const maxDate = new Date();
                        maxDate.setDate(maxDate.getDate() + 30);
                        return maxDate.toISOString().split('T')[0];
                      })()}
                      className={`pl-10 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        rideType === 'unused' ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      disabled={rideType === 'unused'}
                    />
                  </div>
              
                  {/* Time Input */}
                  <div className="flex-1">
                    <input
                      type="time"
                      id="ride-time"
                      value={rideTime}
                      onChange={(e) => setRideTime(e.target.value)}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={rideType === 'flexible'}
                    />
                  </div>
              
                  {/* Time Zone Selector */}
                  <div className="flex-1">
                    <select
                      id="ride-timezone"
                      value={rideTimezone}
                      onChange={(e) => setRideTimezone(e.target.value)}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={rideType === 'flexible'}
                    >
                      <option value="America/New_York">America/New_York</option>
                      <option value="America/Chicago">America/Chicago</option>
                      <option value="America/Denver">America/Denver</option>
                      <option value="America/Los_Angeles">America/Los_Angeles</option>
                    </select>
                  </div>
              
                </div>
              </div>

              {/* Note to Driver */}
              <div>
                <label htmlFor="driver-note" className="block text-sm font-medium text-gray-700 mb-1">
                  Note to Driver (Optional)
                </label>
                <textarea
                  id="driver-note"
                  value={driverNote}
                  onChange={(e) => setDriverNote(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any special instructions or notes for the driver..."
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-8">
            {/* Confirmation Message */}
            <div className="flex items-start gap-4">
              {/* Logo outside the message box and larger */}
              <img 
                src="/UberHealth.jpg" 
                alt="Uber Health" 
                className="h-20 w-auto object-contain"
              />
            
              {/* Message box with black background and white text */}
              <div className="bg-black text-white rounded-lg flex items-center p-4 h-20 flex-1">
                <p className="text-lg font-medium">
                  Are you sure you want to submit this ride to Uber Health?
                </p>
              </div>
            </div>

            {/* Client Information Summary */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Client Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Name:</span>
                    <p className="text-sm font-medium text-gray-900">{firstName} {lastName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Phone:</span>
                    <p className="text-sm font-medium text-gray-900">{phoneNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Language:</span>
                    <p className="text-sm font-medium text-gray-900">{language}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Location Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Pickup Location:</span>
                  <p className="text-sm font-medium text-gray-900">
                    {addresses.find(addr => addr.id === pickupLocation)?.address || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Drop-off Location:</span>
                  <p className="text-sm font-medium text-gray-900">
                    {addresses.find(addr => addr.id === dropoffLocation)?.address || 'N/A'}
                  </p>
                </div>
                {selectedStops.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Additional Stops:</span>
                    <ul className="mt-1 space-y-1">
                      {selectedStops.map(stopId => (
                        <li key={stopId} className="text-sm font-medium text-gray-900">
                          {addresses.find(addr => addr.id === stopId)?.address || 'N/A'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Return Trip Details */}
            {bookReturnTrip && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Return Trip Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Return Pickup Location</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {returnPickupLocation?.address || 'Not selected'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Return Drop-off Location</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {returnDropoffLocation?.address || 'Not selected'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Service Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {products.find(p => p.product.product_id === selectedProduct) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Service Type:</span>
                      <p className="text-sm font-medium text-gray-900">
                        {products.find(p => p.product.product_id === selectedProduct)?.product.display_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Estimated Fare:</span>
                      <p className="text-sm font-medium text-gray-900">
                        {products.find(p => p.product.product_id === selectedProduct)?.estimate.fare_estimate}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Estimated Duration:</span>
                      <p className="text-sm font-medium text-gray-900">
                        {Math.round((products.find(p => p.product.product_id === selectedProduct)?.estimate.duration || 0) / 60)} minutes
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Total Distance:</span>
                      <p className="text-sm font-medium text-gray-900">
                        {products.find(p => p.product.product_id === selectedProduct)?.estimate.travel_distance} miles
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Ride Type:</span>
                    <p className="text-sm font-medium text-gray-900">
                      {rideType === 'on-demand' ? 'Ride on Demand' :
                       rideType === 'scheduled' ? 'Scheduled Ride' :
                       'Flexible Ride'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Date:</span>
                    <p className="text-sm font-medium text-gray-900">{rideDate} {rideTime} {rideTimezone}</p>
                  </div>
                </div>
                {driverNote && (
                  <div>
                    <span className="text-sm text-gray-500">Note to Driver:</span>
                    <p className="text-sm font-medium text-gray-900">{driverNote}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              className="mr-auto"
              onClick={() => setCurrentStep(prev => prev - 1)}
            >
              Back
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className={currentStep === 5 ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 
             currentStep === 1 ? 'Select Zone' : 
             currentStep === 2 ? 'Schedule Trip' : 
             currentStep === 3 ? 'Select Product' :
             currentStep === 4 ? 'Review Ride' : 
             currentStep === 5 ? 'Submit Ride' : 
             'Next Step'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export { ScheduleRideWizard };