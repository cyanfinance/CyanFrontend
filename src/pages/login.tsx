import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: request OTP, 2: verify OTP
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState('employee'); // default to employee

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/send-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send OTP');
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), otp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Invalid OTP');
      login(data.token, data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      // Navigate based on user role from the response
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'employee') {
        navigate('/employee/dashboard');
      } else if (data.user.role === 'customer') {
        navigate('/customer/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
            Sign in to Cyan Finance
          </Typography>
          <Box sx={{ width: '100%', mb: 3 }}>
            <label htmlFor="userType" style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>Login as</label>
            <select
              id="userType"
              value={userType}
              onChange={e => {
                setUserType(e.target.value);
                setStep(1);
                setError('');
                setIdentifier('');
                setOtp('');
              }}
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginBottom: 8 }}
            >
              <option value="employee">Login as Employee</option>
              <option value="customer">Login as Customer</option>
            </select>
          </Box>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          {step === 1 && (
            <Box component="form" onSubmit={handleRequestOtp} sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="identifier"
                label="Email Address or Mobile Number"
                helperText="Enter your email address or mobile number (e.g., user@example.com or 9876543210)"
                name="identifier"
                autoComplete="username"
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : 'Request OTP'}
              </Button>
            </Box>
          )}
          {step === 2 && (
            <Box component="form" onSubmit={handleVerifyOtp} sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="otp"
                label="Enter OTP"
                name="otp"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
                inputProps={{ maxLength: 6, style: { letterSpacing: '0.3em', textAlign: 'center' } }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 