import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface AuctionLoan {
  loanId: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  auctionStatus: string;
  auctionReadyDate: string;
  auctionScheduledDate?: string;
  auctionDate?: string;
  daysSinceReady: number;
  totalGoldWeight: number;
  outstandingAmount: number;
  notificationsSent: number;
  notes: string;
}

const AuctionManagement: React.FC = () => {
  const { token } = useAuth();
  const [auctionLoans, setAuctionLoans] = useState<AuctionLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<AuctionLoan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'mark' | 'schedule' | 'auction' | 'cancel'>('mark');
  const [notes, setNotes] = useState('');
  const [auctionDate, setAuctionDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchAuctionLoans();
  }, []);

  const fetchAuctionLoans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/auction-loans`, {
        headers: {
          'x-auth-token': token || ''
        }
      });
      const data = await response.json();
      if (data.success) {
        setAuctionLoans(data.data);
      } else {
        setError('Failed to fetch auction loans');
      }
    } catch (err) {
      setError('Error fetching auction loans');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedLoan) return;

    try {
      setError(null);
      let endpoint = '';
      let body: any = {};

      switch (modalType) {
        case 'mark':
          endpoint = `${API_URL}/admin/loans/${selectedLoan.loanId}/mark-ready-for-auction`;
          body = { notes };
          break;
        case 'schedule':
          if (!auctionDate) {
            setError('Auction date is required');
            return;
          }
          endpoint = `${API_URL}/admin/loans/${selectedLoan.loanId}/schedule-auction`;
          body = { auctionDate, notes };
          break;
        case 'auction':
          endpoint = `${API_URL}/admin/loans/${selectedLoan.loanId}/mark-auctioned`;
          body = { auctionDate: auctionDate || new Date().toISOString(), notes };
          break;
        case 'cancel':
          endpoint = `${API_URL}/admin/loans/${selectedLoan.loanId}/cancel-auction`;
          body = { notes };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(data.message);
        setShowModal(false);
        setNotes('');
        setAuctionDate('');
        fetchAuctionLoans();
      } else {
        setError(data.message || 'Action failed');
      }
    } catch (err) {
      setError('Error performing action');
    }
  };

  const openModal = (loan: AuctionLoan, type: 'mark' | 'schedule' | 'auction' | 'cancel') => {
    setSelectedLoan(loan);
    setModalType(type);
    setShowModal(true);
    setNotes('');
    setAuctionDate('');
    setError(null);
    setSuccess(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready_for_auction': return 'bg-red-100 text-red-800';
      case 'auction_scheduled': return 'bg-orange-100 text-orange-800';
      case 'auctioned': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready_for_auction': return 'Ready for Auction';
      case 'auction_scheduled': return 'Auction Scheduled';
      case 'auctioned': return 'Auctioned';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading auction loans...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Auction Management</h1>
            <button
              onClick={fetchAuctionLoans}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          {auctionLoans.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No loans ready for auction</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loan Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Outstanding
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gold Weight
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Since Ready
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auctionLoans.map((loan) => (
                    <tr key={loan.loanId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{loan.loanId}</div>
                          <div className="text-sm text-gray-500">
                            Ready: {new Date(loan.auctionReadyDate).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{loan.customerName}</div>
                          <div className="text-sm text-gray-500">{loan.customerMobile}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(loan.auctionStatus)}`}>
                          {getStatusText(loan.auctionStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{loan.outstandingAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loan.totalGoldWeight} g
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loan.daysSinceReady} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {loan.auctionStatus === 'not_ready' && (
                            <button
                              onClick={() => openModal(loan, 'mark')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Mark for Auction
                            </button>
                          )}
                          {loan.auctionStatus === 'ready_for_auction' && (
                            <>
                              <button
                                onClick={() => openModal(loan, 'schedule')}
                                className="text-orange-600 hover:text-orange-900"
                              >
                                Schedule
                              </button>
                              <button
                                onClick={() => openModal(loan, 'auction')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Mark Auctioned
                              </button>
                            </>
                          )}
                          {loan.auctionStatus === 'auction_scheduled' && (
                            <button
                              onClick={() => openModal(loan, 'auction')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Mark Auctioned
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

      {/* Modal */}
      {showModal && selectedLoan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {modalType === 'mark' && 'Mark Loan for Auction'}
                {modalType === 'schedule' && 'Schedule Auction'}
                {modalType === 'auction' && 'Mark as Auctioned'}
                {modalType === 'cancel' && 'Cancel Auction'}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Loan: <strong>{selectedLoan.loanId}</strong><br/>
                  Customer: <strong>{selectedLoan.customerName}</strong><br/>
                  Outstanding: <strong>₹{selectedLoan.outstandingAmount.toLocaleString()}</strong>
                </p>
              </div>

              {(modalType === 'schedule' || modalType === 'auction') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auction Date
                  </label>
                  <input
                    type="date"
                    value={auctionDate}
                    onChange={(e) => setAuctionDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={modalType === 'schedule'}
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any notes about this action..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  className={`px-4 py-2 rounded-md text-white ${
                    modalType === 'mark' || modalType === 'auction' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {modalType === 'mark' && 'Mark for Auction'}
                  {modalType === 'schedule' && 'Schedule Auction'}
                  {modalType === 'auction' && 'Mark Auctioned'}
                  {modalType === 'cancel' && 'Cancel Auction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionManagement;
