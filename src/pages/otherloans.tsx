import { Home, Briefcase, User, Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
 
export default function OtherLoans() {
  const loanTypes = [
    {
      icon: Home,
      title: 'Home Loan',
      description: 'Finance your dream home with competitive interest rates',
      minAmount: '₹5,00,000',
      maxAmount: '₹5,00,00,000',
      interestRate: '6.7%',
    },
    {
      icon: Briefcase,
      title: 'Business Loan',
      description: 'Grow your business with flexible financing options',
      minAmount: '₹1,00,000',
      maxAmount: '₹50,00,000',
      interestRate: '11%',
    },
    {
      icon: User,
      title: 'Personal Loan',
      description: 'Quick personal loans for your immediate needs',
      minAmount: '₹50,000',
      maxAmount: '₹20,00,000',
      interestRate: '10.5%',
    },
    {
      icon: Car,
      title: 'Vehicle Loan',
      description: 'Easy financing for your new vehicle purchase',
      minAmount: '₹1,00,000',
      maxAmount: '₹25,00,000',
      interestRate: '8.5%',
    },
  ];
 
  const features = [
    {
      title: 'Quick Processing',
      description: 'Get loan approval within 24-48 hours',
    },
    {
      title: 'Minimal Documentation',
      description: 'Simple documentation process with digital support',
    },
    {
      title: 'Flexible Repayment',
      description: 'Choose from various repayment options',
    },
    {
      title: 'No Hidden Charges',
      description: 'Transparent fee structure with no surprises',
    },
  ];
 
  return (
    <div className="bg-white">
      <SEO
        title="Other Loans - Home, Business & Personal Loans | Cyan Finance"
        description="Get loans for houses, construction, business, and personal needs with flexible terms and competitive interest rates. Collateral-based loans available."
        keywords="gold loan, gold loan vizag, gold loan visakhapatnam, cyan gold, cyan finance, best gold loan provider, home loan, business loan, personal loan, construction loan, other loans, cyan finance loans"
        url="/other-loans"
      />
      {/* Hero Section */}
      <div className="relative bg-blue-100 min-h-screen items-center justify-center px-12 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Comprehensive Loan Solutions
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
              Find the perfect loan to meet your various financial needs
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
 
      {/* Loan Types Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Available Loan Types</h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose from our range of loan products
            </p>
          </div>
 
          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {loanTypes.map((loan) => (
              <div key={loan.title} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-center">
                    <loan.icon className="h-12 w-12 text-[#0e1353]" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-center text-gray-900">
                    {loan.title}
                  </h3>
                  <p className="mt-2 text-gray-500 text-center">
                    {loan.description}
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Min Amount:</span>
                      <span className="font-medium">{loan.minAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Max Amount:</span>
                      <span className="font-medium">{loan.maxAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Interest Rate:</span>
                      <span className="font-medium text-yellow-600">from {loan.interestRate}</span>
                    </div>
                  </div>
                  <button className="mt-6 w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0e1353]">
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Our Loans?</h2>
            <p className="mt-4 text-lg text-gray-600">
              We offer the best loan features in the market
            </p>
          </div>
 
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white p-6 rounded-lg shadow-md"
              >
                <h3 className="text-lg font-medium text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* Requirements Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Loan Requirements</h2>
            <p className="mt-4 text-lg text-gray-600">
              Basic documents required for loan application
            </p>
          </div>
 
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {[
                  'Valid ID Proof (Aadhar, PAN, etc.)',
                  'Income Proof (Salary Slips, ITR)',
                  'Bank Statements (Last 6 months)',
                  'Address Proof',
                  'Photographs',
                ].map((requirement) => (
                  <li key={requirement} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {requirement}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
 
      {/* CTA Section */}
      <div className="bg-[#0e1353]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              Ready to Apply?
            </h2>
            <p className="mt-4 text-xl text-yellow-100">
              Start your loan application process today
            </p>
            <div className="mt-8">
              <Link
                to="/apply-loan"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-black bg-white "
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}