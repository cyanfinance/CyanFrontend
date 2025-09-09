import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Login = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: request OTP, 2: verify OTP
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Countdown timer for resend cooldown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  // OTP expiration timer (3 minutes)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && !otpExpired) {
      const startTime = Date.now();
      const expirationTime = 3 * 60 * 1000; // 3 minutes
      
      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= expirationTime) {
          setOtpExpired(true);
          setError('OTP has expired. Please request a new OTP.');
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, otpExpired]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setOtpExpired(false);
    try {
      const response = await fetch(`${API_URL}/auth/send-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send OTP');
      setStep(2);
      setResendCooldown(60); // Start 60-second cooldown
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setError('');
    setResendLoading(true);
    setOtpExpired(false);
    try {
      const response = await fetch(`${API_URL}/auth/send-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email })
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          setResendCooldown(data.timeLeft || 60);
          throw new Error(data.message || 'Please wait before requesting another OTP');
        }
        throw new Error(data.message || 'Failed to resend OTP');
      }
      setResendCooldown(60); // Start 60-second cooldown
      setOtp(''); // Clear previous OTP input
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpExpired) {
      setError('OTP has expired. Please request a new OTP.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Invalid OTP');
      login(data.token, {
        id: data.user._id,
        role: data.user.role,
        email: data.user.email,
        name: data.user.name
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      switch (data.user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'employee':
          navigate('/employee/dashboard');
          break;
        case 'customer':
          navigate('/customer/dashboard');
          break;
        default:
          setError('Invalid user role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Admin, Employee, and Customer Portal
          </p>
        </div>
        {step === 1 && (
          <form className="mt-8 space-y-6" onSubmit={handleRequestOtp}>
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <div className="rounded-md shadow-sm">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
              >
                {loading ? 'Sending OTP...' : 'Request OTP'}
              </button>
            </div>
          </form>
        )}
        {step === 2 && (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <div className="rounded-md shadow-sm">
              <div>
                <label htmlFor="otp" className="sr-only">OTP</label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  autoComplete="one-time-code"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className={`appearance-none rounded relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm tracking-widest text-center ${otpExpired ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Enter OTP"
                  maxLength={6}
                  disabled={loading || otpExpired}
                />
              </div>
            </div>
            
            {/* Resend OTP Section */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || resendLoading || otpExpired}
                className={`text-sm ${resendCooldown > 0 || resendLoading || otpExpired 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:text-blue-800 underline'
                }`}
              >
                {resendLoading ? 'Resending...' : 
                 resendCooldown > 0 ? `Resend OTP in ${formatTime(resendCooldown)}` : 
                 otpExpired ? 'Request New OTP' : 'Resend OTP'}
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || otpExpired}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading || otpExpired ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>

            {/* Back to email input */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                  setOtp('');
                  setOtpExpired(false);
                  setResendCooldown(0);
                }}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                ← Back to email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login; 