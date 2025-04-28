import React, { useState, useEffect } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import { useAuth } from '../../context/AuthContext';

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
}
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const EmployeeDashboard = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await fetch(`${API_URL}/employee/loans`, {
        headers: {
          'x-auth-token': token || ''
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch loans');
      setLoans(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch loans');
    } finally {
      setLoading(false);
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
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      active: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status];
  };

  const filteredLoans = loans.filter(loan =>
    loan.name.toLowerCase().includes(search.toLowerCase()) ||
    loan.email.toLowerCase().includes(search.toLowerCase()) ||
    loan.primaryMobile.includes(search) ||
    (loan.customerId && loan.customerId.toString().includes(search)) ||
    formatCurrency(loan.amount).includes(search)
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <EmployeeSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          </div>
          <div className="flex justify-end mb-4">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, mobile, customer ID, or amount"
              className="p-2 border rounded w-80"
            />
          </div>
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
    </div>
  );
};

export default EmployeeDashboard; 