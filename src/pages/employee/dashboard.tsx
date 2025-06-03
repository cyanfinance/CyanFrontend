import { useState, useEffect } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

interface GoldItem {
  description: string;
  grossWeight: number;
  netWeight: number;
}

interface Loan {
  _id: string;
  customerId: string;
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
  createdAt: string;
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
  onRepay: (amount: number, paymentMethod: string, transactionId?: string) => Promise<void>;
}

const RepaymentModal: React.FC<RepaymentModalProps> = ({ loan: _loan, onClose, onRepay }) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('handcash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate transaction ID for online payments
      if (paymentMethod === 'online' && !transactionId.trim()) {
        throw new Error('Transaction ID is required for online payments');
      }

      await onRepay(amount, paymentMethod, paymentMethod === 'online' ? transactionId : undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process repayment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Repay Loan</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              required
            />
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
              disabled={loading}
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
  const { token: rawToken, user } = useAuth();
  const token = rawToken || '';
  const [search, setSearch] = useState('');

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
    }
  };

  const calculateLoanDetails = (data: Partial<LoanFormData>) => {
    const principal = data.loanAmount || formData.loanAmount;
    const ratePerMonth = (data.interestRate || formData.interestRate) / 100;
    const months = data.duration || formData.duration;

    if (principal > 0 && ratePerMonth > 0 && months > 0) {
      // Monthly payment formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
      const monthlyPayment = (principal * ratePerMonth * Math.pow(1 + ratePerMonth, months)) /
                            (Math.pow(1 + ratePerMonth, months) - 1);
      // Total amount is monthly payment times number of months
      const totalAmount = monthlyPayment * months;

      return {
        monthlyPayment: Math.round(monthlyPayment),
        totalAmount: Math.round(totalAmount)
      };
    }
    return { monthlyPayment: 0, totalAmount: 0 };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
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
      const newValue = name === 'interestRate' || name === 'loanAmount' || name === 'duration'
        ? parseFloat(value) || 0
        : value;

      setFormData(prev => {
        const updatedData = {
          ...prev,
          [name]: newValue
        };

        // Calculate monthly payment and total amount if relevant fields change
        if (name === 'interestRate' || name === 'loanAmount' || name === 'duration') {
          const { monthlyPayment, totalAmount } = calculateLoanDetails(updatedData);
          updatedData.monthlyPayment = monthlyPayment;
          updatedData.totalAmount = totalAmount;
        }

        return updatedData;
      });
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate Aadhar number
      if (!/^\d{12}$/.test(formData.aadharNumber)) {
        throw new Error('Aadhar number must be exactly 12 digits');
      }

      // Validate required fields
      if (!formData.aadharNumber || !formData.name || !formData.email || !formData.primaryMobile ||
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
        customerId: formData.aadharNumber,
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

      console.log('Sending loan request with data:', JSON.stringify(requestData, null, 2));

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

  const handleRepay = async (amount: number, paymentMethod: string, transactionId?: string) => {
    if (!selectedLoan) return;
    const response = await fetch(`${API_URL}/loans/${selectedLoan._id}/repay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ amount, paymentMethod, transactionId })
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
    return (
    loan.name.toLowerCase().includes(search.toLowerCase()) ||
    loan.email.toLowerCase().includes(search.toLowerCase()) ||
    loan.primaryMobile.includes(search) ||
    (loan.customerId && loan.customerId.toString().includes(search)) ||
    formatCurrency(loan.amount).includes(search)
  );
  });

  // Count loans by status
  const activeLoansCount = loans.filter(loan => loan.status === 'active').length;
  const closedLoansCount = loans.filter(loan => loan.status === 'closed').length;

  return (
    <div className="flex h-screen bg-gray-100">
      <EmployeeSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Employee Dashboard</h1>
            <button
              onClick={() => setShowLoanForm(!showLoanForm)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
            >
              {showLoanForm ? 'Close Form' : 'Add New Loan'}
            </button>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-full ${
                statusFilter === 'all'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              All Loans ({loans.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-full ${
                statusFilter === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Active Loans ({activeLoansCount})
            </button>
            <button
              onClick={() => setStatusFilter('closed')}
              className={`px-4 py-2 rounded-full ${
                statusFilter === 'closed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Closed Loans ({closedLoansCount})
            </button>
          </div>

          {showLoanForm && (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Personal Information</h2>
                  <input
                    type="text"
                    name="aadharNumber"
                    value={formData.aadharNumber}
                    onChange={handleInputChange}
                    placeholder="Aadhar Number"
                    className="w-full p-2 border rounded"
                    required
                  />
                  {checkingAadhar && (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                      <CircularProgress size={24} />
                    </div>
                  )}
                  {customerDetails && (
                    <Alert severity="info" style={{ margin: '10px 0' }}>
                      <strong>Existing Customer Found:</strong><br />
                      Name: {customerDetails.name}<br />
                      {/* Customer ID: {customerDetails.customerId}<br /> */}
                      Mobile: {customerDetails.primaryMobile}<br />
                      {customerDetails.secondaryMobile && (<span>Secondary Mobile: {customerDetails.secondaryMobile}<br /></span>)}
                      {customerDetails.emergencyContact?.mobile && (<span>Emergency Contact: {customerDetails.emergencyContact.mobile}<br /></span>)}
                      {customerDetails.emergencyContact?.relation && (<span>Relation: {customerDetails.emergencyContact.relation}<br /></span>)}
                      Email: {customerDetails.email}
                    </Alert>
                  )}
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    className="w-full p-2 border rounded"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Contact Information</h2>
                  <input
                    type="tel"
                    name="primaryMobile"
                    value={formData.primaryMobile}
                    onChange={handleInputChange}
                    placeholder="Primary Mobile Number"
                    className="w-full p-2 border rounded"
                    required
                  />
                  <input
                    type="tel"
                    name="secondaryMobile"
                    value={formData.secondaryMobile}
                    onChange={handleInputChange}
                    placeholder="Secondary Mobile Number"
                    className="w-full p-2 border rounded"
                    required
                  />
                  <input
                    type="tel"
                    name="emergencyContact.mobile"
                    value={formData.emergencyContact.mobile}
                    onChange={handleInputChange}
                    placeholder="Emergency Contact Number"
                    className="w-full p-2 border rounded"
                    required
                  />
                  <input
                    type="text"
                    name="emergencyContact.relation"
                    value={formData.emergencyContact.relation}
                    onChange={handleInputChange}
                    placeholder="Relation with Emergency Contact"
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Address Information</h2>
                <textarea
                  name="presentAddress"
                  value={formData.presentAddress}
                  onChange={handleInputChange}
                  placeholder="Present Address"
                  className="w-full p-2 border rounded"
                  required
                />
                <textarea
                  name="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={handleInputChange}
                  placeholder="Permanent Address"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {/* Gold Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Gold Items</h2>
                  <button
                    type="button"
                    onClick={addGoldItem}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Add Item
                  </button>
                </div>
                {formData.goldItems.map((item, index) => (
                  <div key={index} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Item Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleGoldItemChange(index, 'description', e.target.value)}
                          placeholder="Enter item description"
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Gross Weight (in grams)
                          </label>
                          <input
                            type="number"
                            value={item.grossWeight}
                            onChange={(e) => handleGoldItemChange(index, 'grossWeight', e.target.value)}
                            placeholder="Total weight with impurities"
                            className="w-full p-2 border rounded"
                            required
                            min="0"
                            step="0.01"
                          />
                          <p className="text-xs text-gray-500">Total weight including impurities</p>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Net Weight (in grams)
                          </label>
                          <input
                            type="number"
                            value={item.netWeight}
                            onChange={(e) => handleGoldItemChange(index, 'netWeight', e.target.value)}
                            placeholder="Pure gold weight"
                            className="w-full p-2 border rounded"
                            required
                            min="0"
                            step="0.01"
                          />
                          <p className="text-xs text-gray-500">Actual gold weight (must be less than gross weight)</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeGoldItem(index)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        disabled={formData.goldItems.length === 1}
                      >
                        Remove Item
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Loan Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Loan Details</h2>
                  
                  <div className="space-y-1">
                    <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700">
                      Interest Rate (% per year)
                    </label>
                    <input
                      id="interestRate"
                      type="number"
                      name="interestRate"
                      value={formData.interestRate}
                      onChange={handleInputChange}
                      placeholder="Enter annual interest rate"
                      className="w-full p-2 border rounded"
                      required
                      min="0"
                      step="0.01"
                    />
                    <p className="text-sm text-gray-500">Annual interest rate as a percentage (e.g., 12 for 12% per year)</p>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700">
                      Loan Amount (₹)
                    </label>
                    <input
                      id="loanAmount"
                      type="number"
                      name="loanAmount"
                      value={formData.loanAmount}
                      onChange={handleInputChange}
                      placeholder="Enter loan amount"
                      className="w-full p-2 border rounded"
                      required
                      min="100"
                      step="1"
                    />
                    <p className="text-sm text-gray-500">Principal amount to be disbursed to the customer (minimum ₹100)</p>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                      Loan Duration
                    </label>
                    <input
                      id="duration"
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      placeholder="Enter number of months"
                      className="w-full p-2 border rounded"
                      required
                      min="1"
                      step="1"
                    />
                    <p className="text-sm text-gray-500">Loan tenure in months (minimum 1 month)</p>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="monthlyPayment" className="block text-sm font-medium text-gray-700">
                      Monthly Payment (₹)
                    </label>
                    <div className="relative">
                      <input
                        id="monthlyPayment"
                        type="number"
                        name="monthlyPayment"
                        value={formData.monthlyPayment}
                        className="w-full p-2 border rounded bg-gray-100"
                        placeholder="Monthly payment will be calculated automatically"
                        readOnly
                      />
                      <span className="absolute right-3 top-2 text-gray-500 text-sm">Auto-calculated</span>
                    </div>
                    <p className="text-sm text-gray-500">Monthly installment amount to be paid by the customer</p>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700">
                      Total Amount to be Paid (₹)
                    </label>
                    <div className="relative">
                      <input
                        id="totalAmount"
                        type="number"
                        name="totalAmount"
                        value={formData.totalAmount}
                        className="w-full p-2 border rounded bg-gray-100"
                        placeholder="Total amount will be calculated automatically"
                        readOnly
                      />
                      <span className="absolute right-3 top-2 text-gray-500 text-sm">Auto-calculated</span>
                    </div>
                    <p className="text-sm text-gray-500">Total amount including interest to be repaid by the customer</p>
                  </div>

                  <div className="mt-2 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-600">
                      <strong>Note:</strong> The monthly payment and total amount are calculated using compound interest, 
                      with interest being charged monthly. The interest rate you enter is the <b>annual rate</b> (not monthly rate).
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded"
              >
                Create Loan
              </button>
            </form>
          )}

          {/* Search Input */}
          <div className="flex justify-end mb-4">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, mobile, customer ID, or amount"
              className="p-2 border rounded w-80"
            />
          </div>

          {/* Loans Table */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Loans</h2>
            
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLoans.map((loan) => (
                      <tr key={loan._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(loan.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{loan.name}</div>
                          <div className="text-sm text-gray-500">{loan.customerId}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{loan.primaryMobile}</div>
                          <div className="text-sm text-gray-500">{loan.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            Amount: {formatCurrency(loan.amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Term: {loan.term} months | Interest: {loan.interestRate}%
                          </div>
                          <div className="text-sm text-gray-500">
                            Monthly: {formatCurrency(loan.monthlyPayment)}
                          </div>
                          <div className="text-sm text-green-700">
                            Total Paid: {formatCurrency(loan.totalPaid || 0)}
                          </div>
                          <div className="text-sm text-red-700">
                            To Be Paid: {formatCurrency((loan.totalPayment || 0) - (loan.totalPaid || 0))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200 text-sm font-medium">
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
                        </td>
                      </tr>
                    ))}
                    {filteredLoans.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          No loans found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
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

export default  EmployeeDashboard;
