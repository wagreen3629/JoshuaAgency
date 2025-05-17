import React, { useState, useEffect } from 'react';
import { Car, Calendar, MapPin, Clock, Plus, Filter, Search, Upload, AlertCircle, FileSignature, ExternalLink, Edit, X, Mail } from 'lucide-react'; 
import { ImCancelCircle } from "react-icons/im";
import { subDays, startOfDay, endOfDay, addDays } from 'date-fns';
import { Button } from '../components/Button';
import { fetchRides, fetchContracts, Ride, Contract } from '../lib/airtable';
import { useNavigate } from 'react-router-dom';
import { DateRangePicker } from '../components/DateRangePicker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';

export function RidesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('processing');
  const [rides, setRides] = useState<Ride[]>([]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractFilter, setContractFilter] = useState('all');
  const [fromDate, setFromDate] = useState<Date>(startOfDay(subDays(new Date(), 30)));
  const [toDate, setToDate] = useState<Date>(endOfDay(addDays(new Date(), 30)));
  const [dateError, setDateError] = useState<string | undefined>(undefined);
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setContractFilter('all');
    setActiveTab('processing');
    setCurrentPage(1);
    setFromDate(startOfDay(subDays(new Date(), 30)));
    setToDate(endOfDay(addDays(new Date(), 30))); // Updated to 30 days in the future
    setDateError(undefined);
  };
  
  const handleFromDateChange = (date: Date | undefined) => {
    setDateError(undefined);
    setFromDate(date ? startOfDay(date) : startOfDay(subDays(new Date(), 30)));
  
    if (date && toDate && date > toDate) {
      setDateError('From date cannot be later than to date');
      return;
    }
  };
  
  const handleToDateChange = (date: Date | undefined) => {
    setDateError(undefined);
    setToDate(date ? endOfDay(date) : endOfDay(addDays(new Date(), 30))); // Updated fallback to 30 days in future
  
    if (date && fromDate && date < fromDate) {
      setDateError('To date cannot be earlier than from date');
      return;
    }
  };


  const loadRides = async () => {
    try {
      setLoading(true);
      const [ridesData, contractsData] = await Promise.all([
        fetchRides(),
        fetchContracts()
      ]);
      console.log('Fetched rides data:', ridesData);
      console.log('Fetched contracts data:', contractsData);
      setRides(ridesData);
      setFilteredRides(ridesData);
      setContracts(contractsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching rides:', err);
      setError('Failed to load rides. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  useEffect(() => {
    loadRides();
  }, []);

  useEffect(() => {
    // Filter rides based on search term and active tab
    let result = rides;
    console.log('From Date:', fromDate);
    console.log('To Date:', toDate);

    // Sort rides by RideNum in descending order
    result = [...result].sort((a, b) => (b.rideNum || 0) - (a.rideNum || 0));
    
    // Log contract filter and ride data for debugging
    console.log('Contract filter:', contractFilter);
    //console.log('Sample ride data:', result[0]);
    console.log('Ride Contract Names:', result.map(r => r.contractName));

    
    // Apply contract filter
    if (contractFilter !== 'all') {
      result = result.filter(ride => {
        const contractNames = Array.isArray(ride.contractName) ? ride.contractName : [ride.contractName];
        return contractNames.some(name => String(name || '').toLowerCase() === contractFilter.toLowerCase());
      });
    }   
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(ride => {
        // Ensure we have string values before calling toLowerCase
        const clientName = String(ride.clientName || '').toLowerCase();
        const driver = String(ride.driver || '').toLowerCase();
        const pickupAddress = String(ride.pickupAddress || '').toLowerCase();
        const dropoffAddress = String(ride.dropoffAddress || '').toLowerCase();
        
        return (
          clientName.includes(term) ||
          driver.includes(term) ||
          pickupAddress.includes(term) ||
          dropoffAddress.includes(term)
        );
      });
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(ride => ride.status === statusFilter);
    }
    
    // Apply date range filter
    if (fromDate) {
      result = result.filter(ride => {
        const raw = ride.requestDateTime || '';
        const fixed = raw.replace(/(\d)(AM|PM)$/i, '$1 $2'); // Add space if missing
        const rideDate = new Date(fixed);
        return rideDate >= fromDate;
      });
    }
    
    if (toDate) {
      result = result.filter(ride => {
        const raw = ride.requestDateTime || '';
        const fixed = raw.replace(/(\d)(AM|PM)$/i, '$1 $2'); // Add space if missing
        const rideDate = new Date(fixed);
        return rideDate <= toDate;
      });
    }

    
    // Filter by tab
      if (activeTab === 'processing') {
        result = result.filter(ride => 
          !['Canceled', 'No Driver', 'Driver Canceled', 'Rider Canceled', 'Coordinator Canceled', 'Completed', 'Expired'].includes(ride.status) &&
          ride.transactionType === 'on-demand'
        );
      } else if (activeTab === 'scheduled') {
        result = result.filter(ride => 
          !['Canceled', 'No Driver', 'Driver Canceled', 'Rider Canceled', 'Coordinator Canceled', 'Completed', 'Expired'].includes(ride.status) &&
          ride.transactionType === 'scheduled'
        );
      } else if (activeTab === 'flexible') {
        result = result.filter(ride => 
          !['Canceled', 'No Driver', 'Driver Canceled', 'Rider Canceled', 'Coordinator Canceled', 'Completed', 'Expired'].includes(ride.status) &&
          ride.transactionType === 'flexible'
        );
      } else if (activeTab === 'completed') {
        result = result.filter(ride => ride.status === 'Completed');
      } else if (activeTab === 'expired') {
        result = result.filter(ride => ride.status === 'Expired');
      } else if (activeTab === 'canceled') {
        result = result.filter(ride => 
          ['Canceled', 'No Driver', 'Driver Canceled', 'Rider Canceled', 'Coordinator Canceled'].includes(ride.status)
        );
      } else if (activeTab === 'no-show') {
        result = result.filter(ride => ride.noShow === 'Yes');
      }

    
    setFilteredRides(result);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, activeTab, statusFilter, contractFilter, fromDate, toDate, rides]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleUploadRidesFile = () => {
    alert('This would open a file upload dialog for rides data');
  };

  const handleCancelRide = async () => {
    if (!selectedRideId) return;
    
    try {
      const response = await fetch('https://hook.us1.make.com/xmf1aawvi99k1lnihxfgysnr9dphmxty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tripId: selectedRideId })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel ride');
      }

      // Refresh rides list after cancellation
      await loadRides();
      
    } catch (err) {
      console.error('Error canceling ride:', err);
      setError('Failed to cancel ride. Please try again.', err);
    } finally {
      setShowCancelDialog(false);
      setSelectedRideId(null);
    }
  };

  const openCancelDialog = (rideId: string) => {
    setSelectedRideId(rideId);
    setShowCancelDialog(true);
  };

  const handleViewRide = (id: string) => {
    navigate(`/rides/${id}`);
  };
  
  const handleSupportEmail = (tripId: string) => {
    const subject = encodeURIComponent('Joshua Agency Support Request');
    const body = encodeURIComponent(`I am having an issue with Trip ID: ${tripId}. See the description of the issue below:\n\n`);
    window.location.href = `mailto:health-api-support@uber.com?subject=${subject}&body=${body}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  // Format time for display
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

  // Pagination logic
  const indexOfLastRide = currentPage * itemsPerPage;
  const indexOfFirstRide = indexOfLastRide - itemsPerPage;
  const currentRides = filteredRides.slice(indexOfFirstRide, indexOfLastRide);
  const totalPages = Math.ceil(filteredRides.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading rides...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rides</h1>
          <p className="text-gray-600 mt-1">Manage transportation rides for clients</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            className="flex items-center" 
            onClick={handleUploadRidesFile}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Rides
          </Button>
          <Button 
            className="flex items-center"
            onClick={() => navigate('/rides/schedule', {
              state: { returnPath: '/rides' }
            })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Ride
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('processing')}
            className={`${
              activeTab === 'processing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            In Progress
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`${
              activeTab === 'scheduled'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Scheduled
          </button>
          <button
            onClick={() => setActiveTab('flexible')}
            className={`${
              activeTab === 'flexible'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Flexible
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`${
              activeTab === 'completed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`${
              activeTab === 'expired'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Expired
          </button>
          <button
            onClick={() => setActiveTab('canceled')}
            className={`${
              activeTab === 'canceled'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Canceled
          </button>
          <button
            onClick={() => setActiveTab('no-show')}
            className={`${
              activeTab === 'no-show'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            No Show
          </button>
        </nav>
      </div>
      
      {/* Search and filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search rides..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <select
                value={contractFilter}
                onChange={(e) => setContractFilter(e.target.value)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <option value="all">All Contracts</option>
                {contracts
                  .filter(contract => contract.status === 'Active')
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(contract => (
                    <option key={contract.id} value={contract.name}>
                      {contract.name} ({contract.contractNumber})
                    </option>
                  ))
                }
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="No Driver">No Driver</option>
                <option value="Accepted">Accepted</option>
                <option value="Driver Canceled">Driver Canceled</option>
                <option value="Rider Canceled">Rider Canceled</option>
                <option value="Failed">Failed</option>
                <option value="Offered">Offered</option>
                <option value="Driver Redispatched">Driver Redispatched</option>
                <option value="Coordinator Canceled">Coordinator Canceled</option>
              </select>
            </div>
          </div>
      
          <div className="flex flex-col md:flex-row gap-4 w-full items-center">
            <div className="flex items-center w-full gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">From</label>
              <input
                type="date"
                value={fromDate.toISOString().split('T')[0]}
                onChange={(e) => handleFromDateChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm h-9 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center w-full gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">To</label>
              <input
                type="date"
                value={toDate.toISOString().split('T')[0]}
                onChange={(e) => handleToDateChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm h-9 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center px-3 h-9 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reset
            </button>
          </div>
      
          {dateError && (
            <div className="text-sm text-red-600">
              {dateError}
            </div>
          )}
        </div>
      </div>



      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading rides...</p>
        </div>
      ) : filteredRides.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <Car className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No rides found</h3>
          <p className="mt-2 text-gray-500">
            {searchTerm 
              ? 'Try adjusting your search criteria.' 
              : activeTab === 'completed' 
                ? 'No completed rides found.' 
                : 'No scheduled rides found.'}
          </p>
        {!searchTerm && (['scheduled', 'processing', 'flexible'].includes(activeTab)) && (
          <Button
            className="mt-4"
            onClick={() =>
              navigate('/rides/schedule', {
                state: { returnPath: '/rides' }
              })
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Ride
          </Button>
        )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentRides.map((ride) => (
            <div 
              key={ride.id} 
              className={`bg-white shadow rounded-lg overflow-hidden ${
                ride.noShow === 'Yes' ? 'border-2 border-red-500' : ''
              }`}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Ride #{ride.rideNum}</h3>
                  <div className="flex items-center space-x-2">
                    {ride.noShow === 'Yes' && (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        No Show
                      </span>
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
                        : ['Canceled', 'No Driver', 'Driver Canceled', 'Rider Canceled', 'Expired'].includes(ride.status)
                        ? 'bg-red-100 text-red-800'
                        : ['Accepted', 'Arriving', 'In Progress', 'Offered', 'Driver Redispatched', 'Processing'].includes(ride.status)
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {ride.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Client</div>
                    <div className="mt-1 text-sm text-gray-900">{ride.clientName || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Driver</div>
                    <div className="mt-1 text-sm text-gray-900">{ride.driver || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Date & Time</div>
                    <div className="mt-1 text-sm text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {ride.pickupDay}
                      <Clock className="h-4 w-4 ml-2 mr-1 text-gray-400" />
                      {ride.pickupTime}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Pickup Location</div>
                    <div className="mt-1 text-sm text-gray-900 flex items-start">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>{ride.pickupAddress || 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Destination</div>
                    <div className="mt-1 text-sm text-gray-900 flex items-start">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>{ride.dropoffAddress || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 bg-gray-50 text-right">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Trip ID: {ride.tripID || 'N/A'}
                  </div>
                  <div>
                    <button 
                      onClick={() => handleViewRide(ride.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3" 
                      title="View Details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    {(activeTab === 'scheduled' || activeTab === 'processing') && (
                      <>
                        <button
                          onClick={() => handleSupportEmail(ride.tripID)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Contact Support"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Edit Ride"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          title="Cancel Ride"
                          onClick={() => openCancelDialog(ride.tripID)}
                        >
                          <ImCancelCircle className="h-4 w-4" /> 
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Pagination */}
          {filteredRides.length > itemsPerPage && (
            <div className="mt-6 flex justify-center">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = index + 1;
                  } else if (currentPage <= 3) {
                    pageNum = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + index;
                  } else {
                    pageNum = currentPage - 2 + index;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      )}
      
      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Ride</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this ride? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              No, Do Not Cancel Ride
            </Button>
            <Button
              onClick={handleCancelRide}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Cancel Ride
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RidesPage;