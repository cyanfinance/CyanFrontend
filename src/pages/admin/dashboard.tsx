import { useState, useEffect } from 'react';
import { Alert, CircularProgress, Card, Typography, TextField, Button } from '@mui/material';
import AdminSidebar from '../../components/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import { formatAmountInWords } from '../../utils/numberToWords';
import { calculateDailyInterest, fetchEarlyRepaymentDetails } from '../../utils/api';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import UpgradedLoansList from '../../components/UpgradedLoansList';
import { Bell, AlertCircle, IndianRupee , Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Custom styles for input cursor icon
const inputCursorStyles = `
  .input-with-cursor {
    position: relative;
    cursor: text !important;
  }
  .input-with-cursor:hover::after {
    content: '✏️';
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
    pointer-events: none;
    z-index: 1000;
    opacity: 1;
    transition: opacity 0.2s ease-in;
    background: white;
    padding: 2px 4px;
    border-radius: 3px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .input-with-cursor:not(:hover)::after {
    opacity: 0;
    transition: opacity 0.2s ease-out;
  }
`;

interface GoldItem {
  description: string;
  grossWeight: number;
  netWeight: number;
}

interface Loan {
  _id: string;
  customerId: string | {
    _id: string;
    name: string;
    email: string;
    primaryMobile: string;
    aadharNumber: string;
  };
  name: string;
  email: string;
  primaryMobile: string;
  secondaryMobile?: string;
  presentAddress: string;
  permanentAddress: string;
  emergencyContact: {
    mobile: string;
    relation: string;
  };
  goldItems: GoldItem[];
  amount: number;
  term: number;
  interestRate: number;
  status:  'approved' | 'rejected' | 'active' | 'closed';
  monthlyPayment: number;
  totalPayment: number;
  totalPaid: number;
  remainingBalance?: number;
  createdAt: string;
  createdBy?: {
    name: string;
    email: string;
    role: string;
  };
  originalInterestRate?: number;
  currentUpgradeLevel?: number;
  interestRateUpgraded?: boolean;
  interestRateUpgradeDate?: string;
}

interface LoanFormData {
  aadharNumber: string;
  name: string;
  email: string;
  primaryMobile: string;
  secondaryMobile: string;
  emergencyContact: {
    mobile: string;
    relation: string;
  };
  presentAddress: string;
  permanentAddress: string;
  goldItems: GoldItem[];
  interestRate: number;
  loanAmount: number;
  totalAmount: number;
  monthlyPayment: number;
  duration: number;
}

interface CustomerDetails {
  customerId: string;
  name: string;
  email: string;
  primaryMobile: string;
  secondaryMobile?: string;
  presentAddress: string;
  permanentAddress: string;
  emergencyContact?: {
    mobile?: string;
    relation?: string;
  };
}

interface RepaymentModalProps {
  loan: Loan;
  onClose: () => void;
  onRepay: (amount: number, paymentMethod: string, transactionId?: string, bankName?: string, paymentType?: string) => Promise<void>;
}

interface WeeklyDue {
  loanId: string;
  customer: {
    name: string;
    email: string;
    primaryMobile: string;
    aadharNumber: string;
  };
  dueDate: string;
  amount: number;
  status: string;
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
    if (calc && !userHasManuallySetAmount) {
      // Set amount based on payment type
      let newAmount = 0;
      if (paymentType === 'interest') {
        newAmount = Math.round(calc.interest || 0);
      } else if (paymentType === 'principal') {
        newAmount = _loan.amount - (_loan.totalPaid || 0);
      } else {
        // For total amount, use remaining balance (total due - already paid)
        const remainingBalance = Math.round(calc.totalDue) - (_loan.totalPaid || 0);
        newAmount = Math.max(remainingBalance, 0);
      }
      setAmount(newAmount);
    }
  }, [calc, paymentType, _loan.amount, _loan.totalPaid, userHasManuallySetAmount]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (paymentMethod === 'online' && !transactionId.trim()) {
        throw new Error('Transaction ID is required for online payments');
      }
      if (calc && amount < calc.minimumTotalDue) {
        throw new Error(`Amount must be at least ₹${calc.minimumTotalDue}`);
      }
      if (paymentMethod === 'online' && !bankName.trim()) {
        throw new Error('Bank Name is required for online payments');
      }
      await onRepay(amount, paymentMethod, transactionId, bankName, paymentType);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process repayment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {calcLoading ? (
              <div className="text-yellow-700 text-sm flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                Calculating interest for selected date...
              </div>
            ) : calc && (
              <div className="text-sm bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                <div className="font-semibold text-yellow-800 mb-2">
                  Interest Calculation (as of {new Date(repaymentDate).toLocaleDateString()}):
                </div>
                <div className="space-y-1">
                  <div><b>Interest (compounded monthly):</b> ₹{calc.interest}</div>
                  <div><b>Minimum interest period:</b> {calc.minimumDays} days</div>
                  <div><b>Minimum interest amount:</b> ₹{calc.minimumInterest}</div>
                  <div><b>Rebate:</b> ₹{calc.rebate || 0}</div>
                  <div><b>Grace period:</b> {calc.gracePeriodDays} days {calc.gracePeriodReason ? `(${calc.gracePeriodReason})` : ''}</div>
                  <div><b>Total Due:</b> <span className="text-lg font-bold">₹{calc.totalDue}</span></div>
                  {calc.minimumTotalDue && (
                    <div className="text-xs text-gray-500">Minimum total due: ₹{calc.minimumTotalDue}</div>
                  )}
                </div>
                {calc.breakdown && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-yellow-700 text-sm">View Breakdown</summary>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap mt-1">{JSON.stringify(calc.breakdown, null, 2)}</pre>
                  </details>
                )}
              </div>
            )}
            
            {/* Monthly vs Total Amount Information */}
            <div className="text-sm bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
              <div className="font-semibold text-blue-800 mb-2">Payment Options:</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Monthly Installment:</span>
                  <span className="font-bold text-blue-700">₹{_loan.monthlyPayment?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Loan Amount:</span>
                  <span className="font-bold text-blue-700">₹{_loan.amount?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Payment (with interest):</span>
                  <span className="font-bold text-blue-700">₹{calc?.totalDue?.toLocaleString() || _loan.totalPayment?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Already Paid:</span>
                  <span className="font-bold text-green-600">₹{_loan.totalPaid?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-1">
                  <span>Remaining Balance:</span>
                  <span className="font-bold text-red-600">₹{(_loan.status === 'closed' && _loan.remainingBalance === 0 ? 0 : (calc?.totalDue || _loan.totalPayment || 0) - (_loan.totalPaid || 0)).toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                💡 <strong>Tip:</strong> You can pay the monthly installment or any amount up to the full remaining balance. Use the buttons below to quickly set common amounts.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {userHasManuallySetAmount && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserHasManuallySetAmount(false);
                      // This will trigger the useEffect to auto-set the amount
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 border border-gray-300"
                    title="Reset to automatic amount calculation"
                  >
                    🔄 Reset to Auto
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setAmount(_loan.monthlyPayment || 0);
                    setUserHasManuallySetAmount(true);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 border border-blue-300"
                >
                  Set Monthly (₹{_loan.monthlyPayment?.toLocaleString() || '0'})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const remainingBalance = Math.round(calc?.totalDue || _loan.totalPayment || 0) - (_loan.totalPaid || 0);
                    setAmount(Math.max(remainingBalance, 0));
                    setUserHasManuallySetAmount(true);
                  }}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 border border-green-300"
                >
                  Set Full Balance (₹{Math.max(Math.round(calc?.totalDue || _loan.totalPayment || 0) - (_loan.totalPaid || 0), 0).toLocaleString()})
                </button>
                {paymentType === 'interest' && calc?.interest && (
                  <button
                    type="button"
                    onClick={() => {
                      setAmount(calc.interest);
                      setUserHasManuallySetAmount(true);
                    }}
                    className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 border border-yellow-300"
                  >
                    Set Interest Only (₹{calc.interest?.toLocaleString()})
                  </button>
                )}
                {paymentType === 'principal' && (
                  <button
                    type="button"
                    onClick={() => {
                      const remainingPrincipal = _loan.amount - (_loan.totalPaid || 0);
                      setAmount(Math.max(remainingPrincipal, 0));
                      setUserHasManuallySetAmount(true);
                    }}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 border border-purple-300"
                  >
                    Set Principal Only (₹{Math.max(_loan.amount - (_loan.totalPaid || 0), 0).toLocaleString()})
                  </button>
                )}
              </div>
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || value === '0') {
                    setAmount(0);
                  } else {
                    setAmount(Number(value));
                  }
                  setUserHasManuallySetAmount(true);
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                required
                min={calc?.minimumTotalDue || 0}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                required
              >
                <option value="handcash">Hand Cash</option>
                <option value="online">Online Payment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
          </div>
          {paymentMethod === 'online' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  placeholder="Enter bank name"
                  required={paymentMethod === 'online'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  placeholder="Enter transaction ID"
                  required={paymentMethod === 'online'}
                />
              </div>
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

const AdminDashboard = () => {
  // Add custom styles for input cursor icon
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = inputCursorStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [showLoanForm, setShowLoanForm] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const [customerCreationLoading, setCustomerCreationLoading] = useState(false);
  const [otpVerificationLoading, setOtpVerificationLoading] = useState(false);
  const [loanCreationLoading, setLoanCreationLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [formData, setFormData] = useState<LoanFormData>({
    aadharNumber: '',
    name: '',
    email: '',
    primaryMobile: '',
    secondaryMobile: '',
    emergencyContact: {
      mobile: '',
      relation: '',
    },
    presentAddress: '',
    permanentAddress: '',
    goldItems: [{ description: '', grossWeight: 0, netWeight: 0 }],
    interestRate: 0,
    loanAmount: 0,
    totalAmount: 0,
    monthlyPayment: 0,
    duration: 1,
  });
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [checkingAadhar, setCheckingAadhar] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const { token: rawToken, user } = useAuth();
  const token = rawToken || '';
  const [search, setSearch] = useState('');
  const [goldRate, setGoldRate] = useState('7000');
  const [message, setMessage] = useState('');
  const [loanStep, setLoanStep] = useState<1 | 2 | 3>(1); // 1: customer, 2: otp, 3: loan
  const [customerEmail, setCustomerEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [customerVerified, setCustomerVerified] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [todaysDuePayments, setTodaysDuePayments] = useState<any[]>([]);
  const [loadingDuePayments, setLoadingDuePayments] = useState(false);
  const [earlyDueMap, setEarlyDueMap] = useState<Record<string, number>>({});
  const [loanOtp, setLoanOtp] = useState('');
  const [loanOtpSent, setLoanOtpSent] = useState(false);
  const [loanOtpVerified, setLoanOtpVerified] = useState(false);
  const [loanOtpError, setLoanOtpError] = useState<string | null>(null);
  const [justVerified, setJustVerified] = useState(false);
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null);
  const [customers, setCustomers] = useState<CustomerDetails[]>([]);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);

  // Ensure user is logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Please log in to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchLoans();
    fetchGoldRate();
    fetchTodaysDuePayments();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/loans`, {
        headers: {
          'x-auth-token': token
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch loans');
      }
      setLoans(data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching loans:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  const fetchGoldRate = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings/gold-rate`);
      if (response.data.rate) {
        setGoldRate(response.data.rate.toString());
      }
    } catch (error) {
      console.error('Error fetching gold rate:', error);
      // Keep the existing rate if there's an error
    }
  };

  const fetchTodaysDuePayments = async () => {
    setLoadingDuePayments(true);
    try {
      const response = await fetch(`${API_URL}/notifications/todays-due`, {
        headers: {
          'x-auth-token': token
        }
      });
      const data = await response.json();
      if (response.ok) {
        setTodaysDuePayments(data.data);
      }
    } catch (error) {
      console.error("Error fetching today's due payments:", error);
    } finally {
      setLoadingDuePayments(false);
    }
  };

  const checkAadharNumber = async (aadharNumber: string) => {
    try {
      setCheckingAadhar(true);
      const response = await fetch(`${API_URL}/admin/check-aadhar/${aadharNumber}`, {
        headers: {
          'x-auth-token': token
        }
      });
      const data = await response.json();
      if (data.exists) {
        setCustomerDetails(data.customerDetails);
        setFormData(prev => ({
          ...prev,
          customerId: data.customerDetails.customerId,
          name: data.customerDetails.name,
          email: data.customerDetails.email,
          primaryMobile: data.customerDetails.primaryMobile,
          secondaryMobile: data.customerDetails.secondaryMobile || '',
          presentAddress: data.customerDetails.presentAddress,
          permanentAddress: data.customerDetails.permanentAddress,
          emergencyContact: {
            mobile: data.customerDetails.emergencyContact?.mobile || '',
            relation: data.customerDetails.emergencyContact?.relation || ''
          }
        }));
      } else {
        setCustomerDetails(null);
      }
    } catch (err) {
      console.error('Error checking Aadhar:', err);
      setError(err instanceof Error ? err.message : 'Failed to check Aadhar number');
    } finally {
      setCheckingAadhar(false);
    }
  };

  const calculateLoanDetails = async (data: Partial<LoanFormData>) => {
    const principal = data.loanAmount || formData.loanAmount;
    const yearlyRate = data.interestRate || formData.interestRate;
    const months = data.duration || formData.duration;

    if (principal > 0 && yearlyRate > 0 && months > 0) {
      // Use today's date as disbursement, closure after months
      const disbursementDate = new Date();
      const closureDate = new Date(disbursementDate.getTime());
      closureDate.setMonth(closureDate.getMonth() + months);
      const res = await fetch(`${API_URL}/loans/calculate-interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          principal,
          annualRate: yearlyRate,
          disbursementDate: disbursementDate.toISOString(),
          closureDate: closureDate.toISOString()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Calculation failed');
      // Use the monthly payment from the new calculation method
      return {
        monthlyPayment: data.monthlyPayment,
        totalAmount: data.totalAmount
      };
    }
    return { monthlyPayment: 0, totalAmount: 0 };
  };

  const capitalizeWords = (str: string) =>
    str.replace(/\b\w/g, c => c.toUpperCase());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Always process the value for name and relation fields
    if (name === 'name') {
      setFormData(prev => ({
        ...prev,
        [name]: capitalizeWords(value)
      }));
      return;
    }
    if (name === 'emergencyContact.relation') {
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          relation: capitalizeWords(value)
        }
      }));
      return;
    }

    // Check Aadhar number when it's 12 digits
    if (name === 'aadharNumber' && value.length === 12) {
      checkAadharNumber(value);
    }

    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'interestRate' || name === 'loanAmount' || name === 'duration'
          ? parseFloat(value) || 0
          : value
      }));
    }
  };

  // Recalculate monthlyPayment and totalAmount when relevant fields change
  useEffect(() => {
    const recalc = async () => {
      const principal = formData.loanAmount;
      const yearlyRate = formData.interestRate;
      const months = formData.duration;
      if (principal > 0 && yearlyRate > 0 && months > 0) {
        try {
          const disbursementDate = new Date();
          const closureDate = new Date(disbursementDate.getTime());
          closureDate.setMonth(closureDate.getMonth() + months);
          const res = await fetch(`${API_URL}/loans/calculate-interest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              principal,
              annualRate: yearlyRate,
              disbursementDate: disbursementDate.toISOString(),
              closureDate: closureDate.toISOString(),
              termMonths: months
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Calculation failed');
          setFormData(prev => ({
            ...prev,
            monthlyPayment: data.monthlyPayment,
            totalAmount: data.totalAmount
          }));
        } catch {
          // Fallback calculation if API fails
          const timeInYears = months / 12;
          const totalInterest = (principal * yearlyRate * timeInYears) / 100;
          const totalAmount = principal + totalInterest;
          const monthlyPayment = totalAmount / months;
          
          setFormData(prev => ({
            ...prev,
            monthlyPayment: Math.round(monthlyPayment),
            totalAmount: Math.round(totalAmount)
          }));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          monthlyPayment: 0,
          totalAmount: 0
        }));
      }
    };
    recalc();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.loanAmount, formData.interestRate, formData.duration]);

  const handleGoldItemChange = (index: number, field: keyof GoldItem, value: string) => {
    setFormData(prev => ({
      ...prev,
      goldItems: prev.goldItems.map((item, i) => 
        i === index ? { ...item, [field]: field === 'description' ? value : parseFloat(value) || 0 } : item
      )
    }));
  };

  const addGoldItem = () => {
    setFormData(prev => ({
      ...prev,
      goldItems: [...prev.goldItems, { description: '', grossWeight: 0, netWeight: 0 }]
    }));
  };

  const removeGoldItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      goldItems: prev.goldItems.filter((_, i) => i !== index)
    }));
  };

  // Step 1: Add customer and send OTP
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCustomerCreationLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          aadharNumber: formData.aadharNumber,
          name: formData.name,
          email: formData.email,
          primaryMobile: formData.primaryMobile,
          secondaryMobile: formData.secondaryMobile,
          presentAddress: formData.presentAddress,
          permanentAddress: formData.permanentAddress,
          emergencyContact: formData.emergencyContact
        })
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessage = data.errors.map((error: any) => error.msg).join('\n');
          throw new Error(errorMessage);
        } else {
          throw new Error(data.message || 'Failed to add customer');
        }
      }
      setCustomerEmail(formData.email);
      setLoanStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add customer');
    } finally {
      setCustomerCreationLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOtpVerificationLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/verify-customer-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ email: customerEmail, otp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'OTP verification failed');
      setCustomerVerified(true);
      setCustomerId(data.customer._id);
      setLoanStep(3);
      setJustVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setOtpVerificationLoading(false);
    }
  };

  // Step 3: Send OTP for loan creation
  const handleSendLoanOtp = async () => {
    setLoanOtpError(null);
    setOtpVerificationLoading(true);
    try {
      const response = await fetch(`${API_URL}/loans/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ customerId, email: formData.email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send OTP');
      setLoanOtpSent(true);
    } catch (err) {
      setLoanOtpError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setOtpVerificationLoading(false);
    }
  };

  const handleVerifyLoanOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoanOtpError(null);
    setOtpVerificationLoading(true);
    try {
      const response = await fetch(`${API_URL}/loans/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ customerId, email: formData.email, otp: loanOtp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to verify OTP');
      setLoanOtpVerified(true);
    } catch (err) {
      setLoanOtpError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setOtpVerificationLoading(false);
    }
  };

  // Step 3: Add loan (existing handleSubmit, but only allow if customerVerified)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerVerified) {
      setError('Customer must be verified before adding a loan.');
      return;
    }
    setLoanCreationLoading(true);
    try {
      // Validate Aadhar number
      if (!/^\d{12}$/.test(formData.aadharNumber)) {
        throw new Error('Aadhar number must be exactly 12 digits');
      }

      // Validate required fields
      if (!formData.aadharNumber || !formData.name || !formData.primaryMobile ||
          !formData.presentAddress || !formData.permanentAddress) {
        throw new Error('Please fill in all required fields');
      }

      // Validate gold items
      if (!formData.goldItems.length || !formData.goldItems[0].description ||
          !formData.goldItems[0].grossWeight || !formData.goldItems[0].netWeight) {
        throw new Error('Please add at least one gold item with complete details');
      }

      // Convert numeric values
      const amount = Number(formData.loanAmount);
      const term = Number(formData.duration);
      const interestRate = Number(formData.interestRate);
      const monthlyPayment = Number(formData.monthlyPayment);
      const totalPayment = Number(formData.totalAmount);

      // Validate numeric values
      if (isNaN(amount) || amount < 100) {
        throw new Error('Loan amount must be at least 100');
      }
      if (isNaN(term) || term < 1) {
        throw new Error('Loan duration must be at least 1 month');
      }
      if (isNaN(interestRate) || interestRate < 0) {
        throw new Error('Interest rate cannot be negative');
      }
      if (isNaN(monthlyPayment) || monthlyPayment <= 0) {
        throw new Error('Invalid monthly payment amount');
      }
      if (isNaN(totalPayment) || totalPayment <= 0) {
        throw new Error('Invalid total payment amount');
      }

      const requestData = {
        // Customer details
        customerId: customerId, // Use the actual customer ID from OTP verification
        aadharNumber: formData.aadharNumber,
        name: formData.name,
        email: formData.email,
        primaryMobile: formData.primaryMobile,
        secondaryMobile: formData.secondaryMobile,
        presentAddress: formData.presentAddress,
        permanentAddress: formData.permanentAddress,
        emergencyContact: formData.emergencyContact,
        // Loan details
        goldItems: formData.goldItems,
        interestRate,
        amount,
        term,
        monthlyPayment,
        totalPayment,
        // Add createdBy field
        createdBy: user.id
      };

      // console.log('Sending loan request with data:', JSON.stringify(requestData, null, 2));

      const response = await fetch(`${API_URL}/admin/loans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessage = data.errors.map((error: any) => error.msg).join('\n');
          throw new Error(errorMessage);
        } else {
          throw new Error(data.message || 'Failed to create loan');
        }
      }

      // Refresh the loans list after successful creation
      await fetchLoans();

      alert('Loan created successfully');
      setShowLoanForm(false);
      setFormData({
        aadharNumber: '',
        name: '',
        email: '',
        primaryMobile: '',
        secondaryMobile: '',
        emergencyContact: {
          mobile: '',
          relation: '',
        },
        presentAddress: '',
        permanentAddress: '',
        goldItems: [{ description: '', grossWeight: 0, netWeight: 0 }],
        interestRate: 0,
        loanAmount: 0,
        totalAmount: 0,
        monthlyPayment: 0,
        duration: 1,
      });
    } catch (error) {
      console.error('Error creating loan:', error);
      alert(error instanceof Error ? error.message : 'Failed to create loan');
    } finally {
      setLoanCreationLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: Loan['status']) => {
    const colors = {
      // pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      active: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status];
  };

  const handleRepay = async (amount: number, paymentMethod: string, transactionId?: string, bankName?: string, paymentType?: string) => {
    if (!selectedLoan) return;
    const response = await fetch(`${API_URL}/loans/${selectedLoan._id}/payment`, {
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

  // Filter loans based on search
  const filteredLoans = loans.filter(loan => {
    // First filter by status
    if (statusFilter !== 'all' && loan.status !== statusFilter) {
      return false;
    }
    
    // Then filter by search term
    const customerName = (typeof loan.customerId === 'object' && loan.customerId?.name) ? loan.customerId.name : '';
    const customerAadhar = (typeof loan.customerId === 'object' && loan.customerId?.aadharNumber) ? loan.customerId.aadharNumber : '';
    
    return (
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      loan.email.toLowerCase().includes(search.toLowerCase()) ||
      loan.primaryMobile.includes(search) ||
      customerAadhar.includes(search) ||
      formatCurrency(loan.amount).includes(search)
    );
  });

  // Count loans by status
  const activeLoansCount = loans.filter(loan => loan.status === 'active').length;
  const closedLoansCount = loans.filter(loan => loan.status === 'closed').length;

  // Update gold rate
  const handleUpdateGoldRate = async () => {
    try {
      setLoading(true);
      // console.log('Token being used:', token);
      await axios.post(`${API_URL}/settings/update-gold-rate`, 
        { rate: parseFloat(goldRate) },
        { headers: { 'x-auth-token': token } }
      );
      setMessage('Gold rate updated successfully!');
      // Fetch the updated rate
      await fetchGoldRate();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error updating gold rate:', error);
      // if (error.response) {
      //   console.log('Error response:', {
      //     status: error.response.status,
      //     data: error.response.data,
      //     headers: error.response.headers
      //   });
      // }
      setMessage(error.response?.data?.message || 'Failed to update gold rate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch early repayment due for all loans
    const fetchAllEarlyDue = async () => {
      const map: Record<string, number> = {};
      for (const loan of loans) {
        try {
          const data = await fetchEarlyRepaymentDetails({
            loanId: loan._id,
            repaymentDate: new Date().toISOString().slice(0, 10),
            token: token || '',
          });
          map[loan._id] = data.totalDue;
        } catch (e) {
          map[loan._id] = loan.amount; // fallback
        }
      }
      setEarlyDueMap(map);
    };
    if (loans.length > 0) fetchAllEarlyDue();
    // eslint-disable-next-line
  }, [loans]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <Navbar isSidebarPage={true} sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
        <main className={`flex-1 p-4 transition-all duration-300 relative z-10 ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
          {/* Header Section */}
          {/* <div className="text-center mb-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white text-sm">🏦</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
            </div>
            <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-2"></div>
            <p className="text-gray-600 text-sm">Manage loans, customers, and financial operations</p>
          </div> */}
          
          <div className="relative z-10">
          
            {/* Today's Due Payments Section */}
            {todaysDuePayments.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-4 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Today's Due Payments</h3>
                      <p className="text-xs text-gray-600">Payments due for today</p>
                    </div>
                  </div>
                  <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold text-sm">
                    {todaysDuePayments.length} Due
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {todaysDuePayments.map((payment) => (
                    <div key={payment._id} className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-yellow-200 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-bold">{payment.customerName?.charAt(0)?.toUpperCase()}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-gray-800">{payment.customerName}</span>
                            <div className="text-xs text-gray-500">{payment.customerMobile}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <IndianRupee  className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-bold text-gray-700">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Due Today
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Loan ID: {payment.loanId?.loanId || 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Summary Statistics */}
            {loans.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-4 border border-white/20">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Portfolio Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-blue-600 font-medium">Total Loans</p>
                        <p className="text-lg font-bold text-blue-900">{loans.length}</p>
                      </div>
                      <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 text-sm">📊</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-green-600 font-medium">Active Loans</p>
                        <p className="text-lg font-bold text-green-900">{activeLoansCount}</p>
                      </div>
                      <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
                        <span className="text-green-600 text-sm">✅</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Closed Loans</p>
                        <p className="text-lg font-bold text-gray-900">{closedLoansCount}</p>
                      </div>
                      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-600 text-sm">🔒</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-purple-600 font-medium">Total Amount</p>
                        <p className="text-lg font-bold text-purple-900">
                          {formatCurrency(loans.reduce((sum, loan) => sum + loan.amount, 0))}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center">
                        <span className="text-purple-600 text-sm">💰</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filter and Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-4 border border-white/20">
              <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <button 
                    className={`px-4 py-2 rounded-lg font-medium shadow transition-all duration-300 text-sm ${
                      statusFilter === 'all' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                        : 'bg-white/60 text-blue-700 border border-blue-200 hover:bg-blue-50'
                    }`} 
                    onClick={() => setStatusFilter('all')}
                  >
                    All Loans ({loans.length})
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-lg font-medium shadow transition-all duration-300 text-sm ${
                      statusFilter === 'active' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                        : 'bg-white/60 text-green-700 border border-green-200 hover:bg-green-50'
                    }`} 
                    onClick={() => setStatusFilter('active')}
                  >
                    Active ({activeLoansCount})
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-lg font-medium shadow transition-all duration-300 text-sm ${
                      statusFilter === 'closed' 
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white' 
                        : 'bg-white/60 text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`} 
                    onClick={() => setStatusFilter('closed')}
                  >
                    Closed ({closedLoansCount})
                  </button>
                </div>
                <button 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-all duration-300 flex items-center space-x-2 group text-sm"
                  onClick={() => navigate('/admin/add-loan')}
                >
                  <span className="group-hover:scale-110 transition-transform">➕</span>
                  <span>Add New Loan</span>
                </button>
              </div>
            </div>

            {showLoanForm && (
              <div className="bg-white/90 rounded-2xl shadow-xl p-6 space-y-6">
                {loanStep === 1 && (
                  <div className="max-w-4xl mx-auto bg-blue-50 shadow-xl rounded-2xl p-8 mt-8 mb-12 border border-blue-100">
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-blue-700 mb-4"><span>📝</span> Add Customer & Send OTP</h2>
                    <p className="text-gray-500 mb-6 text-sm">Fill in the customer details below. An OTP will be sent to the provided email for verification before proceeding with the loan process.</p>
                    {/* Error display block */}
                    {error && (
                      <div className="mb-4">
                        {error.includes('\n') ? (
                          <ul className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 list-disc list-inside">
                            {error.split('\n').map((msg, idx) => (
                              <li key={idx}>{msg}</li>
                            ))}
                          </ul>
                        ) : (
                          <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3">{error}</div>
                        )}
                      </div>
                    )}
                    <form onSubmit={handleAddCustomer} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-blue-600 mb-2 flex items-center gap-1"><span>👤</span> Personal Info</h3>
                          <label className="block text-sm font-semibold text-gray-700">Aadhar Number
                            <span className="block text-xs text-gray-400">12-digit unique ID</span>
                          </label>
                          <input type="text" name="aadharNumber" value={formData.aadharNumber} onChange={handleInputChange} placeholder="Aadhar Number" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" required autoComplete="off" />
                          <label className="block text-sm font-semibold text-gray-700">Full Name</label>
                          <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Full Name" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" required style={{ textTransform: 'capitalize' }} autoComplete="name" />
                          <label className="block text-sm font-semibold text-gray-700">Email
                            <span className="block text-xs text-gray-400">OTP will be sent here</span>
                          </label>
                          <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email Address (Optional)" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" autoComplete="email" />
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-blue-600 mb-2 flex items-center gap-1"><span>📞</span> Contact Info</h3>
                          <label className="block text-sm font-semibold text-gray-700">Primary Mobile</label>
                          <input type="tel" name="primaryMobile" value={formData.primaryMobile} onChange={handleInputChange} placeholder="Primary Mobile Number" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" required autoComplete="tel" />
                          <label className="block text-sm font-semibold text-gray-700">Secondary Mobile</label>
                          <input type="tel" name="secondaryMobile" value={formData.secondaryMobile} onChange={handleInputChange} placeholder="Secondary Mobile Number" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" autoComplete="tel" />
                          <label className="block text-sm font-semibold text-gray-700">Emergency Contact Number</label>
                          <input type="tel" name="emergencyContact.mobile" value={formData.emergencyContact.mobile} onChange={handleInputChange} placeholder="Emergency Contact Number" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" required autoComplete="tel" />
                          <label className="block text-sm font-semibold text-gray-700">Relation with Emergency Contact
                            <span className="block text-xs text-gray-400">e.g., Father, Mother</span>
                          </label>
                          <input type="text" name="emergencyContact.relation" value={formData.emergencyContact.relation} onChange={handleInputChange} placeholder="Relation (e.g., Father, Mother)" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" required style={{ textTransform: 'capitalize' }} autoComplete="relationship" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-blue-600 mb-2 flex items-center gap-1"><span>🏠</span> Address</h3>
                        <label className="block text-sm font-semibold text-gray-700">Present Address</label>
                        <textarea name="presentAddress" value={formData.presentAddress} onChange={handleInputChange} placeholder="Present Address" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" required autoComplete="address-line1" />
                        <label className="block text-sm font-semibold text-gray-700">Permanent Address</label>
                        <textarea name="permanentAddress" value={formData.permanentAddress} onChange={handleInputChange} placeholder="Permanent Address" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" required autoComplete="address-line2" />
                      </div>
                      <div className="flex justify-end mt-8">
                        <button 
                          type="submit" 
                          disabled={customerCreationLoading}
                          className={`px-8 py-3 rounded-xl text-lg font-bold shadow-lg flex items-center gap-2 transition-all duration-200 ${
                            customerCreationLoading 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700'
                          } text-white`}
                        >
                          {customerCreationLoading ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Creating Customer...
                            </>
                          ) : (
                            <>
                          <span>📧</span> Add Customer & Send OTP
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                {loanStep === 2 && (
                  <div className="max-w-md mx-auto bg-yellow-50 shadow-xl rounded-2xl p-8 mt-8 mb-12 border border-yellow-200">
                    <h2 className="flex items-center gap-2 text-xl font-bold text-blue-700 mb-4"><span>📱</span> Verify Customer Mobile Number</h2>
                    <p className="text-gray-500 mb-6 text-sm">Enter the One-Time Password (OTP) sent to the customer's <strong>mobile number</strong> to verify their identity before proceeding with the loan process.</p>
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                      <div>
                        <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-1">OTP Code</label>
                        <input
                          id="otp"
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={e => setOtp(e.target.value)}
                          required
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition tracking-widest text-lg text-center"
                          maxLength={6}
                        />
                        <p className="text-xs text-gray-400 mt-1">Didn't receive the OTP? Ask the customer to check their mobile phone or resend the OTP.</p>
                      </div>
                      <button 
                        type="submit" 
                        disabled={otpVerificationLoading}
                        className={`w-full py-3 rounded-xl text-lg font-bold shadow-lg flex items-center gap-2 justify-center transition-all duration-200 ${
                          otpVerificationLoading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700'
                        } text-white`}
                      >
                        {otpVerificationLoading ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Verifying OTP...
                          </>
                        ) : (
                          <>
                        <span>✅</span> Verify OTP
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
                {loanStep === 3 && customerVerified && !loanOtpVerified && (
                  <div className="max-w-md mx-auto bg-orange-50 shadow-xl rounded-2xl p-8 mt-8 mb-12 border border-orange-200">
                    <h2 className="flex items-center gap-2 text-xl font-bold text-blue-700 mb-4"><span>📱</span> Verify Customer Mobile Number</h2>
                    <p className="text-gray-500 mb-6 text-sm">Enter the One-Time Password (OTP) sent to the customer's <strong>mobile number</strong> to verify their identity before proceeding with the loan creation process.</p>
                    
                    {!loanOtpSent ? (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">Click the button below to send OTP to customer's mobile number.</p>
                        <button 
                          onClick={handleSendLoanOtp}
                          disabled={otpVerificationLoading}
                          className={`w-full py-3 rounded-xl text-lg font-bold shadow-lg flex items-center gap-2 justify-center transition-all duration-200 ${
                            otpVerificationLoading 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700'
                          } text-white`}
                        >
                          {otpVerificationLoading ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Sending OTP...
                            </>
                          ) : (
                            <>
                          <span>📱</span> Send SMS OTP to Customer
                            </>
                          )}
                        </button>
                        {loanOtpError && (
                          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                            {loanOtpError}
                          </div>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleVerifyLoanOtp} className="space-y-6">
                        <div>
                          <label htmlFor="loanOtp" className="block text-sm font-semibold text-gray-700 mb-1">OTP Code</label>
                          <input
                            id="loanOtp"
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={loanOtp}
                            onChange={e => setLoanOtp(e.target.value)}
                            required
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition tracking-widest text-lg text-center"
                            maxLength={6}
                          />
                          <p className="text-xs text-gray-400 mt-1">Check the customer's mobile phone for the SMS OTP.</p>
                        </div>
                        <button 
                          type="submit" 
                          disabled={otpVerificationLoading}
                          className={`w-full py-3 rounded-xl text-lg font-bold shadow-lg flex items-center gap-2 justify-center transition-all duration-200 ${
                            otpVerificationLoading 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700'
                          } text-white`}
                        >
                          {otpVerificationLoading ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Verifying OTP...
                            </>
                          ) : (
                            <>
                          <span>✅</span> Verify OTP & Proceed
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                )}
                {loanStep === 3 && customerVerified && loanOtpVerified && (
                  <div className="max-w-4xl mx-auto bg-green-50 shadow-xl rounded-2xl p-8 mt-8 mb-12 border border-green-200">
                    <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <h2 className="flex items-center gap-2 text-xl font-bold text-blue-700 mb-2"><span>👤</span> Customer Details</h2>
                          <label className="block text-sm font-semibold text-gray-700">Aadhar Number
                            <span className="block text-xs text-gray-400">12-digit unique ID</span>
                          </label>
                          <input type="text" name="aadharNumber" value={formData.aadharNumber} onChange={handleInputChange} placeholder="Aadhar Number" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" required autoComplete="off" />
                          <label className="block text-sm font-semibold text-gray-700">Full Name</label>
                          <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Full Name" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" required style={{ textTransform: 'capitalize' }} autoComplete="name" />
                          <label className="block text-sm font-semibold text-gray-700">Email
                            <span className="block text-xs text-gray-400">We'll send an OTP for verification</span>
                          </label>
                          <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email Address (Optional)" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" autoComplete="email" />
                          <label className="block text-sm font-semibold text-gray-700">Primary Mobile</label>
                          <input type="tel" name="primaryMobile" value={formData.primaryMobile} onChange={handleInputChange} placeholder="Primary Mobile Number" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" required autoComplete="tel" />
                          <label className="block text-sm font-semibold text-gray-700">Secondary Mobile</label>
                          <input type="tel" name="secondaryMobile" value={formData.secondaryMobile} onChange={handleInputChange} placeholder="Secondary Mobile Number" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" autoComplete="tel" />
                        </div>
                        <div className="space-y-4">
                          <h2 className="flex items-center gap-2 text-xl font-bold text-blue-700 mb-2"><span>📞</span> Emergency Contact</h2>
                          <label className="block text-sm font-semibold text-gray-700">Contact Number</label>
                          <input type="tel" name="emergencyContact.mobile" value={formData.emergencyContact.mobile} onChange={handleInputChange} placeholder="Emergency Contact Number" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" required autoComplete="tel" />
                          <label className="block text-sm font-semibold text-gray-700">Relation
                            <span className="block text-xs text-gray-400">e.g., Father, Mother</span>
                          </label>
                          <input type="text" name="emergencyContact.relation" value={formData.emergencyContact.relation} onChange={handleInputChange} placeholder="Relation (e.g., Father, Mother)" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" required style={{ textTransform: 'capitalize' }} autoComplete="relationship" />
                          <h2 className="flex items-center gap-2 text-xl font-bold text-blue-700 mt-6 mb-2"><span>🏠</span> Address</h2>
                          <label className="block text-sm font-semibold text-gray-700">Present Address</label>
                          <textarea name="presentAddress" value={formData.presentAddress} onChange={handleInputChange} placeholder="Present Address" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" required autoComplete="address-line1" />
                          <label className="block text-sm font-semibold text-gray-700">Permanent Address</label>
                          <textarea name="permanentAddress" value={formData.permanentAddress} onChange={handleInputChange} placeholder="Permanent Address" className="input-with-cursor w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" required autoComplete="address-line2" />
                        </div>
                      </div>
                      <div className="mt-8">
                          <h2 className="flex items-center gap-2 text-xl font-bold text-yellow-700 mb-2"><span>🪙</span> Gold Items</h2>
                          {formData.goldItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700">Description</label>
                                <input type="text" value={item.description} onChange={e => handleGoldItemChange(index, 'description', e.target.value)} placeholder="Gold Item Description" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition" required autoComplete="off" />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700">Gross Weight (g)</label>
                                <input type="number" value={item.grossWeight} onChange={e => handleGoldItemChange(index, 'grossWeight', e.target.value)} placeholder="Gross Weight" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition" min="0" step="0.01" required autoComplete="off" />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700">Net Weight (g)</label>
                                <input type="number" value={item.netWeight} onChange={e => handleGoldItemChange(index, 'netWeight', e.target.value)} placeholder="Net Weight" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition" min="0" step="0.01" required autoComplete="off" />
                              </div>
                              <div className="col-span-3 flex justify-end">
                                <button type="button" onClick={() => removeGoldItem(index)} className="text-red-600 hover:underline font-semibold" disabled={formData.goldItems.length === 1}>Remove</button>
                              </div>
                            </div>
                          ))}
                          <button type="button" onClick={addGoldItem} className="bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white px-5 py-2 rounded-lg mt-2 font-semibold shadow">+ Add Gold Item</button>
                        </div>
                      <div className="space-y-4 mt-8">
                        <h2 className="flex items-center gap-2 text-xl font-bold text-yellow-700 mb-2"><span>💰</span> Loan Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700">Interest Rate (%)</label>
                            <select name="interestRate" value={formData.interestRate} onChange={handleInputChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition bg-white/80" required>
                              <option value="">Select Interest Rate</option>
                              <option value="18">18% per annum</option>
                              <option value="24">24% per annum</option>
                              <option value="30">30% per annum</option>
                              <option value="36">36% per annum</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700">Loan Amount (₹)</label>
                            <input type="number" name="loanAmount" value={formData.loanAmount} onChange={handleInputChange} placeholder="Loan Amount" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition" min="100" step="1" required autoComplete="off" />
                            {formData.loanAmount > 0 && (
                              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800 font-medium">
                                  {formatAmountInWords(formData.loanAmount)}
                                </p>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700">Duration (months)</label>
                            <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} placeholder="Loan Duration" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition" min="1" step="1" required autoComplete="off" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700">Monthly Payment (₹)</label>
                            <input type="number" name="monthlyPayment" value={formData.monthlyPayment} onChange={handleInputChange} placeholder="Monthly Payment" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition" min="0" step="1" required autoComplete="off" />
                            {formData.monthlyPayment > 0 && (
                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                <div className="text-sm text-green-800">
                                  <div className="flex justify-between">
                                    <span>Monthly Interest:</span>
                                    <span className="font-semibold">₹{Math.round((formData.totalAmount - formData.loanAmount) / (formData.duration || 1)).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Monthly Principal:</span>
                                    <span className="font-semibold">₹{Math.round(formData.monthlyPayment - (formData.totalAmount - formData.loanAmount) / (formData.duration || 1)).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700">Total Amount to be Paid (₹)</label>
                            <input type="number" name="totalAmount" value={formData.totalAmount} onChange={handleInputChange} placeholder="Total Amount" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition" min="0" step="1" required autoComplete="off" />
                          </div>
                        </div>
                        
                      </div>
                      <div className="flex justify-end mt-10">
                        <button 
                          type="submit" 
                          disabled={loanCreationLoading}
                          className={`px-8 py-3 rounded-xl text-lg font-bold shadow-lg flex items-center gap-2 transition-all duration-200 ${
                            loanCreationLoading 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700'
                          } text-white`}
                        >
                          {loanCreationLoading ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Creating Loan...
                            </>
                          ) : (
                            <>
                          <span>🚀</span> Create Loan
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            

            {/* Loans Table Section */}
            <div className="bg-white/90 rounded-xl shadow-lg p-4 mt-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 gap-3">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-1 md:mb-0">
                  <span>📄</span> Loans
                </h2>
                <div className="relative w-full md:w-80">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 text-sm">🔍</span>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, email, mobile, Aadhar"
                    className="pl-8 pr-4 py-2 w-full rounded-lg border border-blue-100 bg-blue-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition text-gray-700 shadow-sm text-sm"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-xl">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Customer</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Contact</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Loan Details</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Created By</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoans.map((loan, idx) => {
                      const isUpgraded = loan.currentUpgradeLevel && loan.currentUpgradeLevel > 0;
                      const getHighlightColor = () => {
                        if (!isUpgraded) return idx % 2 === 0 ? 'bg-blue-50' : 'bg-white';
                        switch (loan.currentUpgradeLevel) {
                          case 1: return 'bg-yellow-50 border-l-4 border-yellow-400';
                          case 2: return 'bg-orange-50 border-l-4 border-orange-400';
                          case 3: return 'bg-red-50 border-l-4 border-red-400';
                          default: return idx % 2 === 0 ? 'bg-blue-50' : 'bg-white';
                        }
                      };
                      
                      return (
                      <tr key={loan._id} className={`transition group ${getHighlightColor()} hover:bg-cyan-50`}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatDate(loan.createdAt)}</td>
                        <td className="px-4 py-3 max-w-[120px] truncate">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {typeof loan.customerId === 'object' && loan.customerId?.name ? loan.customerId.name : loan.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {typeof loan.customerId === 'object' && loan.customerId?.aadharNumber ? loan.customerId.aadharNumber : ''}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-sm text-gray-900">{loan.primaryMobile}</div>
                          <div className="text-xs text-gray-500">{loan.email}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-sm text-gray-900">Amount: ₹{loan.amount}</div>
                          <div className="text-xs text-gray-500">Term: {loan.term} months</div>
                          <div className="text-xs text-gray-500">
                            Interest: {Number(loan.interestRate)}%
                            {/* Debug: {JSON.stringify(loan.interestRate)} */}
                            {/* Temporarily disabled upgrade display
                            {isUpgraded && loan.originalInterestRate && loan.originalInterestRate !== loan.interestRate && (
                              <span className="text-orange-600 font-semibold">
                                {' '}(Upgraded from {Number(loan.originalInterestRate)}%)
                              </span>
                            )}
                            */}
                          </div>
                          <div className="text-xs text-gray-500">Monthly: ₹{loan.monthlyPayment}</div>
                          <div className="text-xs text-green-700">Total Paid: ₹{loan.totalPaid || 0}</div>
                          {isUpgraded && (
                            <div className="text-xs text-orange-600 font-semibold">
                              Level {loan.currentUpgradeLevel} Upgrade
                            </div>
                          )}
                        </td>
                        
                        <td className="px-3 py-2 max-w-[120px] truncate">
                          {loan.createdBy ? (
                            <>
                              <div className="text-sm font-medium text-gray-900 truncate">{loan.createdBy.name}</div>
                              <div className="text-xs text-gray-500 truncate">{loan.createdBy.email}</div>
                              <div className="text-xs text-gray-500 truncate">{loan.createdBy.role}</div>
                            </>
                          ) : (
                            <div className="text-xs text-gray-500">N/A</div>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(loan.status)}`}>{loan.status === 'active' ? '🟢 Active' : loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}</span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          {loan.status === 'active' && (
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setShowRepaymentModal(true);
                              }}
                              className="text-white px-4 py-2 rounded-xl font-bold shadow flex items-center gap-2"
                              style={{ backgroundColor: '#FFE100', color: '#000000' }}
                              onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#FFD700'}
                              onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#FFE100'}
                            >
                              <span>💸</span> Repay
                            </button>
                          )}
                        </td>
                      </tr>
                      );
                    })}
                    {filteredLoans.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-4 text-center text-gray-500">No loans found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Upgraded Loans Section */}
            <div className="mt-4">
              <UpgradedLoansList refreshTrigger={Date.now()} />
            </div>
            {/* Gold Rate Update Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mt-8 border border-white/20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <span className="text-yellow-600 text-lg">💰</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Gold Rate Management</h2>
                  <p className="text-sm text-gray-600">Update current gold rate per gram</p>
                </div>
              </div>
              <div className="flex flex-col lg:flex-row items-center gap-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={goldRate}
                    onChange={(e) => setGoldRate(e.target.value)}
                    placeholder="Gold Rate per gram"
                    className="pl-8 pr-4 py-3 w-48 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-400 transition bg-white/80 backdrop-blur-sm"
                  />
                </div>
                <button
                  onClick={handleUpdateGoldRate}
                  disabled={loading}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all duration-300 flex items-center space-x-2 disabled:opacity-50"
                >
                  <span>🔄</span>
                  <span>{loading ? 'Updating...' : 'Update Rate'}</span>
                </button>
              </div>
              {message && (
                <div className={`mt-4 p-3 rounded-lg ${
                  message.includes('success') 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message}
                </div>
              )}
            </div>

            {/* Footer Section */}
            {/* <div className="mt-12 pb-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 text-xl">📊</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Dashboard Overview</h3>
                    <p className="text-sm text-gray-600">Monitor all loan activities and customer data</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-green-600 text-xl">⚡</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Quick Actions</h3>
                    <p className="text-sm text-gray-600">Add loans, manage repayments, and update rates</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 text-xl">🔒</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Secure Access</h3>
                    <p className="text-sm text-gray-600">Protected admin dashboard with role-based access</p>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </main>
      </div>

      {/* Repayment Modal */}
      {showRepaymentModal && selectedLoan && (
        <RepaymentModal
          loan={selectedLoan}
          onClose={() => {
            setShowRepaymentModal(false);
            setSelectedLoan(null);
          }}
          onRepay={handleRepay}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
export { RepaymentModal }; 
