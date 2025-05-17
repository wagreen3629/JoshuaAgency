import React, { useState } from 'react';
import { Search, Book, Users, FileText, Tag, Receipt, HelpCircle, Home, Car, FileSignature, BarChart, Settings } from 'lucide-react';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';

interface HelpSection {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
}

const helpSections: HelpSection[] = [
  /*
  {
    title: 'Home Dashboard',
    description: 'Overview of key metrics, analytics, and daily operations',
    icon: Home,
    path: '/help'
  },
  */
  {
    title: 'Rides Help',
    description: 'Learn how to schedule, manage, and track transportation rides',
    icon: Book,
    path: '/help/rides'
  },
  {
    title: 'Clients Help',
    description: 'Managing client information, referrals, and documentation',
    icon: Users,
    path: '/help/clients'
  },
  {
    title: 'Contracts Help',
    description: 'Understanding contract management and terms',
    icon: Tag,
    path: '/help/contracts'
  },
  {
    title: 'Invoices Help',
    description: 'Billing, payments, and invoice management',
    icon: Receipt,
    path: '/help/invoices'
  },
  {
    title: 'FAQ',
    description: 'Frequently asked questions and answers',
    icon: HelpCircle,
    path: '/help/faq'
  }
  /*
  ,
  {
    title: 'Reporting',
    description: 'Analytics, reports, and business insights',
    icon: BarChart,
    path: '/help/reporting'
  },
  {
    title: 'Users',
    description: 'User management and access control',
    icon: Users,
    path: '/help/users'
  }
  ,
  {
    title: 'Settings',
    description: 'System configuration and preferences',
    icon: Settings,
    path: '/help/settings'
  }
  */
];

export function HelpPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  console.log('[HelpPage] Rendering help center page');
  
  const filteredSections = helpSections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  console.log('[HelpPage] Filtered sections:', filteredSections);
  
  const handleNavigation = (path: string) => {
    console.log('[HelpPage] Navigating to:', path);
    navigate(path);
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('[HelpPage] Search term changed:', value);
    setSearchTerm(value);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
        <p className="text-gray-600 mt-1">Find help and documentation for all features</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search help topics..."
            value={searchTerm}
            onChange={handleSearch}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Help Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSections.map((section) => (
          <div
            key={section.title}
            onClick={() => handleNavigation(section.path)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
            style={{ cursor: 'pointer' }}
          >
            <div className="flex items-center mb-4">
              <section.icon className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-medium text-gray-900 ml-2">{section.title}</h2>
            </div>
            <p className="text-gray-600 mb-4">{section.description}</p>
          </div>
        ))}
      </div>


      {/* System Overview */}
      <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">System Overview</h2>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Home Dashboard</h3>
            <p className="text-gray-600 mb-4">
              The dashboard provides a comprehensive overview of your transportation operations:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Real-time metrics showing total rides, active clients, and revenue</li>
              <li>Interactive charts displaying ride trends and performance analytics</li>
              <li>Quick access to upcoming rides and important notifications</li>
              <li>Summary of pending signatures and urgent actions needed</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Clients Management</h3>
            <p className="text-gray-600 mb-4">
              Comprehensive client management system for handling transportation service recipients:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Create and manage client profiles with detailed information</li>
              <li>Upload and process client referral documents</li>
              <li>Track approved pickup/dropoff locations for each client</li>
              <li>Manage client-specific requirements and preferences</li>
              <li>View complete ride history and documentation</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Ride Management</h3>
            <p className="text-gray-600 mb-4">
              Complete transportation scheduling and management system:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Schedule immediate, future, and recurring rides</li>
              <li>Real-time ride tracking and status updates</li>
              <li>Manage multiple pickup/dropoff locations</li>
              <li>Handle ride modifications and cancellations</li>
              <li>Track ride completion and signature collection</li>
              <li>Monitor driver assignments and availability</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Digital Signatures</h3>
            <p className="text-gray-600 mb-4">
              Electronic signature management for ride verification:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Collect and store digital signatures for completed rides</li>
              <li>Automated signature requests and processing</li>
              <li>Track signature status and compliance</li>
              <li>Manage signature templates and requirements</li>
              <li>Integration with DocuSign for secure signatures</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoicing System</h3>
            <p className="text-gray-600 mb-4">
              Comprehensive billing and invoice management:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Generate detailed invoices for completed rides</li>
              <li>Track payments and outstanding balances</li>
              <li>Manage billing cycles and payment terms</li>
              <li>Export invoices in multiple formats</li>
              <li>Monitor billing compliance and reporting</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contract Management</h3>
            <p className="text-gray-600 mb-4">
              Handle service agreements and contract administration:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Create and manage transportation service contracts</li>
              <li>Set contract-specific rates and terms</li>
              <li>Track contract expiration and renewals</li>
              <li>Monitor contract compliance and performance</li>
              <li>Manage contract documentation and amendments</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Reporting & Analytics</h3>
            <p className="text-gray-600 mb-4">
              Comprehensive reporting tools for business insights:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Generate detailed operational reports</li>
              <li>Track key performance indicators (KPIs)</li>
              <li>Analyze ride patterns and utilization</li>
              <li>Monitor revenue and cost metrics</li>
              <li>Export data for compliance reporting</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">User Management</h3>
            <p className="text-gray-600 mb-4">
              Secure user access control and administration:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Create and manage user accounts</li>
              <li>Assign user roles and permissions</li>
              <li>Track user activity and audit logs</li>
              <li>Manage password policies and security</li>
              <li>Configure user preferences and settings</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">System Settings</h3>
            <p className="text-gray-600 mb-4">
              Configure and customize system preferences:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Manage notification preferences</li>
              <li>Configure system-wide defaults</li>
              <li>Customize billing settings</li>
              <li>Set up integration preferences</li>
              <li>Manage security settings</li>
            </ul>
          </div>
      
      
        </div>




        
      </div>


      
      {/* Quick Links */}
      <div className="mt-12 bg-gray-50 rounded-lg p-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => handleNavigation('/help')}
          >
            <Book className="h-4 w-4 mr-2" />
            Getting Started Guide
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => window.location.href = 'mailto:williamg@TheJoshuaAgency.com'}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => handleNavigation('/help')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Documentation
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => handleNavigation('/help')}
          >
            <Users className="h-4 w-4 mr-2" />
            Community Forum
          </Button>
        </div>
      </div>
    </div>


    
  );
}