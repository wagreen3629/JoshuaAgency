import React, { useState, useEffect } from 'react';
import { FileSignature, Plus, Search, Filter, Calendar, MapPin, Clock, Route, FileDown, Mail, AlertCircle, Users, ExternalLink, Check } from 'lucide-react';
import { Button } from '../components/Button';
import { fetchSignatures, fetchSignaturesForExport, fetchContracts, Signature, Contract } from '../lib/airtable';
import { DateRangePicker } from '../components/DateRangePicker';
import { startOfDay, endOfDay, isValid } from 'date-fns';

export function SignaturesPage() {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [filteredSignatures, setFilteredSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractFilter, setContractFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  
  // Date range state
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [dateError, setDateError] = useState<string | undefined>(undefined);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const loadSignatures = async () => {
    try {
      setLoading(true);
      const [data, contractsData] = await Promise.all([
        fetchSignatures(),
        fetchContracts()
      ]);
      console.log('Fetched signatures:', data);
      console.log('Fetched contracts:', contractsData);
      setSignatures(data);
      setFilteredSignatures(data);
      setContracts(contractsData);
      setError(null);
    } catch (error) {
      console.error('Error fetching signatures:', error);
      setError('Failed to load signatures. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSignatures();
  }, []);

  // Hide success message after 10 seconds
  useEffect(() => {
    if (exportSuccess) {
      const timer = setTimeout(() => {
        setExportSuccess(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [exportSuccess]);

  useEffect(() => {
    // Filter signatures based on search term, status filter, and date range
    let result = signatures;
    
    // Apply contract filter
    if (contractFilter !== 'all') {
      result = result.filter(signature => {
        const contractNames = Array.isArray(signature.contractName) 
          ? signature.contractName 
          : [signature.contractName];
        return contractNames.some(name => 
          String(name || '').toLowerCase() === contractFilter.toLowerCase()
        );
      });
    
    	console.log('Filtering signatures with contract filter:', contractFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(signature => {
        const clientName = String(signature.clientName || '').toLowerCase();
        const clientEmail = String(signature.clientEmail || '').toLowerCase();
        const city = String(signature.city || '').toLowerCase();
        const pickupAddress = String(signature.pickupAddress || '').toLowerCase();
        const dropoffAddress = String(signature.dropoffAddress || '').toLowerCase();
        const guestName = String(signature.guestName || '').toLowerCase();
    
    		console.log('Filtering signatures with term filter:', term);
        
        return (
          clientName.includes(term) ||
          clientEmail.includes(term) ||
          city.includes(term) ||
          pickupAddress.includes(term) ||
          dropoffAddress.includes(term) ||
          guestName.includes(term)
        );
      });
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(signature => 
        String(signature.status || '').toLowerCase() === statusFilter.toLowerCase()
      );
    
    		console.log('Filtering signatures with statusFilter filter:', statusFilter);
    }
    
    // Apply date range filter using dropoffDateTime
    if (fromDate && isValid(fromDate)) {
      const startDate = startOfDay(fromDate);
      result = result.filter(signature => {
        const dropoffDate = new Date(signature.dropoffDateTime);
        return isValid(dropoffDate) && dropoffDate >= startDate;
      });
    
    		console.log('Filtering signatures with fromDate filter:', fromDate);
    }
    
    if (toDate && isValid(toDate)) {
      const endDate = endOfDay(toDate);
      result = result.filter(signature => {
        const dropoffDate = new Date(signature.dropoffDateTime);
        return isValid(dropoffDate) && dropoffDate <= endDate;
      });
    
    		console.log('Filtering signatures with endDate filter:', endDate);
    }
    
    setFilteredSignatures(result);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, statusFilter, contractFilter, fromDate, toDate, signatures]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleContractFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setContractFilter(e.target.value);
  };

  const handleFromDateChange = (date: Date | undefined) => {
    setDateError(undefined);
    setFromDate(date);
    
    // Validate date range
    if (date && toDate && date > toDate) {
      setDateError('From date cannot be later than to date');
      return;
    }
  };

  const handleToDateChange = (date: Date | undefined) => {
    setDateError(undefined);
    setToDate(date);
    
    // Validate date range
    if (date && fromDate && date < fromDate) {
      setDateError('To date cannot be earlier than from date');
      return;
    }
  };

  const handleReset = () => {
    // Reset all filter states
    setFromDate(undefined);
    setToDate(undefined);
    setDateError(undefined);
    setContractFilter('all');
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1); // Reset to first page
    
    		console.log('Filtering Reset');
  };

  const handleAddSignature = () => {
    alert('This would open a signature creation tool');
  };

  const handleExportSignatures = async () => {
    try {
      console.log('Starting signature export process');
      setExporting(true);
      setError(null);
      
      // Create export parameters object
      const exportParams = {
        fromDate,
        toDate,
        dateError,
        searchTerm,
        statusFilter,
        contractFilter
      };
      
      console.log('Export parameters:', exportParams);

      // Get all signatures with "Prepared" status and a valid email address
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const preparedSignatures = signatures.filter(sig => 
        sig.status === 'Prepared' && emailRegex.test(sig.clientEmail)
      );
      
      console.log('Found prepared signatures:', {
        count: preparedSignatures.length,
        signatures: preparedSignatures.map(s => ({ id: s.id, status: s.status }))
      });

      if (preparedSignatures.length === 0) {
        throw new Error('No signatures with "Prepared" status found. Please adjust your filters to include signatures that need to be exported.');
      }

      // Fetch signatures with additional fields for export using the parameters
      console.log('Fetching extended signature data for export');
      const exportSignatures = await fetchSignaturesForExport(exportParams);
      console.log('Fetched export signatures:', {
        count: exportSignatures.length,
        sample: exportSignatures[0]
      });
      
      if (!exportSignatures || !Array.isArray(exportSignatures)) {
        throw new Error('Failed to fetch signatures for export. Please try again.');
      }
	  
      
      console.log('--- Export Triggered ---');
      console.log('fromDate:', fromDate);
      console.log('toDate:', toDate);
      console.log('dateError:', dateError);
      console.log('searchTerm:', `"${searchTerm}"`);
      console.log('statusFilter:', statusFilter);
      
      // Determine if any filters are active
      const isFilterActive =
        fromDate !== undefined ||
        toDate !== undefined ||
        dateError !== undefined ||
        (searchTerm && searchTerm.trim() !== '') ||
        statusFilter !== 'all'||
				contractFilter !== 'all';
      
      console.log('Is any filter active?', isFilterActive);
      
      let filteredExportSignatures;
      
      if (isFilterActive) {
        console.log('Applying filters based on filtered IDs from preparedSignatures.');
        const filteredIds = new Set(preparedSignatures.map(sig => sig.id));
        console.log('Filtered IDs count:', filteredIds.size);
        filteredExportSignatures = exportSignatures.filter(sig => filteredIds.has(sig.id));
        console.log('Filters active: exporting all fetched prepared records.');
        //filteredExportSignatures = exportSignatures;
      } else {
        console.log('No filters active: exporting all fetched records.');
        filteredExportSignatures = exportSignatures;
      }
      
      console.log('Exported signatures summary:', {
        count: filteredExportSignatures.length,
        ids: filteredExportSignatures.map(s => s.id)
      });


      
      if (filteredExportSignatures.length === 0) {
        throw new Error('No matching signatures found for export.');
      }
      
      // Group signatures by client name
      const groupedSignatures = filteredExportSignatures.reduce((groups, signature) => {
        const clientName = signature.clientName || 'Unknown Client';
        if (!groups[clientName]) {
          groups[clientName] = [];
        }
        groups[clientName].push(signature);
        return groups;
      }, {} as Record<string, typeof filteredExportSignatures[number][]>);
      console.log('Grouped signatures by client:', {
        clientCount: Object.keys(groupedSignatures).length,
        clients: Object.keys(groupedSignatures)
      });

      // Sort client names alphabetically
      const sortedClientNames = Object.keys(groupedSignatures).sort((a, b) => 
        a.toLowerCase().localeCompare(b.toLowerCase())
      );

      // Create batches with sorted and grouped signatures
      const batches = sortedClientNames.map(clientName => ({
        clientName,
        documents: groupedSignatures[clientName].map(signature => {
          // Parse and validate distances
          const googleDistance = signature.googleDistance ? parseFloat(signature.googleDistance) : 0;
          const uberDistance = signature.uberDistance ? parseFloat(signature.uberDistance) : 0;
          
          console.log('Processing signature distances:', {
            signatureId: signature.id,
            rawGoogleDistance: signature.googleDistance,
            rawUberDistance: signature.uberDistance,
            parsedGoogleDistance: googleDistance,
            parsedUberDistance: uberDistance
          });
          
          return {
            id: signature.id,
            rideId: signature.rideId,
            dropoffDateTime: signature.dropoffDateTime,
            clientName: signature.clientName,
            clientEmail: signature.clientEmail || 'Not Available',
            city: signature.city,
            googleDistance: isNaN(googleDistance) ? '0.00' : googleDistance.toFixed(2),
            duration: signature.duration,
            pickupAddress: signature.pickupAddress,
            dropoffAddress: signature.dropoffAddress,
            status: signature.status,
            requestedDate: signature.requestedDate || '',
            guestName: signature.guestName || 'None',
            stops: signature.stops || [],
            uberDistance: isNaN(uberDistance) ? '0.00' : uberDistance.toFixed(2)
          };
        })
      }));
      console.log('Created export batches:', {
        batchCount: batches.length,
        firstBatch: batches[0]
      });
      
      // Prepare the export data structure
      const exportData = [{
        filters: {
          searchTerm,
          statusFilter,
          totalItems: preparedSignatures.length
        },
        batches
      }];
      console.log('Prepared export data:', {
        filters: exportData[0].filters,
        batchCount: exportData[0].batches.length
      });
      
      // Call the webhook
      const webhookUrl = 'https://hook.us1.make.com/s4j5lr6r6kia2std81mia8qfspjjgtac';
      console.log('Calling webhook:', {
        url: webhookUrl,
        method: 'POST',
        contentType: 'application/json'
      });
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportData)
      });
      
      console.log('Webhook response received:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error('Failed to export signatures. Please try again.');
      }
      
      // Show success message
      console.log('Export completed successfully');
      setExportSuccess(true);
      setError(null);
      
      // Refresh the signatures list
      await loadSignatures();
      
    } catch (error: any) {
      console.error('Error exporting signatures:', {
        message: error.message,
        error
      });
      setError('Failed to export signatures. Please try again later.');
      setExportSuccess(false);
    } finally {
      setExporting(false);
    }
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString();
    } catch (error) {
      return 'N/A';
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

  const formatDistance = (distance: string | undefined) => {
    if (!distance) return 'N/A';
    const numericDistance = parseFloat(distance);
    return isNaN(numericDistance) ? 'N/A' : `${numericDistance.toFixed(2)} mi`;
  };

  const getStatusColor = (status: string | undefined) => {
    const normalizedStatus = String(status || '').toLowerCase();
    switch (normalizedStatus) {
      case 'signed':
        return 'text-green-600';
      case 'on hold':
        return 'text-red-600';
      case 'pending':
        return 'text-blue-600';
      case 'prepared':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  // Pagination logic
  const indexOfLastSignature = currentPage * itemsPerPage;
  const indexOfFirstSignature = indexOfLastSignature - itemsPerPage;
  const currentSignatures = filteredSignatures.slice(indexOfFirstSignature, indexOfLastSignature);
  const totalPages = Math.ceil(filteredSignatures.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Count signatures with "Prepared" status
  const preparedCount = filteredSignatures.filter(sig => sig.status === 'Prepared').length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading signatures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Digital Signatures</h1>
          <p className="text-gray-600 mt-1">Manage signatures for transportation documents</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            onClick={handleExportSignatures}
            disabled={exporting || preparedCount === 0}
            className="flex items-center"
            title={preparedCount === 0 ? 'No signatures with "Prepared" status to export' : undefined}
          >
            <FileDown className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export to DocuSign'}
          </Button>
          <Button 
            onClick={handleAddSignature}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Signature
          </Button>
        </div>
      </div>

      {/* Success message */}
      {exportSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg transition-opacity duration-500">
          <p className="flex items-center">
            <FileSignature className="h-5 w-5 mr-2" />
            Signatures have been exported to DocuSign successfully!
          </p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </p>
        </div>
      )}
      
      {/* Search and filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search signatures..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={contractFilter}
              onChange={handleContractFilterChange}
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
              onChange={handleStatusFilterChange}
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="prepared">Prepared</option>
              <option value="on hold">On Hold</option>
              <option value="signed">Signed</option>
            </select>
          </div>
          
          {/* Date Range Picker */}
          <DateRangePicker
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={handleFromDateChange}
            onToDateChange={handleToDateChange}
            onReset={handleReset}
            error={dateError}
          />
        </div>
      </div>

      {signatures.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <FileSignature className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No signatures yet</h3>
          <p className="mt-2 text-gray-500">
            Add your first signature to use in transportation documents.
          </p>
          <Button 
            onClick={handleAddSignature}
            className="mt-4"
          >
            Add Your First Signature
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {currentSignatures.map((signature) => (
            <div key={signature.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Signature Request #{signature.signatureId}
                  </h3>
                  <span className={`text-sm font-medium ${getStatusColor(signature.status)}`}>
                    {signature.status || 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Client</div>
                    <div className="mt-1 text-sm text-gray-900">{signature.clientName || 'N/A'}</div>
                    {signature.clientEmail && (
                      <div className="mt-1 text-sm text-gray-500 flex items-center">
                        <button 
                          onClick={() => handleEmailClick(signature.clientEmail)}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                          title="Send email"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          {signature.clientEmail}
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Guest</div>
                    <div className="mt-1 text-sm text-gray-900 flex items-center">
                      <Users className="h-4 w-4 mr-1 text-gray-400" />
                      {signature.guestName || 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Drop-off Date & Time</div>
                    <div className="mt-1 text-sm text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {formatDate(signature.dropoffDateTime)}
                      <Clock className="h-4 w-4 ml-2 mr-1 text-gray-400" />
                      {formatTime(signature.dropoffDateTime)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Distance</div>
                    <div className="mt-1 text-sm text-gray-900 flex items-center">
                      <Route className="h-4 w-4 mr-1 text-gray-400" />
                      {formatDistance(signature.googleDistance)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Duration</div>
                    <div className="mt-1 text-sm text-gray-900 flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      {signature.duration || 'N/A'} min
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Pickup Location</div>
                    <div className="mt-1 text-sm text-gray-900 flex items-start">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>{signature.pickupAddress || 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Drop-off Location</div>
                    <div className="mt-1 text-sm text-gray-900 flex items-start">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>{signature.dropoffAddress || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 bg-gray-50 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Requested: {formatDate(signature.requestedDate)}
                </div>
                <div>
                  {signature.status === 'Signed' && signature.signature && signature.signature.length > 0 && (
                    <a
                      href={(() => {
                        try {
                          // Validate URL
                          const url = new URL(signature.signature[0].url);
                          return url.toString();
                        } catch (err) {
                          console.error('Invalid signature URL:', err);
                          return '#';
                        }
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                      title="View Signature Document"
                      onClick={(e) => {
                        if (e.currentTarget.getAttribute('href') === '#') {
                          e.preventDefault();
                          alert('Invalid signature URL');
                        }
                      }}
                    >
                      <FileSignature className="h-5 w-5 mr-1" />
                      View Signature
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Pagination */}
          {filteredSignatures.length > itemsPerPage && (
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
      
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-md font-medium text-blue-800">About Digital Signatures</h3>
        <p className="mt-2 text-sm text-blue-700">
          Digital signatures are used to sign transportation service agreements, consent forms, and other documents.
          Your signatures are securely stored and can be used across all documents in the system.
        </p>
      </div>
    </div>
  );
}