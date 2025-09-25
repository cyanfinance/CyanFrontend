import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import Navbar from '../../components/Navbar';

const EmployeesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addEmployeeDialogOpen, setAddEmployeeDialogOpen] = useState(false);
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    email: '',
    name: '',
    mobile: '',
    alternateMobile: '',
    role: 'employee',
    aadharNumber: ''
  });
  const [adminForm, setAdminForm] = useState({
    email: '',
    name: '',
    mobile: '',
    alternateMobile: '',
    role: 'admin',
    aadharNumber: ''
  });
  const [editForm, setEditForm] = useState({
    name: '',
    mobile: '',
    alternateMobile: '',
    role: 'employee'
  });
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [registering, setRegistering] = useState(false);
  const [editing, setEditing] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/admin/employees`, {
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

  const handleRegisterEmployee = async () => {
    setRegistering(true);
    try {
      const response = await fetch(`${API_URL}/admin/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          email: employeeForm.email,
          name: employeeForm.name,
          mobile: employeeForm.mobile,
          alternateMobile: employeeForm.alternateMobile,
          role: 'employee',
          aadharNumber: employeeForm.aadharNumber
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to register employee');
      alert('Employee registered and email sent!');
      setAddEmployeeDialogOpen(false);
      setEmployeeForm({ email: '', name: '', mobile: '', alternateMobile: '', role: 'employee', aadharNumber: '' });
      fetchEmployees();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to register employee');
    } finally {
      setRegistering(false);
    }
  };

  const handleRegisterAdmin = async () => {
    setRegistering(true);
    try {
      const response = await fetch(`${API_URL}/admin/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          email: adminForm.email,
          name: adminForm.name,
          mobile: adminForm.mobile,
          alternateMobile: adminForm.alternateMobile,
          role: 'admin',
          aadharNumber: adminForm.aadharNumber
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to register admin');
      alert('Admin registered and email sent!');
      setAddAdminDialogOpen(false);
      setAdminForm({ email: '', name: '', mobile: '', alternateMobile: '', role: 'admin', aadharNumber: '' });
      fetchEmployees();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to register admin');
    } finally {
      setRegistering(false);
    }
  };

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee);
    setEditForm({
      name: employee.name || '',
      mobile: employee.primaryMobile || '',
      alternateMobile: employee.secondaryMobile || '',
      role: employee.role || 'employee'
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedEmployee) return;
    setEditing(true);
    try {
      const response = await fetch(`${API_URL}/admin/employees/${selectedEmployee._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          name: editForm.name,
          primaryMobile: editForm.mobile,
          secondaryMobile: editForm.alternateMobile,
          role: editForm.role
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update employee');
      alert('Employee updated successfully!');
      setEditDialogOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update employee');
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete employee '${name}'? This action cannot be undone.`)) return;
    try {
      const response = await fetch(`${API_URL}/admin/employees/${id}`, {
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
    <>
      <Navbar isSidebarPage={true} sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(open => !open)} />
        <div className={`flex-1 overflow-auto transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
          <div className="p-8">
            <div className="max-w-4xl mx-auto mt-8 bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-yellow-800">Employees Management</h2>
                <div className="flex gap-3">
                  <button
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200"
                    onClick={() => setAddEmployeeDialogOpen(true)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Employee
                  </button>
                  <button
                    className="bg-gradient-to-r from-purple-500 to-purple-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow hover:from-purple-600 hover:to-purple-800 transition-all duration-200"
                    onClick={() => setAddAdminDialogOpen(true)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Add Admin
                  </button>
                </div>
              </div>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading employees...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                  <button 
                    onClick={fetchEmployees}
                    className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden table-fixed">
                  <thead className="bg-yellow-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-700">Aadhar Number</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-700">Mobile</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-700">Alternate Mobile</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-700">Role</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {employees.map(emp => (
                      <tr key={emp._id} className="hover:bg-yellow-50 transition">
                        <td className="px-4 py-3 flex items-center gap-2">
                          <span className="font-semibold">{emp.name}</span>
                        </td>
                        <td className="px-4 py-3">{emp.email}</td>
                        <td className="px-4 py-3">{emp.aadharNumber}</td>
                        <td className="px-4 py-3">{emp.primaryMobile}</td>
                        <td className="px-4 py-3">{emp.secondaryMobile}</td>
                        <td className="px-4 py-3 capitalize font-semibold">{emp.role}</td>
                        <td className="px-4 py-3 flex gap-2 items-center">
                          <button 
                            onClick={() => handleEdit(emp)}
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 flex items-center gap-1"
                          >
                            ✏️ Edit
                          </button>
                          {emp.role.toLowerCase() === 'employee' ? (
                            <button 
                              onClick={() => handleDelete(emp._id, emp.name)}
                              className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 flex items-center gap-1"
                            >
                              🗑️ Delete
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs px-2">Admin cannot be deleted</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={addEmployeeDialogOpen} onClose={() => setAddEmployeeDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{
          style: {
            background: 'rgba(255,255,255,0.85)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            backdropFilter: 'blur(8px)',
            borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.18)'
          }
        }}
      >
        <DialogTitle style={{
          background: 'linear-gradient(90deg, #F59E0B 0%, #FCD34D 100%)',
          color: 'white',
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: 1,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18
        }}>Add New Employee</DialogTitle>
        <DialogContent style={{ background: 'rgba(254, 252, 232, 0.7)', padding: '24px 18px 8px 18px' }}>
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}
          >
            <TextField
              fullWidth
              label="Name"
              value={employeeForm.name}
              onChange={e => setEmployeeForm({ ...employeeForm, name: e.target.value })}
              margin="normal"
              required
              InputProps={{
                style: {
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.95)',
                  fontSize: 15,
                  padding: '7px 12px',
                  height: 38
                }
              }}
              FormHelperTextProps={{ style: { marginLeft: 0 } }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={employeeForm.email}
              onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })}
              margin="normal"
              required
              InputProps={{
                style: {
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.95)',
                  fontSize: 15,
                  padding: '7px 12px',
                  height: 38
                }
              }}
            />
            <TextField
              fullWidth
              label="Aadhar Number"
              value={employeeForm.aadharNumber}
              onChange={e => setEmployeeForm({ ...employeeForm, aadharNumber: e.target.value })}
              margin="normal"
              required
              inputProps={{ maxLength: 12, style: { letterSpacing: '0.12em', fontSize: 15 } }}
              InputProps={{
                style: {
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.95)',
                  fontSize: 15,
                  padding: '7px 12px',
                  height: 38
                }
              }}
            />
            <TextField
              fullWidth
              label="Mobile"
              value={employeeForm.mobile}
              onChange={e => setEmployeeForm({ ...employeeForm, mobile: e.target.value })}
              margin="normal"
              required
              inputProps={{ maxLength: 10, style: { fontSize: 15 } }}
              InputProps={{
                style: {
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.95)',
                  fontSize: 15,
                  padding: '7px 12px',
                  height: 38
                }
              }}
            />
            <TextField
              fullWidth
              label="Alternate Mobile"
              value={employeeForm.alternateMobile}
              onChange={e => setEmployeeForm({ ...employeeForm, alternateMobile: e.target.value })}
              margin="normal"
              inputProps={{ maxLength: 10, style: { fontSize: 15 } }}
              InputProps={{
                style: {
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.95)',
                  fontSize: 15,
                  padding: '7px 12px',
                  height: 38
                }
              }}
            />
            <div className="flex items-center justify-center">
              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-semibold">
                Role: Employee
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions style={{ background: 'rgba(254, 252, 232, 0.7)', borderBottomLeftRadius: 18, borderBottomRightRadius: 18, padding: '14px 18px' }}>
          <Button onClick={() => setAddEmployeeDialogOpen(false)} style={{ color: '#64748b', fontWeight: 600, borderRadius: 8, fontSize: 15, padding: '7px 18px' }}>Cancel</Button>
          <Button onClick={handleRegisterEmployee} variant="contained" style={{
            background: 'linear-gradient(90deg, #F59E0B 0%, #FCD34D 100%)',
            color: 'white',
            fontWeight: 700,
            borderRadius: 8,
            fontSize: 16,
            padding: '8px 26px',
            boxShadow: '0 2px 8px 0 rgba(245,158,11,0.15)',
            textTransform: 'none',
            letterSpacing: 1
          }} disabled={registering}>
            {registering ? 'Registering...' : 'Add Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={addAdminDialogOpen} onClose={() => setAddAdminDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{
          style: {
            background: 'rgba(255,255,255,0.85)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            backdropFilter: 'blur(8px)',
            borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.18)'
          }
        }}
      >
        <DialogTitle style={{
          background: 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)',
          color: 'white',
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: 1,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18
        }}>Add New Admin</DialogTitle>
        <DialogContent style={{ background: 'rgba(245, 243, 255, 0.7)', padding: '24px 18px 8px 18px' }}>
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}
          >
            <TextField
              fullWidth
              label="Name"
              value={adminForm.name}
              onChange={e => setAdminForm({ ...adminForm, name: e.target.value })}
              margin="normal"
              required
              InputProps={{
                style: {
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.95)',
                  fontSize: 15,
                  padding: '7px 12px',
                  height: 38
                }
              }}
              FormHelperTextProps={{ style: { marginLeft: 0 } }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={adminForm.email}
              onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
              margin="normal"
              required
              InputProps={{
                style: {
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.95)',
                  fontSize: 15,
                  padding: '7px 12px',
                  height: 38
                }
              }}
            />
            <TextField
              fullWidth
              label="Aadhar Number"
              value={adminForm.aadharNumber}
              onChange={e => setAdminForm({ ...adminForm, aadharNumber: e.target.value })}
              margin="normal"
              required
              inputProps={{ maxLength: 12, style: { letterSpacing: '0.12em', fontSize: 15 } }}
              InputProps={{
                style: {
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.95)',
                  fontSize: 15,
                  padding: '7px 12px',
                  height: 38
                }
              }}
            />
            <TextField
              fullWidth
              label="Mobile"
              value={adminForm.mobile}
              onChange={e => setAdminForm({ ...adminForm, mobile: e.target.value })}
              margin="normal"
              required
              inputProps={{ maxLength: 10, style: { fontSize: 15 } }}
              InputProps={{
                style: {
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.95)',
                  fontSize: 15,
                  padding: '7px 12px',
                  height: 38
                }
              }}
            />
            <TextField
              fullWidth
              label="Alternate Mobile"
              value={adminForm.alternateMobile}
              onChange={e => setAdminForm({ ...adminForm, alternateMobile: e.target.value })}
              margin="normal"
              inputProps={{ maxLength: 10, style: { fontSize: 15 } }}
              InputProps={{
                style: {
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.95)',
                  fontSize: 15,
                  padding: '7px 12px',
                  height: 38
                }
              }}
            />
            <div className="flex items-center justify-center">
              <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-semibold">
                Role: Admin
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions style={{ background: 'rgba(245, 243, 255, 0.7)', borderBottomLeftRadius: 18, borderBottomRightRadius: 18, padding: '14px 18px' }}>
          <Button onClick={() => setAddAdminDialogOpen(false)} style={{ color: '#64748b', fontWeight: 600, borderRadius: 8, fontSize: 15, padding: '7px 18px' }}>Cancel</Button>
          <Button onClick={handleRegisterAdmin} variant="contained" style={{
            background: 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)',
            color: 'white',
            fontWeight: 700,
            borderRadius: 8,
            fontSize: 16,
            padding: '8px 26px',
            boxShadow: '0 2px 8px 0 rgba(139,92,246,0.15)',
            textTransform: 'none',
            letterSpacing: 1
          }} disabled={registering}>
            {registering ? 'Registering...' : 'Add Admin'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="bg-gradient-to-r from-blue-400 to-blue-600 text-white">Edit Employee</DialogTitle>
        <DialogContent className="bg-blue-50">
          <div className="space-y-4 mt-2">
            <TextField
              fullWidth
              label="Name"
              value={editForm.name}
              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Mobile"
              value={editForm.mobile}
              onChange={e => setEditForm({ ...editForm, mobile: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Alternate Mobile"
              value={editForm.alternateMobile}
              onChange={e => setEditForm({ ...editForm, alternateMobile: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              select
              label="Role"
              value={editForm.role}
              onChange={e => setEditForm({ ...editForm, role: e.target.value })}
              margin="normal"
              required
            >
              <MenuItem value="employee">Employee</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </div>
        </DialogContent>
        <DialogActions className="bg-blue-50">
          <Button onClick={() => setEditDialogOpen(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg px-6 py-2 shadow">Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold rounded-lg px-8 py-2 shadow-lg" disabled={editing}>
            {editing ? 'Updating...' : 'Update Employee'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EmployeesPage; 