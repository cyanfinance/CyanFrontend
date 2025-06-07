import { Shield, Clock, Calculator, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
 
export default function goldloan() {
  const features = [
    {
      icon: Shield,
      title: 'Secure Storage',
      description: 'Your gold is stored in our highly secure bank-grade vaults with 24/7 surveillance',
    },
    {
      icon: Clock,
      title: 'Quick Processing',
      description: 'Get your loan approved within 30 minutes after gold evaluation',
    },
    {
      icon: Calculator,
      title: 'Competitive Rates',
      description: 'Enjoy the lowest interest rates in the market starting from 7.5% per annum',
    },
    {
      icon: CheckCircle,
      title: 'Flexible Tenure',
      description: 'Choose loan tenure from 3 months to 3 years based on your convenience',
    },
  ];
 
  const loanTypes = [
    {
      title: 'Gold Ornament Loan',
      description: 'Get loans against your gold jewelry and ornaments',
      minAmount: '₹25,000',
      maxAmount: '₹50,00,000',
    //   interestRate: '7.5%',
    },
    {
      title: 'Gold Coin Loan',
      description: 'Loans against gold coins and bars from certified institutions',
      minAmount: '₹50,000',
      maxAmount: '₹1,00,00,000',
    //   interestRate: '8.0%',
    },
    {
      title: 'Business Gold Loan',
      description: 'Special gold loans for business purposes with higher limits',
      minAmount: '₹1,00,000',
      maxAmount: '₹5,00,00,000',
    //   interestRate: '8.5%',
    },
  ];
 
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-blue-100 min-h-screen items-center justify-center px-12 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Gold Loans Made <span className="text-yellow-600">Simple</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
              Get instant loans against your gold with competitive interest rates and flexible repayment options
            </p>
            <div className="mt-8">
              <Link
                to="/loan-eligibility"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#0e1353] "
              >
                Check Eligibility
              </Link>
           
              <Link
                to="/login"
                className="btn-secondary inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#0e1353] ml-3"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </div>
 
      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Our Gold Loan?</h2>
            <p className="mt-4 text-lg text-gray-600">
              We offer the best-in-class gold loan services with unmatched benefits
            </p>
          </div>
 
          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="relative bg-white p-6 rounded-lg shadow-md">
                <div className="absolute -top-4 left-4">
                  <div className="inline-flex items-center justify-center p-3 bg-[#0e1353] rounded-md">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-base text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* Loan Types Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Gold Loan Types</h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose the gold loan that best suits your needs
            </p>
          </div>
 
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {loanTypes.map((loan) => (
              <div
                key={loan.title}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{loan.title}</h3>
                  <p className="mt-2 text-gray-500">{loan.description}</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Min Amount:</span>
                      <span className="font-medium text-gray-900">{loan.minAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Amount:</span>
                      <span className="font-medium text-gray-900">{loan.maxAmount}</span>
                    </div>
                    {/* <div className="flex justify-between">
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="font-medium text-yellow-600">{loan.interestRate}</span>
                    </div> */}
                  </div>
                  <div className="mt-6">
                    <Link
                      to="/login"
                      className="block w-1/2 text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0e1353] hover:bg-[#0e1353] ml-20"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* CTA Section */}
      <div className="bg-[#0e1353]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-xl text-yellow-100">
              Check your eligibility now and get instant approval
            </p>
            <div className="mt-8">
              <Link
                to="/loan-eligibility"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-black bg-white hover:bg-yellow-50"
              >
                Check Eligibility
              </Link>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}