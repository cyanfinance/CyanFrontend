import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import Logo from '../../components/Logo';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  IconButton,
  Collapse,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { Edit as EditIcon, KeyboardArrowDown, KeyboardArrowUp, Print as PrintIcon } from '@mui/icons-material';
import { RepaymentModal } from './dashboard';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import Navbar from '../../components/Navbar';
import ReactDOMServer from 'react-dom/server';
import { fetchEarlyRepaymentDetails } from '../../utils/api';
import PhotoGallery from '../../components/PhotoGallery';
import LoanPrintout from '../../components/LoanPrintout';

interface GoldItem {
  description: string;
  grossWeight: number;
  netWeight: number;
}

interface Loan {
  _id: string;
  loanId: string;
  customerId: string | { _id: string; name: string; email: string; primaryMobile: string; aadharNumber: string };
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
  status: 'approved' | 'rejected' | 'active' | 'closed';
  monthlyPayment: number;
  totalPayment: number;
  totalPaid: number;
  remainingBalance: number;
  createdAt: string;
  depositedBank: string;
  depositedAccountNumber: string;
  depositedAccountName: string;
  depositedIfscCode: string;
  renewalDate: string;
  bankMobileNumber: string;
  bankLoanAmount: number;
  payments?: any[];
  createdBy?: {
    name: string;
    email: string;
    role: string;
  };
}

interface EditableLoan extends Loan {
  depositedBank: string;
  renewalDate: string;
  bankMobileNumber: string;
  bankLoanAmount: number;
}

interface PaymentHistoryModalProps {
  loan: Loan;
  onClose: () => void;
}

const PaymentReceipt: React.FC<{
  payment: any;
  loan: Loan;
  createdBy?: { name: string; email: string; role: string };
}> = ({ payment, loan, createdBy }) => {
  // Print handler
  React.useEffect(() => {
    setTimeout(() => window.print(), 300);
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'Arial, sans-serif', padding: 32 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Logo style={{ marginBottom: 8 }} size="medium" />
        <h2 style={{ fontWeight: 700, fontSize: 28, color: '#b58900', marginBottom: 0 }}>Payment Receipt</h2>
        <div style={{ fontSize: 14, color: '#555' }}>
          Cyan Finance<br />
          BK Towers, Akkayyapalem, Visakhapatnam, Andhra Pradesh-530016.<br />
          Phone: +91-9700049444<br />
          Email: support@cyanfinance.in
        </div>
      </div>
      <div style={{ marginBottom: 16, fontSize: 15 }}>
        <div><b>Date:</b> {new Date(payment.date || payment.createdAt).toLocaleString('en-IN')}</div>
        <div><b>Receipt No:</b> {typeof loan.customerId === 'object' && loan.customerId?.aadharNumber ? loan.customerId.aadharNumber : (typeof loan.customerId === 'string' ? loan.customerId : loan._id)}</div>
        <div><b>Customer Name:</b> {loan.name}</div>
        <div><b>Customer Email:</b> {loan.email}</div>
        <div><b>Customer Mobile:</b> {loan.primaryMobile}</div>
      </div>
      <div style={{ marginBottom: 16, fontSize: 15 }}>
        <b>Payment Details:</b>
        <div>Payment Amount: <b>INR {payment.amount}</b></div>
        <div>Total Paid: <b>INR {loan.totalPaid}</b></div>
        <div>Total Loan Amount: <b>INR {loan.amount}</b></div>
        <div>To Be Paid: <b>INR {Math.max(0, (loan.totalPayment || loan.amount) - (loan.totalPaid || 0))}</b></div>
        <div>Payment Method: <b>{payment.method}</b></div>
        {payment.transactionId && <div>Transaction ID: <b>{payment.transactionId}</b></div>}
      </div>
      <div style={{ marginBottom: 16, fontSize: 15 }}>
        <b>Processed By:</b>
        <div>Name: <b>{createdBy?.name || '-'}</b></div>
        <div>Email: <b>{createdBy?.email || '-'}</b></div>
        <div>Role/ID: <b>{createdBy?.role || '-'}</b></div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 32, fontWeight: 500, fontSize: 16, color: '#388e3c' }}>
        Thank you for your payment!
      </div>
    </div>
  );
};

