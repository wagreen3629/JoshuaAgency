import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ArrowLeft, RotateCcw, Clock } from 'lucide-react';
import { Button } from '../components/Button';
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from '../components/ui/toast';

function RideConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textOptOutError, setTextOptOutError] = useState(false);
  const [showReturnTripPrompt, setShowReturnTripPrompt] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);

  // Safely access rideData with a default empty object to prevent undefined errors
  const rideData = location.state?.rideData || {};

  useEffect(() => {
    // Check if we have valid rideData before proceeding
    if (!location.state?.rideData) {
      console.warn('[RideConfirmationPage] No rideData found in location.state');
      setError('No ride data available. Please try scheduling your ride again.');
      return;
    }

    console.log('[RideConfirmationPage] Loaded rideData:', rideData);
    console.log('webhookStatus:', rideData.webhookStatus);
    console.log('webhookMessage', rideData.webhookMessage);
    console.log('Status:', rideData.status);
    console.log('Message', rideData.message);

    if (rideData.webhookStatus === 'Failure') {
      if (rideData.webhookMessage?.includes("Your ride can't be scheduled because your rider has opted out of text updates")) {
        console.info('[RideConfirmationPage] Ride scheduling failed due to text opt-out:', rideData.webhookMessage);
        setTextOptOutError(true);
        setError(rideData.webhookMessage);
      } else {
        console.info('[RideConfirmationPage] Ride scheduling failed:', rideData.webhookMessage);
        setError(rideData.webhookMessage || 'Failed to schedule ride');
      }
      setSubmissionComplete(false);
    } else if (rideData.webhookStatus) { // Only set as success if we have a webhookStatus
      console.info('[RideConfirmationPage] Ride scheduled successfully:', rideData.webhookMessage);
      setSubmissionComplete(true);
      setShowReturnTripPrompt(true);
    }
  }, [rideData, location.state, navigate]);

  const handleCancel = () => {
    console.log('[RideConfirmationPage] User chose to cancel and return to /rides');
    navigate('/rides');
  };

  const handleScheduleReturnTrip = () => {
    console.log('[RideConfirmationPage] User chose to schedule a return trip');
    navigate('/rides/schedule', {
      state: {
        clientId: rideData?.clientId,
        isReturnTrip: true,
        originalPickup: rideData?.pickup,
        originalDropoff: rideData?.dropoff
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center mb-8">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/rides')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Rides
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Ride Confirmation</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {loading ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Submitting ride request...</p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Failed to Schedule Ride
                  </h3>
                  {textOptOutError ? (
                    <div className="mt-2 text-sm text-red-700">
                      <p>Your ride can't be scheduled because your rider has opted out of text updates.</p>
                      <p className="mt-2">To schedule a ride, please ask your rider to text START to 425-310-4746.</p>
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-red-700 whitespace-pre-line">{error}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleCancel}>Try Later</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Ride Scheduled Successfully
                  </h3>
                  <p className="mt-2 text-sm text-green-700">
                    {rideData.webhookMessage || 'Your ride has been scheduled and confirmed.'}
                  </p>
                </div>
              </div>
            </div>

            {showReturnTripPrompt && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800">
                  Would you like to schedule a return trip?
                </h3>
                <p className="mt-2 text-sm text-blue-700">
                  We can help you schedule a return trip with the same client.
                </p>
                <div className="mt-4 flex justify-end space-x-3">
                  <Button variant="outline" onClick={handleCancel}>No, Thanks</Button>
                  <Button onClick={handleScheduleReturnTrip} disabled={textOptOutError}>Schedule Return Trip</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ToastProvider>
        {submissionComplete && (
          <Toast>
            <div className="flex">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <ToastTitle>Ride Scheduled</ToastTitle>
                <ToastDescription>{rideData.webhookMessage || 'Your ride request has been confirmed'}</ToastDescription>
              </div>
            </div>
            <ToastClose />
          </Toast>
        )}
        <ToastViewport />
      </ToastProvider>
    </div>
  );
}

export default RideConfirmationPage;
