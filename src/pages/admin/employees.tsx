import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem } from '@mui/material';

const EmployeesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [form, setForm] = useState({
    email: '',
    name: '',
    mobile: '',
    alternateMobile: '',
    role: 'employee',
    aadharNumber: ''
  });
  const [registering, setRegistering] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/employees', {
        headers: { 'x-auth-token': token || '' }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch employees');
      setEmployees(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          mobile: form.mobile,
          alternateMobile: form.alternateMobile,
          role: form.role,
          aadharNumber: form.aadharNumber
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to register employee');
      alert('Employee registered and email sent!');
      setAddDialogOpen(false);
      setForm({ email: '', name: '', mobile: '', alternateMobile: '', role: 'employee', aadharNumber: '' });
      fetchEmployees();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to register employee');
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete employee '${name}'? This action cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/admin/employees/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token || '' }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete employee');
      alert('Employee deleted successfully!');
      fetchEmployees();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete employee');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Employees Management</h1>
          <div className="flex justify-end mb-6">
            <Button variant="contained" color="primary" onClick={() => setAddDialogOpen(true)}>
              Add Employee
            </Button>
          </div>
          {/* Add Employee Dialog */}
          <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Add Employee</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Aadhar Number"
                value={form.aadharNumber}
                onChange={e => setForm({ ...form, aadharNumber: e.target.value })}
                margin="normal"
                inputProps={{ maxLength: 12 }}
                helperText="Must be exactly 12 digits"
              />
              <TextField
                fullWidth
                label="Mobile Number"
                value={form.mobile}
                onChange={e => setForm({ ...form, mobile: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Alternate Mobile Number"
                value={form.alternateMobile}
                onChange={e => setForm({ ...form, alternateMobile: e.target.value })}
                margin="normal"
              />
              <TextField
                select
                fullWidth
                label="Role"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                margin="normal"
              >
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAddDialogOpen(false)} disabled={registering}>Cancel</Button>
              <Button variant="contained" color="primary" onClick={handleRegister} disabled={registering}>
                {registering ? 'Registering...' : 'Register'}
              </Button>
            </DialogActions>
          </Dialog>
          {/* Employee List Table */}
          {loading ? (
            <div>Loading employees...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <table className="min-w-full bg-white border border-gray-200 rounded-lg mt-6">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aadhar Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alternate Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.map(emp => (
                  <tr key={emp._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{emp.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{emp.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{emp.aadharNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{emp.primaryMobile}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{emp.secondaryMobile}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">{emp.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {emp.role === 'employee' && (
                        <Button color="error" variant="outlined" size="small" onClick={() => handleDelete(emp._id, emp.name)}>
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No employees found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage; 