import React from 'react';
import { ArrowLeft, Users, Upload, FileText, Search, Filter } from 'lucide-react';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';

export function ClientsHelpPage() {
  const navigate = useNavigate();
  
  console.log('[ClientsHelpPage] Rendering clients help page');
  
  const handleNavigation = (path: string) => {
    console.log('[ClientsHelpPage] Navigating to:', path);
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
        <h1 className="text-2xl font-bold text-gray-900">Clients Help Guide</h1>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Managing Clients</h2>
          <div className="relative w-full mb-6 rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
            <video
              className="absolute top-0 left-0 w-full h-full object-contain"
              controls
              preload="metadata"              
              poster="/LaptopThumbnail.PNG"
            >
              <source src="/ManageClients.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="bg-white shadow rounded-lg p-6 space-y-4">
            <div className="flex items-start">
              <Users className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Adding New Clients</h3>
                <p className="mt-1 text-gray-600">Click the "Add Client" button to create a new client profile. Fill in all required information including:</p>
                <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                  <li>Personal information (name, contact details)</li>
                  <li>Case information (case manager, county)</li>
                  <li>Program details and activities</li>
                  <li>Contract assignment</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start">
              <Upload className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Uploading Referrals</h3>
                <p className="mt-1 text-gray-600">To upload a client referral:</p>
                <ol className="mt-2 list-decimal list-inside text-gray-600 ml-4">
                  <li>Click "Upload Referral" button</li>
                  <li>Select or drag-and-drop the PDF file</li>
                  <li>Wait for the upload to complete</li>
                  <li>The system will process the referral automatically</li>
                </ol>
              </div>
            </div>

            <div className="flex items-start">
              <FileText className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Client Details</h3>
                <p className="mt-1 text-gray-600">View detailed client information by clicking on a client's name. From the details page, you can:</p>
                <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                  <li>Edit client information</li>
                  <li>View ride history</li>
                  <li>Manage approved destinations</li>
                  <li>Schedule new rides</li>
                  <li>View and upload documents</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start">
              <Search className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Searching and Filtering</h3>
                <p className="mt-1 text-gray-600">Use the search bar to find clients by:</p>
                <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                  <li>Name</li>
                  <li>Email</li>
                  <li>Phone number</li>
                  <li>Contract number</li>
                </ul>
                <p className="mt-2 text-gray-600">Use filters to sort by status, contract, or review status.</p>
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
                <span>Always verify client information before saving changes</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">2</span>
                <span>Keep contact information up to date</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">3</span>
                <span>Review and update approved destinations regularly</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">4</span>
                <span>Document any special requirements or notes clearly</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
