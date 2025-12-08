import { Info, Shield, Percent } from 'lucide-react';
import GoldCalculator from '../components/GoldCalculator';
import SEO from '../components/SEO';

 
function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": "Cyan Finance",
    "alternateName": "Cyan Gold",
    "description": "Most Trusted Gold Loan Partner Since 2011. Get secure gold loans at best rates in Visakhapatnam, Vizag.",
    "url": "https://cyangold.in",
    "logo": "https://cyangold.in/golditems.png",
    "foundingDate": "2011",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "BK Towers, Akkayyapalem",
      "addressLocality": "Visakhapatnam",
      "addressRegion": "Andhra Pradesh",
      "postalCode": "530016",
      "addressCountry": "IN"
    },
    "serviceType": "Gold Loan",
    "areaServed": {
      "@type": "City",
      "name": "Visakhapatnam"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Gold Loan Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Gold Loan Vizag",
            "description": "Best gold loan provider in Visakhapatnam"
          }
        }
      ]
    }
  };

  return (
    <div>
      <SEO
        title="Cyan Finance - Best Gold Loan Provider in Visakhapatnam | Vizag Gold Loan"
        description="Cyan Finance - Best gold loan provider in Visakhapatnam (Vizag). Get secure gold loans at best rates since 2011. Transform your gold into opportunity with competitive loan rates and transparent process."
        keywords="gold loan, gold loan vizag, gold loan visakhapatnam, cyan gold, cyan finance, best gold loan provider, gold loan near me, gold loan rates, secure gold loan, gold loan calculator, best gold loan rates, gold loan partner"
        url="/"
        structuredData={structuredData}
      />
      <div className=" bg-blue-400 h-400px overflow-hidden items-center justify-center ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center pt-1">
        <p className="text-2xl font-bold text-gray-900 sm:text-5xl md:text-5xl">
          Welcome to Cyan Finance
        </p>
        <p className="mt-2 max-w-2xl mx-auto text-xl text-black">
          Most Trusted GOLD LOAN Partner since 2011.
        </p>
          </div>
        </div>
        {/* <div>
          <img src="https://www.cyanfinance.in/img/handgold1.png" alt="" />
        </div> */}
        <div className="relative w-3/4 h-[300px] overflow-hidden">
  <img
    src="/golditems.png"
    alt="Gold Image"
    className="w-full object-cover object-top"
  />
</div>
 
      </div>
    <div className="max-w-7xl mt-10 mb-10 mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Secure Gold Loans at Best Rates
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Transform your gold into opportunity with our competitive loan rates and transparent process.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <Shield className="h-6 w-6 text-yellow-600 mt-1 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-800">Secure Storage</h3>
                <p className="text-gray-600">Your gold is stored in our highly secure vaults</p>
              </div>
            </div>
            <div className="flex items-start">
              <Percent className="h-6 w-6 text-yellow-600 mt-1 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-800">Competitive Rates</h3>
                <p className="text-gray-600">Get loans at ₹7,000 per gram with minimal interest</p>
              </div>
            </div>
            <div className="flex items-start">
              <Info className="h-6 w-6 text-yellow-600 mt-1 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-800">Quick Processing</h3>
                <p className="text-gray-600">Get your loan approved within hours</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <img
            src="https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80"
            alt="Gold jewelry"
            className="rounded-lg shadow-lg w-full h-[400px] object-cover"
          />
        </div>
      </div>
 
      <div className="mb-12">
        <GoldCalculator />
      </div>
 
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <img
            src="https://i.pinimg.com/736x/39/0d/ae/390daec6136cccca807af6da491cd812.jpg"
            alt="Gold coins"
            className="w-full h-48 object-cover rounded-md mb-4"
          />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Gold Loan</h3>
          <p className="text-gray-600">
            We offer competitive rates for gold purchase with no hidden charges.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <img
            src="https://i.pinimg.com/236x/e2/e6/49/e2e649673ed3b2c48307a4ccfb545c8d.jpg"
            alt="Gold coins"
            className="w-full h-48 object-cover rounded-md mb-4"
          />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Gold Purchase</h3>
          <p className="text-gray-600">
            We offer competitive rates for gold purchase with no hidden charges.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <img
            src="https://i.pinimg.com/736x/3f/34/d0/3f34d085df6f8e879fc8adec09b842d0.jpg"
            alt="Gold bars"
            className="w-full h-48 object-cover rounded-md mb-4"
          />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Bank Buy Back</h3>
          <p className="text-gray-600">
            Easy transfer of gold loans from any bank with no additional charges.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <img
            src="https://i.pinimg.com/236x/56/e5/fd/56e5fdaf21e5d7ef6dc874ec364c465d.jpg"
            alt="Gold coins"
            className="w-full h-48 object-cover rounded-md mb-4"
          />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">interest-rates</h3>
          <p className="text-gray-600">
            We offer competitive rates for gold purchase with no hidden charges.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <img
            src="https://i.pinimg.com/736x/69/68/9f/69689fad596bc7792dbefdc605efaf85.jpg"
            alt="Gold coins"
            className="w-full h-48 object-cover rounded-md mb-4"
          />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">other-loans</h3>
          <p className="text-gray-600">
            We offer competitive rates for gold purchase with no hidden charges.
          </p>
        </div>
       
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <img
            src="https://i.pinimg.com/736x/ef/3a/b9/ef3ab994ca4278eb5a8bac482e60c493.jpg"
            alt="Gold jewelry"
            className="w-full h-48 object-cover rounded-md mb-4"
          />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">payments</h3>
          <p className="text-gray-600">
            Get instant loans with minimal documentation and quick processing.
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
          </div></div>
  );
}
 
export default Home;