const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({ loan, onClose }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/loans/${loan._id}/payments`, {
          headers: {
            'x-auth-token': token || ''
          }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch payment history');
        }
        setPayments(data.data);
      } catch (err) {
        console.error('Error fetching payment history:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch payment history');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, [loan._id, token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">💳</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">Payment History</h2>
              <p className="text-blue-100 text-xs">Loan ID: {loan.loanId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-all duration-200 p-2 hover:bg-white/10 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Loan Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">👤</span>
                </div>
            <div>
                  <p className="text-blue-600 text-xs font-medium">Customer</p>
                  <p className="text-blue-900 font-bold text-sm">{loan.name}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">💰</span>
                </div>
                <div>
                  <p className="text-green-600 text-xs font-medium">Loan Amount</p>
                  <p className="text-green-900 font-bold text-sm">{formatCurrency(loan.amount)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">✅</span>
                </div>
                <div>
                  <p className="text-emerald-600 text-xs font-medium">Total Paid</p>
                  <p className="text-emerald-900 font-bold text-sm">{formatCurrency(loan.totalPaid || 0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">⚖️</span>
                </div>
                <div>
                  <p className="text-red-600 text-xs font-medium">Remaining</p>
                  <p className="text-red-900 font-bold text-sm">{formatCurrency(loan.status === 'closed' && loan.remainingBalance === 0 ? 0 : (loan.totalPayment || 0) - (loan.totalPaid || 0))}</p>
                </div>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No payment history available
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-sm">📋</span>
                  Payment Transactions
                </h3>
                <p className="text-xs text-gray-600 mt-1">{payments.length} payment{payments.length !== 1 ? 's' : ''} found</p>
              </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction ID</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Entered By</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                  {payments.map((payment) => {
                    const isHandcash = payment.method === 'handcash';
                    const isSuccess = isHandcash || payment.status === 'success';
                    const isPendingOnline = payment.method === 'online' && payment.status !== 'success';
                    return (
                      <tr key={payment._id || payment.date} className="hover:bg-gray-50 transition-all duration-200 border-b border-gray-100">
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                              <span className="text-blue-600 text-xs">📅</span>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-900">
                                {new Date(payment.date).toLocaleDateString('en-IN')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(payment.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                              <span className="text-green-600 text-xs">₹</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(payment.amount)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${payment.method === 'handcash' ? 'bg-orange-400' : 'bg-blue-400'}`}></span>
                            <span className="text-xs font-medium text-gray-700 capitalize">
                          {payment.method}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className="text-xs text-gray-500 font-mono">
                          {payment.transactionId || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 text-xs font-bold">
                                {(payment.enteredBy?.name || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs font-medium text-gray-700">
                          {payment.enteredBy?.name || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isSuccess ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                              isSuccess ? 'bg-green-400' : 'bg-yellow-400'
                            }`}></span>
                            {isSuccess ? 'Success' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                          {isPendingOnline && (
                            <button
                              className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-medium rounded shadow-sm hover:shadow-md transition-all duration-200"
                              onClick={async () => {
                                const token = localStorage.getItem('token');
                                const response = await fetch(
                                  `${API_URL}/loans/${loan._id}/payments/${payment._id}/approve`,
                                  {
                                    method: 'PATCH',
                                    headers: { 'x-auth-token': token || '' }
                                  }
                                );
                                if (!response.ok) {
                                  alert('Failed to approve payment');
                                  return;
                                }
                                alert('Payment approved and customer notified.');
                                // Refresh payment list
                                const refreshed = await fetch(`${API_URL}/loans/${loan._id}/payments`, {
                                  headers: { 'x-auth-token': token || '' }
                                });
                                const data = await refreshed.json();
                                setPayments(data.data);
                              }}
                            >
                              <span className="mr-1">✅</span>
                              Approve
                            </button>
                          )}
                          <button
                            className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-medium rounded shadow-sm hover:shadow-md transition-all duration-200"
                            onClick={async () => {
                              try {
                                // Import the frontend PDF generator
                                const { previewReceipt } = await import('../../utils/simplePdfGenerator');
                                
                                // Calculate the correct values for this specific payment
                                // Always calculate fresh to avoid using old negative values from payment records
                                // If customer paid more than principal, use payment amount as total loan amount (includes interest)
                                const totalLoanAmount = (loan.totalPaid >= loan.amount) ? loan.totalPaid : (loan.totalPayment || loan.amount);
                                const remainingBalanceAtTime = Math.max(0, totalLoanAmount - (loan.totalPaid || 0));
                                const totalPaidAtTime = loan.totalPaid || 0;
                                
                                const receiptData = {
                                  customerName: loan.name || 'Customer',
                                  paymentDate: payment.date,
                                  paymentAmount: payment.amount,
                                  totalLoanAmount: totalLoanAmount,
                                  totalPaid: totalPaidAtTime,
                                  remainingBalance: remainingBalanceAtTime,
                                  loanId: loan.loanId,
                                  receiptNumber: `${loan.loanId}_${payment.installmentNumber}`
                                };
                                
                                // Generate preview and open in new tab
                                const pdfDataUri = await previewReceipt(receiptData);
                                const newWindow = window.open();
                                if (newWindow) {
                                  newWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>Payment Receipt - ${receiptData.receiptNumber}</title>
                                        <style>
                                          body { margin: 0; padding: 20px; background: #f5f5f5; }
                                          .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                                          .header { padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
                                          .actions { display: flex; gap: 10px; }
                                          .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; }
                                          .btn-primary { background: #3b82f6; color: white; }
                                          .btn-secondary { background: #6b7280; color: white; }
                                          .btn:hover { opacity: 0.9; }
                                          iframe { width: 100%; height: 80vh; border: none; }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="container">
                                          <div class="header">
                                            <h2>Payment Receipt Preview</h2>
                                            <div class="actions">
                                              <button class="btn btn-secondary" onclick="window.close()">Close</button>
                                              <button class="btn btn-primary" onclick="downloadReceipt()">Download PDF</button>
                                            </div>
                                          </div>
                                          <iframe src="${pdfDataUri}"></iframe>
                                        </div>
                                        <script>
                                          function downloadReceipt() {
                                            const link = document.createElement('a');
                                            link.href = '${pdfDataUri}';
                                            link.download = 'payment_receipt_${receiptData.receiptNumber}.pdf';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                          }
                                        </script>
                                      </body>
                                    </html>
                                  `);
                                  newWindow.document.close();
                                }
                              } catch (error) {
                                console.error('Error generating receipt:', error);
                                alert('Failed to generate receipt');
                              }
                            }}
                          >
                            <span className="mr-1">📄</span>
                            Receipt
                          </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LoansPage = () => {
  const { user, token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<EditableLoan | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [repayLoan, setRepayLoan] = useState<Loan | null>(null);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [deleteLoan, setDeleteLoan] = useState<Loan | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLoanAgreement, setShowLoanAgreement] = useState(false);
  const [selectedLoanForAgreement, setSelectedLoanForAgreement] = useState<Loan | null>(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [selectedLoanForRenewal, setSelectedLoanForRenewal] = useState<Loan | null>(null);
  const [renewalAmount, setRenewalAmount] = useState<number>(0);
  const [renewalInterestRate, setRenewalInterestRate] = useState<number>(0);
  const [renewalTerm, setRenewalTerm] = useState<number>(6);
  const [renewalLoading, setRenewalLoading] = useState(false);
  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      if (!token) {
        throw new Error('No authentication token found');
      }
      const url = user?.role === 'employee'
        ? `${API_URL}/employee/loans`
        : `${API_URL}/admin/loans`;
      const response = await fetch(url, {
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

  const handleEditClick = (loan: Loan) => {
    setSelectedLoan({
      ...loan,
      depositedBank: loan.depositedBank || '',
      renewalDate: loan.renewalDate || '',
      bankMobileNumber: loan.bankMobileNumber || '',
      bankLoanAmount: loan.bankLoanAmount || 0,
      goldItems: loan.goldItems.map(item => ({
        description: item.description || '',
        grossWeight: item.grossWeight || 0,
        netWeight: item.netWeight || 0
      }))
    });
    setEditDialogOpen(true);
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
      const response = await fetch(`${API_URL}/admin/loans/${selectedLoanForRenewal._id}/renew`, {
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

  // Transform loan data to match LoanPrintout interface
  const transformLoanForPrintout = (loan: Loan) => {
    // Handle customerId which might be an object or string
    const customerId = loan.customerId;
    const aadharNumber = typeof customerId === 'object' 
      ? customerId.aadharNumber 
      : customerId;

    return {
      _id: loan._id,
      loanId: loan.loanId,
      name: loan.name,
      aadharNumber: aadharNumber || '',
      email: loan.email,
      primaryMobile: loan.primaryMobile,
      secondaryMobile: loan.secondaryMobile,
      emergencyContact: {
        mobile: loan.emergencyContact.mobile,
        relation: loan.emergencyContact.relation,
        _id: loan._id // Use loan ID as fallback
      },
      presentAddress: loan.presentAddress,
      permanentAddress: loan.permanentAddress,
      amount: loan.amount,
      interestRate: loan.interestRate,
      term: loan.term,
      monthlyPayment: loan.monthlyPayment,
      totalPayment: loan.totalPayment,
      remainingBalance: loan.remainingBalance,
      dailyInterestRate: (loan.interestRate / 100) / 365, // Calculate daily interest rate
      goldItems: loan.goldItems,
      createdAt: loan.createdAt,
      createdBy: {
        name: loan.createdBy?.name || 'System',
        email: loan.createdBy?.email || 'system@cyanfinance.in'
      }
    };
  };

  const handleSaveEdit = async () => {
    if (!selectedLoan) return;

    try {
      if (!token) {
        throw new Error('No authentication token found');
      }
      // Validate gold items before sending
      const invalidGoldItems = selectedLoan.goldItems.filter(
        item => !item.description || item.grossWeight <= 0 || item.netWeight <= 0
      );
      if (invalidGoldItems.length > 0) {
        throw new Error('All gold items must have a description and valid weights');
      }
      const endpoint = user?.role === 'employee'
        ? `${API_URL}/employee/loans/${selectedLoan._id}`
        : `${API_URL}/admin/loans/${selectedLoan._id}`;
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          goldItems: selectedLoan.goldItems,
          depositedBank: selectedLoan.depositedBank,
          renewalDate: selectedLoan.renewalDate,
          bankMobileNumber: selectedLoan.bankMobileNumber,
          bankLoanAmount: selectedLoan.bankLoanAmount
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update loan');
      }
      // Refresh loans list
      await fetchLoans();
      setEditDialogOpen(false);
      setSelectedLoan(null);
      // Show success message
      alert('Loan updated successfully');
    } catch (err) {
      console.error('Error updating loan:', err);
      alert(err instanceof Error ? err.message : 'Failed to update loan');
    }
  };

  const handleGoldItemChange = (index: number, field: keyof GoldItem, value: string) => {
    if (!selectedLoan) return;

    const updatedGoldItems = selectedLoan.goldItems.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          [field]: field === 'description' ? value : parseFloat(value) || 0
        };
      }
      return item;
    });

    setSelectedLoan({
      ...selectedLoan,
      goldItems: updatedGoldItems
    });
  };

  const addGoldItem = () => {
    if (!selectedLoan) return;

    setSelectedLoan({
      ...selectedLoan,
      goldItems: [
        ...selectedLoan.goldItems,
        { description: '', grossWeight: 0, netWeight: 0 }
      ]
    });
  };

  const removeGoldItem = (index: number) => {
    if (!selectedLoan) return;

    setSelectedLoan({
      ...selectedLoan,
      goldItems: selectedLoan.goldItems.filter((_, i) => i !== index)
    });
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
      approved: 'success.light',
      rejected: 'error.light',
      active: 'info.light',
      closed: 'text.disabled'
    };
    return colors[status];
  };

  // Filter loans based on search
  const filteredLoans = loans.filter((loan) => {
    const query = search.toLowerCase();
    const customerIdStr = typeof loan.customerId === 'object' && loan.customerId?.aadharNumber
      ? loan.customerId.aadharNumber 
      : (typeof loan.customerId === 'string' ? loan.customerId : '');
    return (
      loan.name.toLowerCase().includes(query) ||
      loan.primaryMobile.includes(query) ||
      (loan.secondaryMobile && loan.secondaryMobile.includes(query)) ||
      customerIdStr.includes(query)
    );
  });

  const handleRepay = async (amount: number, paymentMethod: string, transactionId?: string, bankName?: string, paymentType?: string) => {
    if (!repayLoan) return;
    
    // console.log('Processing repayment:', { amount, paymentMethod, transactionId, bankName, paymentType });
    
    const response = await fetch(`${API_URL}/loans/${repayLoan._id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token || ''
      },
      body: JSON.stringify({ amount, paymentMethod, transactionId, bankName, paymentType })
    });
    
    const data = await response.json();
    if (!response.ok) {
      console.error('Payment failed:', data);
      throw new Error(data.message || data.errors?.[0]?.msg || 'Failed to process repayment');
    }
    
    // console.log('Payment successful:', data);
    await fetchLoans();
  };

  const handleDeleteLoan = async () => {
    if (!deleteLoan || !token) return;
    
    // console.log('Delete loan request:', {
    //   loanId: deleteLoan._id,
    //   token: token ? 'Present' : 'Missing',
    //   userRole: user?.role
    // });
    
    try {
      const response = await fetch(`${API_URL}/loans/${deleteLoan._id}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token
        }
      });
      
      // console.log('Delete response status:', response.status);
      const data = await response.json();
      // console.log('Delete response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete loan');
      }
      
      const paymentInfo = data.hadPayments ? ` (had ${data.paymentCount} payment(s))` : '';
      alert(`Loan ${deleteLoan.loanId} deleted successfully${paymentInfo}`);
      setShowDeleteDialog(false);
      setDeleteLoan(null);
      await fetchLoans();
    } catch (error) {
      console.error('Delete failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete loan');
    }
  };

  // Add this CSS block at the top or in a <style> tag if using CSS-in-JS
  const tableContainerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar isSidebarPage={true} sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
      <div className="flex relative">
        {user?.role === 'employee' ? (
          <EmployeeSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
        ) : (
          <AdminSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
        )}
        
        <main className={`flex-1 p-6 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'ml-0'} min-h-screen pt-20`}>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-blue-100/50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-yellow-800 mb-1 flex items-center gap-2">
                  <span>💳</span> Loans Management
                </h1>
                <p className="text-gray-600 text-sm">View, manage, and track all loans in one place.</p>
              </div>
              <div className="relative w-full md:w-80 mt-3 md:mt-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by Name, Mobile, or Aadhar"
                  className="pl-8 pr-4 py-2 w-full rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition text-gray-700 shadow-sm text-sm"
                />
              </div>
            </div>
            {loading && (
              <div className="flex justify-center">
                <CircularProgress />
              </div>
            )}
            {error && (
              <Alert severity="error" className="mb-4">
                {error}
              </Alert>
            )}
            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="min-w-full rounded-xl border border-blue-100 shadow-sm">
                  <thead className="bg-gradient-to-r from-blue-100 via-cyan-50 to-white">
                    <tr>
                      <th className="w-8"></th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-800 uppercase tracking-wider w-24">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-800 uppercase tracking-wider w-48">Customer Details</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-800 uppercase tracking-wider w-64">Loan Details</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-800 uppercase tracking-wider w-24">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-800 uppercase tracking-wider w-40">Created By</th>
                      <th className="px-2 py-2 text-left text-xs font-bold text-blue-800 uppercase tracking-wider w-28 sticky right-0 bg-gradient-to-r from-blue-100 via-cyan-50 to-white z-10">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoans.map((loan, idx) => (
                      <React.Fragment key={loan._id}>
                        <tr className={
                          (idx % 2 === 0 ? "bg-white/80" : "bg-blue-50/60") +
                          " hover:bg-blue-100/60 transition group border-b border-blue-100"
                        }>
                          <td className="px-2">
                            <IconButton
                              size="small"
                              onClick={() => setExpandedRow(expandedRow === loan._id ? null : loan._id)}
                            >
                              {expandedRow === loan._id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                            </IconButton>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">{formatDate(loan.createdAt)}</td>
                          <td className="px-3 py-3">
                            <div className="text-sm font-bold text-yellow-800">{loan.name}</div>
                            <div className="text-xs text-gray-500">{loan.primaryMobile}</div>
                            <div className="text-xs text-gray-500 truncate max-w-40">{loan.email}</div>
                          </td>
                          <td className="px-3 py-3 align-top">
                            <div className="text-sm text-cyan-800 font-semibold">
                              {formatCurrency(loan.amount)} | {loan.term}m @ {Number(loan.interestRate)}%
                            </div>
                            <div className="text-xs mt-1">
                              <span className="text-green-700">Paid: {formatCurrency(loan.totalPaid || 0)}</span>
                              <span className="mx-1">|</span>
                              <span className="text-red-600 font-bold">To Pay: {formatCurrency(loan.remainingBalance || 0)}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm bg-blue-100 text-blue-800">{loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}</span>
                          </td>
                          <td className="px-3 py-3">
                            {loan.createdBy ? (
                              <>
                                <div className="text-sm font-bold text-gray-900">{loan.createdBy.name}</div>
                                <div className="text-xs text-gray-500 truncate max-w-32">{loan.createdBy.email}</div>
                                <div className="text-xs text-gray-500">{loan.createdBy.role}</div>
                              </>
                            ) : (
                              <div className="text-xs text-gray-400">N/A</div>
                            )}
                          </td>
                          <td className={`px-2 py-3 whitespace-nowrap flex flex-col gap-1 items-start sticky right-0 z-10 ${idx % 2 === 0 ? 'bg-white/80' : 'bg-blue-50/60'}`}>
                            <button
                              onClick={() => handleEditClick(loan)}
                              className="bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700 text-white px-2 py-1 rounded-lg font-medium flex items-center gap-1 shadow group-hover:scale-105 transition text-xs"
                            >
                              <span>✏️</span> Edit
                            </button>
                            <button
                              onClick={() => handlePrintAgreement(loan)}
                              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-2 py-1 rounded-lg font-medium flex items-center gap-1 shadow group-hover:scale-105 transition text-xs"
                            >
                              <span>📄</span> Agreement
                            </button>
                            {loan.status === 'closed' && (
                              <button
                                onClick={() => handleRenewLoan(loan)}
                                className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-2 py-1 rounded-lg font-medium flex items-center gap-1 shadow group-hover:scale-105 transition text-xs"
                              >
                                <span>🔄</span> Renew
                              </button>
                            )}
                            {loan.status === 'active' && (
                              <button
                                onClick={() => {
                                  setRepayLoan(loan);
                                  setShowRepaymentModal(true);
                                }}
                                className="text-white px-2 py-1 rounded-lg font-medium flex items-center gap-1 shadow group-hover:scale-105 transition text-xs"
                                style={{ backgroundColor: '#FFE100', color: '#000000' }}
                                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#FFD700'}
                                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#FFE100'}
                              >
                                <span>💸</span> Repay
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedLoan({
                                  ...loan,
                                  depositedBank: loan.depositedBank || '',
                                  renewalDate: loan.renewalDate || '',
                                  bankMobileNumber: loan.bankMobileNumber || '',
                                  bankLoanAmount: loan.bankLoanAmount || 0
                                });
                                setShowPaymentHistoryModal(true);
                              }}
                              className="bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white px-2 py-1 rounded-lg font-medium flex items-center gap-1 shadow group-hover:scale-105 transition text-xs"
                            >
                              <span>📜</span> History
                            </button>
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => {
                                  setDeleteLoan(loan);
                                  setShowDeleteDialog(true);
                                }}
                                className="bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white px-2 py-1 rounded-lg font-medium flex items-center gap-1 shadow group-hover:scale-105 transition text-xs"
                              >
                                <span>🗑️</span> Delete
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandedRow === loan._id && (
                          <tr className="bg-cyan-50 border-t border-blue-100">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-1 text-yellow-700"><span>🪙</span> Gold Items</h4>
                                    <div className="text-sm">
                                      {loan.goldItems.map((item, index) => (
                                        <div key={item.description + index} className="mb-2">
                                          <p>Item {index + 1}: <span className="font-semibold">{item.description}</span></p>
                                          <p className="ml-4">Gross Weight: {item.grossWeight}g</p>
                                          <p className="ml-4">Net Weight: {item.netWeight}g</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    {loan.depositedBank && (
                                      <p className="text-sm">Deposited Bank: <span className="font-semibold">{loan.depositedBank}</span></p>
                                    )}
                                    {loan.renewalDate && (
                                      <p className="text-sm">Renewal Date: <span className="font-semibold">{formatDate(loan.renewalDate)}</span></p>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Photos Section */}
                                <div className="border-t border-blue-200 pt-4">
                                  <h4 className="font-semibold mb-4 flex items-center gap-1 text-blue-700"><span>📸</span> Gold Item Photos</h4>
                                  
                                  {loan.goldItems.map((item, index) => (
                                    <div key={`photos-${index}`} className="mb-6 bg-white rounded-lg p-4 border border-blue-100">
                                      <h5 className="font-medium text-gray-700 mb-3">
                                        {item.description} (Item {index + 1})
                                      </h5>
                                      <PhotoGallery
                                        loanId={loan._id}
                                        goldItemIndex={index}
                                        token={token || ''}
                                        className="max-w-full"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {filteredLoans.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-400">No loans found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Edit Dialog */}
          <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="lg" fullWidth>
            <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-3xl shadow-2xl p-0 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <span className="text-2xl">✏️</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Edit Loan Details</h2>
                      <p className="text-blue-100 text-sm">Modify loan information and gold items</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditDialogOpen(false)}
                    className="text-white hover:text-gray-200 transition-all duration-200 p-2 hover:bg-white/10 rounded-xl"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <DialogContent className="p-0 max-h-[70vh] overflow-y-auto">
                {selectedLoan && (
                  <div className="p-6 space-y-6">
                    {/* Loan Information Card */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 text-lg">💰</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Loan Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Loan Amount</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={`₹${selectedLoan.amount?.toLocaleString() || 0}`}
                                readOnly
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-medium"
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <span className="text-gray-400 text-sm">Read Only</span>
                              </div>
                            </div>
                          </div>
                          
                      {user?.role !== 'employee' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Deposited Bank</label>
                              <input
                                type="text"
                                value={selectedLoan.depositedBank || ''}
                            onChange={(e) => setSelectedLoan({ ...selectedLoan, depositedBank: e.target.value })}
                                placeholder="Enter bank name"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Loan ID</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={selectedLoan.loanId || ''}
                                readOnly
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-mono"
                              />
                            </div>
                          </div>
                          
                          {user?.role !== 'employee' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Renewal Date</label>
                              <input
                            type="date"
                            value={selectedLoan.renewalDate ? selectedLoan.renewalDate.split('T')[0] : ''}
                            onChange={(e) => setSelectedLoan({ ...selectedLoan, renewalDate: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      )}
                    </div>
                      </div>
                      
                      {/* Bank Information Section */}
                      {user?.role !== 'employee' && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <span className="text-green-600 text-lg">🏦</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Bank Information</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Mobile Number</label>
                              <input
                                type="tel"
                                value={selectedLoan.bankMobileNumber || ''}
                                onChange={(e) => setSelectedLoan({ ...selectedLoan, bankMobileNumber: e.target.value })}
                                placeholder="Enter bank mobile number"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Loan Amount</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                  type="number"
                                  value={selectedLoan.bankLoanAmount || ''}
                                  onChange={(e) => setSelectedLoan({ ...selectedLoan, bankLoanAmount: parseFloat(e.target.value) || 0 })}
                                  placeholder="Enter amount given by bank"
                                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Difference Calculation */}
                          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-blue-600 text-lg">📊</span>
                              <h4 className="text-sm font-semibold text-blue-800">Amount Difference</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="text-center">
                                <div className="text-gray-600">Customer Amount</div>
                                <div className="font-semibold text-gray-800">₹{selectedLoan.amount?.toLocaleString() || 0}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-600">Bank Amount</div>
                                <div className="font-semibold text-gray-800">₹{(selectedLoan.bankLoanAmount || 0).toLocaleString()}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-600">Difference</div>
                                <div className={`font-bold ${(selectedLoan.amount || 0) - (selectedLoan.bankLoanAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ₹{((selectedLoan.amount || 0) - (selectedLoan.bankLoanAmount || 0)).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-blue-600 text-center">
                              {((selectedLoan.amount || 0) - (selectedLoan.bankLoanAmount || 0)) >= 0 
                                ? 'Admin profit from this loan' 
                                : 'Admin loss from this loan'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Gold Items Card */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                            <span className="text-amber-600 text-lg">🪙</span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800">Gold Items</h3>
                          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">
                            {selectedLoan.goldItems.length} item{selectedLoan.goldItems.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <button
                          onClick={addGoldItem}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                        >
                          <span>+</span> Add Item
                        </button>
                      </div>

                      <div className="space-y-4">
                      {selectedLoan.goldItems.map((item, index) => (
                          <div key={index} className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                                  {index + 1}
                                </div>
                                <span className="font-semibold text-gray-700">Gold Item #{index + 1}</span>
                              </div>
                              <button
                              onClick={() => removeGoldItem(index)}
                              disabled={selectedLoan.goldItems.length === 1}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Remove this item"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                          </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <input
                                  type="text"
                            value={item.description}
                            onChange={(e) => handleGoldItemChange(index, 'description', e.target.value)}
                                  placeholder="e.g., Gold Chain, Ring, etc."
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Gross Weight (g)</label>
                                <input
                              type="number"
                              value={item.grossWeight}
                              onChange={(e) => handleGoldItemChange(index, 'grossWeight', e.target.value)}
                                  placeholder="0.00"
                                  step="0.01"
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Net Weight (g)</label>
                                <input
                              type="number"
                              value={item.netWeight}
                              onChange={(e) => handleGoldItemChange(index, 'netWeight', e.target.value)}
                                  placeholder="0.00"
                                  step="0.01"
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                />
                              </div>
                          </div>
                        </div>
                      ))}
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                <button
                  onClick={() => setEditDialogOpen(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  <span>💾</span>
                  Save Changes
                </button>
              </div>
            </div>
          </Dialog>

          {showRepaymentModal && repayLoan && (
            <RepaymentModal
              loan={repayLoan}
              onClose={() => {
                setShowRepaymentModal(false);
                setRepayLoan(null);
              }}
              onRepay={handleRepay}
            />
          )}

          {/* Add Payment History Modal */}
          {showPaymentHistoryModal && selectedLoan && (
            <PaymentHistoryModal
              loan={selectedLoan}
              onClose={() => {
                setShowPaymentHistoryModal(false);
                setSelectedLoan(null);
              }}
            />
          )}

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} maxWidth="sm" fullWidth>
            <div className="bg-white rounded-2xl shadow-2xl">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
        </div>
                  <div>
                    <h2 className="text-xl font-bold">Delete Loan</h2>
                    <p className="text-red-100 text-sm">This action cannot be undone</p>
      </div>
                </div>
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="text-white hover:text-gray-200 transition-all duration-200 p-2 hover:bg-white/10 rounded-xl"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-red-600 text-lg">🚨</span>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800">Warning</h3>
                  </div>
                  <p className="text-red-700 text-sm mb-3">
                    You are about to permanently delete loan <strong>{deleteLoan?.loanId}</strong>. 
                    This action cannot be undone and will remove all loan data from the system.
                  </p>
                  {deleteLoan && deleteLoan.payments && deleteLoan.payments.length > 0 && (
                    <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-orange-600 text-lg">⚠️</span>
                        <span className="text-orange-800 font-semibold text-sm">Payment Data Warning</span>
                      </div>
                      <p className="text-orange-700 text-sm">
                        This loan has <strong>{deleteLoan.payments.length} payment(s)</strong> totaling <strong>₹{formatCurrency(deleteLoan.totalPaid || 0)}</strong>. 
                        Deleting this loan will permanently remove all payment history and financial records.
                      </p>
                    </div>
                  )}
                </div>

                {deleteLoan && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Loan Details:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Customer:</span>
                        <span className="ml-2 font-medium">{deleteLoan.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Amount:</span>
                        <span className="ml-2 font-medium">{formatCurrency(deleteLoan.amount)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Term:</span>
                        <span className="ml-2 font-medium">{deleteLoan.term} months</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Interest Rate:</span>
                        <span className="ml-2 font-medium">{Number(deleteLoan.interestRate)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Paid:</span>
                        <span className="ml-2 font-medium text-green-600">{formatCurrency(deleteLoan.totalPaid || 0)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Payments:</span>
                        <span className="ml-2 font-medium">{deleteLoan.payments?.length || 0} transaction(s)</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className="ml-2 font-medium capitalize">{deleteLoan.status}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <span className="ml-2 font-medium">{new Date(deleteLoan.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteDialog(false)}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteLoan}
                    className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Delete Loan
                  </button>
                </div>
              </div>
            </div>
          </Dialog>
        </main>
      </div>
      
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

export default LoansPage; 