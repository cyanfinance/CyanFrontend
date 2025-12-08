import { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

function GoldCalculator() {
  // Load from localStorage if available, otherwise default to 7000
  const getStoredGoldRate = () => {
    try {
      const stored = localStorage.getItem('goldRate');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.rate || 7000;
      }
    } catch (e) {
      console.error('Error reading gold rate from localStorage:', e);
    }
    return 7000;
  };

  const [weight, setWeight] = useState<string>('');
  const [goldRate, setGoldRate] = useState<number>(getStoredGoldRate());
  const [loanAmount, setLoanAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingRate, setFetchingRate] = useState(true);

  // Fetch current gold rate on component mount and refresh periodically
  useEffect(() => {
    const fetchGoldRate = async () => {
      try {
        const response = await axios.get(`${API_URL}/settings/gold-rate`);
        if (response.data.rate) {
          const rate = response.data.rate;
          setGoldRate(rate);
          
          // Update localStorage to keep it in sync
          try {
            localStorage.setItem('goldRate', JSON.stringify({
              rate,
              lastUpdated: response.data.lastUpdated || new Date().toISOString()
            }));
          } catch (e) {
            console.error('Error saving gold rate to localStorage:', e);
          }
        }
      } catch (error) {
        console.error('Error fetching gold rate:', error);
        // Use stored rate from localStorage if API fails
        const storedRate = getStoredGoldRate();
        if (storedRate !== 7000) {
          setGoldRate(storedRate);
        }
      } finally {
        setFetchingRate(false);
      }
    };
    
    fetchGoldRate();
    
    // Listen for custom goldRateUpdated event (when footer updates the rate)
    const handleGoldRateUpdate = (e: CustomEvent) => {
      if (e.detail && e.detail.rate) {
        setGoldRate(e.detail.rate);
        console.log('Gold rate updated in calculator:', e.detail.rate);
      }
    };
    
    // Listen for storage changes (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'goldRate' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.rate) {
            setGoldRate(parsed.rate);
          }
        } catch (err) {
          console.error('Error parsing storage change:', err);
        }
      }
    };
    
    window.addEventListener('goldRateUpdated', handleGoldRateUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('goldRateUpdated', handleGoldRateUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const calculateLoan = async () => {
    setError(null);
    setLoanAmount(null);
    setLoading(true);
    
    const weightNum = parseFloat(weight);
    
    if (!weight || weightNum <= 0) {
      setError('Please enter a valid gold weight (greater than 0)');
      setLoading(false);
      return;
    }

    if (isNaN(weightNum)) {
      setError('Please enter a valid number');
      setLoading(false);
      return;
    }

    try {
      // Fetch fresh gold rate before calculation to ensure we have the latest rate
      const response = await axios.get(`${API_URL}/settings/gold-rate`);
      const currentRate = response.data.rate || goldRate;
      
      // Update state if rate changed
      if (currentRate !== goldRate) {
        setGoldRate(currentRate);
        // Update localStorage
        try {
          localStorage.setItem('goldRate', JSON.stringify({
            rate: currentRate,
            lastUpdated: response.data.lastUpdated || new Date().toISOString()
          }));
        } catch (e) {
          console.error('Error saving gold rate to localStorage:', e);
        }
      }
      
      // Simple calculation: Loan Amount = Gold Weight × Gold Rate per gram
      const amount = weightNum * currentRate;
      setLoanAmount(amount);
    } catch (error) {
      console.error('Error fetching gold rate for calculation:', error);
      // Use current goldRate state if API fails
      const amount = weightNum * goldRate;
      setLoanAmount(amount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <center>
      <div className="bg-white p-6 rounded-lg w-1/2 shadow-lg">
        <div className="flex items-center mb-4">
          <Calculator className="h-6 w-6 text-yellow-600 mr-2" />
          <h2 className="text-2xl font-semibold text-gray-800">Gold Loan Calculator</h2>
        </div>
        
        <div className="space-y-4">
          {/* Display current gold rate */}
          {!fetchingRate && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-sm text-gray-600">
                Current Gold Rate: <span className="font-bold text-yellow-700">₹{goldRate.toLocaleString()} per gram</span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gold Weight (in grams)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => {
                setWeight(e.target.value);
                setLoanAmount(null); // Clear previous calculation when weight changes
                setError(null);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  calculateLoan();
                }
              }}
              className="mt-1 block w-full pl-3 pr-3 border rounded-md h-12 border-gray-300 shadow-sm focus:border-yellow-500 focus:ring focus:ring-yellow-200 text-lg"
              placeholder="Enter gold weight in grams"
              min="0"
              step="0.01"
            />
          </div>

          <button
            onClick={calculateLoan}
            className="w-full bg-yellow-600 text-white py-3 px-4 rounded-md hover:bg-yellow-700 transition-colors duration-200 font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={loading || fetchingRate || !weight}
          >
            {loading ? 'Calculating...' : 'Calculate Loan Amount'}
          </button>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          {loanAmount !== null && (
            <div className="mt-4 p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>💰</span> Loan Amount Calculation
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                  <span className="text-gray-700 font-medium">Gold Weight:</span>
                  <span className="text-gray-800 font-semibold">{parseFloat(weight).toLocaleString()} grams</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                  <span className="text-gray-700 font-medium">Gold Rate:</span>
                  <span className="text-gray-800 font-semibold">₹{goldRate.toLocaleString()} per gram</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-yellow-200 rounded-md px-4 mt-4">
                  <span className="text-lg font-bold text-gray-800">Loan Amount:</span>
                  <span className="text-2xl font-bold text-yellow-800">₹{loanAmount.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-600 mt-3 italic">
                  * This is the estimated loan amount based on current gold rate. Final amount may vary based on gold purity and other factors.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </center>
  );
}

export default GoldCalculator;