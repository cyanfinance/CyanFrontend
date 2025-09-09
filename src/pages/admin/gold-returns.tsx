import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Mail,
  Phone,
  User,
  Package,
  TrendingUp,
  RefreshCw,
  Eye,
  FileText,
  MapPin,
  CalendarDays
} from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

interface GoldReturn {
  loanId: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  totalGoldWeight: number;
  goldItems: Array<{
    description: string;
    grossWeight: number;
    netWeight: number;
  }>;
  closedDate: string;
  daysSinceClosed: number;
  goldReturnStatus: 'pending' | 'scheduled' | 'returned' | 'overdue';
  scheduledReturnDate?: string;
  actualReturnDate?: string;
  remindersSent: number;
  isOverdue: boolean;
}

interface GoldReturnStats {
  stats: Array<{
    _id: string;
    count: number;
    totalGoldWeight: number;
  }>;
  totalClosedLoans: number;
  overdueLoans: number;
}

interface GoldReturnDetails {
  loanId: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  totalGoldWeight: number;
  goldItems: Array<{
    description: string;
    grossWeight: number;
    netWeight: number;
  }>;
  closedDate: string;
  daysSinceClosed: number;
  goldReturnStatus: 'pending' | 'scheduled' | 'returned' | 'overdue';
  scheduledReturnDate?: string;
  actualReturnDate?: string;
  remindersSent: number;
  isOverdue: boolean;
  reminders: Array<{
    sentDate: string;
    type: string;
    sentTo: string;
    message: string;
  }>;
  notes: string;
}

