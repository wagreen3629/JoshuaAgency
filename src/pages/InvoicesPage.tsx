import React, { useState } from 'react';
import { FileText, Download, Search, Filter, Calendar, DollarSign, ArrowUpRight, FileDown } from 'lucide-react';
import { Button } from '../components/Button';

// Mock data for invoices
const mockInvoices = [
  {
    id: 'INV-2025-001',
    client: 'Department of Health & Human Services',
    program: 'TANF/JOBS',
    date: '2025-03-01',
    amount: 2450.00,
    status: 'Paid',
    rides: 35,
    paymentDate: '2025-03-15'
  },
  {
    id: 'INV-2025-002',
    client: 'SNAP Services Division',
    program: 'SNAP',
    date: '2025-03-01',
    amount: 1875.50,
    status: 'Pending',
    rides: 28,
    paymentDate: null
  },
  {
    id: 'INV-2025-003',
    client: 'Workforce Development',
    program: 'OTHER',
    date: '2025-02-28',
    amount: 3200.75,
    status: 'Paid',
    rides: 42,
    paymentDate: '2025-03-14'
  },
  {
    id: 'INV-2025-004',
    client: 'Department of Health & Human Services',
    program: 'TANF/JOBS',
    date: '2025-02-28',
    amount: 1950.25,
    status: 'Overdue',
    rides: 29,
    paymentDate: null
  },
  {
    id: 'INV-2025-005',
    client: 'SNAP Services Division',
    program: 'SNAP',
    date: '2025-02-27',
    amount: 2100.00,
    status: 'Paid',
    rides: 31,
    paymentDate: '2025-03-13'
  }
];

export function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  
  // Filter invoices based on search and filters
  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || invoice.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesProgram = programFilter === 'all' || invoice.program === programFilter;
    
    return matchesSearch && matchesStatus && matchesProgram;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage and track transportation service invoices</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            className="flex items-center"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Generate Invoice
          </Button>
        </div>
      </div>
      
      {/* Search and filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Programs</option>
              <option value="TANF/JOBS">TANF/JOBS</option>
              <option value="SNAP">SNAP</option>
              <option value="OTHER">OTHER</option>
            </select>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </button>
          </div>
        </div>
      </div>
      
      {/* Invoices list */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Program
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    <div className="text-sm font-medium text-gray-900">{invoice.id}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{invoice.client}</div>
                  <div className="text-sm text-gray-500">{invoice.rides} rides</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{invoice.program}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(invoice.date)}</div>
                  {invoice.paymentDate && (
                    <div className="text-sm text-gray-500">
                      Paid: {formatDate(invoice.paymentDate)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.amount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button 
                    className="text-blue-600 hover:text-blue-900"
                    title="View Details"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Outstanding</h3>
          <div className="mt-2 flex items-baseline">
            <div className="text-2xl font-semibold text-gray-900">
              {formatCurrency(
                mockInvoices
                  .filter(inv => inv.status !== 'Paid')
                  .reduce((sum, inv) => sum + inv.amount, 0)
              )}
            </div>
          </div>
          <div className="mt-1 text-sm text-gray-500">
            From {mockInvoices.filter(inv => inv.status !== 'Paid').length} unpaid invoices
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">This Month</h3>
          <div className="mt-2 flex items-baseline">
            <div className="text-2xl font-semibold text-gray-900">
              {formatCurrency(
                mockInvoices.reduce((sum, inv) => sum + inv.amount, 0)
              )}
            </div>
          </div>
          <div className="mt-1 text-sm text-gray-500">
            From {mockInvoices.length} total invoices
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Rides</h3>
          <div className="mt-2 flex items-baseline">
            <div className="text-2xl font-semibold text-gray-900">
              {mockInvoices.reduce((sum, inv) => sum + inv.rides, 0)}
            </div>
          </div>
          <div className="mt-1 text-sm text-gray-500">
            Across all invoices
          </div>
        </div>
      </div>
    </div>
  );
}
