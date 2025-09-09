import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import Navbar from '../../components/Navbar';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { Clock, AlertCircle, Filter, IndianRupee } from 'lucide-react';

interface PendingRepayment {
  loanId: string;
  customer: {
    name: string;
    email: string;
    primaryMobile: string;
    aadharNumber: string;
  };
  dueDate: string;
  amount: number;
  status: string;
  daysUnpaid: number;
}

const PendingRepayments = () => {
  const { token } = useAuth();
  const [pending, setPending] = useState<PendingRepayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'upcoming'>('all');

  useEffect(() => {
    fetchPending(filter);
    // eslint-disable-next-line
  }, [token, filter]);

  const fetchPending = async (filter: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/loans/pending-repayments?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch pending repayments');
      setPending(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending repayments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-yellow-50 flex flex-col">
      <Navbar isSidebarPage={true} sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
      <div className="flex flex-1">
        <AdminSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
        <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
          <h1 className="text-3xl font-bold mb-6 text-blue-900 drop-shadow flex items-center gap-2"><Clock className="w-7 h-7 text-blue-600" /> Pending Repayments</h1>
          <div className="p-8">
            <div className="flex gap-4 mb-8 items-center">
              <Filter className="w-5 h-5 text-blue-400" />
              <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-full font-semibold shadow transition-all ${filter === 'all' ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'}`}>All</button>
              <button onClick={() => setFilter('unpaid')} className={`px-4 py-2 rounded-full font-semibold shadow transition-all ${filter === 'unpaid' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'}`}>Unpaid</button>
              <button onClick={() => setFilter('upcoming')} className={`px-4 py-2 rounded-full font-semibold shadow transition-all ${filter === 'upcoming' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-white text-yellow-700 border border-yellow-200 hover:bg-yellow-50'}`}>Upcoming</button>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="ml-2 text-blue-600">Loading pending repayments...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> {error}</div>
            ) : pending.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-lg">No pending repayments</p>
                <p className="text-xs text-gray-400 mt-1">All installments are up to date</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pending.map((due, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">
                          {new Date(due.dueDate).toLocaleDateString('en-IN', {
                            weekday: 'short', month: 'short', day: 'numeric'
                          })}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${due.status === 'unpaid' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {due.status === 'unpaid' ? '⚠️ Unpaid' : '📅 Upcoming'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-gray-800 truncate">{due.customer.name}</span>
                        <span className="text-xs text-gray-500">{due.customer.primaryMobile}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">{due.amount}</span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Loan ID: {due.loanId}</div>
                        <div>Aadhar: {due.customer.aadharNumber}</div>
                        <div className="text-blue-600">{due.customer.email}</div>
                        {due.status === 'unpaid' && (
                          <div className="text-red-700 font-semibold">Days Unpaid: {due.daysUnpaid}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PendingRepayments; 