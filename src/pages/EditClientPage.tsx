import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { ClientForm } from '../components/ClientForm';
import { fetchClientById, ClientDetails } from '../lib/airtable';

export function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getClientDetails = async () => {
      if (!id) {
        setError('Client ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const clientData = await fetchClientById(id);
        
        if (!clientData) {
          setError('Client not found');
        } else {
          setClient(clientData);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching client details:', err);
        setError('Failed to load client details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    getClientDetails();
  }, [id]);

  const handleSuccess = () => {
    navigate(`/clients/${id}`, { 
      state: { message: 'Client updated successfully' }
    });
  };

  const handleCancel = () => {
    navigate(`/clients/${id}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading client details...</p>
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
            <Button onClick={() => navigate('/clients')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center mb-8">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(`/clients/${id}`)}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Client</h1>
      </div>

      <ClientForm
        client={client}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}