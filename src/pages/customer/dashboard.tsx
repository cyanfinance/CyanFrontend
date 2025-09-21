import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface Payment {
  _id: string;
  amount: number;
  date: string;
  method: string;
  status: string;
  installmentNumber: number;
  transactionId?: string;
  bankName: string;
  remainingBalance?: number;
}

interface Loan {
  _id: string;
  loanId: string;
  amount: number;
  status: string;
  term: number;
  interestRate: number;
  createdAt: string;
  totalPaid: number;
  remainingBalance: number;
  monthlyPayment: number;
  totalPayment?: number;
  payments: Payment[];
  installments: Array<{
    number: number;
    dueDate: string;
    amount: number;
    status: string;
    amountPaid: number;
  }>;
}

const CustomerDashboard = () => {
  const { token: authToken, user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showInstallments, setShowInstallments] = useState(false);

  useEffect(() => {
    const fetchLoans = async () => {
      setLoading(true);
      setError('');
      
      // Get token from both sources to ensure compatibility
      const token = authToken || localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/loans/customer`, {
          headers: { 'x-auth-token': token }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch loans');
        
        
        setLoans(data.data);
      } catch (err) {
        console.error('Error fetching loans:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch loans');
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, [authToken]);

  const downloadPaymentReceipt = async (loanId: string, paymentId: string) => {
    try {
      console.log(`=== DOWNLOAD FUNCTION CALLED ===`);
      console.log(`Loan ID: ${loanId}`);
      console.log(`Payment ID: ${paymentId}`);
      
      // Find the loan and payment data
      const loan = loans.find(l => l._id === loanId);
      if (!loan) {
        throw new Error('Loan not found');
      }
      
      const payment = loan.payments?.find(p => p._id === paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }
      
      // Import the frontend PDF generator
      const { downloadReceipt } = await import('../../utils/pdfGenerator');
      
      // Calculate the correct values for this specific payment
      // Always calculate fresh to avoid using old negative values from payment records
      // If customer paid more than principal, use payment amount as total loan amount (includes interest)
      const totalLoanAmount = (loan.totalPaid >= loan.amount) ? loan.totalPaid : (loan.totalPayment || loan.amount);
      const remainingBalanceAtTime = Math.max(0, totalLoanAmount - (loan.totalPaid || 0));
      const totalPaidAtTime = loan.totalPaid || 0;
      
      const receiptData = {
        customerName: user.name || 'Customer',
        paymentDate: payment.date,
        paymentAmount: payment.amount,
        totalLoanAmount: totalLoanAmount,
        totalPaid: totalPaidAtTime,
        remainingBalance: remainingBalanceAtTime,
        loanId: loan.loanId,
        receiptNumber: `${loan.loanId}_${payment.installmentNumber}`
      };
      
      console.log(`Generating receipt with data:`, receiptData);
      await downloadReceipt(receiptData);
      console.log(`=== DOWNLOAD COMPLETED ===`);
      
    } catch (err) {
      console.error('Error generating receipt:', err);
      alert('Failed to generate receipt');
    }
  };

  const formatCurrency = (amount: number) => {
    // Ensure amount is a number
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount || 0);
  };

  const ensureNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  };

  const calculateRemainingBalance = (loan: Loan): number => {
    // If loan is closed with 0 remaining balance, return 0
    if (loan.status === 'closed' && loan.remainingBalance === 0) {
      return 0;
    }
    
    const amount = ensureNumber(loan.amount);
    const totalPaid = ensureNumber(loan.totalPaid);
    return Math.max(0, amount - totalPaid);
  };

  const getEffectivePaymentStatus = (payment: Payment, loan: Loan) => {
    // If payment amount equals or exceeds loan amount, consider it successful
    if (payment.amount >= loan.amount) {
      return 'success';
    }
    return payment.status;
  };

  const getEffectiveLoanStatus = (loan: Loan) => {
    // If total paid equals or exceeds loan amount, loan is closed
    if (loan.totalPaid >= loan.amount) {
      return 'closed';
    }
    // If any payment has been made, loan is active
    if (loan.totalPaid > 0) {
      return 'active';
    }
    return loan.status;
  };

  const getPaymentType = (loan: Loan) => {
    // Check if this was a single full payment
    if (loan.payments && loan.payments.length === 1 && loan.payments[0].amount >= loan.amount) {
      return 'full-payment';
    }
    // Check if this was early payment (before term completion)
    if (loan.totalPaid >= loan.amount && loan.payments && loan.payments.length > 0) {
      return 'early-payment';
    }
    return 'monthly-installments';
  };

  const getPaymentSummary = (loan: Loan) => {
    const paymentType = getPaymentType(loan);
    
    if (paymentType === 'full-payment') {
      return {
        type: 'Full Payment',
        description: 'Entire loan amount paid in single payment',
        amount: loan.payments[0].amount,
        date: loan.payments[0].date
      };
    } else if (paymentType === 'early-payment') {
      return {
        type: 'Early Payment',
        description: 'Loan fully paid before term completion',
        amount: loan.totalPaid,
        installments: loan.payments.length
      };
    } else {
      return {
        type: 'Monthly Installments',
        description: 'Regular monthly payments',
        amount: loan.totalPaid,
        installments: loan.payments.length
      };
    }
  };

  // Check if user is authenticated and is a customer
  if (!user) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Please log in to access the customer dashboard.</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'customer') {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Access denied. This dashboard is only for customers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative p-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">🏦</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Customer Dashboard
            </h1>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-4"></div>
          <p className="text-gray-600 text-lg">Manage your loans and track your financial progress</p>
        </div>

        {/* Welcome Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-3xl font-bold">{user.name?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {user.name}!</h2>
                <p className="text-gray-600 text-lg">Here's an overview of your loan portfolio</p>
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">Account Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Last login: {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Total Loans</p>
                <p className="text-2xl font-bold text-gray-800">{loans.length}</p>
                <p className="text-xs text-green-600 mt-1">Active Portfolio</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        {loans.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Portfolio Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Borrowed</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(loans.reduce((sum, loan) => sum + ensureNumber(loan.amount), 0))}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-xl">💰</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Paid</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(loans.reduce((sum, loan) => sum + ensureNumber(loan.totalPaid || 0), 0))}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-xl">✅</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 font-medium">Outstanding</p>
                    <p className="text-2xl font-bold text-red-900">
                      {formatCurrency(loans.reduce((sum, loan) => sum + calculateRemainingBalance(loan), 0))}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-200 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 text-xl">⚖️</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Active Loans</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {loans.filter(loan => getEffectiveLoanStatus(loan) === 'active').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-xl">📊</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loans Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Your Loans</h2>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live Updates</span>
            </div>
          </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading your loans...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Loans Found</h3>
            <p className="text-gray-500">You don't have any active loans at the moment.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {loans.map((loan: Loan) => (
              <div key={loan._id} className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">Loan ID: {loan.loanId}</h3>
                    <p className="text-sm text-gray-500">Created: {new Date(loan.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                    getEffectiveLoanStatus(loan) === 'active' ? 'bg-green-100 text-green-800 border border-green-200' : 
                    getEffectiveLoanStatus(loan) === 'closed' ? 'bg-gray-100 text-gray-800 border border-gray-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {getEffectiveLoanStatus(loan).toUpperCase()}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <span className="text-blue-600 text-xl">💰</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Loan Amount</p>
                        <p className="text-lg font-bold text-gray-800">{formatCurrency(loan.amount)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <span className="text-green-600 text-xl">✅</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Total Paid</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(loan.totalPaid || 0)}</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(((loan.totalPaid || 0) / loan.amount) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(((loan.totalPaid || 0) / loan.amount) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <span className="text-red-600 text-xl">⚖️</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Remaining Balance</p>
                        <p className="text-lg font-bold text-red-600">
                          {formatCurrency(calculateRemainingBalance(loan))}
                        </p>
                        {calculateRemainingBalance(loan) === 0 && (
                          <div className="mt-2">
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Fully Paid</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <span className="text-purple-600 text-xl">📅</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Monthly Payment</p>
                        <p className="text-lg font-bold text-purple-600">{formatCurrency(loan.monthlyPayment || 0)}</p>
                        <p className="text-xs text-gray-500 mt-1">Per month</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Term</p>
                    <p className="font-bold text-gray-800">{loan.term} months</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Interest Rate</p>
                    <p className="font-bold text-gray-800">{Number(loan.interestRate)}%</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Payment Type</p>
                    <p className="font-bold text-gray-800">{getPaymentSummary(loan).type}</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setSelectedLoan(loan);
                      setShowPaymentHistory(true);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group"
                  >
                    <span className="group-hover:scale-110 transition-transform">📊</span>
                    <span>View Payment History</span>
                  </button>
                  {loan.installments && loan.installments.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedLoan(loan);
                        setShowInstallments(true);
                      }}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group"
                    >
                      <span className="group-hover:scale-110 transition-transform">📋</span>
                      <span>View Installments</span>
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        const token = authToken || localStorage.getItem('token');
                        const response = await fetch(`${API_URL}/loans/${loan._id}/receipt`, {
                          headers: { 'x-auth-token': token || '' }
                        });
                        if (!response.ok) {
                          alert('Failed to download receipt');
                          return;
                        }
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `LoanReceipt_${loan.loanId}.pdf`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error('Error downloading receipt:', error);
                        alert('Failed to download receipt');
                      }
                    }}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group"
                  >
                    <span className="group-hover:scale-110 transition-transform">📄</span>
                    <span>Download Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Payment History Modal */}
      {showPaymentHistory && selectedLoan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-5xl w-full max-h-[85vh] overflow-y-auto border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📊</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Payment History - Loan {selectedLoan.loanId}</h3>
              </div>
              <button
                onClick={() => setShowPaymentHistory(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <span className="text-gray-600 text-lg">×</span>
              </button>
            </div>
            
            {selectedLoan.payments && selectedLoan.payments.length > 0 ? (
              <div className="space-y-4">
                {/* Payment Type Summary */}
                {(() => {
                  const paymentSummary = getPaymentSummary(selectedLoan);
                  return (
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold text-blue-900 mb-2">{paymentSummary.type}</h4>
                      <p className="text-blue-700">{paymentSummary.description}</p>
                      {paymentSummary.date && (
                        <p className="text-blue-600 text-sm mt-1">Paid on: {new Date(paymentSummary.date).toLocaleDateString()}</p>
                      )}
                    </div>
                  );
                })()}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Total Paid</p>
                    <p className="text-lg font-semibold text-blue-900">{formatCurrency(selectedLoan.totalPaid || 0)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Payment Type</p>
                    <p className="text-lg font-semibold text-green-900">{getPaymentType(selectedLoan) === 'full-payment' ? 'Single Payment' : `${selectedLoan.payments.length} Payments`}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600">Remaining Balance</p>
                    <p className="text-lg font-semibold text-red-900">{formatCurrency(calculateRemainingBalance(selectedLoan))}</p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Amount</th>
                        <th className="px-4 py-2 text-left">Method</th>
                        <th className="px-4 py-2 text-left">Installment</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLoan.payments.map((payment: Payment, index: number) => (
                        <tr key={payment._id} className="border-b">
                          <td className="px-4 py-2">{new Date(payment.date).toLocaleDateString()}</td>
                          <td className="px-4 py-2">{formatCurrency(payment.amount)}</td>
                          <td className="px-4 py-2 capitalize">{payment.method}</td>
                          <td className="px-4 py-2">{payment.installmentNumber}</td>
                          <td className="px-4 py-2">
                            {(() => {
                              const effectiveStatus = getEffectivePaymentStatus(payment, selectedLoan);
                              return (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  effectiveStatus === 'success' ? 'bg-green-100 text-green-800' : 
                                  effectiveStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {effectiveStatus === 'success' ? 'Success' : 
                                   effectiveStatus === 'pending' ? 'Pending' : effectiveStatus}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => {
                                console.log(`=== DOWNLOADING RECEIPT FOR PAYMENT ${index + 1} ===`);
                                console.log(`Loan ID: ${selectedLoan._id}`);
                                console.log(`Payment ID: ${payment._id}`);
                                console.log(`Payment Amount: ₹${payment.amount}`);
                                console.log(`Payment Date: ${payment.date}`);
                                console.log(`Payment Method: ${payment.method}`);
                                console.log(`Installment: ${payment.installmentNumber}`);
                                console.log(`Full Payment Object:`, payment);
                                downloadPaymentReceipt(selectedLoan._id, payment._id);
                              }}
                              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg flex items-center space-x-1"
                            >
                              <span>📄</span>
                              <span>Download Receipt</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No payment history available for this loan.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Installments Modal */}
      {showInstallments && selectedLoan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-5xl w-full max-h-[85vh] overflow-y-auto border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">📋</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Installment Details - Loan {selectedLoan.loanId}</h3>
              </div>
              <button
                onClick={() => setShowInstallments(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <span className="text-gray-600 text-lg">×</span>
              </button>
            </div>
            
            {selectedLoan.installments && selectedLoan.installments.length > 0 ? (
              <div className="space-y-4">
                {/* Check if this was a full payment */}
                {getPaymentType(selectedLoan) === 'full-payment' ? (
                  <div className="bg-green-50 p-6 rounded-lg text-center">
                    <h4 className="text-lg font-semibold text-green-900 mb-2">Full Payment Made</h4>
                    <p className="text-green-700 mb-4">
                      This loan was paid in full with a single payment of {formatCurrency(selectedLoan.payments[0].amount)} 
                      on {new Date(selectedLoan.payments[0].date).toLocaleDateString()}.
                    </p>
                    <p className="text-green-600 text-sm">
                      The original installment plan was for {selectedLoan.term} months, but the entire amount was paid upfront.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600">Total Installments</p>
                        <p className="text-lg font-semibold text-blue-900">{selectedLoan.installments.length}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600">Paid Installments</p>
                        <p className="text-lg font-semibold text-green-900">
                          {selectedLoan.installments.filter(inst => inst.status === 'paid').length}
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-600">Pending Installments</p>
                        <p className="text-lg font-semibold text-red-900">
                          {selectedLoan.installments.filter(inst => inst.status !== 'paid').length}
                        </p>
                      </div>
                    </div>
                  </>
                )}
                
                {getPaymentType(selectedLoan) === 'full-payment' ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No individual installments to display</p>
                    <p className="text-sm text-gray-400">
                      This loan was paid in full with a single payment, so individual installments are not applicable.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left">Installment #</th>
                          <th className="px-4 py-2 text-left">Due Date</th>
                          <th className="px-4 py-2 text-left">Amount</th>
                          <th className="px-4 py-2 text-left">Amount Paid</th>
                          <th className="px-4 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedLoan.installments.map((installment, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2">{installment.number}</td>
                            <td className="px-4 py-2">{new Date(installment.dueDate).toLocaleDateString()}</td>
                            <td className="px-4 py-2">{formatCurrency(installment.amount)}</td>
                            <td className="px-4 py-2">{formatCurrency(installment.amountPaid || 0)}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                installment.status === 'paid' ? 'bg-green-100 text-green-800' : 
                                new Date(installment.dueDate) < new Date() ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {installment.status === 'paid' ? 'Paid' : 
                                 new Date(installment.dueDate) < new Date() ? 'Overdue' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No installment details available for this loan.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Section */}
      <div className="mt-12 pb-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 text-xl">📞</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600">Contact our support team</p>
              <p className="text-blue-600 font-medium">+91-9700049444</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-xl">📧</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Email Support</h3>
              <p className="text-sm text-gray-600">Get help via email</p>
              <p className="text-green-600 font-medium">support@cyanfinance.com</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 text-xl">🕒</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Business Hours</h3>
              <p className="text-sm text-gray-600">Monday - Friday</p>
              <p className="text-purple-600 font-medium">9:00 AM - 6:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard; 