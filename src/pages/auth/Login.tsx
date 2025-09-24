import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: request OTP, 2: verify OTP
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);
  const [otpValidation, setOtpValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    message: string;
  }>({
    isValidating: false,
    isValid: null,
    message: ''
  });
  const navigate = useNavigate();
  const { login } = useAuth();

  // Handler for OTP input changes
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    setOtp(value);
    
    // Clear previous validation state when user starts typing
    if (value.length < 6) {
      setOtpValidation({
        isValidating: false,
        isValid: null,
        message: ''
      });
    }
    
    // Auto-verify when 6 digits are entered
    if (value.length === 6) {
      verifyOtpAutomatically(value);
    }
  };

  // Automatic OTP verification function
  const verifyOtpAutomatically = async (otpValue: string) => {
    if (otpValue.length !== 6 || !/^\d{6}$/.test(otpValue)) {
      return;
    }

    if (otpExpired) {
      setOtpValidation({
        isValidating: false,
        isValid: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
      return;
    }

    setOtpValidation({
      isValidating: true,
      isValid: null,
      message: 'Verifying OTP...'
    });

    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), otp: otpValue })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setOtpValidation({
          isValidating: false,
          isValid: true,
          message: 'OTP verified successfully! ✅'
        });
        setError('');
        
        // Auto-login after successful verification
        login(data.token, {
          id: data.user._id,
          role: data.user.role,
          email: data.user.email,
          name: data.user.name
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Navigate based on role
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
      } else {
        setOtpValidation({
          isValidating: false,
          isValid: false,
          message: 'Wrong OTP. Please check and try again. ❌'
        });
        setError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setOtpValidation({
        isValidating: false,
        isValid: false,
        message: 'Network error. Please try again. ❌'
      });
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    }
  };

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
        body: JSON.stringify({ identifier: identifier.trim() })
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
        body: JSON.stringify({ identifier: identifier.trim() })
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
        body: JSON.stringify({ identifier: identifier.trim(), otp })
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
                <label htmlFor="identifier" className="sr-only">Email address or Mobile number</label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address or Mobile number (e.g., user@example.com or 9876543210)"
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
              <div className="relative">
                <label htmlFor="otp" className="sr-only">OTP</label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  autoComplete="one-time-code"
                  required
                  value={otp}
                  onChange={handleOtpChange}
                  className={`appearance-none rounded relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm tracking-widest text-center ${
                    otpValidation.isValid === true 
                      ? 'border-green-500 bg-green-50' 
                      : otpValidation.isValid === false 
                        ? 'border-red-500 bg-red-50' 
                        : otpExpired 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                  }`}
                  placeholder="Enter OTP"
                  maxLength={6}
                  disabled={loading || otpExpired || otpValidation.isValidating || otpValidation.isValid === true}
                />
                
                {/* Loading spinner */}
                {otpValidation.isValidating && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                
                {/* Success checkmark */}
                {otpValidation.isValid === true && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                
                {/* Error X */}
                {otpValidation.isValid === false && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Validation message */}
              {otpValidation.message && (
                <div className={`mt-2 p-2 rounded-lg text-sm font-medium ${
                  otpValidation.isValid === true 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : otpValidation.isValid === false 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {otpValidation.message}
                </div>
              )}
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
                disabled={loading || otpExpired || otpValidation.isValidating || otpValidation.isValid === true}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  loading || otpExpired || otpValidation.isValidating || otpValidation.isValid === true
                    ? 'bg-blue-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {loading || otpValidation.isValidating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {otpValidation.isValidating ? 'Verifying...' : 'Verifying...'}
                  </>
                ) : otpValidation.isValid === true ? (
                  <>
                    <span>✅</span> OTP Verified - Logging in...
                  </>
                ) : (
                  'Verify OTP'
                )}
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
                  setOtpValidation({
                    isValidating: false,
                    isValid: null,
                    message: ''
                  });
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