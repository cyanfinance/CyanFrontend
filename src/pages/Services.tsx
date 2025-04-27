import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';

const Services = () => {
  const services = [
    {
      title: "Gold Purchase",
      description: "We buy gold at the best market rates with transparent evaluation.",
      path: "/gold-purchase",
      icon: "💰"
    },
    {
      title: "Bank Buy Back",
      description: "We help you transfer your gold from other banks with hassle-free process.",
      path: "/bank-buy-back",
      icon: "🏦"
    },
    {
      title: "Interest Rates",
      description: "Our Interest Rates are very much considerable when compared to other Partners in the Market.",
      path: "/interest-rates",
      icon: "📊"
    },
    {
      title: "Payments",
      description: "Multiple convenient payment options available.",
      path: "/payments",
      icon: "💳"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Our Services
          </h2>
          <p className="mt-4 text-xl text-gray-500">
            Discover our range of financial services tailored to meet your needs
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
            {services.map((service) => (
              <Link
                key={service.title}
                to={service.path}
                className="relative group bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105"
              >
                <div className="px-6 py-8">
                  <div className="text-4xl mb-4">{service.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {service.description}
                  </p>
                  <div className="flex items-center text-[#0e1353] font-semibold">
                    Learn more <FaArrowRight className="ml-2" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Why Choose Us?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-4">⚡</div>
              <h4 className="text-xl font-semibold mb-2">Quick Processing</h4>
              <p className="text-gray-600">Fast and efficient service with minimal waiting time</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-4">🔒</div>
              <h4 className="text-xl font-semibold mb-2">Secure Storage</h4>
              <p className="text-gray-600">Your valuables are protected in our secure facilities</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-4">💎</div>
              <h4 className="text-xl font-semibold mb-2">Best Rates</h4>
              <p className="text-gray-600">Competitive rates and transparent pricing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
