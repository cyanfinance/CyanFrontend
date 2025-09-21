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
// Import logo directly
import cyanlogo1 from '/cyanlogo1.png';

interface EmployeeSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { } = useAuth();

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
      {/* Mobile menu button only (no logo, logo is in Navbar) */}
      {/* <div className="lg:hidden fixed top-16 left-0 right-0 bg-white z-[60] border-b"> */}
        {/* <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md bg-yellow-600 text-white"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button> */}
          {/* <div className="w-10"></div> Spacer to balance the layout
        </div> */}
      {/* </div> */}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[55] xl:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-gradient-to-br from-cyan-50 to-blue-100 shadow-2xl rounded-r-3xl transform transition-transform duration-300 ease-in-out z-[58] \
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} \
          md:translate-x-0 md:relative md:z-0 w-64 border-r border-blue-100`}
      >
        <nav className="h-full overflow-y-auto flex flex-col">
          <div className="hidden md:flex flex-col items-center py-8 bg-white/60 rounded-br-3xl mb-4 shadow-sm">
            <img src={cyanlogo1} alt="Cyan Finance Logo" className="h-16 w-auto mb-2" />
            <span className="text-lg font-bold text-cyan-800 tracking-wide">CYAN FINANCE</span>
          </div>
          {/* Show public links on mobile only */}
          <div className="block md:hidden">
            {publicLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 rounded-lg mx-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200
                  ${location.pathname === item.path ? 'bg-blue-100 text-blue-700 font-bold border-l-4 border-blue-600' : ''}`}
                onClick={toggleSidebar}
              >
                {React.cloneElement(item.icon, { className: `w-5 h-5 ${location.pathname === item.path ? 'text-blue-600' : 'text-gray-400'}` })}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
            <div className="border-t border-blue-100 my-4"></div>
          </div>
          {/* Employee links always visible */}
          <div className="flex-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 rounded-lg mx-2 my-1 text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors duration-200
                  ${location.pathname === item.path ? 'bg-cyan-100 text-cyan-800 font-bold border-l-4 border-cyan-600 shadow' : ''}`}
                onClick={() => {
                  if (isOpen) toggleSidebar();
                }}
              >
                {React.cloneElement(item.icon, { className: `w-6 h-6 ${location.pathname === item.path ? 'text-cyan-600' : 'text-gray-400'}` })}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      </aside>
    </div>
  );
};

export default EmployeeSidebar; 