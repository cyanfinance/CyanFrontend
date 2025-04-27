import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaWhatsapp } from 'react-icons/fa';
import cyanlogo from '../pages/cyanlogo.png';
import { useAuth } from '../context/AuthContext';
import { Button } from '@mui/material';

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-[#0e1353]' : 'text-gray-600 hover:text-[#0e1353]';
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white z-10 shadow-lg">
      {/* Top Bar with WhatsApp */}
      <div className="flex justify-end items-center bg-white py-2 px-4">
        <FaWhatsapp className="text-green-500 text-2xl mr-3" />
        <span className="text-gray-500 font-semibold">WhatsApp: <strong>+91-9700049444</strong></span>
      </div>
      
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/">
            <img src={cyanlogo} alt="Logo" className="h-16 w-auto" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`${isActive('/')} transition-colors duration-200`}><strong>Home</strong></Link>
            <Link to="/about" className={`${isActive('/about')} transition-colors duration-200`}><strong>About</strong></Link>
            <Link to="/services" className={`${isActive('/services')} transition-colors duration-200`}><strong>Services</strong></Link>
            <Link to="/location" className={`${isActive('/location')} transition-colors duration-200`}><strong>Location</strong></Link>
            <Link to="/contact" className={`${isActive('/contact')} transition-colors duration-200`}><strong>Contact Us</strong></Link>
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-[#0e1353] text-sm cursor-pointer" onClick={() => {
                  if (user.role === 'admin') navigate('/admin/dashboard');
                  else if (user.role === 'employee') navigate('/employee/dashboard');
                }}>
                  Welcome, <span className="underline hover:text-yellow-600">{user.name}</span>
                </span>
                <Button
                  variant="contained"
                  onClick={handleLogout}
                  sx={{
                    backgroundColor: '#0e1353',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#0a0f3d',
                    },
                  }}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/login" className="bg-[#0e1353] text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors duration-200">
                <strong>Login</strong>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-[#0e1353] text-2xl focus:outline-none">
              {isOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-lg py-4 px-6 space-y-4 flex flex-col items-center">
          <Link to="/" className={`${isActive('/')} block`} onClick={() => setIsOpen(false)}><strong>Home</strong></Link>
          <Link to="/about" className={`${isActive('/about')} block`} onClick={() => setIsOpen(false)}><strong>About</strong></Link>
          <Link to="/services" className={`${isActive('/services')} block`} onClick={() => setIsOpen(false)}><strong>Services</strong></Link>
          <Link to="/location" className={`${isActive('/location')} block`} onClick={() => setIsOpen(false)}><strong>Location</strong></Link>
          <Link to="/contact" className={`${isActive('/contact')} block`} onClick={() => setIsOpen(false)}><strong>Contact Us</strong></Link>
          {user ? (
            <div className="flex flex-col items-center space-y-4 w-full">
              <span className="text-[#0e1353] text-sm cursor-pointer" onClick={() => {
                if (user.role === 'admin') navigate('/admin/dashboard');
                else if (user.role === 'employee') navigate('/employee/dashboard');
              }}>
                Welcome, <span className="underline hover:text-yellow-600">{user.name}</span>
              </span>
              <Button
                variant="contained"
                onClick={handleLogout}
                fullWidth
                sx={{
                  backgroundColor: '#0e1353',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#0a0f3d',
                  },
                }}
              >
                Logout
              </Button>
            </div>
          ) : (
            <Link to="/login" className="bg-[#0e1353] text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors duration-200 block w-full text-center" onClick={() => setIsOpen(false)}>
              <strong>Login</strong>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
