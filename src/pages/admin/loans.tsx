import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
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
import { Edit as EditIcon, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { RepaymentModal } from './dashboard';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config.ts';
import Navbar from '../../components/Navbar';
import ReactDOMServer from 'react-dom/server';
import { fetchEarlyRepaymentDetails } from '../../utils/api';

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
  status: 'approved' | 'rejected' | 'active' | 'closed';
  monthlyPayment: number;
  totalPayment: number;
  totalPaid: number;
  createdAt: string;
  depositedBank: string;
  depositedAccountNumber: string;
  depositedAccountName: string;
  depositedIfscCode: string;
  renewalDate: string;
  createdBy?: {
    name: string;
    email: string;
    role: string;
  };
}

interface EditableLoan extends Loan {
  depositedBank: string;
  renewalDate: string;
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
        <img src="/logo192.png" alt="Cyan Finance Logo" style={{ height: 48, marginBottom: 8 }} />
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
        <div><b>Receipt No:</b> {loan.customerId || loan._id}</div>
        <div><b>Customer Name:</b> {loan.name}</div>
        <div><b>Customer Email:</b> {loan.email}</div>
        <div><b>Customer Mobile:</b> {loan.primaryMobile}</div>
      </div>
      <div style={{ marginBottom: 16, fontSize: 15 }}>
        <b>Payment Details:</b>
        <div>Payment Amount: <b>INR {payment.amount}</b></div>
        <div>Total Paid: <b>INR {loan.totalPaid}</b></div>
        <div>Total Loan Amount: <b>INR {loan.amount}</b></div>
        <div>To Be Paid: <b>INR {loan.totalPayment - loan.totalPaid}</b></div>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-white rounded-2xl shadow-2xl p-0 w-full max-w-4xl max-h-[80vh] overflow-y-auto border border-blue-100">
        <div className="flex justify-between items-center px-8 pt-8 pb-4 border-b border-blue-100 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><span>💳</span> Payment History</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 text-2xl"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-8 py-6">
          <div className="mb-6 bg-white/80 rounded-xl shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border border-blue-50">
            <div>
              <h3 className="font-semibold text-blue-700 mb-2 flex items-center gap-1"><span>📄</span> Loan Details</h3>
              <div className="text-sm text-gray-700">Customer: <span className="font-bold text-blue-900">{loan.name}</span></div>
              <div className="text-sm text-gray-700">Amount: <span className="font-bold">{formatCurrency(loan.amount)}</span></div>
              <div className="text-sm text-green-700">Total Paid: <span className="font-bold">{formatCurrency(loan.totalPaid || 0)}</span></div>
              <div className="text-sm text-red-700">Remaining: <span className="font-bold">{formatCurrency((loan.totalPayment || 0) - (loan.totalPaid || 0))}</span></div>
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-100 rounded-xl bg-white/90 shadow">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Payment Method</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Entered By</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-50">
                  {payments.map((payment) => {
                    const isHandcash = payment.method === 'handcash';
                    const isSuccess = isHandcash || payment.status === 'success';
                    const isPendingOnline = payment.method === 'online' && payment.status !== 'success';
                    return (
                      <tr key={payment._id || payment.date} className="hover:bg-cyan-50 transition">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(payment.date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {payment.method}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {payment.transactionId || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {payment.enteredBy?.name || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            isSuccess ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {isSuccess ? 'Success' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap flex gap-2">
                          {isSuccess && (
                            <button
                              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white px-4 py-1 rounded-full font-bold flex items-center gap-2 shadow"
                              onClick={async () => {
                                const token = localStorage.getItem('token');
                                const response = await fetch(
                                  `${API_URL}/loans/${loan._id}/payments/${payment._id}/receipt`,
                                  {
                                    headers: { 'x-auth-token': token || '' }
                                  }
                                );
                                if (!response.ok) {
                                  alert('Failed to fetch receipt');
                                  return;
                                }
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                window.open(url, '_blank');
                              }}
                            >
                              <span>🖨️</span> Print Receipt
                            </button>
                          )}
                          {isPendingOnline && (
                            <button
                              className="bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white px-4 py-1 rounded-full font-bold flex items-center gap-2 shadow"
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
                              <span>✔️</span> Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
  const [earlyDueMap, setEarlyDueMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchLoans();
  }, []);

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
      goldItems: loan.goldItems.map(item => ({
        description: item.description || '',
        grossWeight: item.grossWeight || 0,
        netWeight: item.netWeight || 0
      }))
    });
    setEditDialogOpen(true);
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
          renewalDate: selectedLoan.renewalDate
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
    return (
      loan.name.toLowerCase().includes(query) ||
      loan.primaryMobile.includes(query) ||
      (loan.secondaryMobile && loan.secondaryMobile.includes(query)) ||
      loan.customerId.includes(query)
    );
  });

  const handleRepay = async (amount: number, paymentMethod: string, transactionId?: string, bankName?: string) => {
    if (!repayLoan) return;
    
    console.log('Processing repayment:', { amount, paymentMethod, transactionId, bankName });
    
    const response = await fetch(`${API_URL}/loans/${repayLoan._id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token || ''
      },
      body: JSON.stringify({ amount, paymentMethod, transactionId, bankName })
    });
    
    const data = await response.json();
    if (!response.ok) {
      console.error('Payment failed:', data);
      throw new Error(data.message || data.errors?.[0]?.msg || 'Failed to process repayment');
    }
    
    console.log('Payment successful:', data);
    await fetchLoans();
  };

  // Add this CSS block at the top or in a <style> tag if using CSS-in-JS
  const tableContainerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%'
  };

  return (
    <>
      <Navbar isSidebarPage={true} sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
      <div className="flex h-screen bg-gray-100">
        {user?.role === 'employee' ? (
          <EmployeeSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
        ) : (
          <AdminSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
        )}
        
        <div className="flex-1 overflow-auto p-8 bg-gradient-to-br from-blue-50 via-white to-cyan-50 min-h-screen">
          <div className="bg-white/90 rounded-2xl shadow-xl p-6 border border-blue-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-yellow-800 mb-2 flex items-center gap-2">
                  <span>💳</span> Loans Management
                </h1>
                <p className="text-gray-600 text-base">View, manage, and track all loans in one place.</p>
              </div>
              <div className="relative w-full md:w-96 mt-4 md:mt-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by Name, Mobile, or Aadhar"
                  className="pl-10 pr-4 py-2 w-full rounded-full border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition text-gray-700 shadow-sm"
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
                      <th></th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Customer Details</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Loan Details</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Created By</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Actions</th>
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
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(loan.createdAt)}</td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-bold text-yellow-800 flex items-center gap-1">{loan.name}</div>
                            <div className="text-xs text-gray-500">{loan.primaryMobile}</div>
                            <div className="text-xs text-gray-500">{loan.email}</div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="text-sm text-cyan-800 font-semibold">
                              Amount: {formatCurrency(loan.amount)}
                              <span className="mx-1">|</span>
                              {loan.term}m @ {loan.interestRate}% (Daily)
                              <span className="mx-1">|</span>
                              Monthly: {formatCurrency(loan.monthlyPayment)}
                            </div>
                            <div className="text-xs mt-1">
                              <span className="text-green-700 font-medium">Paid: {formatCurrency(loan.totalPaid || 0)}</span>
                              <span className="mx-1">|</span>
                              <span className="text-red-600 font-bold">To Pay: {earlyDueMap[loan._id] !== undefined ? formatCurrency(Math.max(0, earlyDueMap[loan._id] - (loan.totalPaid || 0))) : '...'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm bg-blue-100 text-blue-800">{loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}</span>
                          </td>
                          <td className="px-4 py-4">
                            {loan.createdBy ? (
                              <>
                                <div className="text-sm font-bold text-gray-900">{loan.createdBy.name}</div>
                                <div className="text-xs text-gray-500">{loan.createdBy.email}</div>
                                <div className="text-xs text-gray-500">{loan.createdBy.role}</div>
                              </>
                            ) : (
                              <div className="text-xs text-gray-400">N/A</div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap flex flex-col gap-2 items-start">
                            <button
                              onClick={() => handleEditClick(loan)}
                              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white px-3 py-1 rounded-full font-bold flex items-center gap-2 shadow group-hover:scale-105 transition"
                            >
                              <span>✏️</span> Edit
                            </button>
                            {loan.status === 'active' && (
                              <button
                                onClick={() => {
                                  setRepayLoan(loan);
                                  setShowRepaymentModal(true);
                                }}
                                className="bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white px-3 py-1 rounded-full font-bold flex items-center gap-2 shadow group-hover:scale-105 transition"
                              >
                                <span>💸</span> Repay
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setShowPaymentHistoryModal(true);
                              }}
                              className="bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white px-3 py-1 rounded-full font-bold flex items-center gap-2 shadow group-hover:scale-105 transition"
                            >
                              <span>📜</span> Payment History
                            </button>
                          </td>
                        </tr>
                        {expandedRow === loan._id && (
                          <tr className="bg-cyan-50 border-t border-blue-100">
                            <td colSpan={7} className="px-6 py-4">
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
          <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
            <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-white rounded-2xl shadow-2xl p-0">
              <DialogTitle className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white rounded-t-2xl px-8 py-6 text-2xl font-bold flex items-center gap-2">
                <span>✏️</span> Edit Loan Details
              </DialogTitle>
              <DialogContent className="px-8 py-6">
                {selectedLoan && (
                  <div className="space-y-6">
                    <div className="bg-white/80 rounded-xl shadow p-6 border border-blue-50">
                      <TextField
                        fullWidth
                        label="Loan Amount"
                        value={selectedLoan.amount}
                        margin="normal"
                        InputProps={{ readOnly: true }}
                        className="bg-blue-50 rounded-lg"
                      />
                      {/* Only show these fields for admin users */}
                      {user?.role !== 'employee' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          <TextField
                            fullWidth
                            label="Deposited Bank"
                            value={selectedLoan.depositedBank}
                            onChange={(e) => setSelectedLoan({ ...selectedLoan, depositedBank: e.target.value })}
                            margin="normal"
                            className="bg-cyan-50 rounded-lg"
                          />
                          <TextField
                            fullWidth
                            type="date"
                            label="Renewal Date"
                            value={selectedLoan.renewalDate ? selectedLoan.renewalDate.split('T')[0] : ''}
                            onChange={(e) => setSelectedLoan({ ...selectedLoan, renewalDate: e.target.value })}
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                            className="bg-cyan-50 rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                    <div className="bg-cyan-50/80 rounded-xl shadow p-6 border border-cyan-100">
                      <h3 className="flex items-center gap-2 text-xl font-bold text-cyan-700 mb-4"><span>🪙</span> Gold Items</h3>
                      {selectedLoan.goldItems.map((item, index) => (
                        <div key={index} className="space-y-4 p-4 border border-cyan-200 rounded-xl mb-4 bg-white/70">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-cyan-700">Item #{index + 1}</span>
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() => removeGoldItem(index)}
                              disabled={selectedLoan.goldItems.length === 1}
                              size="small"
                            >
                              Remove Item
                            </Button>
                          </div>
                          <TextField
                            fullWidth
                            label="Description"
                            value={item.description}
                            onChange={(e) => handleGoldItemChange(index, 'description', e.target.value)}
                            margin="normal"
                            className="bg-cyan-50 rounded-lg"
                          />
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <TextField
                              label="Gross Weight (g)"
                              type="number"
                              value={item.grossWeight}
                              onChange={(e) => handleGoldItemChange(index, 'grossWeight', e.target.value)}
                              fullWidth
                              margin="normal"
                              className="bg-cyan-50 rounded-lg"
                            />
                            <TextField
                              label="Net Weight (g)"
                              type="number"
                              value={item.netWeight}
                              onChange={(e) => handleGoldItemChange(index, 'netWeight', e.target.value)}
                              fullWidth
                              margin="normal"
                              className="bg-cyan-50 rounded-lg"
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="contained"
                        onClick={addGoldItem}
                        className="mt-4 mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-bold shadow-lg"
                        fullWidth
                      >
                        + Add New Gold Item
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
              <DialogActions className="px-8 pb-6 flex justify-end gap-4">
                <Button onClick={() => setEditDialogOpen(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg px-6 py-2 shadow">Cancel</Button>
                <Button onClick={handleSaveEdit} variant="contained" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-lg px-8 py-2 shadow-lg">
                  Save Changes
                </Button>
              </DialogActions>
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
        </div>
      </div>
    </>
  );
};

export default LoansPage; 