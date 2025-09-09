import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL, // Use the same API_URL from config
  withCredentials: true, // If you use cookies/auth
  // You can add headers or interceptors here if needed
});

export default api;

// Utility function to calculate daily interest
export const calculateDailyInterest = (
  principal: number,
  yearlyInterestRate: number,
  months: number
) => {
  const dailyRate = (yearlyInterestRate / 100) / 365;
  const totalDays = months * 30; // Approximate days (30 days per month)
  const totalInterest = principal * dailyRate * totalDays;
  const monthlyPayment = (principal + totalInterest) / months;
  const totalAmount = principal + totalInterest;

  return {
    dailyRate,
    totalDays,
    dailyInterest: principal * dailyRate,
    totalInterest,
    monthlyPayment: Math.round(monthlyPayment),
    totalAmount: Math.round(totalAmount)
  };
};

// Call backend for early repayment calculation (Muthoot-style)
export async function fetchEarlyRepaymentDetails({ loanId, repaymentDate, token }: { loanId: string, repaymentDate: string, token: string }) {
  const res = await fetch(`${API_URL}/loans/${loanId}/calculate-early-repayment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
    body: JSON.stringify({ repaymentDate }),
  });
  if (!res.ok) {
    throw new Error((await res.json()).message || 'Failed to fetch repayment details');
  }
  return res.json();
} 