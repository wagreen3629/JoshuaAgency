import React from 'react';
import { ArrowLeft, FileText, DollarSign, Settings, Users } from 'lucide-react';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';

export function ContractsHelpPage() {
  const navigate = useNavigate();
  
  console.log('[ContractsHelpPage] Rendering contracts help page');
  
  const handleNavigation = (path: string) => {
    console.log('[ContractsHelpPage] Navigating to:', path);
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
        <h1 className="text-2xl font-bold text-gray-900">Contracts Help Guide</h1>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Managing Contracts</h2>
          <div className="bg-white shadow rounded-lg p-6 space-y-4">
            <div className="flex items-start">
              <FileText className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Creating Contracts</h3>
                <p className="mt-1 text-gray-600">Steps to create a new contract:</p>
                <ol className="mt-2 list-decimal list-inside text-gray-600 ml-4">
                  <li>Click "Add Contract" button</li>
                  <li>Enter contract details and terms</li>
                  <li>Set pricing structure</li>
                  <li>Upload contract document</li>
                  <li>Assign authorized signers</li>
                </ol>
              </div>
            </div>

            <div className="flex items-start">
              <DollarSign className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Fee Structure</h3>
                <p className="mt-1 text-gray-600">Configure various fee types:</p>
                <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                  <li>Mileage rates</li>
                  <li>Base trip fees</li>
                  <li>Wait time charges</li>
                  <li>Additional passenger fees</li>
                  <li>Special service charges</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start">
              <Settings className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Contract Settings</h3>
                <p className="mt-1 text-gray-600">Important contract settings include:</p>
                <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                  <li>Service area boundaries</li>
                  <li>Operating hours</li>
                  <li>Required notice periods</li>
                  <li>Cancellation policies</li>
                  <li>Insurance requirements</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contract Management</h2>
          <div className="bg-white shadow rounded-lg p-6 space-y-4">
            <div className="flex items-start">
              <Users className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Client Assignment</h3>
                <p className="mt-1 text-gray-600">Managing client relationships:</p>
                <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                  <li>Assign clients to contracts</li>
                  <li>Track client usage</li>
                  <li>Monitor service limits</li>
                  <li>Review client eligibility</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start">
              <FileText className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Documentation</h3>
                <p className="mt-1 text-gray-600">Required contract documentation:</p>
                <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                  <li>Signed agreements</li>
                  <li>Insurance certificates</li>
                  <li>Service level agreements</li>
                  <li>Compliance documents</li>
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
                <span>Review contracts regularly for compliance</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">2</span>
                <span>Keep fee structures up to date</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">3</span>
                <span>Monitor contract expiration dates</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">4</span>
                <span>Document all contract changes</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
