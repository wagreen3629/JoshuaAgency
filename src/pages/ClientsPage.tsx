import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, Users, AlertCircle, Upload, X, Check, Car, ExternalLink, Edit, AlertTriangle } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { fetchClients, toggleClientReviewed, deleteClient, Client, fetchContracts } from '../lib/airtable';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { validateClientForRide } from '../lib/ride-validation';

function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [reviewedFilter, setReviewedFilter] = useState('all');
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    const getClients = async () => {
      try {
        setLoading(true);
        const clientsData = await fetchClients();
        const contractsData = await fetchContracts();
        setClients(clientsData);
        setFilteredClients(clientsData);
        setContracts(contractsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load clients. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    getClients();
  }, []);

  useEffect(() => {
    // Filter clients based on search term and filters
    let result = clients;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(client => {
        const name = String(client.name || '').toLowerCase();
        const email = String(client.email || '').toLowerCase();
        const phone = String(client.phone || '').toLowerCase();
        
        return (
          name.includes(term) ||
          email.includes(term) ||
          phone.includes(term)
        );
      });
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(client => 
        String(client.status || '').toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    if (reviewedFilter !== 'all') {
        result = result.filter(client => {
          if (reviewedFilter === 'reviewed') return client.reviewed === true;
          if (reviewedFilter === 'not-reviewed') return client.reviewed !== true; // covers false, null, undefined
        });
      }
    
   if (selectedContract !== 'all') {
      console.log('Filtering by contract:', selectedContract);
      console.log('Current clients:', result);
    
      result = result.filter(client => {
        const clientContract = client.contract;
    
        if (selectedContract === 'None') {
          // Return clients with no contract value
          return clientContract === null || clientContract === undefined || clientContract === '';
        }
    
        // For all other contract values
        if (!clientContract) return false;
    
        const clientContractStr = String(clientContract).trim();
        const selectedContractStr = String(selectedContract).trim();
    
        return clientContractStr === selectedContractStr;
      });
    
      console.log('Filtered clients:', result);
    }
    
    setFilteredClients(result);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, statusFilter, reviewedFilter, selectedContract, clients]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleReviewedFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReviewedFilter(e.target.value);
  };
  
  const handleContractFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('Contract filter changed to:', e.target.value);
    setSelectedContract(e.target.value);
  };

  const handleAddClient = () => {
    // Navigate to add client form
    navigate('/clients/new');
  };

  const handleUploadReferral = () => {
    navigate('/upload-referral');
  };

  const handleViewClient = (id: string) => {
    navigate(`/clients/${id}`);
  };

  const handleToggleReviewed = async (id: string, currentReviewed: boolean) => {
    try {
      const success = await toggleClientReviewed(id, !currentReviewed);
      if (success) {
        // Update local state
        setClients(prevClients => 
          prevClients.map(client => 
            client.id === id 
              ? { ...client, reviewed: !currentReviewed }
              : client
          )
        );
      }
    } catch (err) {
      console.error('Error toggling client reviewed status:', err);
      // Show error message to user
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteClient(id);
      if (success) {
        setClients(prev => prev.filter(c => c.id !== id));
        setFilteredClients(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error('Error deleting client:', err);
      setError('Failed to delete client. Please try again.');
    } finally {
      setShowDeleteDialog(false);
      setSelectedClientId(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setSelectedClientId(id);
    setShowDeleteDialog(true);
  };

  const handleScheduleRide = async (clientId: string) => {
    const validation = await validateClientForRide(clientId);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setShowValidationDialog(true);
      return;
    }
    
    navigate('/rides/schedule', { 
      state: { 
        clientId,
        returnPath: '/clients/'clientId
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Pagination logic
  const indexOfLastClient = currentPage * itemsPerPage;
  const indexOfFirstClient = indexOfLastClient - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Manage transportation service clients</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            className="flex items-center"
            onClick={handleUploadReferral}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Referral
          </Button>
          <Button 
            onClick={handleAddClient}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>
      
      {/* Search and filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={selectedContract}
              onChange={handleContractFilterChange}
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Contracts</option>
              <option value="None">No Contract Assigned (0)</option>
              {contracts
                .filter(contract => contract.status === 'Active')
                .map(contract => (
                  <option key={contract.id} value={contract.contractNumber || ''}>
                    {contract.name} ({contract.contractNumber})
                  </option>
                ))
              }
            </select>
            <select
              value={reviewedFilter}
              onChange={handleReviewedFilterChange}
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Reviews</option>
              <option value="reviewed">Reviewed</option>
              <option value="not-reviewed">Not Reviewed</option>
            </select>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </button>
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {clients.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No clients yet</h3>
          <p className="mt-2 text-gray-500">
            Add your first client to start managing transportation services.
          </p>
          <Button 
            onClick={handleAddClient}
            className="mt-4"
          >
            Add Your First Client
          </Button>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reviewed
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {client.name?.split(' ').map(n => n[0]).join('') || ''}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div 
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                          onClick={() => handleViewClient(client.id)}
                        >
                          {client.name}
                        </div>
                        {client.contract && (
                          <div className="text-xs text-gray-500">
                            Contract Num: {client.contract}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.email}</div>
                    <div className="text-sm text-gray-500">{client.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      client.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(client.createdDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleToggleReviewed(client.id, client.reviewed)}
                      className={`${
                        client.reviewed 
                          ? 'text-green-600 hover:text-green-900' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title={client.reviewed ? 'Mark as Unreviewed' : 'Mark as Reviewed'}
                    >
                      {client.reviewed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleScheduleRide(client.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Schedule Ride"
                    >
                      <Car className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/clients/${client.id}/edit`)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Edit Client"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleViewClient(client.id)}
                      className="text-blue-600 hover:text-blue-900" 
                      title="View Details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDeleteDialog(client.id)} 
                      className="text-red-600 hover:text-red-900 ml-3" 
                      title="Delete Client" 
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Client</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this client? This action cannot be undone.
                  All associated rides, signatures, and addresses will also be deleted.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => selectedClientId && handleDelete(selectedClientId)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Client
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Validation Error Dialog */}
          <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center text-red-600">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Unable to Create Ride
                </DialogTitle>
                <DialogDescription>
                  <p className="mb-4"><strong>Client does not meet the following requirements:</strong></p>
                  <ol className="list-disc pl-5 space-y-2">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm text-gray-900">{error}</li>
                    ))}
                  </ol>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  onClick={() => setShowValidationDialog(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Pagination */}
          {filteredClients.length > itemsPerPage && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstClient + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastClient, filteredClients.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredClients.length}</span> results
                  </p>
                </div>
                <div>
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
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export { ClientsPage }