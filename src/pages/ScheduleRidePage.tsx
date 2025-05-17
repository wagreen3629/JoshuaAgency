import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ScheduleRideWizard } from '../components/ScheduleRideWizard';

export function ScheduleRidePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const defaultClientId = location.state?.clientId;
  const returnPath = location.state?.returnPath || '/rides';

  const handleCancel = () => {
    navigate(returnPath);
  };

  const handleComplete = () => {
    navigate(returnPath);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ScheduleRideWizard 
        defaultClientId={defaultClientId}
        onCancel={handleCancel}
        onComplete={handleComplete}
      />
    </div>
  );
}
