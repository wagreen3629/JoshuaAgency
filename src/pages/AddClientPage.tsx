import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { ClientForm } from '../components/ClientForm';

export function AddClientPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/clients', { 
      state: { message: 'Client added successfully' }
    });
  };

  const handleCancel = () => {
    navigate('/clients');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center mb-8">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/clients')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Add New Client</h1>
      </div>

      <ClientForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
