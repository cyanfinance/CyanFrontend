import React from 'react';
import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import Navbar from '../../components/Navbar';

interface GoldItem {
  description: string;
  grossWeight: number;
  netWeight: number;
}

interface EmergencyContact {
  mobile: string;
  relation: string;
}

interface LoanDetails {
  amount: number;
  term: number;
  interestRate: number;
  status: string;
  monthlyPayment: number;
  totalPayment: number;
  depositedBank?: string;
  renewalDate?: Date;
}

interface Customer {
  customerId: string;
  aadharNumber: string;
  name: string;
  email: string;
  primaryMobile: string;
  secondaryMobile?: string;
  presentAddress: string;
  permanentAddress: string;
  emergencyContact?: EmergencyContact;
  goldItems?: GoldItem[];
  totalLoans: number;
  activeLoans: number;
  latestLoan?: LoanDetails;
  mongoId?: string;
  userId?: string;
  role?: string;
}

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const { token: rawToken, user } = useAuth();
  const token = rawToken || '';
  const [originalAadharNumber, setOriginalAadharNumber] = useState<string | null>(null);

  // Function to mask Aadhar number for employees
  const maskAadharNumber = (aadharNumber: string) => {
    if (user?.role === 'employee' && aadharNumber) {
      // Show only last 4 digits, mask the rest with asterisks
      return '****-****-' + aadharNumber.slice(-4);
    }
    return aadharNumber;
  };

  useEffect(() => {
    // console.log('Admin Customers Page Token:', token);
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      if (!token) {
        throw new Error('No authentication token found');
      }
      let endpoint = `${API_URL}/admin/customers`;
      if (user && user.role === 'employee') {
        endpoint = `${API_URL}/employee/customers`;
      }
      const response = await fetch(endpoint, {
        headers: {
          'x-auth-token': token
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch customers');
      }
      setCustomers(data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const filteredCustomers = customers.filter((customer) => {
    const query = search.toLowerCase();
    return (
      (customer.name?.toLowerCase().includes(query)) ||
      (customer.aadharNumber?.includes(query)) ||
      (customer.customerId?.includes(query)) ||
      (customer.email?.toLowerCase().includes(query)) ||
      (customer.primaryMobile?.includes(query)) ||
      (customer.secondaryMobile?.includes(query))
    );
  });

  const handleSaveCustomer = async () => {
    if (!selectedCustomer) return;
    setSaving(true);
    try {
      if (!token) throw new Error('No authentication token found');
      let endpoint = `${API_URL}/admin/customers/${originalAadharNumber}`;
      if (user && user.role === 'employee') {
        endpoint = `${API_URL}/employee/customers/${originalAadharNumber}`;
      }
      const safeToken = token || '';
      // Only send updatable fields
      const updateData = {
        name: selectedCustomer.name,
        email: selectedCustomer.email,
        aadharNumber: selectedCustomer.aadharNumber,
        primaryMobile: selectedCustomer.primaryMobile,
        secondaryMobile: selectedCustomer.secondaryMobile,
        presentAddress: selectedCustomer.presentAddress,
        permanentAddress: selectedCustomer.permanentAddress,
        emergencyContact: selectedCustomer.emergencyContact,
      };
      let response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': safeToken
        },
        body: JSON.stringify(updateData)
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update customer');
      }
      const updatedData = await response.json();
      setCustomers(prev => prev.map(c => c.mongoId === selectedCustomer.mongoId ? { ...c, ...selectedCustomer, ...updatedData.data } : c));
      setEditDialogOpen(false);
      setSelectedCustomer(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar isSidebarPage={true} sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
      <div className="flex h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
        {user?.role === 'employee' ? (
          <EmployeeSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
        ) : (
          <AdminSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
        )}
        
        <div className={`flex-1 overflow-auto transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
          <div className="p-4">
            <div className="bg-gradient-to-r from-blue-100 via-cyan-50 to-white rounded-xl shadow p-3 mb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-blue-800 mb-1 flex items-center gap-2">
                    <span>👥</span> Customers
                  </h1>
                  <p className="text-gray-600 text-sm">Manage all your customers and their loan activity here.</p>
                </div>
                <div className="relative w-full md:w-80 mt-3 md:mt-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 text-sm">🔍</span>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by Name, Aadhar, Mobile, or Email"
                    className="pl-8 pr-4 py-2 w-full rounded-lg border border-blue-100 bg-blue-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition text-gray-700 shadow-sm text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="bg-white/90 rounded-xl shadow-lg p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-xl">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase tracking-wider w-32">Customer ID</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase tracking-wider w-48">Basic Info</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase tracking-wider w-40">Contact Details</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase tracking-wider w-64">Address</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase tracking-wider w-32">Loan Summary</th>
                      <th className="px-2 py-2 text-left text-xs font-bold text-blue-700 uppercase tracking-wider w-24 sticky right-0 bg-blue-100 z-10">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {filteredCustomers.map((customer, idx) => (
                      <React.Fragment key={customer.mongoId || customer.customerId}>
                        <tr className={`transition group ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'} hover:bg-cyan-50`}>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 font-semibold">
                            <div className="text-xs">{customer.customerId}</div>
                            <div className="text-xs text-gray-500">{maskAadharNumber(customer.aadharNumber)}</div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="text-sm font-bold text-blue-800">{customer.name}</div>
                            <div className="text-xs text-gray-500 truncate max-w-40">{customer.email}</div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{customer.primaryMobile}</div>
                            {customer.secondaryMobile && (
                              <div className="text-xs text-gray-500">{customer.secondaryMobile}</div>
                            )}
                            {customer.emergencyContact && (
                              <div className="text-xs text-gray-500">
                                {customer.emergencyContact.mobile} ({customer.emergencyContact.relation})
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm text-gray-900 truncate max-w-60">{customer.presentAddress}</div>
                            <div className="text-xs text-gray-500 truncate max-w-60">{customer.permanentAddress}</div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="text-sm text-green-700 font-semibold">Active: {customer.activeLoans}</div>
                            <div className="text-xs text-gray-500">Total: {customer.totalLoans}</div>
                          </td>
                          <td className={`px-2 py-4 whitespace-nowrap sticky right-0 z-10 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                            <button
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setOriginalAadharNumber(customer.aadharNumber);
                                setEditDialogOpen(true);
                              }}
                              className="bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 shadow group-hover:scale-105 transition text-sm"
                              disabled={!customer.mongoId}
                              title={!customer.mongoId ? 'Cannot edit: No user record found for this customer' : ''}
                            >
                              <span>✏️</span> Edit
                            </button>
                          </td>
                        </tr>
                        {customer.latestLoan && (
                          <tr className="bg-blue-50 border-t border-blue-100" key={`expanded-${customer.mongoId || customer.customerId}`}>
                            <td colSpan={6} className="px-6 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2 flex items-center gap-1 text-blue-700"><span>💳</span> Latest Loan Details</h4>
                                  <div className="text-sm">
                                    <p>Amount: <span className="font-bold text-blue-800">{formatCurrency(customer.latestLoan.amount)}</span></p>
                                    <p>Term: {customer.latestLoan.term} months</p>
                                    <p>Interest Rate: {Number(customer.latestLoan.interestRate)}%</p>
                                    <p>Monthly Payment: {formatCurrency(customer.latestLoan.monthlyPayment)}</p>
                                    <p>Total Payment: {formatCurrency(customer.latestLoan.totalPayment)}</p>
                                    <p>Status: <span className="capitalize font-semibold text-blue-700">{customer.latestLoan.status}</span></p>
                                    {customer.latestLoan.depositedBank && (
                                      <p>Bank: {customer.latestLoan.depositedBank}</p>
                                    )}
                                    {customer.latestLoan.renewalDate && (
                                      <p>Renewal Date: {formatDate(customer.latestLoan.renewalDate.toString())}</p>
                                    )}
                                  </div>
                                </div>
                                {customer.goldItems && customer.goldItems.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-1 text-blue-700"><span>🪙</span> Gold Items</h4>
                                    <div className="text-sm">
                                      {customer.goldItems.map((item, index) => (
                                        <div key={item.description + index} className="mb-2">
                                          <p>Item {index + 1}: <span className="font-semibold">{item.description}</span></p>
                                          <p className="ml-4">Gross Weight: {item.grossWeight}g</p>
                                          <p className="ml-4">Net Weight: {item.netWeight}g</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                          No customers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-white rounded-xl shadow-xl">
          <DialogTitle className="!bg-gradient-to-r !from-blue-400 !to-cyan-500 !text-white !rounded-t-xl !py-5 !px-8 flex items-center gap-3">
            <span className="text-2xl">📝</span> Edit Customer Details
          </DialogTitle>
          <DialogContent className="!py-8 !px-8">
            {selectedCustomer && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TextField
                    fullWidth
                    label="Name"
                    value={selectedCustomer.name}
                    margin="normal"
                    onChange={e => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })}
                    className="bg-white rounded-lg shadow-sm"
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    value={selectedCustomer.email}
                    margin="normal"
                    onChange={e => setSelectedCustomer({ ...selectedCustomer, email: e.target.value })}
                    className="bg-white rounded-lg shadow-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TextField
                    fullWidth
                    label="Aadhar Number"
                    value={selectedCustomer.aadharNumber}
                    margin="normal"
                    onChange={e => setSelectedCustomer({ ...selectedCustomer, aadharNumber: e.target.value })}
                    className="bg-white rounded-lg shadow-sm"
                  />
                  <TextField
                    fullWidth
                    label="Primary Mobile"
                    value={selectedCustomer.primaryMobile}
                    margin="normal"
                    onChange={e => setSelectedCustomer({ ...selectedCustomer, primaryMobile: e.target.value })}
                    className="bg-white rounded-lg shadow-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TextField
                    fullWidth
                    label="Secondary Mobile"
                    value={selectedCustomer.secondaryMobile || ''}
                    margin="normal"
                    onChange={e => setSelectedCustomer({ ...selectedCustomer, secondaryMobile: e.target.value })}
                    className="bg-white rounded-lg shadow-sm"
                  />
                  <TextField
                    fullWidth
                    label="Present Address"
                    value={selectedCustomer.presentAddress}
                    margin="normal"
                    onChange={e => setSelectedCustomer({ ...selectedCustomer, presentAddress: e.target.value })}
                    className="bg-white rounded-lg shadow-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TextField
                    fullWidth
                    label="Permanent Address"
                    value={selectedCustomer.permanentAddress}
                    margin="normal"
                    onChange={e => setSelectedCustomer({ ...selectedCustomer, permanentAddress: e.target.value })}
                    className="bg-white rounded-lg shadow-sm"
                  />
                  {selectedCustomer.emergencyContact && (
                    <div className="flex flex-col gap-4">
                      <TextField
                        fullWidth
                        label="Emergency Contact Mobile"
                        value={selectedCustomer.emergencyContact.mobile}
                        margin="normal"
                        onChange={e => setSelectedCustomer({ ...selectedCustomer, emergencyContact: { mobile: e.target.value, relation: selectedCustomer.emergencyContact!.relation } })}
                        className="bg-white rounded-lg shadow-sm"
                      />
                      <TextField
                        fullWidth
                        label="Emergency Contact Relation"
                        value={selectedCustomer.emergencyContact.relation}
                        margin="normal"
                        onChange={e => setSelectedCustomer({ ...selectedCustomer, emergencyContact: { mobile: selectedCustomer.emergencyContact!.mobile, relation: e.target.value } })}
                        className="bg-white rounded-lg shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
          <DialogActions className="!px-8 !pb-6">
            <Button onClick={() => setEditDialogOpen(false)} disabled={saving} className="rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 shadow mr-2">Close</Button>
            <Button onClick={handleSaveCustomer} variant="contained" disabled={saving}
              className="rounded-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg px-8 py-2">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </div>
      </Dialog>
    </>
  );
};

export default CustomersPage; 