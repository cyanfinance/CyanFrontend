import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import axios from 'axios';
import UpgradeHistoryModal from '../../components/UpgradeHistoryModal';

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
                          {loan.status === 'active' && (
                            <button
                              onClick={() => {/* Repay functionality */}}
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
    </div>
  );
};

export default EmployeeLoansPage;
