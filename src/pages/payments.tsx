import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';

const Payments = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Payment Options
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Multiple convenient ways to make your payments
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Online Banking</h3>
            <p className="text-gray-600 mb-4">
              Transfer funds directly through your bank's online portal
            </p>
            <ul className="text-gray-600 space-y-2">
              <li>• Instant transfer</li>
              <li>• 24/7 availability</li>
              <li>• Secure transactions</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">UPI Payment</h3>
            <p className="text-gray-600 mb-4">
              Pay using your preferred UPI app
            </p>
            <ul className="text-gray-600 space-y-2">
              <li>• Quick and easy</li>
              <li>• Zero transaction fees</li>
              <li>• Multiple UPI apps supported</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Branch Payment</h3>
            <p className="text-gray-600 mb-4">
              Visit our branch for in-person payments
            </p>
            <ul className="text-gray-600 space-y-2">
              <li>• Personal assistance</li>
              <li>• Immediate processing</li>
              <li>• Receipt provided</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Need Help?
          </h2>
          <p className="text-gray-600 mb-8">
            Contact our support team for assistance with payments
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#0e1353] hover:bg-[#0a0f3d]"
          >
            Contact Us <FaArrowRight className="ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Payments;