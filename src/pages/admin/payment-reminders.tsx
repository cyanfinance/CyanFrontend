import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  RefreshCw,
  IndianRupee,
  Phone,
  User
} from 'lucide-react';
import api from '../../utils/api';
import AdminSidebar from '../../components/AdminSidebar';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

interface PaymentReminder {
  loanId: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  daysUntilDue?: number;
  daysOverdue?: number;
  totalPaid: number;
  remainingBalance: number;
  status: string;
}

const PaymentReminders: React.FC = () => {
  const { token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'overdue'>('upcoming');
  const [upcomingPayments, setUpcomingPayments] = useState<PaymentReminder[]>([]);
  const [overduePayments, setOverduePayments] = useState<PaymentReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderType, setReminderType] = useState<'upcoming' | 'overdue' | 'all'>('all');
  const [daysFilter, setDaysFilter] = useState(7);
  const [error, setError] = useState<string | null>(null);



  const fetchUpcomingPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      // console.log('Fetching upcoming payments with days filter:', daysFilter);
      
      const response = await fetch(`${API_URL}/notifications/upcoming-payments?days=${daysFilter}`, {
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // console.log('Upcoming payments response:', data);
      setUpcomingPayments(data.data || []);
    } catch (error: any) {
      console.error('Error fetching upcoming payments:', error);
      setError(error.response?.data?.message || 'Failed to fetch upcoming payments');
      setUpcomingPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverduePayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/notifications/overdue-payments`, {
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setOverduePayments(data.data || []);
    } catch (error: any) {
      console.error('Error fetching overdue payments:', error);
      setError(error.response?.data?.message || 'Failed to fetch overdue payments');
      setOverduePayments([]);
    } finally {
      setLoading(false);
    }
  };

  const sendPaymentReminders = async () => {
    try {
      setSendingReminders(true);
      // console.log('Sending payment reminders with type:', reminderType);
      
      const response = await fetch(`${API_URL}/notifications/send-payment-reminders`, {
        method: 'POST',
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: reminderType })
      });
      
      // console.log('Send reminders response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      // console.log('Send reminders response data:', data);
      
      alert(`Successfully sent ${data.data.totalSent} reminder emails!`);
      
      // Refresh the data
      if (activeTab === 'upcoming') {
        fetchUpcomingPayments();
      } else {
        fetchOverduePayments();
      }
    } catch (error: any) {
      console.error('Error sending payment reminders:', error);
      alert(error.message || 'Failed to send payment reminders');
    } finally {
      setSendingReminders(false);
    }
  };





  useEffect(() => {
    if (activeTab === 'upcoming') {
      fetchUpcomingPayments();
    } else {
      fetchOverduePayments();
    }
  }, [activeTab, daysFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (daysUntilDue?: number, daysOverdue?: number) => {
    if (daysOverdue && daysOverdue > 0) {
      if (daysOverdue >= 30) return 'text-red-600 bg-red-50 border-red-200';
      if (daysOverdue >= 14) return 'text-orange-600 bg-orange-50 border-orange-200';
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
    if (daysUntilDue === 0) return 'text-red-600 bg-red-50 border-red-200';
    if (daysUntilDue && daysUntilDue <= 1) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getStatusText = (daysUntilDue?: number, daysOverdue?: number) => {
    if (daysOverdue && daysOverdue > 0) {
      return `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`;
    }
    if (daysUntilDue === 0) return 'Due today';
    if (daysUntilDue && daysUntilDue === 1) return 'Due tomorrow';
    return `Due in ${daysUntilDue} days`;
  };

  const currentPayments = activeTab === 'upcoming' ? upcomingPayments : overduePayments;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <Navbar isSidebarPage={true} sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
        <main className={`flex-1 p-8 transition-all duration-300 relative z-10 ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Payment Reminders
              </h1>
            </div>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-4"></div>
            <p className="text-gray-600 text-lg">Manage and send payment reminder emails to customers</p>
          </div>
          
          <div className="relative z-10">

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700 font-medium">Error: {error}</p>
                </div>
              </div>
            )}



            {/* Reminder Controls */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <select
                    value={reminderType}
                    onChange={(e) => setReminderType(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Reminders</option>
                    <option value="upcoming">Upcoming Only</option>
                    <option value="overdue">Overdue Only</option>
                  </select>
                  
                  {activeTab === 'upcoming' && (
                    <select
                      value={daysFilter}
                      onChange={(e) => setDaysFilter(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={3}>Next 3 days</option>
                      <option value={7}>Next 7 days</option>
                      <option value={14}>Next 14 days</option>
                      <option value={30}>Next 30 days</option>
                    </select>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (activeTab === 'upcoming') {
                        fetchUpcomingPayments();
                      } else {
                        fetchOverduePayments();
                      }
                    }}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  
                  <button
                    onClick={sendPaymentReminders}
                    disabled={sendingReminders}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {sendingReminders ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    {sendingReminders ? 'Sending...' : 'Send Reminders'}
                  </button>
                </div>
              </div>
              

            </div>

            {/* Tabs */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === 'upcoming'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Upcoming Payments ({upcomingPayments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('overdue')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === 'overdue'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Overdue Payments ({overduePayments.length})
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading...</span>
                  </div>
                ) : currentPayments.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No {activeTab} payments found
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentPayments.map((payment, idx) => (
                      <div key={idx} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="font-semibold text-sm text-gray-800 truncate">
                              {payment.customerName}
                            </span>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full font-semibold border ${getStatusColor(payment.daysUntilDue, payment.daysOverdue)}`}>
                            {getStatusText(payment.daysUntilDue, payment.daysOverdue)}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>Loan ID: {payment.loanId}</div>
                            <div>Installment: {payment.installmentNumber}/{payment.totalInstallments}</div>
                            <div>Due: {formatDate(payment.dueDate)}</div>
                            <div className="text-blue-600">{payment.customerEmail}</div>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {payment.customerMobile}
                            </div>
                            <div>Paid: {formatCurrency(payment.totalPaid)}</div>
                            <div>Balance: {formatCurrency(payment.remainingBalance)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PaymentReminders; 