const GoldReturns: React.FC = () => {
  const { token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [goldReturns, setGoldReturns] = useState<GoldReturn[]>([]);
  const [stats, setStats] = useState<GoldReturnStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<GoldReturn | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<GoldReturnDetails | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchGoldReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/gold-returns/pending`, {
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setGoldReturns(data.data || []);
    } catch (error: any) {
      console.error('Error fetching gold returns:', error);
      setError(error.message || 'Failed to fetch gold returns');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/gold-returns/stats`, {
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchGoldReturnDetails = async (loanId: string) => {
    try {
      const response = await fetch(`${API_URL}/gold-returns/${loanId}`, {
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSelectedDetails(data.data);
      setShowDetailsModal(true);
    } catch (error: any) {
      console.error('Error fetching gold return details:', error);
      alert(error.message || 'Failed to fetch details');
    }
  };

  const scheduleGoldReturn = async () => {
    if (!selectedReturn || !scheduledDate) return;
    
    try {
      setProcessing(true);
      
      const response = await fetch(`${API_URL}/gold-returns/${selectedReturn.loanId}/schedule`, {
        method: 'POST',
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduledDate: new Date(scheduledDate).toISOString(),
          notes
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      alert('Gold return scheduled successfully!');
      setShowScheduleModal(false);
      setSelectedReturn(null);
      setScheduledDate('');
      setNotes('');
      fetchGoldReturns();
      fetchStats();
    } catch (error: any) {
      console.error('Error scheduling gold return:', error);
      alert(error.message || 'Failed to schedule gold return');
    } finally {
      setProcessing(false);
    }
  };

  const markGoldReturned = async () => {
    if (!selectedReturn) return;
    
    try {
      setProcessing(true);
      
      const response = await fetch(`${API_URL}/gold-returns/${selectedReturn.loanId}/mark-returned`, {
        method: 'POST',
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      alert('Gold marked as returned successfully!');
      setShowReturnModal(false);
      setSelectedReturn(null);
      setNotes('');
      fetchGoldReturns();
      fetchStats();
    } catch (error: any) {
      console.error('Error marking gold as returned:', error);
      alert(error.message || 'Failed to mark gold as returned');
    } finally {
      setProcessing(false);
    }
  };

  const sendReminder = async (loanId: string, reminderType: string = 'urgent') => {
    try {
      const response = await fetch(`${API_URL}/gold-returns/${loanId}/send-reminder`, {
        method: 'POST',
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reminderType })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      alert(`${reminderType} reminder sent successfully!`);
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      alert(error.message || 'Failed to send reminder');
    }
  };

  const processAllReminders = async () => {
    try {
      setProcessing(true);
      
      const response = await fetch(`${API_URL}/gold-returns/process-reminders`, {
        method: 'POST',
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      alert('All gold return reminders processed successfully!');
      fetchGoldReturns();
      fetchStats();
    } catch (error: any) {
      console.error('Error processing reminders:', error);
      alert(error.message || 'Failed to process reminders');
    } finally {
      setProcessing(false);
    }
  };



  useEffect(() => {
    fetchGoldReturns();
    fetchStats();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'scheduled': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'returned': return 'text-green-600 bg-green-50 border-green-200';
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'returned': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
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

  // Filter gold returns based on search term and status
  const filteredGoldReturns = goldReturns.filter(goldReturn => {
    const matchesSearch = 
      goldReturn.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goldReturn.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goldReturn.customerMobile.includes(searchTerm) ||
      goldReturn.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || goldReturn.goldReturnStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Navbar isSidebarPage={true} sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
        
        <div className="flex-1 overflow-auto p-8 bg-gradient-to-br from-yellow-50 via-white to-orange-50 min-h-screen">
          <div className="bg-white/90 rounded-2xl shadow-xl p-6 border border-yellow-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-yellow-800 mb-2 flex items-center gap-2">
                  <Package className="w-6 h-6" />
                  Gold Return Management
                </h1>
                <p className="text-gray-600 text-base">Track and manage gold returns for closed loans</p>
              </div>
              
                             <div className="flex gap-3">
                 <button
                   onClick={processAllReminders}
                   disabled={processing}
                   className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                 >
                   <RefreshCw className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
                   Process Reminders
                 </button>
                 <button
                   onClick={() => { fetchGoldReturns(); fetchStats(); }}
                   disabled={loading}
                   className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
                 >
                   <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                   Refresh
                 </button>
               </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Closed Loans</p>
                      <p className="text-2xl font-bold">{stats.totalClosedLoans}</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm">Pending Returns</p>
                      <p className="text-2xl font-bold">{stats.stats.find(s => s._id === 'pending')?.count || 0}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm">Overdue Returns</p>
                      <p className="text-2xl font-bold">{stats.overdueLoans}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Returned</p>
                      <p className="text-2xl font-bold">{stats.stats.find(s => s._id === 'returned')?.count || 0}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-200" />
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700 font-medium">Error: {error}</p>
                </div>
              </div>
            )}

            {/* Search and Filter */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, loan ID, mobile, or email..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="overdue">Overdue</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    Showing {filteredGoldReturns.length} of {goldReturns.length} returns
                  </div>
                </div>
              </div>
            </div>

            {/* Gold Returns List */}
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <RefreshCw className="w-8 h-8 animate-spin text-yellow-600" />
              </div>
            ) : filteredGoldReturns.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {goldReturns.length === 0 ? 'No pending gold returns found' : 'No returns match your search criteria'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredGoldReturns.map((goldReturn) => (
                  <div key={goldReturn.loanId} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-sm text-gray-800 truncate">
                          {goldReturn.customerName}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold border flex items-center gap-1 ${getStatusColor(goldReturn.goldReturnStatus)}`}>
                        {getStatusIcon(goldReturn.goldReturnStatus)}
                        {goldReturn.goldReturnStatus}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-700">
                          {goldReturn.totalGoldWeight}g Gold
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Loan ID: {goldReturn.loanId}</div>
                        <div>Closed: {formatDate(goldReturn.closedDate)}</div>
                        <div>Days Since: {goldReturn.daysSinceClosed}</div>
                        <div className="text-blue-600">{goldReturn.customerEmail}</div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {goldReturn.customerMobile}
                        </div>
                        <div>Reminders: {goldReturn.remindersSent}</div>
                      </div>
                      
                      {goldReturn.isOverdue && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          ⚠️ Overdue for {goldReturn.daysSinceClosed - 30} days
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => fetchGoldReturnDetails(goldReturn.loanId)}
                        className="flex-1 bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs hover:bg-purple-200 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View Details
                      </button>
                      <button
                        onClick={() => sendReminder(goldReturn.loanId, 'urgent')}
                        className="flex-1 bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs hover:bg-blue-200 flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3" />
                        Send Reminder
                      </button>
                      <button
                        onClick={() => { setSelectedReturn(goldReturn); setShowScheduleModal(true); }}
                        className="flex-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-xs hover:bg-yellow-200"
                      >
                        Schedule
                      </button>
                      <button
                        onClick={() => { setSelectedReturn(goldReturn); setShowReturnModal(true); }}
                        className="flex-1 bg-green-100 text-green-700 px-3 py-1 rounded text-xs hover:bg-green-200"
                      >
                        Mark Returned
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Gold Return Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Customer Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedDetails.customerName}</div>
                    <div><strong>Mobile:</strong> {selectedDetails.customerMobile}</div>
                    <div><strong>Email:</strong> {selectedDetails.customerEmail}</div>
                    <div><strong>Loan ID:</strong> {selectedDetails.loanId}</div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Gold Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Total Weight:</strong> {selectedDetails.totalGoldWeight}g</div>
                    <div><strong>Items:</strong> {selectedDetails.goldItems.length}</div>
                    <div><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full font-semibold border ${getStatusColor(selectedDetails.goldReturnStatus)}`}>
                        {selectedDetails.goldReturnStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5" />
                    Timeline
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Closed Date:</strong> {formatDate(selectedDetails.closedDate)}</div>
                    <div><strong>Days Since Closed:</strong> {selectedDetails.daysSinceClosed}</div>
                    {selectedDetails.scheduledReturnDate && (
                      <div><strong>Scheduled Return:</strong> {formatDateTime(selectedDetails.scheduledReturnDate)}</div>
                    )}
                    {selectedDetails.actualReturnDate && (
                      <div><strong>Actual Return:</strong> {formatDateTime(selectedDetails.actualReturnDate)}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Gold Items and Reminders */}
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Gold Items ({selectedDetails.goldItems.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedDetails.goldItems.map((item, index) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="font-medium text-sm">{item.description}</div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Gross Weight: {item.grossWeight}g</div>
                          <div>Net Weight: {item.netWeight}g</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Reminder History ({selectedDetails.reminders.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedDetails.reminders.length === 0 ? (
                      <p className="text-sm text-gray-500">No reminders sent yet</p>
                    ) : (
                      selectedDetails.reminders.map((reminder, index) => (
                        <div key={index} className="bg-white p-2 rounded border text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{reminder.type.toUpperCase()}</div>
                              <div className="text-gray-600">Sent to: {reminder.sentTo}</div>
                              <div className="text-gray-500">{formatDateTime(reminder.sentDate)}</div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              reminder.type === 'urgent' ? 'bg-red-100 text-red-700' :
                              reminder.type === 'final' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {reminder.type}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {selectedDetails.notes && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Notes
                    </h3>
                    <p className="text-sm text-gray-700">{selectedDetails.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Schedule Gold Return</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                <p className="text-gray-900">{selectedReturn.customerName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows={3}
                  placeholder="Add any notes about the scheduled return..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={scheduleGoldReturn}
                disabled={processing || !scheduledDate}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                {processing ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Returned Modal */}
      {showReturnModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Mark Gold as Returned</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                <p className="text-gray-900">{selectedReturn.customerName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gold Weight</label>
                <p className="text-gray-900">{selectedReturn.totalGoldWeight}g</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows={3}
                  placeholder="Add any notes about the return..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={markGoldReturned}
                disabled={processing}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Mark Returned'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoldReturns;
