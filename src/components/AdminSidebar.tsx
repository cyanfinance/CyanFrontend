import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  UserPlus, 
  CreditCard,
  Home,
  Menu,
  X,
  Clock,
  Mail,
  Package,
  Gavel
} from 'lucide-react';
import cyanlogo from '../pages/cyanlogo.png';

interface AdminSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  const userString = localStorage.getItem('user');
  let userRole = 'admin';
  if (userString) {
    try {
      const user = JSON.parse(userString);
      userRole = user.role;
    } catch {}
  }

  const menuItems = [
    {
      path: '/admin/dashboard',
      name: 'Dashboard',
      icon: <Home className="w-5 h-5" />
    },
    {
      path: '/admin/customers',
      name: 'Customers',
      icon: <Users className="w-5 h-5" />
    },
    {
      path: '/admin/loans',
      name: 'Loans',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      path: '/admin/pending-repayments',
      name: 'Pending Repayments',
      icon: <Clock className="w-5 h-5" />
    },
    {
      path: '/admin/payment-reminders',
      name: 'Payment Reminders',
      icon: <Mail className="w-5 h-5" />
    },
    {
      path: '/admin/gold-returns',
      name: 'Gold Returns',
      icon: <Package className="w-5 h-5" />
    },
    {
      path: '/admin/auction-management',
      name: 'Auction Management',
      icon: <Gavel className="w-5 h-5" />
    },
    ...(userRole === 'admin' ? [{
      path: '/admin/employees',
      name: 'Employees',
      icon: <UserPlus className="w-5 h-5" />
    }] : [])
  ];

  const publicLinks = [
    { path: '/about', name: 'About', icon: <FileText className="w-5 h-5" /> },
    { path: '/services', name: 'Services', icon: <FileText className="w-5 h-5" /> },
    { path: '/location', name: 'Location', icon: <FileText className="w-5 h-5" /> },
    { path: '/contact', name: 'Contact', icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <div className="relative">
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[55] xl:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-7 left-0 h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 shadow-2xl rounded-r-3xl transform transition-transform duration-300 ease-in-out z-[58] \
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} \
          md:translate-x-0 md:relative md:z-0 w-64 border-r border-blue-100/50 backdrop-blur-sm`}
      >
        <nav className="h-full overflow-y-auto flex flex-col">
          <div className="flex flex-col items-center py-8 bg-white/80 backdrop-blur-sm rounded-br-3xl mb-4 shadow-lg border border-white/20">
            <img src={cyanlogo} alt="Cyan Logo" className="h-14 w-auto mb-2" />
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wide">CYAN FINANCE</span>
          </div>
          {/* Show public links on mobile only */}
          <div className="block md:hidden">
            {publicLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 rounded-xl mx-2 text-gray-700 hover:bg-blue-50/80 hover:text-blue-700 transition-all duration-300 group
                  ${location.pathname === item.path ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 font-bold shadow-md' : ''}`}
                onClick={toggleSidebar}
              >
                {React.cloneElement(item.icon, { className: `w-5 h-5 ${location.pathname === item.path ? 'text-blue-600' : 'text-gray-400'}` })}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
            <div className="border-t border-blue-100 my-4"></div>
          </div>
          {/* Admin links always visible */}
          <div className="flex-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 rounded-xl mx-2 my-1 text-gray-700 hover:bg-blue-50/80 hover:text-blue-700 transition-all duration-300 group
                  ${location.pathname === item.path ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 font-bold shadow-md' : ''}`}
                onClick={toggleSidebar}
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

export default AdminSidebar; 