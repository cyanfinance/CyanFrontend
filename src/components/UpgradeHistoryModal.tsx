import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Avatar
} from '@mui/material';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { API_URL } from '../config';
import axios from 'axios';

interface UpgradeHistoryEntry {
  fromRate: number;
  toRate: number;
  upgradeDate: string;
  reason: string;
  newTermEndDate: string;
  calculatedFromOriginalDate: boolean;
  upgradeLevel: number;
  daysSinceLoanStart: number;
  previousTotalPayment: number;
  newTotalPayment: number;
  previousMonthlyPayment: number;
  newMonthlyPayment: number;
  upgradedBy: {
    id: string;
    name: string;
    type: string;
  };
  notificationSent: boolean;
  nextUpgradeDate?: string;
  nextUpgradeRate?: number;
}

interface TimelineEntry {
  date: string;
  type: 'loan_created' | 'upgrade' | 'future_upgrade';
  title: string;
  description: string;
  rate?: number;
  fromRate?: number;
  toRate?: number;
  level: number;
  isUpgrade: boolean;
  isFuture?: boolean;
  reason?: string;
  previousTotalPayment?: number;
  newTotalPayment?: number;
  previousMonthlyPayment?: number;
  newMonthlyPayment?: number;
  upgradedBy?: {
    id: string;
    name: string;
    type: string;
  };
  nextUpgradeDate?: string;
  nextUpgradeRate?: number;
}

interface UpgradeHistoryData {
  loanId: string;
  customerName: string;
  originalInterestRate: number;
  currentInterestRate: number;
  currentUpgradeLevel: number;
  daysSinceLoanStart: number;
  loanStartDate: string;
  upgradeHistory: UpgradeHistoryEntry[];
  nextUpgradeInfo?: {
    upgradeDate: string;
    fromRate: number;
    toRate: number;
    daysRemaining: number;
    upgradeLevel: number;
  };
  isAtFinalLevel: boolean;
  totalUpgrades: number;
  lastUpgradeDate?: string;
}

interface UpgradeHistoryModalProps {
  open: boolean;
  onClose: () => void;
  loanId: string;
  loanData?: {
    name: string;
    loanId: string;
    amount: number;
    currentInterestRate: number;
    currentUpgradeLevel: number;
  };
}

