import { Scale, TrendingUp, BadgeCheck, Banknote } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function BankBuyback() {
  const features = [
    {
      icon: Scale,
      title: 'Fair Valuation',
      description: 'Get the best market rates for your gold based on live prices',
    },
    {
      icon: TrendingUp,
      title: 'Transparent Pricing',
      description: 'Clear breakdown of valuation with no hidden charges',
    },
    {
      icon: BadgeCheck,
      title: 'Instant Verification',
      description: 'Quick authentication and purity assessment of your gold',
    },
    {
      icon: Banknote,
      title: 'Immediate Payment',
      description: 'Receive payment directly to your bank account within hours',
    },
  ];

  const steps = [
    {
      title: 'Book Appointment',
      description: 'Schedule a convenient time for gold evaluation at our branch',
    },
    {
      title: 'Gold Assessment',
      description: 'Expert evaluation of your gold for purity and weight',
    },
    {
      title: 'Price Quote',
      description: 'Receive transparent pricing based on current market rates',
    },
    {
      title: 'Instant Payment',
      description: 'Accept the quote and receive immediate bank transfer',
    },
  ];

  return (
    <div className="bg-white">
      <SEO
        title="Bank Buy Back - Transfer Gold Loans from Any Bank | Cyan Finance"
        description="Transfer your gold loans from any Private and Public Sector Banks to Cyan Finance with no extra charges. Fair valuation, transparent pricing, and instant verification."
        keywords="gold loan, gold loan vizag, gold loan visakhapatnam, cyan gold, cyan finance, best gold loan provider, bank buy back, gold loan transfer, bank loan takeover, cyan finance bank buy back"
        url="/bank-buy-back"
      />
      {/* Hero Section */}
      <div className="relative bg-blue-100 min-h-screen items-center justify-center px-12 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Gold Buyback Program
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
              Get the best value for your gold with our transparent buyback process
            </p>
            <div className="mt-8">
                          <Link
                            to="/loan-eligibility"
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#0e1353] "
                          >
                            Check Eligibility
                          </Link>
                        
                          <Link
                            to="/apply-loan"
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
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Our Buyback Service?</h2>
            <p className="mt-4 text-lg text-gray-600">
              We offer the most competitive rates with a hassle-free process
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

      {/* Process Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Buyback Process</h2>
            <p className="mt-4 text-lg text-gray-600">
              Simple steps to sell your gold
            </p>
          </div>

          <div className="mt-16">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-between">
                {steps.map((step, index) => (
                  <div
                    key={step.title}
                    className="bg-gray-50 px-4"
                  >
                    <span className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#0e1353] bg-white text-xl font-semibold text-[#0e1353]">
                      {index + 1}
                    </span>
                    <div className="mt-4">
                      <h3 className="text-lg font-medium text-gray-900">{step.title}</h3>
                      <p className="mt-2 text-sm text-gray-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Rates Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Today's Gold Rates</h2>
            <p className="mt-4 text-lg text-gray-600">
              Current buyback rates for different purities
            </p>
          </div>

          <div className="mt-16 max-w-3xl mx-auto">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate per Gram
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate per 10 Grams
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    { purity: '24K (99.9%)', perGram: '₹5,700', per10Gram: '₹57,000' },
                    { purity: '22K (91.6%)', perGram: '₹5,225', per10Gram: '₹52,250' },
                    { purity: '18K (75%)', perGram: '₹4,275', per10Gram: '₹42,750' },
                  ].map((rate) => (
                    <tr key={rate.purity}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {rate.purity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rate.perGram}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rate.per10Gram}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-gray-500 text-center">
              * Rates are indicative and subject to market fluctuations
            </p>
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