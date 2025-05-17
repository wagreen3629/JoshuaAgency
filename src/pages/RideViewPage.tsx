import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Car, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  AlertCircle, 
  Route, 
  Users, 
  CreditCard, 
  Receipt, 
  Tag, 
  Mail,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../components/Button';
import { fetchRideById, fetchRides, Ride } from '../lib/airtable';

export function RideViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allRides, setAllRides] = useState<Ride[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Fetch all rides to enable navigation
  useEffect(() => {
    const getAllRides = async () => {
      try {
        const rides = await fetchRides();
        setAllRides(rides);
        // Find current ride's index
        const index = rides.findIndex(r => r.id === id);
        setCurrentIndex(index);
      } catch (err) {
        console.error('Error fetching all rides:', err);
      }
    };

    getAllRides();
  }, [id]);

  useEffect(() => {
    const getRideDetails = async () => {
      if (!id) {
        setError('Ride ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const rideData = await fetchRideById(id);
        
        if (!rideData) {
          setError('Ride not found');
        } else {
          console.log('Fetched ride data:', rideData);
          setRide(rideData);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching ride details:', err);
        setError('Failed to load ride details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    getRideDetails();
  }, [id]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevRide = allRides[currentIndex - 1];
      navigate(`/rides/${prevRide.id}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < allRides.length - 1) {
      const nextRide = allRides[currentIndex + 1];
      navigate(`/rides/${nextRide.id}`);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDistance = (distance: string | number | null | undefined) => {
    if (distance === null || distance === undefined) {
      return 'N/A';
    }
    // Convert string to number if needed and fix to exactly 2 decimal places
    const numericDistance = typeof distance === 'string' ? parseFloat(distance) : distance;
    return isNaN(numericDistance) ? 'N/A' : numericDistance.toFixed(2) + ' mi';
  };

  const calculateDistanceDifference = (uberDistance: string, googleDistance: string) => {
    const uber = parseFloat(uberDistance);
    const google = parseFloat(googleDistance);
    
    if (isNaN(uber) || isNaN(google)) {
      return { value: 'N/A', isNegative: false };
    }
    
    // Calculate the difference (Uber - Google)
    const difference = uber - google;
    // Format the absolute value with 2 decimal places
    const absoluteDifference = Math.abs(difference).toFixed(2);
    
    return {
      // For negative values, wrap the absolute value in parentheses and add "mi"
      value: difference < 0 ? `(${absoluteDifference}) mi` : `${absoluteDifference} mi`,
      isNegative: difference < 0
    };
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          <div className="mt-4">
            <Button onClick={() => navigate('/rides')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Rides
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!ride) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/rides')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Ride Details</h1>
          
          {/* Navigation buttons */}
          <div className="ml-4 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex <= 0}
              className="h-8 px-2"
              title="Previous ride"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex >= allRides.length - 1}
              className="h-8 px-2"
              title="Next ride"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            className="h-10"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          <Button className="h-10">
            <Car className="h-4 w-4 mr-2" />
            Schedule Similar Ride
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className={`bg-white shadow rounded-lg overflow-hidden ${
        ride.noShow === 'Yes' ? 'border-2 border-red-500' : ''
      }`}>
        {/* Status header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Ride #{ride.rideNum}</h3>
            <div className="flex items-center space-x-2">
              {ride.noShow === 'Yes' && (
                <div className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  No Show
                </div>
              )}
              <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                ride.sigStatus === 'Signed' 
                  ? 'bg-[#eceeeb] text-green-600' 
                  : ride.sigStatus === 'On Hold'
                  ? 'bg-[#eceeeb] text-red-600'
                  : ride.sigStatus === 'Pending'
                  ? 'bg-[#eceeeb] text-yellow-600'
                  : 'bg-[#eceeeb] text-gray-600'
              }`}>
                <span className="font-bold text-black">
                  <FileSignature className="h-3 w-3 mr-1 inline" />
                  Signature Status:
                </span>
                <span className="ml-1">{ride.sigStatus}</span>
              </span>
              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                ride.status === 'Completed' 
                  ? 'bg-green-100 text-green-800' 
                  : ride.status === 'Cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {ride.status}
              </span>
            </div>
          </div>
          {ride.noShow === 'Yes' && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Client No Show
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      The client did not show up for this scheduled ride. Please follow up with the client
                      to reschedule if needed and document any necessary actions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Client and Driver Information */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-4">People</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-500">Client</div>
              <div className="mt-1 flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{ride.clientName}</span>
              </div>
              <div className="mt-1 text-sm text-gray-500 flex items-center">
                {ride.clientEmail && (
                  <button 
                    onClick={() => handleEmailClick(ride.clientEmail)}
                    className="mr-2 text-blue-600 hover:text-blue-800"
                    title="Send email"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                )}
                <span>{ride.clientEmail}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Driver</div>
              <div className="mt-1 flex items-center">
                <Car className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{ride.driver}</span>
              </div>
            </div>
            {ride.guestName && (
              <div>
                <div className="text-sm font-medium text-gray-500">Guest</div>
                <div className="mt-1 flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-gray-900">{ride.guestName}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ride Details */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-4">Ride Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-500">Pickup Location</div>
              <div className="mt-1 flex items-start">
                <MapPin className="h-4 w-4 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                <span className="text-gray-900">{ride.pickupAddress}</span>
              </div>
              <div className="mt-6">
                <div className="text-sm font-medium text-gray-500">Trip ID</div>
                <div className="mt-1 flex items-start">
                  <Car className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-gray-900">{ride.tripID || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Drop-off Location</div>
              <div className="mt-1 flex items-start">
                <MapPin className="h-4 w-4 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                <span className="text-gray-900">{ride.dropoffAddress}</span>
              </div>
            </div>
          </div>
          {/* Pick-Up Information */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-500">Pick-Up Date</div>
              <div className="mt-1 flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{ride.pickupDay}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Pick-Up Time</div>
              <div className="mt-1 flex items-center">
                <Clock className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{ride.pickupTime}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">City</div>
              <div className="mt-1 flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{ride.city}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500"></div>
              <div className="mt-1 flex items-center">
               
                <span className="text-gray-900"></span>
              </div>
            </div>
        </div>
          {/*Drop Off Information */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-500">Drop-off Date</div>
              <div className="mt-1 flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{formatDate(ride.dropoffDateTime)}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Drop-off Time</div>
              <div className="mt-1 flex items-center">
                <Clock className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{formatTime(ride.dropoffDateTime)}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">City</div>
              <div className="mt-1 flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{ride.city}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Duration</div>
              <div className="mt-1 flex items-center">
                <Clock className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{ride.duration} minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Distance Information */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-4">Distance Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-500">Uber Distance</div>
              <div className="mt-1 flex items-center">
                <Route className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{formatDistance(ride.uberDistance)}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Google Distance</div>
              <div className="mt-1 flex items-center">
                <Route className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{formatDistance(ride.googleDistance)}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Distance Difference</div>
              <div className="mt-1 flex items-center">
                <Route className="h-4 w-4 text-gray-400 mr-1" />
                {(() => {
                  const difference = calculateDistanceDifference(ride.uberDistance, ride.googleDistance);
                  return (
                    <span className={difference.isNegative ? 'text-red-600' : 'text-gray-900'}>
                      {difference.value}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Service Information */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-4">Service Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-500">Service Type</div>
              <div className="mt-1 flex items-center">
                <Tag className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{ride.service}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Program</div>
              <div className="mt-1 flex items-center">
                <Tag className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{ride.program}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Group</div>
              <div className="mt-1 flex items-center">
                <Users className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{ride.group}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Request Date</div>
              <div className="mt-1 flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{formatDate(ride.requestDateTime)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="px-6 py-4">
          <h4 className="text-sm font-medium text-gray-500 mb-4">Payment Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-500">Payment Method</div>
              <div className="mt-1 flex items-center">
                <CreditCard className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{ride.paymentMethod}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Transaction Type</div>
              <div className="mt-1 flex items-center">
                <Receipt className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{ride.transactionType}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Fare</div>
              <div className="mt-1 flex items-center">
                <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{formatCurrency(ride.fare)}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Taxes</div>
              <div className="mt-1 flex items-center">
                <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{formatCurrency(ride.taxes)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons at bottom */}
      <div className="flex justify-between mt-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/rides')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rides
          </Button>
          
          {/* Bottom navigation buttons */}
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex <= 0}
            className="px-2"
            title="Previous ride"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentIndex >= allRides.length - 1}
            className="px-2"
            title="Next ride"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            className="h-10"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          <Button className="h-10">
            <Car className="h-4 w-4 mr-2" />
            Schedule Similar Ride
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RideViewPage;