const UpgradeHistoryModal: React.FC<UpgradeHistoryModalProps> = ({
  open,
  onClose,
  loanId,
  loanData
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeHistory, setUpgradeHistory] = useState<UpgradeHistoryData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

  useEffect(() => {
    if (open && loanId) {
      fetchUpgradeHistory();
    }
  }, [open, loanId]);

  const fetchUpgradeHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole');
      
      // Use appropriate endpoint based on user role
      const endpoint = userRole === 'admin' 
        ? `${API_URL}/admin/loans/${loanId}/upgrade-history`
        : `${API_URL}/employee/loans/${loanId}/upgrade-history`;
      
      const response = await axios.get(endpoint, {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.data.success) {
        setUpgradeHistory(response.data.data.upgradeHistory);
        setTimeline(response.data.data.timeline);
      } else {
        setError('Failed to fetch upgrade history');
      }
    } catch (err: any) {
      console.error('Error fetching upgrade history:', err);
      setError(err.response?.data?.message || 'Failed to fetch upgrade history');
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
      case 1: return 'First Upgrade';
      case 2: return 'Second Upgrade';
      case 3: return 'Third Upgrade';
      default: return 'Original';
    }
  };

  const getTimelineIcon = (entry: TimelineEntry) => {
    if (entry.isFuture) {
      return <Clock size={16} />;
    } else if (entry.isUpgrade) {
      return <TrendingUp size={16} />;
    } else {
      return <CheckCircle size={16} />;
    }
  };

  const getTimelineColor = (entry: TimelineEntry) => {
    if (entry.isFuture) {
      return '#9e9e9e'; // Grey
    } else if (entry.isUpgrade) {
      return getUpgradeLevelColor(entry.level);
    } else {
      return '#4caf50'; // Green
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <TrendingUp className="text-blue-600" size={24} />
          <Box>
            <Typography variant="h6">
              Interest Rate Upgrade History
            </Typography>
            {loanData && (
              <Typography variant="body2" color="text.secondary">
                {loanData.name} - Loan ID: {loanData.loanId}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {upgradeHistory && !loading && (
          <Box>
            {/* Summary Card */}
            <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
              <CardContent>
                <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <DollarSign size={16} className="text-green-600" />
                      <Typography variant="body2" color="text.secondary">
                        Original Rate
                      </Typography>
                    </Box>
                    <Typography variant="h6" color="primary">
                      {Number(upgradeHistory.originalInterestRate)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <TrendingUp size={16} className="text-blue-600" />
                      <Typography variant="body2" color="text.secondary">
                        Current Rate
                      </Typography>
                    </Box>
                    <Typography variant="h6" color="primary">
                      {Number(upgradeHistory.currentInterestRate)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Calendar size={16} className="text-orange-600" />
                      <Typography variant="body2" color="text.secondary">
                        Total Upgrades
                      </Typography>
                    </Box>
                    <Typography variant="h6" color="primary">
                      {upgradeHistory.totalUpgrades}
                    </Typography>
                  </Box>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Clock size={16} className="text-purple-600" />
                      <Typography variant="body2" color="text.secondary">
                        Days Since Start
                      </Typography>
                    </Box>
                    <Typography variant="h6" color="primary">
                      {upgradeHistory.daysSinceLoanStart}
                    </Typography>
                  </Box>
                </Box>

                {upgradeHistory.nextUpgradeInfo && !upgradeHistory.isAtFinalLevel && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AlertTriangle size={16} />
                      <Typography variant="body2">
                        Next upgrade to {upgradeHistory.nextUpgradeInfo.toRate}% in{' '}
                        {upgradeHistory.nextUpgradeInfo.daysRemaining} days
                        ({formatDate(upgradeHistory.nextUpgradeInfo.upgradeDate)})
                      </Typography>
                    </Box>
                  </Alert>
                )}

                {upgradeHistory.isAtFinalLevel && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AlertTriangle size={16} />
                      <Typography variant="body2">
                        This loan has reached the final upgrade level (36%)
                      </Typography>
                    </Box>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Typography variant="h6" gutterBottom>
              Upgrade Timeline
            </Typography>
            
            <Box sx={{ position: 'relative' }}>
              {timeline.map((entry, index) => (
                <Box key={index} sx={{ display: 'flex', mb: 3, position: 'relative' }}>
                  {/* Timeline line */}
                  {index < timeline.length - 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 24,
                        top: 48,
                        bottom: -24,
                        width: 2,
                        bgcolor: 'grey.300',
                        zIndex: 1
                      }}
                    />
                  )}
                  
                  {/* Timeline dot */}
                  <Box sx={{ mr: 3, zIndex: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: getTimelineColor(entry),
                        color: 'white',
                        width: 48,
                        height: 48
                      }}
                    >
                      {getTimelineIcon(entry)}
                    </Avatar>
                  </Box>
                  
                  {/* Timeline content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {entry.title}
                        </Typography>
                        {entry.isUpgrade && (
                          <Chip
                            label={getUpgradeLevelText(entry.level)}
                            size="small"
                            sx={{ 
                              bgcolor: getUpgradeLevelColor(entry.level),
                              color: 'white'
                            }}
                          />
                        )}
                        {entry.isFuture && (
                          <Chip
                            label="Future"
                            size="small"
                            variant="outlined"
                            color="default"
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {formatDate(entry.date)} - {entry.description}
                      </Typography>

                      {entry.isUpgrade && (
                        <Box>
                          <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} mt={1}>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Previous Total Payment
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {formatCurrency(entry.previousTotalPayment || 0)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                New Total Payment
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" color="error">
                                {formatCurrency(entry.newTotalPayment || 0)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Previous Monthly Payment
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {formatCurrency(entry.previousMonthlyPayment || 0)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                New Monthly Payment
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" color="error">
                                {formatCurrency(entry.newMonthlyPayment || 0)}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {entry.upgradedBy && (
                            <Box mt={1}>
                              <Typography variant="body2" color="text.secondary">
                                Upgraded by: {entry.upgradedBy.name} ({entry.upgradedBy.type})
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Paper>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpgradeHistoryModal;
