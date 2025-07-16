import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { DocumentUpload } from '../components/DocumentUpload';

export function UploadReferralPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const clientInfo = location.state?.client || null;
  console.log('Client info from state:', clientInfo);
  
  const handleSuccess = () => {
    if (clientInfo?.id) {
      navigate(`/clients/${clientInfo.id}`, { 
        state: { message: 'Referral document uploaded successfully' }
      });
    } else {
      navigate('/clients', { 
        state: { message: 'Referral document uploaded successfully' }
      });
    }
  };

  const handleCancel = () => {
    if (clientInfo?.id) {
      navigate(`/clients/${clientInfo.id}`);
    } else {
      navigate('/clients');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center mb-8">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCancel}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Upload Referral Document</h1>
      </div>
      
      <div>
        <DocumentUpload
          clientName={clientInfo?.clientName || clientInfo?.name}
          clientId={clientInfo?.id}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
