import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Home,
  Menu,
  X,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import cyanlogo from '../pages/cyanlogo.png';

interface EmployeeSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const menuItems = [
    {
      path: '/employee/dashboard',
      name: 'Dashboard',
      icon: <Home className="w-5 h-5" />
    },
    {
      path: '/employee/customers',
      name: 'Customers',
      icon: <Users className="w-5 h-5" />
    },
    {
      path: '/employee/loans',
      name: 'Loans',
      icon: <CreditCard className="w-5 h-5" />
    }
  ];

  // Add public links for mobile only
  const publicLinks = [
    { path: '/about', name: 'About', icon: <FileText className="w-5 h-5" /> },
    { path: '/services', name: 'Services', icon: <FileText className="w-5 h-5" /> },
    { path: '/location', name: 'Location', icon: <FileText className="w-5 h-5" /> },
    { path: '/contact', name: 'Contact', icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <div className="relative">
      {/* Mobile menu button and logo */}
      <div className="lg:hidden fixed top-16 left-0 right-0 bg-white z-[60] border-b">
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md bg-yellow-600 text-white"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link to="/" className="absolute left-1/2 transform -translate-x-1/2">
            <img src={cyanlogo} alt="Logo" className="h-8 w-auto" />
          </Link>
          <div className="w-10"></div> {/* Spacer to balance the layout */}
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[55] lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-[5.5rem] lg:top-32 left-0 h-[calc(100vh-5.5rem)] lg:h-[calc(100vh-8rem)] bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-[58] \
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} \
          lg:translate-x-0 lg:relative lg:z-0 w-64`}
      >
        <nav className="h-full overflow-y-auto">
          {/* Show public links on mobile only */}
          <div className="block lg:hidden">
            {publicLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-colors duration-200
                  ${location.pathname === item.path ? 'bg-yellow-50 text-yellow-600 border-r-4 border-yellow-600' : ''}`}
                onClick={toggleSidebar}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
            <div className="border-t border-gray-200 my-4"></div>
          </div>
          {/* Employee links always visible */}
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-colors duration-200
                ${location.pathname === item.path ? 'bg-yellow-50 text-yellow-600 border-r-4 border-yellow-600' : ''}`}
              onClick={() => {
                // console.log('[Sidebar Link Click]', {
                //   user,
                //   isAuthenticated,
                //   to: item.path
                // });
                if (isOpen) toggleSidebar();
              }}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
};

export default EmployeeSidebar; 