import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PhotoUpload from './PhotoUpload';
import LoanPrintout from './LoanPrintout';

// Types for props
interface GoldItem {
  description: string;
  grossWeight: string | number;
  netWeight: string | number;
}

interface LoanFormData {
  aadharNumber: string;
  name: string;
  email: string;
  primaryMobile: string;
  secondaryMobile: string;
  emergencyContact: {
    mobile: string;
    relation: string;
  };
  presentAddress: string;
  permanentAddress: string;
  goldItems: GoldItem[];
  interestRate: string | number;
  loanAmount: string | number;
  totalAmount: string | number;
  monthlyPayment: string | number;
  duration: string | number;
}

interface CustomerDetails {
  customerId: string;
  name: string;
  email: string;
  primaryMobile: string;
  secondaryMobile?: string;
  presentAddress: string;
  permanentAddress: string;
  emergencyContact?: {
    mobile?: string;
    relation?: string;
  };
}

interface LoanFormProps {
  apiPrefix: string; // 'admin' or 'employee'
  token: string;
  user: any;
  onSuccess: () => void;
}

const LoanForm: React.FC<LoanFormProps> = ({ apiPrefix, token, user, onSuccess }) => {
  const [formData, setFormData] = useState<LoanFormData>({
    aadharNumber: '',
    name: '',
    email: '',
    primaryMobile: '',
    secondaryMobile: '',
    emergencyContact: { mobile: '', relation: '' },
    presentAddress: '',
    permanentAddress: '',
    goldItems: [{ description: '', grossWeight: '', netWeight: '' }],
    interestRate: '',
    loanAmount: '',
    totalAmount: '',
    monthlyPayment: '',
    duration: '',
  });
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [checkingAadhar, setCheckingAadhar] = useState(false);
  const [loanStep, setLoanStep] = useState<1 | 2 | 3 | 4>(1);
  const [customerEmail, setCustomerEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [customerVerified, setCustomerVerified] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loanOtp, setLoanOtp] = useState('');
  const [loanOtpSent, setLoanOtpSent] = useState(false);
  const [loanOtpVerified, setLoanOtpVerified] = useState(false);
  const [loanOtpError, setLoanOtpError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdLoanId, setCreatedLoanId] = useState<string | null>(null);
  const [goldItemPhotos, setGoldItemPhotos] = useState<{[key: number]: any[]}>({});
  const [showPrintout, setShowPrintout] = useState(false);
  const [createdLoanData, setCreatedLoanData] = useState<any>(null);

  const API_URL = import.meta.env.VITE_API_URL || '';

  // Stepper for progress indication
  const steps = [
    { label: 'Customer Info', icon: '👤' },
    { label: 'Verify OTP', icon: '🔒' },
    { label: 'Loan Details & Photos', icon: '💰' },
  ];

  // Handler for input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Clear any previous mobile number validation errors
    setError(null);
    
    if (name === 'aadharNumber' && value.length === 12) {
      checkAadharNumber(value);
    }
    
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      // Handle number inputs properly - store as string to avoid leading zeros
      const isNumberField = name === 'interestRate' || name === 'loanAmount' || name === 'duration' || name === 'monthlyPayment' || name === 'totalAmount';
      
      setFormData(prev => ({
        ...prev,
        [name]: isNumberField ? (value === '' ? '' : value) : value
      }));
    }
    
    // Validate mobile numbers after updating form data
    setTimeout(() => {
      validateMobileNumbers();
    }, 0);
  };

  // Validate that mobile numbers are different
  const validateMobileNumbers = () => {
    const { primaryMobile, secondaryMobile, emergencyContact } = formData;
    
    // Create a set of non-empty mobile numbers
    const mobileNumbers = new Set([
      primaryMobile?.trim(),
      secondaryMobile?.trim(),
      emergencyContact?.mobile?.trim()
    ].filter(num => num && num.length > 0));
    
    // If we have fewer unique numbers than total non-empty numbers, there are duplicates
    if (mobileNumbers.size < [primaryMobile, secondaryMobile, emergencyContact?.mobile].filter(num => num && num.length > 0).length) {
      setError('Primary Mobile, Secondary Mobile, and Emergency Contact Number must be different');
      return false;
    }
    
    return true;
  };

  // Handler for gold item changes
  const handleGoldItemChange = (index: number, field: keyof GoldItem, value: string) => {
    setFormData(prev => ({
      ...prev,
      goldItems: prev.goldItems.map((item, i) => 
        i === index ? { 
          ...item, 
          [field]: field === 'description' ? value : (value === '' ? '' : value)
        } : item
      )
    }));
  };
  const addGoldItem = () => {
    setFormData(prev => ({
      ...prev,
      goldItems: [...prev.goldItems, { description: '', grossWeight: '', netWeight: '' }]
    }));
  };
  const removeGoldItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      goldItems: prev.goldItems.filter((_, i) => i !== index)
    }));
    
    // Remove photos for this gold item
    setGoldItemPhotos(prev => {
      const newPhotos = { ...prev };
      delete newPhotos[index];
      return newPhotos;
    });
  };

  // Handle photo changes for a specific gold item
  const handleGoldItemPhotosChange = (goldItemIndex: number, photos: any[]) => {
    setGoldItemPhotos(prev => ({
      ...prev,
      [goldItemIndex]: photos
    }));
  };

  // Upload photos for all gold items
  const uploadPhotosForLoan = async (loanId: string) => {
    const uploadPromises: Promise<any>[] = [];

    Object.entries(goldItemPhotos).forEach(([goldItemIndex, photos]) => {
      if (photos && photos.length > 0) {
        const uploadFormData = new FormData();
        uploadFormData.append('goldItemIndex', goldItemIndex);
        uploadFormData.append('description', `Photos for ${formData.goldItems[parseInt(goldItemIndex)]?.description || 'gold item'}`);

        photos.forEach(photo => {
          if (photo.file && !photo.uploaded) {
            uploadFormData.append('photos', photo.file);
          }
        });

        if (uploadFormData.getAll('photos').length > 0) {
          const uploadPromise = fetch(`${API_URL}/loans/${loanId}/photos`, {
            method: 'POST',
            headers: {
              'x-auth-token': token
            },
            body: uploadFormData
          }).then(response => {
            if (!response.ok) {
              throw new Error(`Failed to upload photos for gold item ${parseInt(goldItemIndex) + 1}`);
            }
            return response.json();
          });
          uploadPromises.push(uploadPromise);
        }
      }
    });

    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      aadharNumber: '',
      name: '',
      email: '',
      primaryMobile: '',
      secondaryMobile: '',
      emergencyContact: { mobile: '', relation: '' },
      presentAddress: '',
      permanentAddress: '',
      goldItems: [{ description: '', grossWeight: '', netWeight: '' }],
      interestRate: '',
      loanAmount: '',
      totalAmount: '',
      monthlyPayment: '',
      duration: '',
    });
    setCustomerDetails(null);
    setLoanStep(1);
    setCustomerEmail('');
    setOtp('');
    setCustomerVerified(false);
    setCustomerId(null);
    setCreatedLoanId(null);
    setGoldItemPhotos({});
    setShowPrintout(false);
    setCreatedLoanData(null);
    if (onSuccess) onSuccess();
  };

  const handlePrintoutClose = () => {
    setShowPrintout(false);
    resetForm();
  };

  // Check Aadhar
  const checkAadharNumber = async (aadharNumber: string) => {
    try {
      setCheckingAadhar(true);
      const response = await fetch(`${API_URL}/${apiPrefix}/check-aadhar/${aadharNumber}`, {
        headers: {
          'x-auth-token': token
        }
      });
      const data = await response.json();
      if (data.exists) {
        setCustomerDetails(data.customerDetails);
        setFormData(prev => ({
          ...prev,
          customerId: data.customerDetails.customerId,
          name: data.customerDetails.name,
          email: data.customerDetails.email,
          primaryMobile: data.customerDetails.primaryMobile,
          secondaryMobile: data.customerDetails.secondaryMobile || '',
          presentAddress: data.customerDetails.presentAddress,
          permanentAddress: data.customerDetails.permanentAddress,
          emergencyContact: {
            mobile: data.customerDetails.emergencyContact?.mobile || '',
            relation: data.customerDetails.emergencyContact?.relation || ''
          }
        }));
      } else {
        setCustomerDetails(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check Aadhar number');
    } finally {
      setCheckingAadhar(false);
    }
  };

  // Step 1: Add customer and send OTP
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate mobile numbers are different before submitting
    if (!validateMobileNumbers()) {
      return; // Error is already set by validateMobileNumbers
    }
    
    try {
      const response = await fetch(`${API_URL}/${apiPrefix}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          aadharNumber: formData.aadharNumber,
          name: formData.name,
          email: formData.email,
          primaryMobile: formData.primaryMobile,
          secondaryMobile: formData.secondaryMobile,
          presentAddress: formData.presentAddress,
          permanentAddress: formData.permanentAddress,
          emergencyContact: formData.emergencyContact
        })
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessage = data.errors.map((error: any) => error.msg).join('\n');
          throw new Error(errorMessage);
        } else {
          throw new Error(data.message || 'Failed to add customer');
        }
      }
      setCustomerEmail(formData.email);
      setLoanStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add customer');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch(`${API_URL}/${apiPrefix}/verify-customer-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ email: customerEmail, otp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'OTP verification failed');
      setCustomerVerified(true);
      setCustomerId(data.customer._id);
      setLoanStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    }
  };

  // Step 3: Add loan (only allow if customerVerified)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerVerified) {
      setError('Customer must be verified before adding a loan.');
      return;
    }
    try {
      // Validate Aadhar number
      if (!/^\d{12}$/.test(formData.aadharNumber)) {
        throw new Error('Aadhar number must be exactly 12 digits');
      }
      // Validate required fields
      if (!formData.aadharNumber || !formData.name || !formData.email || !formData.primaryMobile ||
          !formData.presentAddress || !formData.permanentAddress) {
        throw new Error('Please fill in all required fields');
      }
      // Validate mobile numbers are different
      if (!validateMobileNumbers()) {
        return; // Error is already set by validateMobileNumbers
      }
      // Validate gold items
      if (!formData.goldItems.length || !formData.goldItems[0].description ||
          !formData.goldItems[0].grossWeight || !formData.goldItems[0].netWeight ||
          formData.goldItems[0].grossWeight === '' || formData.goldItems[0].netWeight === '') {
        throw new Error('Please add at least one gold item with complete details');
      }
      // Convert numeric values
      const amount = Number(formData.loanAmount);
      const term = Number(formData.duration);
      const interestRate = Number(formData.interestRate);
      const monthlyPayment = Number(formData.monthlyPayment);
      const totalPayment = Number(formData.totalAmount);
      // Validate numeric values
      if (isNaN(amount) || amount < 100) {
        throw new Error('Loan amount must be at least 100');
      }
      if (isNaN(term) || term < 1) {
        throw new Error('Loan duration must be at least 1 month');
      }
      if (isNaN(interestRate) || interestRate < 0) {
        throw new Error('Interest rate cannot be negative');
      }
      if (isNaN(monthlyPayment) || monthlyPayment <= 0) {
        throw new Error('Invalid monthly payment amount');
      }
      if (isNaN(totalPayment) || totalPayment <= 0) {
        throw new Error('Invalid total payment amount');
      }
      const requestData = {
        customerId: formData.aadharNumber,
        aadharNumber: formData.aadharNumber,
        name: formData.name,
        email: formData.email,
        primaryMobile: formData.primaryMobile,
        secondaryMobile: formData.secondaryMobile,
        presentAddress: formData.presentAddress,
        permanentAddress: formData.permanentAddress,
        emergencyContact: formData.emergencyContact,
        goldItems: formData.goldItems.map(item => ({
          ...item,
          grossWeight: Number(item.grossWeight),
          netWeight: Number(item.netWeight)
        })),
        interestRate,
        amount,
        term,
        monthlyPayment,
        totalPayment,
        createdBy: user.id
      };
      const response = await fetch(`${API_URL}/${apiPrefix}/loans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(requestData)
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessage = data.errors.map((error: any) => error.msg).join('\n');
          throw new Error(errorMessage);
        } else {
          throw new Error(data.message || 'Failed to create loan');
        }
      }
      // Store the created loan ID for photo uploads
      setCreatedLoanId(data.data._id);
      
      // Upload photos if any were selected
      await uploadPhotosForLoan(data.data._id);
      
      // Store loan data for printout
      setCreatedLoanData({
        ...data.data,
        createdBy: {
          name: user.name,
          email: user.email
        }
      });
      
      // Show printout instead of alert
      setShowPrintout(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create loan');
    }
  };

  useEffect(() => {
    const recalc = async () => {
      const principal = Number(formData.loanAmount);
      const yearlyRate = Number(formData.interestRate);
      const months = Number(formData.duration);
      if (principal > 0 && yearlyRate > 0 && months > 0) {
        try {
          const disbursementDate = new Date();
          const closureDate = new Date(disbursementDate.getTime());
          closureDate.setMonth(closureDate.getMonth() + months);
          const res = await fetch(`${API_URL}/loans/calculate-interest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              principal,
              annualRate: yearlyRate,
              disbursementDate: disbursementDate.toISOString(),
              closureDate: closureDate.toISOString()
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Calculation failed');
          setFormData(prev => ({
            ...prev,
            monthlyPayment: Math.round(data.totalAmount / months).toString(),
            totalAmount: data.totalAmount.toString()
          }));
        } catch {
          setFormData(prev => ({
            ...prev,
            monthlyPayment: '',
            totalAmount: ''
          }));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          monthlyPayment: '',
          totalAmount: ''
        }));
      }
    };
    recalc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.loanAmount, formData.interestRate, formData.duration]);

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="w-full max-w-3xl bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12 border border-blue-100 relative animate-fade-in">
        {/* Stepper */}
        <div className="flex justify-between items-center mb-10">
          {steps.map((step, idx) => (
            <div key={step.label} className="flex-1 flex flex-col items-center">
              <div className={`w-12 h-12 flex items-center justify-center rounded-full text-2xl font-bold mb-2 transition-all duration-300 ${loanStep === idx + 1 ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white shadow-lg scale-110' : 'bg-blue-100 text-blue-400'}`}>{step.icon}</div>
              <span className={`text-xs font-semibold tracking-wide ${loanStep === idx + 1 ? 'text-blue-700' : 'text-blue-300'}`}>{step.label}</span>
              {idx < steps.length - 1 && <div className="w-full h-1 bg-gradient-to-r from-blue-200 to-cyan-200 my-2 rounded-full" />}
            </div>
          ))}
        </div>
        {/* Error display block */}
        {error && (
          <div className="mb-4">
            {error.includes('\n') ? (
              <ul className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 list-disc list-inside">
                {error.split('\n').map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            ) : (
              <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3">{error}</div>
            )}
          </div>
        )}
        {/* Step 1: Add customer */}
        {loanStep === 1 && (
          <form onSubmit={handleAddCustomer} className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600 mb-2 flex items-center gap-2"><span className="text-2xl">👤</span> Personal Info</h3>
                <label className="block text-sm font-semibold text-gray-700">Aadhar Number
                  <span className="block text-xs text-gray-400">12-digit unique ID</span>
                </label>
                <input type="text" name="aadharNumber" value={formData.aadharNumber} onChange={handleInputChange} placeholder="Aadhar Number" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" required />
                <label className="block text-sm font-semibold text-gray-700">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Full Name" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" required />
                <label className="block text-sm font-semibold text-gray-700">Email
                  <span className="block text-xs text-gray-400">OTP will be sent here</span>
                </label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email Address" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" required />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600 mb-2 flex items-center gap-2"><span className="text-2xl">📞</span> Contact Info</h3>
                <label className="block text-sm font-semibold text-gray-700">Primary Mobile</label>
                <input type="tel" name="primaryMobile" value={formData.primaryMobile} onChange={handleInputChange} placeholder="Primary Mobile Number" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" required />
                <label className="block text-sm font-semibold text-gray-700">Secondary Mobile</label>
                <input type="tel" name="secondaryMobile" value={formData.secondaryMobile} onChange={handleInputChange} placeholder="Secondary Mobile Number" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" />
                <label className="block text-sm font-semibold text-gray-700">Emergency Contact Number</label>
                <input type="tel" name="emergencyContact.mobile" value={formData.emergencyContact.mobile} onChange={handleInputChange} placeholder="Emergency Contact Number" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" required />
                <label className="block text-sm font-semibold text-gray-700">Relation with Emergency Contact
                  <span className="block text-xs text-gray-400">e.g., Father, Mother</span>
                </label>
                <input type="text" name="emergencyContact.relation" value={formData.emergencyContact.relation} onChange={handleInputChange} placeholder="Relation (e.g., Father, Mother)" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" required />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600 mb-2 flex items-center gap-2"><span className="text-2xl">🏠</span> Address</h3>
              <label className="block text-sm font-semibold text-gray-700">Present Address</label>
              <textarea name="presentAddress" value={formData.presentAddress} onChange={handleInputChange} placeholder="Present Address" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" required />
              <label className="block text-sm font-semibold text-gray-700">Permanent Address</label>
              <textarea name="permanentAddress" value={formData.permanentAddress} onChange={handleInputChange} placeholder="Permanent Address" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" required />
            </div>
            <div className="flex justify-end mt-8">
              <button type="submit" className="bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-500 hover:to-blue-700 text-white px-10 py-4 rounded-2xl text-lg font-bold shadow-xl flex items-center gap-2 transition-all duration-200">
                <span>📧</span> Add Customer & Send OTP
              </button>
            </div>
          </form>
        )}
        {/* Step 2: OTP verification */}
        {loanStep === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6 max-w-md mx-auto bg-white/80 shadow-xl rounded-2xl p-8 mt-8 mb-12 border border-cyan-200 animate-fade-in">
            <h2 className="flex items-center gap-2 text-xl font-bold text-blue-700 mb-4"><span>📱</span> Verify Customer Mobile Number</h2>
            <p className="text-gray-500 mb-6 text-sm">Enter the One-Time Password (OTP) sent to the customer's <strong>mobile number</strong> to verify their identity before proceeding with the loan process.</p>
            <div>
              <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-1">OTP Code</label>
              <input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 transition-all duration-200 tracking-widest text-lg text-center bg-white/90"
                maxLength={6}
              />
              <p className="text-xs text-gray-400 mt-1">Didn't receive the OTP? Ask the customer to check their mobile phone or resend the OTP.</p>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-500 hover:to-blue-700 text-white py-4 rounded-2xl text-lg font-bold shadow-xl flex items-center gap-2 justify-center transition-all duration-200">
              <span>✅</span> Verify OTP
            </button>
          </form>
        )}
        {/* Step 3: Loan details */}
        {loanStep === 3 && customerVerified && (
          <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-xl font-bold text-blue-700 mb-2"><span>👤</span> Customer Details</h2>
                <label className="block text-sm font-semibold text-gray-700">Aadhar Number
                  <span className="block text-xs text-gray-400">12-digit unique ID</span>
                </label>
                <input type="text" name="aadharNumber" value={formData.aadharNumber} onChange={handleInputChange} placeholder="Aadhar Number" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" required />
                <label className="block text-sm font-semibold text-gray-700">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Full Name" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" required />
                <label className="block text-sm font-semibold text-gray-700">Email
                  <span className="block text-xs text-gray-400">We'll send an OTP for verification</span>
                </label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email Address" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" required />
                <label className="block text-sm font-semibold text-gray-700">Primary Mobile</label>
                <input type="tel" name="primaryMobile" value={formData.primaryMobile} onChange={handleInputChange} placeholder="Primary Mobile Number" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" required />
                <label className="block text-sm font-semibold text-gray-700">Secondary Mobile</label>
                <input type="tel" name="secondaryMobile" value={formData.secondaryMobile} onChange={handleInputChange} placeholder="Secondary Mobile Number" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" />
              </div>
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-xl font-bold text-blue-700 mb-2"><span>📞</span> Emergency Contact</h2>
                <label className="block text-sm font-semibold text-gray-700">Contact Number</label>
                <input type="tel" name="emergencyContact.mobile" value={formData.emergencyContact.mobile} onChange={handleInputChange} placeholder="Emergency Contact Number" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" required />
                <label className="block text-sm font-semibold text-gray-700">Relation
                  <span className="block text-xs text-gray-400">e.g., Father, Mother</span>
                </label>
                <input type="text" name="emergencyContact.relation" value={formData.emergencyContact.relation} onChange={handleInputChange} placeholder="Relation (e.g., Father, Mother)" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" required />
                <h2 className="flex items-center gap-2 text-xl font-bold text-blue-700 mt-6 mb-2"><span>🏠</span> Address</h2>
                <label className="block text-sm font-semibold text-gray-700">Present Address</label>
                <textarea name="presentAddress" value={formData.presentAddress} onChange={handleInputChange} placeholder="Present Address" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" required />
                <label className="block text-sm font-semibold text-gray-700">Permanent Address</label>
                <textarea name="permanentAddress" value={formData.permanentAddress} onChange={handleInputChange} placeholder="Permanent Address" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80" required />
              </div>
            </div>
            <div className="mt-8">
                <h2 className="flex items-center gap-2 text-xl font-bold text-yellow-700 mb-2"><span>🪙</span> Gold Items</h2>
                {formData.goldItems.map((item, index) => (
                  <div key={index} className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Description</label>
                        <input type="text" value={item.description} onChange={e => handleGoldItemChange(index, 'description', e.target.value)} placeholder="Gold Item Description" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-200 bg-white/80" required />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Gross Weight (g)</label>
                        <input type="number" value={item.grossWeight} onChange={e => handleGoldItemChange(index, 'grossWeight', e.target.value)} placeholder="Gross Weight" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-200 bg-white/80" min="0" step="0.01" required />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Net Weight (g)</label>
                        <input type="number" value={item.netWeight} onChange={e => handleGoldItemChange(index, 'netWeight', e.target.value)} placeholder="Net Weight" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-200 bg-white/80" min="0" step="0.01" required />
                      </div>
                    </div>
                    
                    {/* Photo Upload Section for this Gold Item */}
                    <div className="border-t border-yellow-300 pt-4">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                        <span>📸</span> Photos for {item.description || `Gold Item ${index + 1}`}
                      </h3>
                      <PhotoUpload
                        loanId="temp" // Will be replaced when loan is created
                        goldItemIndex={index}
                        token={token}
                        onPhotosChange={(photos) => handleGoldItemPhotosChange(index, photos)}
                        maxPhotos={3}
                        className="max-w-full"
                      />
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <button type="button" onClick={() => removeGoldItem(index)} className="text-red-600 hover:underline font-semibold" disabled={formData.goldItems.length === 1}>Remove Gold Item</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addGoldItem} className="bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white px-5 py-2 rounded-lg mt-2 font-semibold shadow">+ Add Gold Item</button>
              </div>
            <div className="space-y-4 mt-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-yellow-700 mb-2"><span>💰</span> Loan Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Interest Rate (%)</label>
                  <input type="number" name="interestRate" value={formData.interestRate} onChange={handleInputChange} placeholder="Annual Interest Rate" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-200 bg-white/80" min="0" step="0.01" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Loan Amount (₹)</label>
                  <input type="number" name="loanAmount" value={formData.loanAmount} onChange={handleInputChange} placeholder="Loan Amount" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-200 bg-white/80" min="100" step="1" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Duration (months)</label>
                  <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} placeholder="Loan Duration" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-200 bg-white/80" min="1" step="1" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Monthly Payment (₹)</label>
                  <input type="number" name="monthlyPayment" value={formData.monthlyPayment} onChange={handleInputChange} placeholder="Monthly Payment" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-200 bg-white/80" min="0" step="1" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Total Amount to be Paid (₹)</label>
                  <input type="number" name="totalAmount" value={formData.totalAmount} onChange={handleInputChange} placeholder="Total Amount" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-200 bg-white/80" min="0" step="1" required />
                </div>
              </div>
              
            </div>
            <div className="flex justify-end mt-10">
              <button type="submit" className="bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-500 hover:to-blue-700 text-white px-10 py-4 rounded-2xl text-lg font-bold shadow-xl flex items-center gap-2 transition-all duration-200">
                <span>🚀</span> Create Loan with Photos
              </button>
            </div>
          </form>
        )}

      </div>

      {/* Loan Printout Modal */}
      {showPrintout && createdLoanData && (
        <LoanPrintout
          loanData={createdLoanData}
          onClose={handlePrintoutClose}
        />
      )}
    </div>
  );
};

export default LoanForm; 