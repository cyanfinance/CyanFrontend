import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Pagination,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  Eye,
  AlertTriangle,
  Clock,
  DollarSign,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import { API_URL } from '../config';
import axios from 'axios';
import UpgradeHistoryModal from './UpgradeHistoryModal';

interface UpgradedLoan {
  _id: string;
  loanId: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  amount: number;
  originalInterestRate: number;
  currentInterestRate: number;
  currentUpgradeLevel: number;
  totalUpgrades: number;
  lastUpgradeDate?: string;
  nextUpgradeInfo?: {
    upgradeDate: string;
    fromRate: number;
    toRate: number;
    daysRemaining: number;
    upgradeLevel: number;
  };
  isAtFinalLevel: boolean;
  remainingBalance: number;
  status: string;
  createdAt: string;
  createdBy?: {
    name: string;
    email: string;
  };
  isHighlighted: boolean;
  highlightReason: string;
  highlightColor: string;
}

interface UpgradedLoansListProps {
  refreshTrigger?: number;
}

const UpgradedLoansList: React.FC<UpgradedLoansListProps> = ({ refreshTrigger }) => {
  const [loans, setLoans] = useState<UpgradedLoan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLoans, setTotalLoans] = useState(0);
  const [selectedLoan, setSelectedLoan] = useState<UpgradedLoan | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  useEffect(() => {
    fetchUpgradedLoans();
  }, [currentPage, refreshTrigger]);

  const fetchUpgradedLoans = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole');
      
      // Use appropriate endpoint based on user role
      const endpoint = userRole === 'admin' 
        ? `${API_URL}/admin/loans-with-upgrades`
        : `${API_URL}/employee/loans-with-upgrades`;
      
      const response = await axios.get(endpoint, {
        headers: {
          'x-auth-token': token
        },
        params: {
          page: currentPage,
          limit: 10,
          status: 'active'
        }
      });

      if (response.data.success) {
        setLoans(response.data.data.loans);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalLoans(response.data.data.pagination.totalLoans);
      } else {
        setError('Failed to fetch upgraded loans');
      }
    } catch (err: any) {
      console.error('Error fetching upgraded loans:', err);
      setError(err.response?.data?.message || 'Failed to fetch upgraded loans');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getUpgradeLevelColor = (level: number) => {
    switch (level) {
      case 1: return '#ff9800'; // Orange
      case 2: return '#f44336'; // Red
      case 3: return '#9c27b0'; // Purple
      default: return '#4caf50'; // Green
    }
  };

  const getUpgradeLevelText = (level: number) => {
    switch (level) {
      case 1: return 'Level 1';
      case 2: return 'Level 2';
      case 3: return 'Level 3';
      default: return 'Original';
    }
  };

  const getHighlightColor = (color: string) => {
    switch (color) {
      case 'red': return '#ffebee';
      case 'orange': return '#fff3e0';
      case 'yellow': return '#fffde7';
      default: return '#f5f5f5';
    }
  };

  const handleViewHistory = (loan: UpgradedLoan) => {
    setSelectedLoan(loan);
    setHistoryModalOpen(true);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <TrendingUp className="text-blue-600" size={20} />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                Loans with Interest Rate Upgrades
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {totalLoans} loans have been upgraded (highlighted for attention)
              </Typography>
            </Box>
          </Box>

          {loans.length === 0 ? (
            <Alert severity="info">
              No loans with upgrades found.
            </Alert>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell>Loan Details</TableCell>
                      <TableCell>Interest Rate</TableCell>
                      <TableCell>Upgrade Info</TableCell>
                      <TableCell>Next Upgrade</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loans.map((loan) => (
                      <TableRow 
                        key={loan._id}
                        sx={{ 
                          bgcolor: getHighlightColor(loan.highlightColor),
                          '&:hover': {
                            bgcolor: getHighlightColor(loan.highlightColor),
                            opacity: 0.8
                          }
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {loan.customerName}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                              <Phone size={12} className="text-gray-500" />
                              <Typography variant="caption" color="text.secondary">
                                {loan.customerMobile}
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                              <Mail size={12} className="text-gray-500" />
                              <Typography variant="caption" color="text.secondary">
                                {loan.customerEmail}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {loan.loanId}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                              <DollarSign size={12} className="text-green-600" />
                              <Typography variant="caption" color="text.secondary">
                                {formatCurrency(loan.amount)}
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                              <Calendar size={12} className="text-blue-600" />
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(loan.createdAt)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Original: {Number(loan.originalInterestRate)}%
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="error">
                              Current: {Number(loan.currentInterestRate)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Box>
                            <Chip
                              label={getUpgradeLevelText(loan.currentUpgradeLevel)}
                              size="small"
                              sx={{ 
                                bgcolor: getUpgradeLevelColor(loan.currentUpgradeLevel),
                                color: 'white',
                                mb: 1
                              }}
                            />
                            <Typography variant="caption" display="block" color="text.secondary">
                              {loan.totalUpgrades} upgrade(s)
                            </Typography>
                            {loan.lastUpgradeDate && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                Last: {formatDate(loan.lastUpgradeDate)}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          {loan.nextUpgradeInfo && !loan.isAtFinalLevel ? (
                            <Box>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Clock size={12} className="text-orange-600" />
                                <Typography variant="caption" color="text.secondary">
                                  {loan.nextUpgradeInfo.daysRemaining} days
                                </Typography>
                              </Box>
                              <Typography variant="caption" display="block" color="text.secondary">
                                → {loan.nextUpgradeInfo.toRate}%
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                {formatDate(loan.nextUpgradeInfo.upgradeDate)}
                              </Typography>
                            </Box>
                          ) : loan.isAtFinalLevel ? (
                            <Box display="flex" alignItems="center" gap={1}>
                              <AlertTriangle size={12} className="text-red-600" />
                              <Typography variant="caption" color="error">
                                Final Level
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              No more upgrades
                            </Typography>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Tooltip title="View Upgrade History">
                            <IconButton
                              size="small"
                              onClick={() => handleViewHistory(loan)}
                              sx={{ color: 'primary.main' }}
                            >
                              <Eye size={16} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <UpgradeHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        loanId={selectedLoan?._id || ''}
        loanData={selectedLoan ? {
          name: selectedLoan.customerName,
          loanId: selectedLoan.loanId,
          amount: selectedLoan.amount,
          currentInterestRate: selectedLoan.currentInterestRate,
          currentUpgradeLevel: selectedLoan.currentUpgradeLevel
        } : undefined}
      />
    </Box>
  );
};

export default UpgradedLoansList;
