export interface User {
  id: string;
  email: string;
  role: 'customer' | 'agent';
  name: string;
}

export interface GoldRate {
  rate: number;
  lastUpdated: string;
}

export interface LoanCalculation {
  weight: number;
  amount: number;
  interest: number;
  totalAmount: number;
}

export interface DailyInterestCalculation {
  principal: number;
  dailyRate: number;
  totalDays: number;
  dailyInterest: number;
  totalInterest: number;
  monthlyPayment: number;
  totalAmount: number;
}