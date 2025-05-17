import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarFooter,
  SidebarSeparator
} from '../components/blocks/sidebar';
import { 
  Home, 
  Users, 
  Car, 
  Settings, 
  LogOut, 
  ChevronDown, 
  FileSignature, 
  DollarSign, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  BarChart as BarChartIcon,
  FileText,
  Tag,
  LineChart as LineChartIcon,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { StatCard } from '../components/dashboard/StatCard';
import { ChartCard } from '../components/dashboard/ChartCard';
import { BarChart } from '../components/dashboard/BarChart';
import { LineChart } from '../components/dashboard/LineChart';
import { PieChart } from '../components/dashboard/PieChart';
import { DataTable } from '../components/dashboard/DataTable';

// Menu items
const menuItems = [
  {
    title: "Home",
    path: "/dashboard",
    icon: Home,
  },
  {
    title: "Clients",
    path: "/clients",
    icon: Users,
  },
  {
    title: "Rides",
    path: "/rides",
    icon: Car,
  },
  {
    title: "Signatures",
    path: "/signatures",
    icon: FileSignature,
  },
  {
    title: "Invoices",
    path: "/invoices",
    icon: FileText,
  },
  {
    title: "Contracts",
    path: "/contracts",
    icon: Tag,
  },
  {
    title: "Reporting",
    path: "/reporting",
    icon: LineChartIcon,
  },
  {
    title: "Users",
    path: "/users",
    icon: Users,
  },
  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
  },
  {
    title: "Help",
    path: "/help",
    icon: HelpCircle
  }
];

// Mock data for dashboard
const mockData = {
  clients: {
    total: 128,
    active: 98,
    inactive: 30,
    newThisMonth: 12,
    trend: 8.5
  },
  rides: {
    total: 1842,
    completed: 1756,
    cancelled: 86,
    pending: 24,
    thisMonth: 215,
    trend: 12.3,
    byMonth: [
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
      ],
    byType: [
      { label: 'Medical', value: 845, color: '#4F46E5' },
      { label: 'Therapy', value: 412, color: '#10B981' },
      { label: 'Employment', value: 325, color: '#F59E0B' },
      { label: 'Other', value: 260, color: '#6B7280' }
    ]
  },
  revenue: {
    total: 92450,
    thisMonth: 8750,
    trend: 5.2,
    byMonth: [
      { label: 'Jan', value: 6850 },
      { label: 'Feb', value: 7200 },
      { label: 'Mar', value: 7450 },
      { label: 'Apr', value: 7300 },
      { label: 'May', value: 7650 },
      { label: 'Jun', value: 7900 },
      { label: 'Jul', value: 8100 },
      { label: 'Aug', value: 8300 },
      { label: 'Sep', value: 8500 },
      { label: 'Oct', value: 8450 },
      { label: 'Nov', value: 8600 },
      { label: 'Dec', value: 8750 }
    ],
    byContract: [
      { label: 'Contract A', value: 42500, color: '#4F46E5' },
      { label: 'Contract B', value: 28750, color: '#10B981' },
      { label: 'Contract C', value: 21200, color: '#F59E0B' }
    ]
  },
  signatures: {
    pending: 18,
    completed: 124,
    expired: 3
  },
  upcomingRides: [
    { 
      id: 1, 
      client: 'Sarah Johnson', 
      date: '2025-03-15',
      time: '09:30 AM',
      type: 'Medical',
      status: 'Confirmed'
    },
    { 
      id: 2, 
      client: 'James Rodriguez', 
      date: '2025-03-15',
      time: '11:00 AM',
      type: 'Therapy',
      status: 'Confirmed'
    },
    { 
      id: 3, 
      client: 'Emma Thompson', 
      date: '2025-03-16',
      time: '10:15 AM',
      type: 'Employment',
      status: 'Pending'
    },
    { 
      id: 4, 
      client: 'Michael Chen', 
      date: '2025-03-16',
      time: '02:00 PM',
      type: 'Medical',
      status: 'Confirmed'
    },
    { 
      id: 5, 
      client: 'Olivia Williams', 
      date: '2025-03-17',
      time: '09:45 AM',
      type: 'Other',
      status: 'Pending'
    },
  ]
};

interface DashboardPageProps {
  children?: React.ReactNode;
}

