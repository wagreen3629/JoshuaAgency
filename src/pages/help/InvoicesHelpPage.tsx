import React from 'react';
import { ArrowLeft, FileText, DollarSign, Calendar, Download, AlertCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';

export function InvoicesHelpPage() {
  const navigate = useNavigate();
  
  console.log('[InvoicesHelpPage] Rendering invoices help page');
  
  const handleNavigation = (path: string) => {
    console.log('[InvoicesHelpPage] Navigating to:', path);
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
        <h1 className="text-2xl font-bold text-gray-900">Invoices Help Guide</h1>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Managing Invoices</h2>
          <div className="bg-white shadow rounded-lg p-6 space-y-4">
            <div className="flex items-start">
              <FileText className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Invoice Generation</h3>
                <p className="mt-1 text-gray-600">Steps to generate invoices:</p>
                <ol className="mt-2 list-decimal list-inside text-gray-600 ml-4">
                  <li>Select date range for billing</li>
                  <li>Choose contract or program</li>
                  <li>Review completed rides</li>
                  <li>Verify pricing and fees</li>
                  <li>Generate invoice</li>
                </ol>
              </div>
            </div>

            <div className="flex items-start">
              <DollarSign className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Billing Components</h3>
                <p className="mt-1 text-gray-600">Understanding invoice components:</p>
                <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                  <li>Base trip charges</li>
                  <li>Mileage calculations</li>
                  <li>Wait time fees</li>
                  <li>Additional services</li>
                  <li>Taxes and surcharges</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start">
              <Calendar className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Billing Cycles</h3>
                <p className="mt-1 text-gray-600">Common billing periods:</p>
                <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                  <li>Monthly billing</li>
                  <li>Weekly billing</li>
                  <li>Custom date ranges</li>
                  <li>Contract-specific cycles</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Processing</h2>
          <div className="bg-white shadow rounded-lg p-6 space-y-4">
            <div className="flex items-start">
              <Download className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Export Options</h3>
                <p className="mt-1 text-gray-600">Available export formats:</p>
                <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                  <li>PDF documents</li>
                  <li>Excel spreadsheets</li>
                  <li>CSV data files</li>
                  <li>Accounting software formats</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">Common Issues</h3>
                <p className="mt-1 text-gray-600">Troubleshooting invoice problems:</p>
                <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                  <li>Missing ride data</li>
                  <li>Incorrect calculations</li>
                  <li>Contract discrepancies</li>
                  <li>Payment processing errors</li>
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
                <span>Review all rides before generating invoices</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">2</span>
                <span>Keep detailed records of all billing activities</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">3</span>
                <span>Regularly reconcile invoices with ride data</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">4</span>
                <span>Follow up on overdue payments promptly</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}