import React, { useState } from 'react';
import { Calculator } from 'lucide-react';

const GOLD_RATE_PER_GRAM = 7000;

function GoldCalculator() {
  const [weight, setWeight] = useState<string>('');
  const [calculation, setCalculation] = useState<{
    amount: number;
    interest: number;
    totalAmount: number;
  } | null>(null);

  const calculateLoan = () => {
    const weightNum = parseFloat(weight);
    if (weightNum > 0) {
      const amount = weightNum * GOLD_RATE_PER_GRAM;
      const interest = amount * 0.12; // 12% annual interest
      setCalculation({
        amount,
        interest,
        totalAmount: amount + interest,
      });
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
        >
          Calculate Loan Amount
        </button>

        {calculation && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Loan Details</h3>
            <div className="space-y-2">
              <p className="text-gray-600">
                Loan Amount: ₹{calculation.amount.toLocaleString()}
              </p>
              <p className="text-gray-600">
                Interest (12% p.a.): ₹{calculation.interest.toLocaleString()}
              </p>
              <p className="text-gray-600 font-semibold">
                Total Amount: ₹{calculation.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div></center>
  );
}

export default GoldCalculator;