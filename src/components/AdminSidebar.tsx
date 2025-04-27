import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  UserPlus, 
  CreditCard,
  Home,
  Menu,
  X
} from 'lucide-react';

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
    ...(userRole === 'admin' ? [{
      path: '/admin/employees',
      name: 'Employees',
      icon: <UserPlus className="w-5 h-5" />
    }] : []),
    // {
    //   path: '/admin/reports',
    //   name: 'Reports',
    //   icon: <FileText className="w-5 h-5" />
    // }
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-20 left-4 z-40 p-2 rounded-md bg-yellow-600 text-white"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed left-0 right-0 top-20 bottom-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-20 left-0 h-full bg-white shadow-xl transition-transform duration-300 ease-in-out transform \
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} \
          lg:translate-x-0 lg:static lg:min-h-screen`}
        style={{ width: '250px' }}
      >
        {/* Logo */}
        {/* <div className="p-4 border-b">
          <h1 className="text-2xl font-bold text-yellow-600">Cyan Finance</h1>
        </div> */}

        {/* Navigation */}
        <nav className="mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-colors duration-200
                ${location.pathname === item.path ? 'bg-yellow-50 text-yellow-600 border-r-4 border-yellow-600' : ''}`}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default AdminSidebar; 