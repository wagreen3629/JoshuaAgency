import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertCircle, FileText, Edit, Trash, Check, ExternalLink, FileSignature } from 'lucide-react';
import { Button } from '../components/Button';
import { fetchContracts, Contract, createContract, updateContract, deleteContract } from '../lib/airtable';
import { useNavigate } from 'react-router-dom';

export function ContractsPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseRate: 0,
    mileageRate: 0,
    waitTimeRate: 0,
    contractUrl: '',
    contractExpiration: '',
    status: 'Active' as 'Active' | 'Inactive',
    signature: 'Yes' as 'Yes' | 'No'
  });

  useEffect(() => {
    const getContracts = async () => {
      try {
        setLoading(true);
        const contractsData = await fetchContracts();
        setContracts(contractsData);
        setFilteredContracts(contractsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching contracts:', err);
        setError('Failed to load contracts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    getContracts();
  }, []);

  useEffect(() => {
    let result = contracts;
    
    // Only filter if we have contracts
    if (!result) {
      return;
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(contract => {
        const name = String(contract.name || '').toLowerCase();
        const entity = String(contract.entity || '').toLowerCase();
        const contractNumber = String(contract.contractNumber || '').toLowerCase();
        
        return (
          name.includes(term) ||
          entity.includes(term) ||
          contractNumber.includes(term)
        );
      });
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(contract => 
        String(contract.status || '').toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    setFilteredContracts(result);
  }, [searchTerm, statusFilter, contracts]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Rate') ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingContract) {
        const updated = await updateContract(editingContract.id, formData);
        if (updated) {
          setContracts(prev => prev.map(p => p.id === editingContract.id ? updated : p));
        }
      } else {
        const created = await createContract(formData);
        if (created) {
          setContracts(prev => [...prev, created]);
        }
      }
      
      setShowAddForm(false);
      setEditingContract(null);
      setFormData({
        name: '',
        description: '',
        baseRate: 0,
        mileageRate: 0,
        waitTimeRate: 0,
        contractUrl: '',
        contractExpiration: '',
        status: 'Active'
      });
    } catch (err) {
      console.error('Error saving contract:', err);
      setError('Failed to save contract. Please try again.');
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      name: contract.name,
      description: contract.description,
      baseRate: contract.baseRate,
      mileageRate: contract.mileageRate,
      waitTimeRate: contract.waitTimeRate,
      contractUrl: contract.contractUrl || '',
      contractExpiration: contract.contractExpiration || '',
      status: contract.status
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this contract?')) {
      try {
        const success = await deleteContract(id);
        if (success) {
          setContracts(prev => prev.filter(p => p.id !== id));
        }
      } catch (err) {
        console.error('Error deleting contract:', err);
        setError('Failed to delete contract. Please try again.');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (showAddForm) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {editingContract ? 'Edit Contract' : 'Add New Contract'}
            </h1>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              setShowAddForm(false);
              setEditingContract(null);
            }}
          >
            Cancel
          </Button>
        </div>

        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Basic Information Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Basic Information</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Rate Information Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Rate Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="baseRate" className="block text-sm font-medium text-gray-700 mb-1">
                    Base Rate <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="baseRate"
                      name="baseRate"
                      value={formData.baseRate}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="mileageRate" className="block text-sm font-medium text-gray-700 mb-1">
                    Mileage Rate (per mile) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="mileageRate"
                      name="mileageRate"
                      value={formData.mileageRate}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="waitTimeRate" className="block text-sm font-medium text-gray-700 mb-1">
                    Wait Time Rate (per hour) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="waitTimeRate"
                      name="waitTimeRate"
                      value={formData.waitTimeRate}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contract Information Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Contract Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contractUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Contract URL
                  </label>
                  <input
                    type="url"
                    id="contractUrl"
                    name="contractUrl"
                    value={formData.contractUrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://"
                  />
                </div>

                <div>
                  <label htmlFor="contractExpiration" className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Expiration Date
                  </label>
                  <input
                    type="date"
                    id="contractExpiration"
                    name="contractExpiration"
                    value={formData.contractExpiration}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Status</h3>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingContract(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingContract ? 'Update Contract' : 'Add Contract'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
          <p className="text-gray-600 mt-1">Manage and track transportation service contracts</p>
        </div>
        <div>
          <Button 
            onClick={() => navigate('/contracts/new')}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contract
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
              placeholder="Search contracts..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Contract cards */}
      <div className="space-y-4">
        {filteredContracts.map((contract) => (
          <div key={contract.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Contract #{contract.contractNumber}</h3>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    contract.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {contract.status}
                  </span>
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Contract Name</div>
                    <div className="mt-1 text-sm text-gray-900 font-medium">{contract.name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Entity</div>
                    <div className="mt-1 text-sm text-gray-900">{contract.entity}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Location</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {contract.city}, {contract.state}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Signature Required</div>
                    <div className="mt-1 text-sm text-gray-900 flex items-center text-gray-600">
                      <FileSignature className="h-4 w-4 text-gray-400 mr-1" />
                      {contract.signature || 'No'}
                    </div>
                  </div>
                  <div>
                    {contract.contractUrl && (
                      <div>
                        <div className="text-sm font-medium text-gray-500">Contract Document</div>
                        <div className="mt-1">
                          <a
                            href={contract.contractUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View Contract
                            <ExternalLink className="h-4 w-4 ml-1" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 bg-gray-50 text-right">
                <button
                  onClick={() => navigate(`/contracts/${contract.id}`)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                  title="View Details"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate(`/contracts/${contract.id}/edit`)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(contract.id)}
                  className="text-red-600 hover:text-red-900"
                  title="Delete"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
          </div>
        ))}
      </div>
    </div>
  );
}
