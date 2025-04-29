import { Shield, Award, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
 
function About() {
  return (
    <div>
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About Cyan Finance</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          With over two decades of experience in the gold loan industry, we've helped thousands of customers unlock the value of their gold assets with transparency and trust.
        </p>
      </div>
 
      <div className="grid md:grid-cols-2 gap-12 mb-16">
        <div>
          <video
            controls
            className="rounded-lg shadow-lg w-full h-[600px] object-cover"
          >
            <source
              src="src/components/WhatsApp Video 2025-04-01 at 17.02.44_38fe5129.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
         
        </div>
        <div className="flex flex-col px-6 justify-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <p className="text-gray-600 mb-4">
            Founded in 2011, we started as a small gold finance company and our mission is to provide accessible financial solutions to everyone through transparent and secure gold loans.
          </p>
          <p className="text-gray-600">
            We combine traditional values with modern technology to offer you the best gold loan services in the industry. Our expert team ensures that you get the maximum value for your gold while maintaining the highest security standards.
          </p>
        </div>
      </div>
 
      <div className="grid md:grid-cols-3 gap-8 mb-16">
       
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
         
          <Shield className="h-12 w-12 text-[#0e1353] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Secure Storage</h3>
          <p className="text-gray-600">
            Your gold is stored in state-of-the-art vaults with 24/7 security monitoring and insurance coverage.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <Award className="h-12 w-12 text-[#0e1353] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Industry Leaders</h3>
          <p className="text-gray-600">
            Recognized as one of India's most trusted gold loan providers with numerous industry awards.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <Clock className="h-12 w-12 text-[#0e1353] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Quick Processing</h3>
          <p className="text-gray-600">
            Get your loan approved within hours with minimal documentation requirements.
          </p>
        </div>
      </div>
 
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Numbers Speak</h2>
        <div className="grid md:grid-cols-5 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-[#0e1353] mb-2">13+</div>
            <div className="text-gray-600">Years of Experience</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#0e1353] mb-2">1</div>
            <div className="text-gray-600">Branches</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#0e1353] mb-2">790+</div>
            <div className="text-gray-600">Released Bank Loans</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#0e1353] mb-2">231+</div>
            <div className="text-gray-600">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#0e1353] mb-2">1463</div>
            <div className="text-gray-600">Loans Disbursed</div>
          </div>
        </div>
      </div>
     
    </div>
    {/* CTA Section */}
    <div className="bg-[#0e1353]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
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
          </div>
        </div>
      </div>
    </div>
  );
}
 
export default About;
 