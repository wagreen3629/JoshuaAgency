import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Car, 
  Settings, 
  LogOut, 
  FileSignature, 
  FileText,
  FileCheck, 
  LineChart,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../AuthProvider';

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
    icon: FileCheck,
  },
  {
    title: "Reporting",
    path: "/reporting",
    icon: LineChart
  },
  {
    title: "Users",
    path: "/users",
    icon: Users
  },
  {
    title: "Settings",
    path: "/settings",
    icon: Settings
  },
  {
    title: "Help",
    path: "/help",
    icon: HelpCircle
  }
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [currentPath, setCurrentPath] = useState(location.pathname);

  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-r">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.path)}
              className={`${
                currentPath === item.path
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full`}
            >
              <item.icon
                className={`${
                  currentPath === item.path ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                } mr-3 h-5 w-5`}
              />
              {item.title}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <button
          onClick={handleSignOut}
          className="flex items-center text-gray-600 hover:text-gray-900 w-full"
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span className="text-sm">Sign out</span>
        </button>
      </div>
    </div>
  );
}
