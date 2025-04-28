import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

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
}

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const { token: rawToken, user } = useAuth();
  const token = rawToken || '';

  useEffect(() => {
    console.log('Admin Customers Page Token:', token);
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

  const toggleCustomerDetails = (customerId: string) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
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
      customer.name.toLowerCase().includes(query) ||
      customer.aadharNumber.includes(query) ||
      customer.customerId.includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.primaryMobile.includes(query) ||
      (customer.secondaryMobile && customer.secondaryMobile.includes(query))
    );
  });

  const handleSaveCustomer = async () => {
    if (!selectedCustomer) return;
    setSaving(true);
    try {
      if (!token) throw new Error('No authentication token found');
      let endpoint = `${API_URL}/admin/customers/${selectedCustomer.mongoId}`;
      if (user && user.role === 'employee') {
        endpoint = `${API_URL}/employee/customers/${selectedCustomer.mongoId}`;
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
    <div className="flex h-screen bg-gray-100">
      {user?.role === 'employee' ? (
        <EmployeeSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      ) : (
        <AdminSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      )}
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Customers</h1>

          <div className="mb-4 flex justify-end">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Name, Aadhar, Mobile, or Email"
              className="p-2 border rounded w-80"
            />
          </div>

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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Summary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <React.Fragment key={customer.mongoId || customer.customerId}>
                      <tr className="hover:bg-gray-50" key={`row-${customer.mongoId || customer.customerId}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.customerId}
                          <div className="text-xs text-gray-500">Aadhar: {customer.aadharNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Primary: {customer.primaryMobile}</div>
                          {customer.secondaryMobile && (
                            <div className="text-sm text-gray-500">Secondary: {customer.secondaryMobile}</div>
                          )}
                          {customer.emergencyContact && (
                            <div className="text-sm text-gray-500">
                              Emergency: {customer.emergencyContact.mobile} ({customer.emergencyContact.relation})
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">Present: {customer.presentAddress}</div>
                          <div className="text-sm text-gray-500">Permanent: {customer.permanentAddress}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Active Loans: {customer.activeLoans}</div>
                          <div className="text-sm text-gray-500">Total Loans: {customer.totalLoans}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setEditDialogOpen(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-900"
                            disabled={!customer.mongoId}
                            title={!customer.mongoId ? 'Cannot edit: No user record found for this customer' : ''}
                          >
                            Edit
                          </button>
                          {user?.role === 'admin' && customer.mongoId && (
                            <button
                              onClick={async () => {
                                if (!window.confirm('Are you sure you want to delete this customer?')) return;
                                try {
                                  const safeToken = token || '';
                                  const res = await fetch(`${API_URL}/admin/customers/${customer.mongoId}`, {
                                    method: 'DELETE',
                                    headers: { 'x-auth-token': safeToken }
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    setCustomers(prev => prev.filter(c => c.mongoId !== customer.mongoId));
                                  } else {
                                    alert(data.message || 'Failed to delete customer');
                                  }
                                } catch (err) {
                                  alert('Failed to delete customer');
                                }
                              }}
                              className="ml-2 text-red-600 hover:text-red-900"
                              title="Delete customer"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedCustomer === customer.customerId && customer.latestLoan && (
                        <tr className="bg-gray-50" key={`expanded-${customer.mongoId || customer.customerId}`}>
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Latest Loan Details</h4>
                                <div className="text-sm">
                                  <p>Amount: {formatCurrency(customer.latestLoan.amount)}</p>
                                  <p>Term: {customer.latestLoan.term} months</p>
                                  <p>Interest Rate: {customer.latestLoan.interestRate}%</p>
                                  <p>Monthly Payment: {formatCurrency(customer.latestLoan.monthlyPayment)}</p>
                                  <p>Total Payment: {formatCurrency(customer.latestLoan.totalPayment)}</p>
                                  <p>Status: <span className="capitalize">{customer.latestLoan.status}</span></p>
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
                                  <h4 className="font-semibold mb-2">Gold Items</h4>
                                  <div className="text-sm">
                                    {customer.goldItems.map((item, index) => (
                                      <div key={item.description + index} className="mb-2">
                                        <p>Item {index + 1}: {item.description}</p>
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
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No customers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Customer Details</DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <div className="space-y-4 mt-2">
              <TextField
                fullWidth
                label="Name"
                value={selectedCustomer.name}
                margin="normal"
                onChange={e => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })}
              />
              <TextField
                fullWidth
                label="Email"
                value={selectedCustomer.email}
                margin="normal"
                onChange={e => setSelectedCustomer({ ...selectedCustomer, email: e.target.value })}
              />
              <TextField
                fullWidth
                label="Aadhar Number"
                value={selectedCustomer.aadharNumber}
                margin="normal"
                onChange={e => setSelectedCustomer({ ...selectedCustomer, aadharNumber: e.target.value })}
              />
              <TextField
                fullWidth
                label="Primary Mobile"
                value={selectedCustomer.primaryMobile}
                margin="normal"
                onChange={e => setSelectedCustomer({ ...selectedCustomer, primaryMobile: e.target.value })}
              />
              <TextField
                fullWidth
                label="Secondary Mobile"
                value={selectedCustomer.secondaryMobile || ''}
                margin="normal"
                onChange={e => setSelectedCustomer({ ...selectedCustomer, secondaryMobile: e.target.value })}
              />
              <TextField
                fullWidth
                label="Present Address"
                value={selectedCustomer.presentAddress}
                margin="normal"
                onChange={e => setSelectedCustomer({ ...selectedCustomer, presentAddress: e.target.value })}
              />
              <TextField
                fullWidth
                label="Permanent Address"
                value={selectedCustomer.permanentAddress}
                margin="normal"
                onChange={e => setSelectedCustomer({ ...selectedCustomer, permanentAddress: e.target.value })}
              />
              {selectedCustomer.emergencyContact && (
                <>
                  <TextField
                    fullWidth
                    label="Emergency Contact Mobile"
                    value={selectedCustomer.emergencyContact.mobile}
                    margin="normal"
                    onChange={e => setSelectedCustomer({ ...selectedCustomer, emergencyContact: { mobile: e.target.value, relation: selectedCustomer.emergencyContact!.relation } })}
                  />
                  <TextField
                    fullWidth
                    label="Emergency Contact Relation"
                    value={selectedCustomer.emergencyContact.relation}
                    margin="normal"
                    onChange={e => setSelectedCustomer({ ...selectedCustomer, emergencyContact: { mobile: selectedCustomer.emergencyContact!.mobile, relation: e.target.value } })}
                  />
                </>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={saving}>Close</Button>
          <Button onClick={handleSaveCustomer} variant="contained" color="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CustomersPage; 