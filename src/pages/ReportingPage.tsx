import React from 'react';
import { BarChart as BarChartIcon, PieChart as PieChartIcon, Calendar, Download } from 'lucide-react';
import { Button } from '../components/Button';
import { ChartCard } from '../components/dashboard/ChartCard';
import { BarChart } from '../components/dashboard/BarChart';
import { PieChart } from '../components/dashboard/PieChart';
import { DateRangePicker } from '../components/DateRangePicker';

export function ReportingPage() {
  const [fromDate, setFromDate] = React.useState<Date | undefined>(undefined);
  const [toDate, setToDate] = React.useState<Date | undefined>(undefined);
  const [dateError, setDateError] = React.useState<string | undefined>(undefined);

  // Mock data for reports
  const mockData = {
    ridesByType: [
      { label: 'Medical', value: 845, color: '#4F46E5' },
      { label: 'Therapy', value: 412, color: '#10B981' },
      { label: 'Employment', value: 325, color: '#F59E0B' },
      { label: 'Other', value: 260, color: '#6B7280' }
    ],
    revenueByContract: [
      { label: 'Contract A', value: 42500, color: '#4F46E5' },
      { label: 'Contract B', value: 28750, color: '#10B981' },
      { label: 'Contract C', value: 21200, color: '#F59E0B' }
    ],
    monthlyRides: [
      { label: 'Jan', value: 145 },
      { label: 'Feb', value: 165 },
      { label: 'Mar', value: 172 },
      { label: 'Apr', value: 168 },
      { label: 'May', value: 180 },
      { label: 'Jun', value: 195 },
      { label: 'Jul', value: 190 },
      { label: 'Aug', value: 205 },
      { label: 'Sep', value: 210 },
      { label: 'Oct', value: 198 },
      { label: 'Nov', value: 212 },
      { label: 'Dec', value: 215 }
    ]
  };

  const handleFromDateChange = (date: Date | undefined) => {
    setDateError(undefined);
    setFromDate(date);
    
    if (date && toDate && date > toDate) {
      setDateError('From date cannot be later than to date');
      return;
    }
  };

  const handleToDateChange = (date: Date | undefined) => {
    setDateError(undefined);
    setToDate(date);
    
    if (date && fromDate && date < fromDate) {
      setDateError('To date cannot be earlier than from date');
      return;
    }
  };

  const handleReset = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setDateError(undefined);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporting</h1>
          <p className="text-gray-600 mt-1">View and analyze transportation service data</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Report
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Date Range</h2>
        <DateRangePicker
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={handleFromDateChange}
          onToDateChange={handleToDateChange}
          onReset={handleReset}
          error={dateError}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard 
          title="Rides by Type"
          footer={
            <div className="text-sm text-gray-500">
              Total rides: {mockData.ridesByType.reduce((sum, item) => sum + item.value, 0)}
            </div>
          }
        >
          <div className="flex justify-center">
            <PieChart 
              data={mockData.ridesByType}
              size={220}
            />
          </div>
        </ChartCard>

        <ChartCard 
          title="Revenue by Contract"
          footer={
            <div className="text-sm text-gray-500">
              Total revenue: {formatCurrency(mockData.revenueByContract.reduce((sum, item) => sum + item.value, 0))}
            </div>
          }
        >
          <div className="flex justify-center">
            <PieChart 
              data={mockData.revenueByContract}
              size={220}
              valueFormatter={(value) => formatCurrency(value)}
            />
          </div>
        </ChartCard>
      </div>

      {/* Monthly Trends */}
      <ChartCard 
        title="Monthly Ride Trends"
        footer={
          <div className="text-sm text-gray-500">
            Average rides per month: {Math.round(mockData.monthlyRides.reduce((sum, item) => sum + item.value, 0) / mockData.monthlyRides.length)}
          </div>
        }
      >
        <BarChart 
          data={mockData.monthlyRides.map(item => ({
            ...item,
            color: 'bg-blue-500'
          }))}
          height={250}
        />
      </ChartCard>
    </div>
  );
}
