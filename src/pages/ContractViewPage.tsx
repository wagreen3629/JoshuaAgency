import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, ExternalLink, DollarSign, Calendar, AlertCircle, FileSignature } from 'lucide-react';
import { Button } from '../components/Button';
import { fetchContracts, Contract } from '../lib/airtable';

export function ContractViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getContractDetails = async () => {
      if (!id) {
        setError('Contract ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const contracts = await fetchContracts();
        const contractData = contracts.find(c => c.id === id);
        
        if (!contractData) {
          setError('Contract not found');
        } else {
          setContract(contractData);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching contract details:', err);
        setError('Failed to load contract details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    getContractDetails();
  }, [id]);

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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading contract details...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error || 'Contract not found'}</span>
          </div>
          <div className="mt-4">
            <Button onClick={() => navigate('/contracts')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contracts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/contracts')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Contract Details</h1>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
          >
            {contract.contractUrl ? 'Update Contract Document' : 'Upload Contract Document'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate(`/contracts/${id}/edit`)}
          >
            Edit Contract
          </Button>
        </div>
      </div>

      {/* Contract Information */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Basic Information */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-medium text-gray-900">{contract.name}</h2>
              <p className="mt-1 text-gray-500">Contract #{contract.contractNumber}</p>
            </div>
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              contract.status === 'Active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {contract.status}
            </span>
          </div>
        </div>

        {/* Location Information */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-500">Entity</div>
              <div className="mt-1 text-gray-900">{contract.entity}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">City</div>
              <div className="mt-1 text-gray-900">{contract.city}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">County</div>
              <div className="mt-1 text-gray-900">{contract.county}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">State</div>
              <div className="mt-1 text-gray-900">{contract.state}</div>
            </div>
          </div>
        </div>

        {/* Fee Structure */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Fee Structure</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-500">Mileage Fee</div>
              <div className="mt-1 text-gray-900 flex items-center">
                <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                {formatCurrency(contract.mileageFee)}/mile
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Trip Fee</div>
              <div className="mt-1 text-gray-900 flex items-center">
                <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                {formatCurrency(contract.tripFee)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Child Fee</div>
              <div className="mt-1 text-gray-900 flex items-center">
                <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                {formatCurrency(contract.childFee)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Wait Fee</div>
              <div className="mt-1 text-gray-900 flex items-center">
                <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                {formatCurrency(contract.waitFee)}/hour
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Wheelchair Fee</div>
              <div className="mt-1 text-gray-900 flex items-center">
                <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                {formatCurrency(contract.wheelchairFee)}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-500">Contract Expiration</div>
              <div className="mt-1 text-gray-900 flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                {formatDate(contract.contractExpiration)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Signature Required</div>
              <div className="mt-1 text-gray-900 flex items-center">
                <FileSignature className="h-4 w-4 text-gray-400 mr-1" />
                {contract.signature || 'No'}
              </div>
            </div>
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
          {contract.notes && (
            <div className="mt-6">
              <div className="text-sm font-medium text-gray-500">Notes</div>
              <div className="mt-1 text-gray-900">{contract.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}