function DashboardPage({ children }: DashboardPageProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPath, setCurrentPath] = useState(location.pathname);
  const { user, signOut, loading: authLoading } = useAuth();

  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        setLoading(true);
        
        if (!user) return; // {
          //navigate('/login');
          //return;
        //}
        
        // Get user profile data
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
    fetchUserAndProfile();
     }
  }, [navigate, user, authLoading]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Generate initials from email or name
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  // Get display name
  const getDisplayName = () => {
    return profile?.full_name || user?.email?.split('@')[0] || 'User';
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  /*
  if (authLoading || loading) {
    console.log("Auth User in Dashboard:", user);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }
*/
  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        tooltip={item.title}
                        isActive={currentPath === item.path}
                        onClick={() => navigate(item.path)}
                      >
                        <a>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          {/* Sign Out Section */}
          <SidebarFooter>
            <SidebarSeparator />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  tooltip="Sign Out"
                  onClick={handleSignOut}
                >
                  <LogOut />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex-1 min-h-screen">
          <div className="px-4 py-2 border-b flex justify-between items-center">
            <SidebarTrigger className="h-6 w-6 mt-2" />
            
            {/* User Avatar and Name */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  {getInitials()}
                </div>
                <span className="ml-2 font-medium text-gray-700">{getDisplayName()}</span>
                <ChevronDown className="h-4 w-4 ml-1 text-gray-500" />
              </div>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children ? (
              children
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600 mt-1">
                    Transportation service performance overview
                  </p>
                </div>
                
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <StatCard 
                    title="Total Clients" 
                    value={mockData.clients.total}
                    icon={<Users className="h-5 w-5" />}
                    description={`${mockData.clients.active} active, ${mockData.clients.inactive} inactive`}
                    trend={{ value: mockData.clients.trend, isPositive: true }}
                  />
                  
                  <StatCard 
                    title="Total Rides" 
                    value={mockData.rides.total}
                    icon={<Car className="h-5 w-5" />}
                    description={`${mockData.rides.thisMonth} this month`}
                    trend={{ value: mockData.rides.trend, isPositive: true }}
                  />
                  
                  <StatCard 
                    title="Total Revenue" 
                    value={formatCurrency(mockData.revenue.total)}
                    icon={<DollarSign className="h-5 w-5" />}
                    description={`${formatCurrency(mockData.revenue.thisMonth)} this month`}
                    trend={{ value: mockData.revenue.trend, isPositive: true }}
                  />
                  
                  <StatCard 
                    title="Pending Signatures" 
                    value={mockData.signatures.pending}
                    icon={<FileSignature className="h-5 w-5" />}
                    description={`${mockData.signatures.completed} completed, ${mockData.signatures.expired} expired`}
                    className={mockData.signatures.pending > 10 ? "border-l-4 border-yellow-500" : ""}
                  />
                </div>
                
                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <ChartCard 
                    title="Monthly Rides"
                    footer={
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Last 12 months</span>
                        <div className="flex items-center text-green-600">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          <span>{mockData.rides.trend}% increase</span>
                        </div>
                      </div>
                    }
                  >
                    <BarChart 
                      data={mockData.rides.byMonth.map(item => ({
                        label: item.label,
                        value: item.value,
                        color: 'bg-blue-500 hover:bg-blue-600'
                      }))}
                      height={250}
                    />
                  </ChartCard>
                  
                  <ChartCard 
                    title="Monthly Revenue"
                    footer={
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Last 12 months</span>
                        <div className="flex items-center text-green-600">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          <span>{mockData.revenue.trend}% increase</span>
                        </div>
                      </div>
                    }
                  >
                    <LineChart 
                      data={mockData.revenue.byMonth}
                      height={250}
                      valueFormatter={(value) => formatCurrency(value)}
                    />
                  </ChartCard>
                </div>
                
                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <ChartCard title="Rides by Type">
                    <div className="flex justify-center">
                      <PieChart 
                        data={mockData.rides.byType}
                        size={220}
                      />
                    </div>
                  </ChartCard>
                  
                  <ChartCard title="Revenue by Contract">
                    <div className="flex justify-center">
                      <PieChart 
                        data={mockData.revenue.byContract}
                        size={220}
                        valueFormatter={(value) => formatCurrency(value)}
                      />
                    </div>
                  </ChartCard>
                </div>
                
                {/* Upcoming Rides Table */}
                <ChartCard 
                  title="Upcoming Rides"
                  footer={
                    <div className="text-center">
                      <button 
                        onClick={() => navigate('/rides')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View All Rides
                      </button>
                    </div>
                  }
                >
                  <DataTable 
                    data={mockData.upcomingRides}
                    keyField="id"
                    columns={[
                      { 
                        header: 'Client', 
                        accessor: 'client',
                        className: 'font-medium text-gray-900'
                      },
                      { 
                        header: 'Date', 
                        accessor: (row) => new Date(row.date).toLocaleDateString()
                      },
                      { 
                        header: 'Time', 
                        accessor: 'time'
                      },
                      { 
                        header: 'Type', 
                        accessor: 'type'
                      },
                      { 
                        header: 'Status', 
                        accessor: (row) => (
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            row.status === 'Confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {row.status}
                          </span>
                        ),
                        className: 'text-right'
                      },
                    ]}
                  />
                </ChartCard>
                
                {/* Additional Insights */}
                <div className="mt-6 bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Business Insights</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">Growth Trend</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Client base has grown by {mockData.clients.trend}% in the last month, with {mockData.clients.newThisMonth} new clients.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <BarChartIcon className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">Performance</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {((mockData.rides.completed / mockData.rides.total) * 100).toFixed(1)}% completion rate with {mockData.rides.cancelled} cancellations.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">Action Required</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {mockData.signatures.pending} pending signatures and {mockData.rides.pending} upcoming rides need attention.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}

export { DashboardPage }