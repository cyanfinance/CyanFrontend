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
  User,
  MessageSquare
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
  const [sendingIndividualSMS, setSendingIndividualSMS] = useState<string | null>(null);
  const [smsConfig, setSmsConfig] = useState<any>(null);
  const [showSmsConfig, setShowSmsConfig] = useState(false);



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

  const sendIndividualSMSReminder = async (payment: PaymentReminder) => {
    try {
      setSendingIndividualSMS(payment.loanId);
      
      const response = await fetch(`${API_URL}/notifications/send-individual-sms-reminder`, {
        method: 'POST',
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          loanId: payment.loanId,
          customerMobile: payment.customerMobile,
          customerName: payment.customerName,
          amount: payment.amount,
          dueDate: payment.dueDate,
          daysUntilDue: payment.daysUntilDue,
          daysOverdue: payment.daysOverdue
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        alert(`SMS reminder sent successfully to ${payment.customerName}!`);
      } else {
        alert(`Failed to send SMS reminder: ${data.message}`);
      }
      
    } catch (error: any) {
      console.error('Error sending individual SMS reminder:', error);
      alert(error.message || 'Failed to send SMS reminder');
    } finally {
      setSendingIndividualSMS(null);
    }
  };

  const fetchSmsConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/sms-config`, {
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSmsConfig(data.data);
      setShowSmsConfig(true);
    } catch (error: any) {
      console.error('Error fetching SMS config:', error);
      alert('Failed to fetch SMS configuration');
    }
  };

  const testSms = async () => {
    const phoneNumber = prompt('Enter phone number to test SMS (with country code, e.g., +919876543210):');
    if (!phoneNumber) return;
    
    try {
      const response = await fetch(`${API_URL}/notifications/test-sms`, {
        method: 'POST',
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      alert(`Test SMS result: ${data.success ? 'Success' : 'Failed'}\nMessage: ${data.message}`);
    } catch (error: any) {
      console.error('Error testing SMS:', error);
      alert('Failed to test SMS');
    }
  };

  const testPaymentReminderSms = async () => {
    const phoneNumber = prompt('Enter phone number to test Payment Reminder SMS (with country code, e.g., +919876543210):');
    if (!phoneNumber) return;
    
    try {
      const response = await fetch(`${API_URL}/notifications/test-payment-reminder-sms`, {
        method: 'POST',
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      alert(`Test Payment Reminder SMS result: ${data.success ? 'Success' : 'Failed'}\nMessage: ${data.message}`);
    } catch (error: any) {
      console.error('Error testing payment reminder SMS:', error);
      alert('Failed to test payment reminder SMS');
    }
  };

  const testSimplePaymentSms = async () => {
    const phoneNumber = prompt('Enter phone number to test Simple Payment SMS (with country code, e.g., +919876543210):');
    if (!phoneNumber) return;
    
    try {
      const response = await fetch(`${API_URL}/notifications/test-simple-payment-sms`, {
        method: 'POST',
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      alert(`Test Simple Payment SMS result: ${data.success ? 'Success' : 'Failed'}\nMessage: ${data.message}`);
    } catch (error: any) {
      console.error('Error testing simple payment SMS:', error);
      alert('Failed to test simple payment SMS');
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
            <p className="text-gray-600 text-lg">Manage and send payment reminder emails and SMS to customers</p>
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
                    {sendingReminders ? 'Sending...' : 'Send Email Reminders'}
                  </button>
                  
                  <button
                    onClick={fetchSmsConfig}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    SMS Config
                  </button>
                  
                  <button
                    onClick={testSms}
                    className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Test SMS
                  </button>
                  
                  <button
                    onClick={testPaymentReminderSms}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Test Payment SMS
                  </button>
                  
                  <button
                    onClick={testSimplePaymentSms}
                    className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Test Simple SMS
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
                          
                          {/* Individual SMS Reminder Button */}
                          <div className="pt-3 border-t border-gray-200">
                            <button
                              onClick={() => sendIndividualSMSReminder(payment)}
                              disabled={sendingIndividualSMS === payment.loanId}
                              className="w-full bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs font-medium transition-colors duration-200"
                            >
                              {sendingIndividualSMS === payment.loanId ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <MessageSquare className="w-3 h-3" />
                                  Send SMS Reminder
                                </>
                              )}
                            </button>
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
      
      {/* SMS Configuration Modal */}
      {showSmsConfig && smsConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">SMS Service Configuration</h3>
              <button
                onClick={() => setShowSmsConfig(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-2">Basic Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Provider:</strong> {smsConfig.provider}</div>
                    <div><strong>Node Environment:</strong> {smsConfig.nodeEnv}</div>
                    <div><strong>Has API Key:</strong> {smsConfig.hasApiKey ? '✅' : '❌'}</div>
                    <div><strong>Has Fast2SMS API Key:</strong> {smsConfig.hasFast2smsApiKey ? '✅' : '❌'}</div>
                    <div><strong>Sender ID:</strong> {smsConfig.senderId || 'Not set'}</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-2">Template Configuration</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(smsConfig.templateValidation).map(([purpose, config]: [string, any]) => (
                      <div key={purpose}>
                        <strong>{purpose}:</strong> {config.configured ? '✅' : '❌'} 
                        {config.templateId && ` (${config.templateId})`}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">All Templates</h4>
                <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                  {JSON.stringify(smsConfig.templates, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentReminders; 