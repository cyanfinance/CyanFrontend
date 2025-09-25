import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import axios from 'axios';
import UpgradeHistoryModal from '../../components/UpgradeHistoryModal';
import LoanPrintout from '../../components/LoanPrintout';
import { fetchEarlyRepaymentDetails } from '../../utils/api';

interface RepaymentModalProps {
  loan: Loan;
  onClose: () => void;
  onRepay: (amount: number, paymentMethod: string, transactionId?: string, bankName?: string, paymentType?: string) => Promise<void>;
}

const RepaymentModal: React.FC<RepaymentModalProps> = ({ loan: _loan, onClose, onRepay }) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('handcash');
  const [paymentType, setPaymentType] = useState<string>('total');
  const [transactionId, setTransactionId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [repaymentDate, setRepaymentDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [calc, setCalc] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [bankName, setBankName] = useState<string>('');
  const [userHasManuallySetAmount, setUserHasManuallySetAmount] = useState<boolean>(false);

  const { token } = useAuth();

  useEffect(() => {
    let mounted = true;
    async function fetchCalc() {
      setCalcLoading(true);
      setError('');
      try {
        const data = await fetchEarlyRepaymentDetails({
          loanId: _loan._id,
          repaymentDate,
          token: token || '',
        });
        if (mounted) setCalc(data);
        // Set default amount to remaining balance if not set
        if (mounted && amount === 0 && !userHasManuallySetAmount) {
          const remainingBalance = Math.round(data.totalDue) - (_loan.totalPaid || 0);
          setAmount(Math.max(remainingBalance, 0));
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to fetch repayment details');
      } finally {
        if (mounted) setCalcLoading(false);
      }
    }
    fetchCalc();
    return () => { mounted = false; };
    // eslint-disable-next-line
  }, [_loan._id, repaymentDate]);

  // Auto-set amount when calculation data is available (only if user hasn't manually set it)
  useEffect(() => {
    if (calc && amount === 0 && !userHasManuallySetAmount) {
      const remainingBalance = Math.round(calc.totalDue) - (_loan.totalPaid || 0);
      setAmount(Math.max(remainingBalance, 0));
    }
  }, [calc, _loan.totalPaid, amount, userHasManuallySetAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (paymentMethod === 'online' && !transactionId.trim()) {
        throw new Error('Transaction ID is required for online payments');
      }
      if (paymentMethod === 'online' && !bankName.trim()) {
        throw new Error('Bank Name is required for online payments');
      }
      if (calc && amount < calc.minimumTotalDue) {
        throw new Error(`Amount must be at least ₹${calc.minimumTotalDue}`);
      }
      await onRepay(amount, paymentMethod, paymentMethod === 'online' ? transactionId : undefined, bankName, paymentType);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process repayment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white p-6 rounded-lg w-96 shadow-2xl">
        <h2 className="text-xl font-semibold mb-4 mt-0">Repay Loan</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Repayment Date</label>
            <input
              type="date"
              value={repaymentDate}
              onChange={e => setRepaymentDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Select the actual date when the payment was made (useful for holiday payments)
            </p>
          </div>
          {calcLoading ? (
            <div className="mb-4 text-center">Loading calculation...</div>
          ) : calc ? (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Interest Calculation (as of {new Date(repaymentDate).toLocaleDateString()})</h3>
              <div className="text-sm space-y-1">
                <div><b>Interest (compounded monthly):</b> ₹{calc.interest}</div>
                <div><b>Minimum interest period:</b> {calc.minimumInterestPeriod} days</div>
                <div><b>Minimum interest amount:</b> ₹{calc.minimumInterest}</div>
                <div><b>Rebate:</b> ₹{calc.rebate || 0}</div>
                <div><b>Grace period:</b> {calc.gracePeriodDays} days {calc.gracePeriodReason ? `(${calc.gracePeriodReason})` : ''}</div>
                <div><b>Total Due:</b> <span className="text-lg font-bold">₹{calc.totalDue}</span></div>
                {calc.minimumTotalDue && (
                  <div className="text-xs text-gray-500">Minimum total due: ₹{calc.minimumTotalDue}</div>
                )}
                {calc.breakdown && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-yellow-700">Breakdown</summary>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">{JSON.stringify(calc.breakdown, null, 2)}</pre>
                  </details>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-4 text-red-600 text-sm">Failed to load calculation</div>
          )}
          {calc && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Payment Options</h3>
              <div className="space-y-1 text-sm">
                <div><b>Monthly Installment:</b> ₹{Math.round(calc.monthlyPayment || 0).toLocaleString()}</div>
                <div><b>Total Loan Amount:</b> ₹{_loan.amount.toLocaleString()}</div>
                <div><b>Total Payment (with interest):</b> ₹{Math.round(calc.totalDue || 0).toLocaleString()}</div>
                <div><b>Already Paid:</b> ₹{(_loan.totalPaid || 0).toLocaleString()}</div>
                <div><b>Remaining Balance:</b> ₹{Math.round((calc.totalDue || 0) - (_loan.totalPaid || 0)).toLocaleString()}</div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                💡 You can pay the monthly installment or any amount up to the full remaining balance. Use the buttons below to quickly set common amounts.
              </div>
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(Number(e.target.value));
                setUserHasManuallySetAmount(true);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              required
              min={calc?.minimumTotalDue || 0}
              max={calc?.totalDue || _loan.totalPayment || 0}
            />
            {calc && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAmount(Math.round(calc.monthlyPayment || 0));
                    setUserHasManuallySetAmount(true);
                  }}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Set Monthly (₹{Math.round(calc.monthlyPayment || 0).toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAmount(Math.round(calc.totalDue || 0));
                    setUserHasManuallySetAmount(true);
                  }}
                  className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Set Full Balance (₹{Math.round(calc.totalDue || 0).toLocaleString()})
                </button>
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              required
            >
              <option value="handcash">Hand Cash</option>
              <option value="online">Online Payment</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Payment Type</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              required
            >
              <option value="total">Total Amount (Interest + Principal)</option>
              <option value="interest">Interest Only</option>
              <option value="principal">Principal Only</option>
            </select>
            <div className="mt-1 text-xs text-gray-500">
              {paymentType === 'total' && 'Pays both interest and principal amount'}
              {paymentType === 'interest' && 'Pays only the interest portion'}
              {paymentType === 'principal' && 'Pays only the principal amount'}
            </div>
          </div>
          {paymentMethod === 'online' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter bank name"
                required={paymentMethod === 'online'}
              />
            </div>
          )}
          {paymentMethod === 'online' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                placeholder="Enter transaction ID"
                required={paymentMethod === 'online'}
              />
            </div>
          )}
          {error && (
            <div className="mb-4 text-red-600 text-sm">{error}</div>
          )}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || calcLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Repay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface Loan {
  _id: string;
  loanId: string;
  customerId: string | { aadharNumber: string; name: string; mobile: string; email: string };
  name: string;
  email: string;
  primaryMobile: string;
  amount: number;
  term: number;
  interestRate: number;
  originalInterestRate?: number;
  currentUpgradeLevel?: number;
  status: 'approved' | 'rejected' | 'active' | 'closed';
  monthlyPayment: number;
  totalPayment: number;
  totalPaid: number;
  remainingBalance: number;
  createdAt: string;
  createdBy?: {
    name: string;
    email: string;
    role: string;
  };
  upgradeHistory?: Array<{
    fromRate: number;
    toRate: number;
    upgradeDate: string;
    reason: string;
    upgradeLevel: number;
  }>;
}

const EmployeeLoansPage: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [showLoanAgreement, setShowLoanAgreement] = useState(false);
  const [selectedLoanForAgreement, setSelectedLoanForAgreement] = useState<Loan | null>(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [selectedLoanForRenewal, setSelectedLoanForRenewal] = useState<Loan | null>(null);
  const [renewalAmount, setRenewalAmount] = useState<number>(0);
  const [renewalInterestRate, setRenewalInterestRate] = useState<number>(0);
  const [renewalTerm, setRenewalTerm] = useState<number>(6);
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [selectedLoanForRepayment, setSelectedLoanForRepayment] = useState<Loan | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/employee/loans`, {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.data.success) {
        setLoans(response.data.data);
      } else {
        setError('Failed to fetch loans');
      }
    } catch (err: any) {
      console.error('Error fetching loans:', err);
      setError(err.response?.data?.message || 'Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintAgreement = (loan: Loan) => {
    setSelectedLoanForAgreement(loan);
    setShowLoanAgreement(true);
  };

  const handleRenewLoan = (loan: Loan) => {
    setSelectedLoanForRenewal(loan);
    setRenewalAmount(loan.amount);
    setRenewalInterestRate(loan.interestRate);
    setRenewalTerm(loan.term);
    setShowRenewalModal(true);
  };

  const handleConfirmRenewal = async () => {
    if (!selectedLoanForRenewal) return;

    setRenewalLoading(true);
    try {
      const response = await fetch(`${API_URL}/employee/loans/${selectedLoanForRenewal._id}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          amount: renewalAmount,
          interestRate: renewalInterestRate,
          term: renewalTerm
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to renew loan');
      }

      // Refresh loans list
      await fetchLoans();
      
      // Close modal
      setShowRenewalModal(false);
      setSelectedLoanForRenewal(null);
      
      alert('Loan renewed successfully!');
    } catch (error) {
      console.error('Error renewing loan:', error);
      alert(error instanceof Error ? error.message : 'Failed to renew loan');
    } finally {
      setRenewalLoading(false);
    }
  };

  const handleRepay = async (amount: number, paymentMethod: string, transactionId?: string, bankName?: string, paymentType?: string) => {
    if (!selectedLoanForRepayment) return;
    const response = await fetch(`${API_URL}/loans/${selectedLoanForRepayment._id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ amount, paymentMethod, transactionId, bankName, paymentType })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to process repayment');
    }
    await fetchLoans();
  };

  // Transform loan data to match LoanPrintout interface
  const transformLoanForPrintout = (loan: Loan) => {
    // Extract aadharNumber from customerId if it's an object
    const aadharNumber = typeof loan.customerId === 'object' 
      ? loan.customerId.aadharNumber 
      : loan.customerId;

    return {
      _id: loan._id,
      loanId: loan.loanId,
      name: loan.name,
      aadharNumber: aadharNumber || '',
      email: loan.email,
      primaryMobile: loan.primaryMobile,
      secondaryMobile: undefined,
      emergencyContact: {
        mobile: loan.primaryMobile, // Use primary mobile as fallback
        relation: 'Self',
        _id: loan._id
      },
      presentAddress: 'Address not available', // Default fallback
      permanentAddress: 'Address not available', // Default fallback
      amount: loan.amount,
      interestRate: loan.interestRate,
      term: loan.term,
      monthlyPayment: 0, // Default fallback
      totalPayment: loan.amount + (loan.amount * loan.interestRate / 100 * loan.term / 12), // Calculate approximate total
      remainingBalance: loan.remainingBalance,
      dailyInterestRate: (loan.interestRate / 100) / 365,
      goldItems: [], // Default empty array - this might need to be fetched separately
      createdAt: loan.createdAt,
      createdBy: {
        name: loan.createdBy?.name || 'System',
        email: loan.createdBy?.email || 'system@cyanfinance.in'
      }
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const hasUpgradeHistory = (loan: Loan) => {
    return loan.upgradeHistory && loan.upgradeHistory.length > 0;
  };

  const getUpgradeIndicator = (loan: Loan) => {
    if (!hasUpgradeHistory(loan)) return null;
    
    const totalUpgrades = loan.upgradeHistory?.length || 0;
    const currentRate = loan.interestRate;
    const originalRate = loan.originalInterestRate || loan.interestRate;
    
    if (currentRate > originalRate) {
      return (
        <div className="flex items-center gap-1 mt-1">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            ⬆️ Upgraded {totalUpgrades}x
          </span>
          <span className="text-xs text-gray-500">
            {originalRate}% → {currentRate}%
          </span>
        </div>
      );
    }
    return null;
  };

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = search === '' || 
      loan.name.toLowerCase().includes(search.toLowerCase()) ||
      loan.primaryMobile.includes(search) ||
      (typeof loan.customerId === 'object' && loan.customerId?.aadharNumber?.includes(search));
    
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewHistory = (loan: Loan) => {
    setSelectedLoan(loan);
    setHistoryModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading loans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Loans Management</h1>
          <p className="mt-2 text-gray-600">View, manage, and track all loans in one place.</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search by Name, Mobile, or Aadhar
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search loans..."
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="sm:w-48">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'closed')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Loans Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredLoans.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No loans found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search ? 'Try adjusting your search criteria.' : 'No loans have been created yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLoans.map((loan) => (
                    <tr key={loan._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        {formatDate(loan.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {typeof loan.customerId === 'object' && loan.customerId?.name ? loan.customerId.name : loan.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {loan.primaryMobile}
                        </div>
                        <div className="text-sm text-gray-500">
                          {loan.email}
                        </div>
                        {typeof loan.customerId === 'object' && loan.customerId?.aadharNumber && (
                          <div className="text-xs text-gray-400">
                            Aadhar: xxxxxxxx{loan.customerId.aadharNumber.slice(-4)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          Amount: {formatCurrency(loan.amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Term: {loan.term} months | Interest: {loan.interestRate}%
                        </div>
                        <div className="text-sm text-gray-500">
                          Paid: {formatCurrency(loan.totalPaid || 0)} | To Pay: {formatCurrency(loan.remainingBalance)}
                        </div>
                        {getUpgradeIndicator(loan)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {loan.createdBy?.name || 'System'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {loan.createdBy?.email || ''}
                        </div>
                        <div className="text-xs text-gray-400">
                          {loan.createdBy?.role || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {/* Edit functionality */}}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handlePrintAgreement(loan)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Agreement
                          </button>
                          {loan.status === 'closed' && (
                            <button
                              onClick={() => handleRenewLoan(loan)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Renew
                            </button>
                          )}
                          {loan.status === 'active' && (
                            <button
                              onClick={() => {
                                setSelectedLoanForRepayment(loan);
                                setShowRepaymentModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              Repay
                            </button>
                          )}
                          {hasUpgradeHistory(loan) && (
                            <button
                              onClick={() => handleViewHistory(loan)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              History
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade History Modal */}
      {selectedLoan && (
        <UpgradeHistoryModal
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          loanId={selectedLoan._id}
          loanData={{
            name: typeof selectedLoan.customerId === 'object' && selectedLoan.customerId?.name ? selectedLoan.customerId.name : selectedLoan.name,
            loanId: selectedLoan.loanId,
            amount: selectedLoan.amount,
            currentInterestRate: selectedLoan.interestRate,
            currentUpgradeLevel: selectedLoan.currentUpgradeLevel || 0
          }}
        />
      )}
      
      {/* Loan Agreement Modal */}
      {showLoanAgreement && selectedLoanForAgreement && token && (
        <LoanPrintout
          loanData={transformLoanForPrintout(selectedLoanForAgreement)}
          token={token}
          onClose={() => {
            setShowLoanAgreement(false);
            setSelectedLoanForAgreement(null);
          }}
        />
      )}

      {/* Repayment Modal */}
      {showRepaymentModal && selectedLoanForRepayment && (
        <RepaymentModal
          loan={selectedLoanForRepayment}
          onClose={() => {
            setShowRepaymentModal(false);
            setSelectedLoanForRepayment(null);
          }}
          onRepay={handleRepay}
        />
      )}

      {/* Loan Renewal Modal */}
      {showRenewalModal && selectedLoanForRenewal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Renew Loan</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Customer:</strong> {selectedLoanForRenewal.name}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Loan ID:</strong> {selectedLoanForRenewal.loanId}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Renewal Amount (₹)
                </label>
                <input
                  type="number"
                  value={renewalAmount}
                  onChange={(e) => setRenewalAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interest Rate (% per annum)
                </label>
                <select
                  value={renewalInterestRate}
                  onChange={(e) => setRenewalInterestRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={18}>18%</option>
                  <option value={24}>24%</option>
                  <option value={30}>30%</option>
                  <option value={36}>36%</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Term (months)
                </label>
                <select
                  value={renewalTerm}
                  onChange={(e) => setRenewalTerm(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleConfirmRenewal}
                disabled={renewalLoading}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {renewalLoading ? 'Renewing...' : 'Confirm Renewal'}
              </button>
              <button
                onClick={() => {
                  setShowRenewalModal(false);
                  setSelectedLoanForRenewal(null);
                }}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLoansPage;
