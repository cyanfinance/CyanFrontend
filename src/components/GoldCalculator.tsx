import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { API_URL } from '../config';

const GOLD_RATE_PER_GRAM = 7000;

function GoldCalculator() {
  const [weight, setWeight] = useState<string>('');
  const [calculation, setCalculation] = useState<{
    amount: number;
    interest: number;
    totalAmount: number;
    effectiveDays: number;
    months: number;
    minInterestApplied: boolean;
    minDaysApplied: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateLoan = async () => {
    setError(null);
    setCalculation(null);
    const weightNum = parseFloat(weight);
    if (weightNum > 0) {
      const amount = weightNum * GOLD_RATE_PER_GRAM;
      setLoading(true);
      try {
        // Assume 12 months, 12% for demo
        const res = await fetch(`${API_URL}/loans/calculate-interest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            principal: amount,
            annualRate: 12,
            disbursementDate: new Date().toISOString(),
            closureDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Calculation failed');
        setCalculation({
          amount,
          interest: data.totalInterest,
          totalAmount: data.totalAmount,
          effectiveDays: data.effectiveDays,
          months: data.months,
          minInterestApplied: data.totalInterest === 50,
          minDaysApplied: data.effectiveDays === 7 || data.effectiveDays === 15
        });
      } catch (err: any) {
        setError(err.message || 'Calculation failed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
<center><div className="bg-white p-6 rounded-lg w-1/2  shadow-lg">
      <div className="flex items-center mb-4">
        <Calculator className="h-6 w-6 text-yellow-600 mr-2" />
        <h2 className="text-2xl font-semibold text-gray-800">Gold Loan Calculator</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Gold Weight (in grams)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="mt-1 block w-1/2 pl-3 border  rounded-md h-10 border-gray-300 shadow-sm focus:border-yellow-500 focus:ring focus:ring-yellow-200"
            placeholder="Enter gold weight"
          />
        </div>

        <button
          onClick={calculateLoan}
          className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors duration-200"
          disabled={loading}
        >
          {loading ? 'Calculating...' : 'Calculate Loan Amount'}
        </button>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        {calculation && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Loan Details</h3>
            <div className="space-y-2">
              <p className="text-gray-600">
                Loan Amount: ₹{calculation.amount.toLocaleString()}
              </p>
              <p className="text-gray-600">
                Interest (12% p.a.): ₹{calculation.interest.toLocaleString()}
                {calculation.minInterestApplied && <span className="ml-2 text-xs text-yellow-700">(Minimum ₹50 applied)</span>}
              </p>
              <p className="text-gray-600 font-semibold">
                Total Amount: ₹{calculation.totalAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                Days Charged: {calculation.effectiveDays} {calculation.minDaysApplied && '(Minimum days applied)'}
              </p>
              <p className="text-xs text-gray-500">
                Compounded Monthly ({calculation.months} month{calculation.months > 1 ? 's' : ''})
              </p>
              <p className="text-xs text-blue-700 mt-2">
                * As per policy: Minimum interest of ₹50 and minimum days (7 or 15) may apply. Interest is compounded monthly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div></center>
  );
}

export default GoldCalculator;