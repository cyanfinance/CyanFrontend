import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  IconButton,
  Collapse,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { Edit as EditIcon, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { RepaymentModal } from './dashboard';
import { useAuth } from '../../context/AuthContext';

interface GoldItem {
  description: string;
  grossWeight: number;
  netWeight: number;
}

interface Loan {
  _id: string;
  customerId: string;
  name: string;
  email: string;
  primaryMobile: string;
  secondaryMobile?: string;
  presentAddress: string;
  permanentAddress: string;
  emergencyContact: {
    mobile: string;
    relation: string;
  };
  goldItems: GoldItem[];
  amount: number;
  term: number;
  interestRate: number;
  status: 'approved' | 'rejected' | 'active' | 'closed';
  monthlyPayment: number;
  totalPayment: number;
  totalPaid: number;
  createdAt: string;
  depositedBank?: string;
  renewalDate?: string;
}

interface EditableLoan extends Loan {
  depositedBank: string;
  renewalDate: string;
}

const LoansPage = () => {
  const { user, token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<EditableLoan | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [repayLoan, setRepayLoan] = useState<Loan | null>(null);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      if (!token) {
        throw new Error('No authentication token found');
      }
      const url = user?.role === 'employee'
        ? 'http://localhost:5001/api/employee/loans'
        : 'http://localhost:5001/api/admin/loans';
      const response = await fetch(url, {
        headers: {
          'x-auth-token': token
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch loans');
      }
      setLoans(data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching loans:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (loan: Loan) => {
    setSelectedLoan({
      ...loan,
      depositedBank: loan.depositedBank || '',
      renewalDate: loan.renewalDate || '',
      goldItems: loan.goldItems.map(item => ({
        description: item.description || '',
        grossWeight: item.grossWeight || 0,
        netWeight: item.netWeight || 0
      }))
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedLoan) return;

    try {
      if (!token) {
        throw new Error('No authentication token found');
      }
      // Validate gold items before sending
      const invalidGoldItems = selectedLoan.goldItems.filter(
        item => !item.description || item.grossWeight <= 0 || item.netWeight <= 0
      );
      if (invalidGoldItems.length > 0) {
        throw new Error('All gold items must have a description and valid weights');
      }
      const endpoint = user?.role === 'employee'
        ? `http://localhost:5001/api/employee/loans/${selectedLoan._id}`
        : `http://localhost:5001/api/admin/loans/${selectedLoan._id}`;
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          goldItems: selectedLoan.goldItems,
          depositedBank: selectedLoan.depositedBank,
          renewalDate: selectedLoan.renewalDate
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update loan');
      }
      // Refresh loans list
      await fetchLoans();
      setEditDialogOpen(false);
      setSelectedLoan(null);
      // Show success message
      alert('Loan updated successfully');
    } catch (err) {
      console.error('Error updating loan:', err);
      alert(err instanceof Error ? err.message : 'Failed to update loan');
    }
  };

  const handleGoldItemChange = (index: number, field: keyof GoldItem, value: string) => {
    if (!selectedLoan) return;

    const updatedGoldItems = selectedLoan.goldItems.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          [field]: field === 'description' ? value : parseFloat(value) || 0
        };
      }
      return item;
    });

    setSelectedLoan({
      ...selectedLoan,
      goldItems: updatedGoldItems
    });
  };

  const addGoldItem = () => {
    if (!selectedLoan) return;

    setSelectedLoan({
      ...selectedLoan,
      goldItems: [
        ...selectedLoan.goldItems,
        { description: '', grossWeight: 0, netWeight: 0 }
      ]
    });
  };

  const removeGoldItem = (index: number) => {
    if (!selectedLoan) return;

    setSelectedLoan({
      ...selectedLoan,
      goldItems: selectedLoan.goldItems.filter((_, i) => i !== index)
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: Loan['status']) => {
    const colors = {
      approved: 'success.light',
      rejected: 'error.light',
      active: 'info.light',
      closed: 'text.disabled'
    };
    return colors[status];
  };

  // Filter loans based on search
  const filteredLoans = loans.filter((loan) => {
    const query = search.toLowerCase();
    return (
      loan.name.toLowerCase().includes(query) ||
      loan.primaryMobile.includes(query) ||
      (loan.secondaryMobile && loan.secondaryMobile.includes(query)) ||
      loan.customerId.includes(query)
    );
  });

  const handleRepay = async (amount: number, paymentMethod: string, transactionId?: string) => {
    if (!repayLoan) return;
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5001/api/loans/${repayLoan._id}/repay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token || ''
      },
      body: JSON.stringify({ amount, paymentMethod, transactionId })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to process repayment');
    }
    await fetchLoans();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {user?.role === 'employee' ? (
        <EmployeeSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      ) : (
        <AdminSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      )}
      
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Loans Management</h1>
        {/* Search Input */}
        <div className="mb-4 flex justify-end">
          <TextField
            label="Search by Name, Mobile, or Aadhar"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 300 }}
          />
        </div>
        
        {loading && (
          <div className="flex justify-center">
            <CircularProgress />
          </div>
        )}

        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Date</TableCell>
                  <TableCell>Customer Details</TableCell>
                  <TableCell>Loan Details</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLoans.map((loan) => (
                  <React.Fragment key={loan._id}>
                    <TableRow>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => setExpandedRow(expandedRow === loan._id ? null : loan._id)}
                        >
                          {expandedRow === loan._id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{formatDate(loan.createdAt)}</TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">{loan.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {loan.primaryMobile}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {loan.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          Amount: {formatCurrency(loan.amount)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Term: {loan.term} months | Interest: {loan.interestRate}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Monthly: {formatCurrency(loan.monthlyPayment)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total Paid: {formatCurrency(loan.totalPaid)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          To Be Paid: {formatCurrency(loan.totalPayment - loan.totalPaid)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            bgcolor: getStatusColor(loan.status),
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            display: 'inline-block'
                          }}
                        >
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleEditClick(loan)}
                        >
                          <EditIcon />
                        </IconButton>
                        {loan.status === 'active' && (
                          <Button
                            color="warning"
                            size="small"
                            onClick={() => {
                              setRepayLoan(loan);
                              setShowRepaymentModal(true);
                            }}
                            style={{ marginLeft: 8 }}
                          >
                            Repay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                        <Collapse in={expandedRow === loan._id} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              Gold Items
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Description</TableCell>
                                  <TableCell>Gross Weight (g)</TableCell>
                                  <TableCell>Net Weight (g)</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {loan.goldItems.map((item, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell>{item.grossWeight}</TableCell>
                                    <TableCell>{item.netWeight}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            {loan.depositedBank && (
                              <Typography variant="body2" sx={{ mt: 2 }}>
                                Deposited Bank: {loan.depositedBank}
                              </Typography>
                            )}
                            {loan.renewalDate && (
                              <Typography variant="body2">
                                Renewal Date: {formatDate(loan.renewalDate)}
                              </Typography>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Loan Details</DialogTitle>
          <DialogContent>
            {selectedLoan && (
              <div className="space-y-4 mt-4">
                <TextField
                  fullWidth
                  label="Loan Amount"
                  value={selectedLoan.amount}
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
                {/* Only show these fields for admin users */}
                {user?.role !== 'employee' && (
                  <>
                    <TextField
                      fullWidth
                      label="Deposited Bank"
                      value={selectedLoan.depositedBank}
                      onChange={(e) => setSelectedLoan({ ...selectedLoan, depositedBank: e.target.value })}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      type="date"
                      label="Renewal Date"
                      value={selectedLoan.renewalDate ? selectedLoan.renewalDate.split('T')[0] : ''}
                      onChange={(e) => setSelectedLoan({ ...selectedLoan, renewalDate: e.target.value })}
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                    />
                  </>
                )}
                <Typography variant="h6" className="mt-4 mb-2">
                  Gold Items
                </Typography>
                {selectedLoan.goldItems.map((item, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <Typography variant="subtitle1">Item #{index + 1}</Typography>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => removeGoldItem(index)}
                        disabled={selectedLoan.goldItems.length === 1}
                        size="small"
                      >
                        Remove Item
                      </Button>
                    </div>
                    <TextField
                      fullWidth
                      label="Description"
                      value={item.description}
                      onChange={(e) => handleGoldItemChange(index, 'description', e.target.value)}
                      margin="normal"
                    />
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <TextField
                        label="Gross Weight (g)"
                        type="number"
                        value={item.grossWeight}
                        onChange={(e) => handleGoldItemChange(index, 'grossWeight', e.target.value)}
                        fullWidth
                        margin="normal"
                      />
                      <TextField
                        label="Net Weight (g)"
                        type="number"
                        value={item.netWeight}
                        onChange={(e) => handleGoldItemChange(index, 'netWeight', e.target.value)}
                        fullWidth
                        margin="normal"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={addGoldItem}
                  className="mt-4 mb-4"
                  fullWidth
                >
                  Add New Gold Item
                </Button>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} variant="contained" color="primary">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {showRepaymentModal && repayLoan && (
          <RepaymentModal
            loan={repayLoan}
            onClose={() => {
              setShowRepaymentModal(false);
              setRepayLoan(null);
            }}
            onRepay={handleRepay}
          />
        )}
      </div>
    </div>
  );
};

export default LoansPage; 