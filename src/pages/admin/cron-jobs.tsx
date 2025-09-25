import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import Navbar from '../../components/Navbar';

interface CronJob {
  name: string;
  displayName: string;
  description: string;
  schedule: string;
  lastExecution: string | null;
  status: string;
}

interface CronJobHistory {
  _id: string;
  jobName: string;
  executionType: 'scheduled' | 'manual';
  executedBy?: {
    name: string;
    email: string;
  };
  status: 'success' | 'failed' | 'running';
  startTime: string;
  endTime?: string;
  duration?: number;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errorMessage?: string;
  details: any;
}

const CronJobsManagement: React.FC = () => {
  const { user, token } = useAuth();
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [history, setHistory] = useState<CronJobHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchJobs();
    fetchHistory();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${API_URL}/cron-jobs/list`, {
        headers: {
          'x-auth-token': token
        }
      });
      const data = await response.json();
      if (data.success) {
        setJobs(data.data);
      } else {
        setError(data.message || 'Failed to fetch jobs');
      }
    } catch (err) {
      setError('Failed to fetch jobs');
    }
  };

  const fetchHistory = async (jobName?: string) => {
    try {
      const url = jobName 
        ? `${API_URL}/cron-jobs/history?jobName=${jobName}&limit=5`
        : `${API_URL}/cron-jobs/history?limit=10`;
      
      const response = await fetch(url, {
        headers: {
          'x-auth-token': token
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.data);
      } else {
        setError(data.message || 'Failed to fetch history');
      }
    } catch (err) {
      setError('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const executeJob = async (jobName: string) => {
    setExecuting(jobName);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/cron-jobs/execute/${jobName}`, {
        method: 'POST',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // Refresh jobs and history
        await fetchJobs();
        await fetchHistory();
        
        // Show success message
        alert(`Job '${jobName}' started successfully!`);
      } else {
        setError(data.message || 'Failed to execute job');
      }
    } catch (err) {
      setError('Failed to execute job');
    } finally {
      setExecuting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'running': return '🔄';
      default: return '❓';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    const seconds = Math.round(duration / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cron jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
    
      <Navbar isSidebarPage={true} sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
        <main className={`flex-1 p-6 transition-all duration-300 relative z-10 ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Cron Jobs Management</h1>
              <p className="text-gray-600">Monitor and manually execute scheduled tasks</p>
            </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Jobs Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {jobs.map((job) => (
          <div key={job.name} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{job.displayName}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                {getStatusIcon(job.status)} {job.status}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{job.description}</p>
            
            <div className="text-xs text-gray-500 mb-4">
              <div className="font-medium">Schedule:</div>
              <div>{job.schedule}</div>
              {job.lastExecution && (
                <>
                  <div className="font-medium mt-2">Last Run:</div>
                  <div>{formatDate(job.lastExecution)}</div>
                </>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => executeJob(job.name)}
                disabled={executing === job.name}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {executing === job.name ? 'Running...' : 'Run Now'}
              </button>
              <button
                onClick={() => {
                  setSelectedJob(job.name);
                  setShowHistory(true);
                  fetchHistory(job.name);
                }}
                className="bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
              >
                History
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent History */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedJob ? `${jobs.find(j => j.name === selectedJob)?.displayName} History` : 'Recent Executions'}
            </h2>
            <div className="flex gap-2">
              {selectedJob && (
                <button
                  onClick={() => {
                    setSelectedJob(null);
                    fetchHistory();
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Show All
                </button>
              )}
              <button
                onClick={() => fetchHistory(selectedJob || undefined)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Executed By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {jobs.find(j => j.name === record.jobName)?.displayName || record.jobName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      record.executionType === 'manual' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {record.executionType === 'manual' ? 'Manual' : 'Scheduled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)} {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(record.startTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(record.duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex gap-2">
                      <span className="text-green-600">{record.recordsSuccessful}✓</span>
                      {record.recordsFailed > 0 && (
                        <span className="text-red-600">{record.recordsFailed}✗</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.executedBy ? (
                      <div>
                        <div className="font-medium">{record.executedBy.name}</div>
                        <div className="text-gray-500">{record.executedBy.email}</div>
                      </div>
                    ) : (
                      'System'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {history.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No execution history found
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

export default CronJobsManagement;
