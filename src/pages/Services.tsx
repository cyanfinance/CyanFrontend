import { Coins, ShoppingBag, Ban as Bank, Percent, Home, Smartphone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
 
function Services() {
  const navigate = useNavigate();
 
  const services = [
    {
      icon: <Coins className="h-12 w-12 text-[#0e1353]" />,
      title: "Gold Loan",
      description: "We provide gold loans at a rate of ₹7,000 per gram with competitive interest rates.",
      path: "/gold-loan",
 
    },
    {
      icon: <ShoppingBag className="h-12 w-12 text-[#0e1353]" />,
      title: "Gold Purchase",
      description: "We purchase gold at no extra charges with best market rates.",
      path: "/gold-purchase",
 
    },
    {
      icon: <Bank className="h-12 w-12 text-[#0e1353]" />,
      title: "Bank Buy Back",
      description: "We takeover gold from any Private and Public Sector Banks at no extra charges.",
      path: "/bank-buy-back",
 
    },
    {
      icon: <Percent className="h-12 w-12 text-[#0e1353]" />,
      title: "Nominal Interest Rate",
      description: "Our Interest Rates are very much considerable when compared to other Gold Loan Partners in the Market.",
      path: "/interest-rates",
 
    },
    {
      icon: <Home className="h-12 w-12 text-[#0e1353]" />,
      title: "Other Loans",
      description: "We also provide loans for Houses, Construction on Collateral with flexible terms.",
      path: "/other-loans",
 
    },
    {
      icon: <Smartphone className="h-12 w-12 text-[#0e1353]" />,
      title: "Online/Offline Payments",
      description: "Download our Mobile App from Playstore and make Payments either Online/Offline.",
      path: "/payments",
 
    },
  ];
 
  return (
    <div>
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-12">Our Services</h1>
 
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <div key={index} className="relative p-6 rounded-lg bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
          onClick={() => navigate(service.path)}
>
           
            {/* Moving Edge Border */}
            <div className="absolute inset-0 border-2 border-transparent pointer-events-none rounded-lg">
              <div className="absolute h-full w-full border border-blue-500 rounded-lg animate-moveBorder"></div>
            </div>
 
            {/* Content */}
            <div className="relative flex flex-col cursor-pointer items-center text-center  bg-white p-6 rounded-lg">
              <div className="mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
            </div>
          </div>
        ))}
      </div>
     
 
      {/* CSS Animation */}
      <style>
        {`
          @keyframes moveBorder {
            0%   { clip-path: inset(0% 100% 100% 0%); } /* Start at top */
            20%  { clip-path: inset(0% 0% 100% 0%); }   /* Move right */
            40%  { clip-path: inset(0% 0% 0% 100%); }   /* Move bottom */
            60%  { clip-path: inset(100% 0% 0% 0%); }   /* Move left */
            80%  { clip-path: inset(0% 0% 0% 0%); }     /* Complete */
            100% { clip-path: inset(0% 100% 100% 0%); } /* Restart */
          }
 
          .animate-moveBorder {
            position: absolute;
            border-width: 2px;
            border-style: solid;
            border-color: #0e1353;
            animation: moveBorder 5s linear infinite;
          }
        `}
      </style></div>
 
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
 
      {/* CTA Section */}
      <div className="bg-[#0e1353] mt-7">
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
 
export default Services;