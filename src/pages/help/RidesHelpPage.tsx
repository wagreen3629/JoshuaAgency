import React from 'react';
import { ArrowLeft, Car, Calendar, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';

export function RidesHelpPage() {
  const navigate = useNavigate();
  
  console.log('[RidesHelpPage] Rendering rides help page');
  
  const handleNavigation = (path: string) => {
    console.log('[RidesHelpPage] Navigating to:', path);
    navigate(path);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-8">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleNavigation('/help')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Help
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Rides Help Guide</h1>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Scheduling Rides</h2>
          <div className="relative w-full mb-6 rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
            <video
              className="absolute top-0 left-0 w-full h-full object-contain"
              controls
              preload="metadata"              
              poster="/LaptopThumbnail.PNG"
            >
              <source src="/ScheduleRide.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
           <div className="bg-white shadow rounded-lg p-6 space-y-4">
            <div className="flex items-start">
              <Car className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Types of Rides</h3>
                <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                  <li>Immediate - For rides needed right away</li>
                  <li>Scheduled - For future appointments</li>
                  <li>Flexible - When exact timing is flexible</li>
                  <li>Recurring - For regular appointments</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start">
              <Calendar className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Scheduling Process</h3>
                <ol className="mt-2 list-decimal list-inside text-gray-600 ml-4">
                  <li>Select the client</li>
                  <li>Choose pickup and drop-off locations</li>
                  <li>Set date and time</li>
                  <li>Add any special instructions</li>
                  <li>Review and confirm</li>
                </ol>
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Managing Locations</h3>
                <p className="mt-1 text-gray-600">When entering locations:</p>
                <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                  <li>Use complete addresses</li>
                  <li>Add location notes if needed</li>
                  <li>Save frequently used locations</li>
                  <li>Verify addresses are correct</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Managing Rides</h2>
          <div className="relative w-full mb-6 rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
            <video
              className="absolute top-0 left-0 w-full h-full object-contain"
              controls
              preload="metadata"              
              poster="/LaptopThumbnail.PNG"
            >
              <source src="/ManageRides.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="bg-white shadow rounded-lg p-6 space-y-4">
            <div className="flex items-start">
              <Clock className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Ride Status Updates</h3>
                <p className="mt-1 text-gray-600">Monitor rides through various statuses:</p>
                <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                  <li>Processing - Initial scheduling</li>
                  <li>Confirmed - Driver assigned</li>
                  <li>In Progress - Ride underway</li>
                  <li>Completed - Ride finished</li>
                  <li>Cancelled - Ride cancelled</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Handling Issues</h3>
                <p className="mt-1 text-gray-600">Common issues and solutions:</p>
                <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                  <li>No driver available - Try adjusting pickup time</li>
                  <li>Cancellations - Document reason</li>
                  <li>Late arrivals - Contact support</li>
                  <li>Address errors - Verify and update</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Best Practices</h2>
          <div className="bg-white shadow rounded-lg p-6">
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">1</span>
                <span>Schedule rides at least 24 hours in advance when possible</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">2</span>
                <span>Include detailed pickup/dropoff instructions</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">3</span>
                <span>Verify all details before confirming</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">4</span>
                <span>Monitor ride status and respond to issues promptly</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
