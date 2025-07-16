import React from 'react';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';

export function FAQHelpPage() {
  const navigate = useNavigate();
  
  console.log('[FAQHelpPage] Rendering FAQ help page');
  
  const handleNavigation = (path: string) => {
    console.log('[FAQHelpPage] Navigating to:', path);
    navigate(path);
  };

  const faqs = [
    {
      question: "How do I schedule a ride?",
      answer: "To schedule a ride, go to the Rides page and click 'Schedule Ride'. Select the client, enter pickup and drop-off locations, choose the date and time, and add any special instructions. Review the details and confirm the booking."
    },
    {
      question: "What should I do if a ride is running late?",
      answer: "If a ride is running late, you can track its status in real-time on the Rides page. Contact support immediately if there are significant delays. The system will automatically notify the client of any updates."
    },
    {
      question: "How do I upload a client referral?",
      answer: "To upload a referral, click the 'Upload Referral' button on the Clients page. Select the PDF file and wait for it to upload. The system will process the referral and create or update the client record accordingly."
    },
    {
      question: "Can I modify a ride after it's scheduled?",
      answer: "Yes, you can modify a scheduled ride up until 2 hours before the pickup time. Go to the ride details page and click 'Edit' to make changes. Some restrictions may apply based on the ride status."
    },
    {
      question: "How are ride distances calculated?",
      answer: "Ride distances are calculated using both Google Maps and Uber's routing system. The system compares both distances and uses the appropriate one based on the contract terms. You can view both distances in the ride details."
    },
    {
      question: "What happens if a client misses their ride?",
      answer: "If a client misses their ride, it will be marked as a 'No Show'. The system will record this in the client's history. You can reschedule the ride if needed, but additional fees may apply according to the contract terms."
    },
    {
      question: "How do I generate invoices for a specific contract?",
      answer: "Navigate to the Invoices page, select the contract from the dropdown menu, choose the billing period, and click 'Generate Invoice'. Review the details before finalizing and you can export the invoice in various formats."
    },
    {
      question: "Can I set up recurring rides?",
      answer: "Yes, when scheduling a ride, select the 'Recurring' option. You can set the frequency (daily, weekly, monthly) and specify how long the recurring schedule should continue. Each ride can be managed individually if needed."
    },
    {
      question: "How do I handle special requirements for clients?",
      answer: "Special requirements can be added to the client's profile under 'Additional Information'. These requirements will automatically appear when scheduling rides. You can also add specific instructions for individual rides."
    },
    {
      question: "What should I do if there's a billing discrepancy?",
      answer: "If you notice a billing discrepancy, first verify the ride details and contract rates. Document the issue and contact support with the specific invoice and ride numbers. Keep all related documentation for reference."
    }
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h1>
      </div>

      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-start">
              <HelpCircle className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-gray-900">{faq.question}</h3>
                <p className="mt-2 text-gray-600">{faq.answer}</p>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h2 className="text-lg font-bold text-blue-900 mb-2">Still Need Help?</h2>
          <p className="text-blue-700">
            If you can't find the answer to your question, our support team is here to help.
            Contact us through the support portal or email us at support@example.com.
          </p>
        </div>
      </div>
    </div>
  );
}
