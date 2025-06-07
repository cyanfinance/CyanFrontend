import { Star, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GoldPurchase() {
  const products = [
    {
      id: 1,
      name: '24K Gold Coin',
      weight: '10 grams',
      purity: '99.9%',
      price: '₹62,000',
      image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d',
    },
    {
      id: 2,
      name: '22K Gold Bar',
      weight: '20 grams',
      purity: '91.6%',
      price: '₹1,15,000',
      image: 'https://images.unsplash.com/photo-1624365169364-0640dd10e180',
    },
    {
      id: 3,
      name: '24K Gold Bar',
      weight: '50 grams',
      purity: '99.9%',
      price: '₹3,10,000',
      image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d',
    },
  ];

  const features = [
    {
      icon: Star,
      title: 'Certified Purity',
      description: 'All our gold products are BIS hallmarked and certified for purity',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Purchase',
      description: 'End-to-end secured transaction with buyback guarantee',
    },
    {
      icon: Truck,
      title: 'Insured Delivery',
      description: 'Free insured delivery to your doorstep or bank locker',
    },
    {
      icon: RefreshCw,
      title: 'Easy Buyback',
      description: 'Hassle-free buyback at transparent market rates',
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-blue-100 min-h-screen items-center justify-center px-12 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Purchase Pure Gold at Best Rates
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
              Buy certified gold coins and bars with assured purity and secure delivery
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
            <h2 className="text-3xl font-bold text-gray-900">Why Buy Gold From Us?</h2>
            <p className="mt-4 text-lg text-gray-600">
              We ensure the highest standards of purity and security
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

      {/* Products Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Available Products</h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose from our range of certified gold products
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="aspect-w-3 aspect-h-2">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weight:</span>
                      <span className="font-medium text-gray-900">{product.weight}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Purity:</span>
                      <span className="font-medium text-gray-900">{product.purity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium text-[#0e1353]">{product.price}</span>
                    </div>
                  </div>
                  <button className="mt-6 w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0e1353]">
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Purchase Process Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">How to Purchase</h2>
            <p className="mt-4 text-lg text-gray-600">
              Simple steps to buy gold from us
            </p>
          </div>

          <div className="mt-16">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-between">
                {[
                  'Select Product',
                  'Make Payment',
                  'Verify Details',
                  'Secure Delivery',
                ].map((step, index) => (
                  <div
                    key={step}
                    className="bg-white px-4"
                  >
                    <span className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#0e1353] bg-white text-xl font-semibold text-[#0e1353]">
                      {index + 1}
                    </span>
                    <p className="mt-2 text-sm font-medium text-gray-900">{step}</p>
                  </div>
                ))}
              </div>
            </div>
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