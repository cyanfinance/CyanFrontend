import { useState, useEffect } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import { calculateDailyInterest, fetchEarlyRepaymentDetails } from '../../utils/api';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import UpgradeHistoryModal from '../../components/UpgradeHistoryModal';

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
  customerId: string | { aadharNumber: string; name: string };
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
  originalInterestRate?: number;
  currentUpgradeLevel?: number;
  status:  'approved' | 'rejected' | 'active' | 'closed';
  monthlyPayment: number;
  totalPayment: number;
  totalPaid: number;
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
  hasUpgradeHistory?: boolean;
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
        <h2 className="text-xl font-semibold mb-4 mt-16">Repay Loan</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Repayment Date</label>
            <input
              type="date"
              value={repaymentDate}
              onChange={e => setRepaymentDate(e.target.value)}
              className="input-with-cursor mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Select the actual date when the payment was made (useful for holiday payments)
            </p>
          </div>
          {calcLoading ? (
            <div className="mb-4 text-yellow-700 text-sm flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
              Calculating interest for selected date...
            </div>
          ) : calc && (
            <div className="mb-4 text-sm bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded">
              <div className="font-semibold text-yellow-800 mb-2">
                Interest Calculation (as of {new Date(repaymentDate).toLocaleDateString()}):
              </div>
              <div><b>Interest (compounded monthly):</b> ₹{calc.interest}</div>
              <div><b>Minimum interest period:</b> {calc.minimumDays} days</div>
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
              className="input-with-cursor mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
              className="input-with-cursor mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
              className="input-with-cursor mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
                className="input-with-cursor mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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

const EmployeeDashboard = () => {
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
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const { token: rawToken, user } = useAuth();
  const token = rawToken || '';
  const [search, setSearch] = useState('');
  const [loanStep, setLoanStep] = useState<1 | 2 | 3>(1); // 1: customer, 2: otp, 3: loan
  const [customerEmail, setCustomerEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [customerVerified, setCustomerVerified] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [earlyDueMap, setEarlyDueMap] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  // Reset form function
  const resetForm = () => {
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
    setCustomerDetails(null);
    setLoanStep(1);
    setCustomerEmail('');
    setOtp('');
    setCustomerVerified(false);
    setCustomerId(null);
    setError(null);
  };

  // Ensure user is logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Please log in to access the Employee dashboard.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await fetch(`${API_URL}/employee/loans`, {
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

  const checkAadharNumber = async (aadharNumber: string) => {
    try {
      setCheckingAadhar(true);
      const response = await fetch(`${API_URL}/employee/check-aadhar/${aadharNumber}`, {
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

  const calculateLoanDetails = (data: Partial<LoanFormData>) => {
    const principal = data.loanAmount || formData.loanAmount;
    const yearlyRate = data.interestRate || formData.interestRate;
    const months = data.duration || formData.duration;

    if (principal > 0 && yearlyRate > 0 && months > 0) {
      const result = calculateDailyInterest(principal, yearlyRate, months);
      return {
        monthlyPayment: result.monthlyPayment,
        totalAmount: result.totalAmount
      };
    }
    return { monthlyPayment: 0, totalAmount: 0 };
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

  const handleViewHistory = (loan: Loan) => {
    setSelectedLoan(loan);
    setHistoryModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Clear any previous mobile number validation errors
    setError(null);
    
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
        [name]: name === 'interestRate' || name === 'loanAmount' || name === 'duration' ? parseFloat(value) || 0 : value
      }));
    }
    
    // Validate mobile numbers after updating form data
    setTimeout(() => {
      validateMobileNumbers();
    }, 0);
  };

  // Validate that mobile numbers are different
  const validateMobileNumbers = () => {
    const { primaryMobile, secondaryMobile, emergencyContact } = formData;
    
    // Create a set of non-empty mobile numbers
    const mobileNumbers = new Set([
      primaryMobile?.trim(),
      secondaryMobile?.trim(),
      emergencyContact?.mobile?.trim()
    ].filter(num => num && num.length > 0));
    
    // If we have fewer unique numbers than total non-empty numbers, there are duplicates
    if (mobileNumbers.size < [primaryMobile, secondaryMobile, emergencyContact?.mobile].filter(num => num && num.length > 0).length) {
      setError('Primary Mobile, Secondary Mobile, and Emergency Contact Number must be different');
      return false;
    }
    
    return true;
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
    
    // Validate mobile numbers are different before submitting
    if (!validateMobileNumbers()) {
      return; // Error is already set by validateMobileNumbers
    }
    
    try {
      const response = await fetch(`${API_URL}/employee/customers`, {
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
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch(`${API_URL}/employee/verify-customer-otp`, {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
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
      // Validate mobile numbers are different
      if (!validateMobileNumbers()) {
        return; // Error is already set by validateMobileNumbers
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

      const response = await fetch(`${API_URL}/employee/loans`, {
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
      resetForm();
    } catch (error) {
      console.error('Error creating loan:', error);
      alert(error instanceof Error ? error.message : 'Failed to create loan');
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

  // Calculate filteredLoans based on search and statusFilter
  const filteredLoans = loans.filter(loan => {
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    const searchLower = search.toLowerCase();
    const matchesAadhar = typeof loan.customerId === 'object' && loan.customerId !== null && loan.customerId.aadharNumber && loan.customerId.aadharNumber.includes(search);
    const matchesSearch =
      (typeof loan.customerId === 'object' && loan.customerId !== null && loan.customerId.name && loan.customerId.name.toLowerCase().includes(searchLower)) ||
      loan.email.toLowerCase().includes(searchLower) ||
      loan.primaryMobile.includes(searchLower) ||
      matchesAadhar ||
      String(loan.amount).includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  // Count loans by status
  const activeLoansCount = loans.filter(loan => loan.status === 'active').length;
  const closedLoansCount = loans.filter(loan => loan.status === 'closed').length;

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
    <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 min-h-screen">
      <Navbar isSidebarPage={true} sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
      <div className="flex flex-1">
        <EmployeeSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
        <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
          <h1 className="text-3xl font-bold mb-6 text-blue-900 drop-shadow flex items-center gap-2"><span>📊</span> Employee Dashboard</h1>
          <div className="mb-8 flex gap-4">
            <button className={`px-6 py-2 rounded-full font-semibold shadow transition-all ${statusFilter === 'all' ? 'bg-yellow-400 text-white' : 'bg-white text-yellow-700 border border-yellow-300 hover:bg-yellow-100'}`} onClick={() => setStatusFilter('all')}>All Loans ({loans.length})</button>
            <button className={`px-6 py-2 rounded-full font-semibold shadow transition-all ${statusFilter === 'active' ? 'bg-green-400 text-white' : 'bg-white text-green-700 border border-green-300 hover:bg-green-100'}`} onClick={() => setStatusFilter('active')}>Active Loans ({loans.filter(l => l.status === 'active').length})</button>
            <button className={`px-6 py-2 rounded-full font-semibold shadow transition-all ${statusFilter === 'closed' ? 'bg-gray-400 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`} onClick={() => setStatusFilter('closed')}>Closed Loans ({loans.filter(l => l.status === 'closed').length})</button>
            <button className="ml-auto bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg" onClick={() => navigate('/employee/add-loan')}>Add New Loan</button>
          </div>
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-8 mb-12 border border-blue-100">
            <h2 className="text-xl font-bold mb-4 text-blue-800">Loans</h2>
            <div className="flex justify-end mb-4">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, mobile, Aadhar"
                className="p-2 border rounded w-80"
              />
            </div>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-500 uppercase tracking-wider">Loan Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLoans.map((loan) => (
                      <tr key={loan._id} className="hover:bg-blue-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-500">{formatDate(loan.createdAt)}</td>
                        <td className="px-4 py-3 max-w-[120px] truncate">
                          <div className="text-sm font-medium text-blue-900 truncate">{typeof loan.customerId === 'object' && loan.customerId !== null ? loan.customerId.name : ''}</div>
                          <div className="text-xs text-blue-500 truncate">{typeof loan.customerId === 'object' && loan.customerId !== null && loan.customerId.aadharNumber && loan.customerId.aadharNumber.length === 12 ? 'xxxxxxxx' + loan.customerId.aadharNumber.slice(-4) : (typeof loan.customerId === 'object' && loan.customerId !== null ? loan.customerId.aadharNumber : '')}</div>
                        </td>
                        <td className="px-4 py-3 max-w-[120px] truncate">
                          <div className="text-sm text-blue-900 truncate">{loan.primaryMobile}</div>
                          <div className="text-xs text-blue-500 truncate">{loan.email}</div>
                        </td>
                        <td className="px-4 py-3 max-w-[180px] break-words">
                          <div className="text-sm text-blue-900">Amount: ₹{loan.amount}</div>
                          <div className="text-xs text-blue-500">Term: {loan.term} months | Interest: {Number(loan.interestRate)}% (Daily)</div>
                          <div className="text-xs text-blue-700">Monthly: ₹{loan.monthlyPayment}</div>
                          <div className="text-xs text-green-700">Total Paid: ₹{loan.totalPaid || 0}</div>
                          {getUpgradeIndicator(loan)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(loan.status)}`}>{loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-no-wrap border-b border-gray-200 text-sm font-medium">
                          <div className="flex space-x-2">
                            {loan.status === 'active' && (
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setShowRepaymentModal(true);
                                }}
                                className="text-yellow-600 hover:text-yellow-900"
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
                    {filteredLoans.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-blue-500">No loans found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        
          {showRepaymentModal && selectedLoan && (
            <RepaymentModal
              loan={selectedLoan}
              onClose={() => setShowRepaymentModal(false)}
              onRepay={handleRepay}
            />
          )}

          {/* Upgrade History Modal */}
          {selectedLoan && (
            <UpgradeHistoryModal
              open={historyModalOpen}
              onClose={() => setHistoryModalOpen(false)}
              loanId={selectedLoan._id}
              loanData={{
                name: typeof selectedLoan.customerId === 'object' && selectedLoan.customerId?.name ? selectedLoan.customerId.name : selectedLoan.name,
                loanId: selectedLoan._id,
                amount: selectedLoan.amount,
                currentInterestRate: selectedLoan.interestRate,
                currentUpgradeLevel: selectedLoan.currentUpgradeLevel || 0
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default  EmployeeDashboard;
