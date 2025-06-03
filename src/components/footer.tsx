import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Phone, Mail, MapPin } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

const Footer = () => {
  const [goldRate, setGoldRate] = useState(7000);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchGoldRate = async () => {
      try {
        const response = await axios.get(`${API_URL}/settings/gold-rate`);
        if (response.data.rate) {
          setGoldRate(response.data.rate);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error('Error fetching gold rate:', error);
      }
    };
    fetchGoldRate();
  }, []);

  return (
    <footer className="bg-[#0e1353] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Our Services</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/gold-loan" className="text-gray-400 hover:text-yellow-500">Gold Loan</Link>
              </li>
              <li>
                <Link to="/gold-purchase" className="text-gray-400 hover:text-yellow-500">Gold Purchase</Link>
              </li>
              <li>
                <Link to="/bank-buy-back" className="text-gray-400 hover:text-yellow-500">Bank Buy Back</Link>
              </li>
              <li>
                <Link to="/other-loans" className="text-gray-400 hover:text-yellow-500">Other Loans</Link>
              </li>
              <li>
                <Link to="/interest-rates" className="text-gray-400 hover:text-yellow-500">Interest Rates</Link>
              </li>
              <li>
                <Link to="/payments" className="text-gray-400 hover:text-yellow-500">Payments</Link>
              </li>
            </ul>
          </div>

          {/* Today's Gold Rate */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Gold Loan We are Offering</h3>
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-[#ffffff] text-2xl font-bold">₹{goldRate.toLocaleString()}</p>
              <p className="text-gray-400">per gram</p>
              {lastUpdated && (
                <p className="text-sm text-gray-400 mt-2">
                  Last updated: {lastUpdated.toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-400">
                <Phone className="h-5 w-5 mr-2" />
                <span>+91-9700049444</span>
              </li>
              <li className="flex items-center text-gray-400">
                <Mail className="h-5 w-5 mr-2" />
                <span>support@cyanfinance.in</span>
              </li>
              <li className="flex items-center text-gray-400">
                <MapPin className="h-7 w-7 mr-2" />
                <span>BK Towers,
Akkayyapalem,
Visakhapatnam, Andra Pradesh-530016.</span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/profile.php?id=61573682252439" target="_blank" rel="noopener noreferrer" 
                className="text-gray-400 hover:text-yellow-500">
                <Facebook className="h-6 w-6" />
              </a>
              {/* <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                className="text-gray-400 hover:text-yellow-500">
                <Twitter className="h-6 w-6" />
              </a> */}
              <a href="https://www.instagram.com/cyanfinance4/?__pwa=1#" target="_blank" rel="noopener noreferrer"
                className="text-gray-400 hover:text-yellow-500">
                <Instagram className="h-6 w-6" />
              </a>
              {/* <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                className="text-gray-400 hover:text-yellow-500">
                <Linkedin className="h-6 w-6" />
              </a> */}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Cyan Gold Finance. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;