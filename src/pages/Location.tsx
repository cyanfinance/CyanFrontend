import React, { useState } from "react";
import { MapPin, Phone, Clock } from "lucide-react";
import { Link } from "react-router-dom";

function Location() {
  const branches = [
    {
      name: "Cyan Finance",
      address: "BK Towers,Akkayyapalem,Visakhapatnam, 530016.",
      phone: "+91-9700049444",
      hours: "Mon-Sat: 9:00 AM - 6:00 PM",
    },
    // {
    //   name: "Delhi Branch",
    //   address: "456 Chandni Chowk, Old Delhi, New Delhi, 110006",
    //   phone: "+91 1234567891",
    //   hours: "Mon-Sat: 9:00 AM - 6:00 PM",
    // },
    // {
    //   name: "Bangalore Branch",
    //   address: "789 MG Road, Central Business District, Bangalore, 560001",
    //   phone: "+91 1234567892",
    //   hours: "Mon-Sat: 9:00 AM - 6:00 PM",
    // },
    // {
    //   name: "Chennai Branch",
    //   address: "321 Anna Salai, Mount Road, Chennai, 600002",
    //   phone: "+91 1234567893",
    //   hours: "Mon-Sat: 9:00 AM - 6:00 PM",
    // },
    // {
    //   name: "Kolkata Branch",
    //   address: "654 Park Street, Central Kolkata, Kolkata, 700016",
    //   phone: "+91 1234567894",
    //   hours: "Mon-Sat: 9:00 AM - 6:00 PM",
    // },
    // {
    //   name: "Hyderabad Branch",
    //   address: "987 Jubilee Hills, Hyderabad, 500133",
    //   phone: "+91 1234567895",
    //   hours: "Mon-Sat: 9:00 AM - 6:00 PM",
    // },
  ];

  const [selectedBranch, setSelectedBranch] = useState(branches[0]); // Default branch

  return (
    <div>
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Locations</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Find your nearest GoldFinance branch. We have multiple locations across major cities in India to serve you better.
        </p>
      </div>

     <center><div className="grid md:grid-cols-2 lg:grid-cols-1 w-1/2 text-start  gap-8  ">
        {branches.map((branch, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition"
            onClick={() => setSelectedBranch(branch)}
          >
           <center><h3 className="text-xl font-semibold text-gray-800 mb-4">{branch.name}</h3></center> 

            <div className="space-y-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-[#0e1353] mt-1 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-700">Address</h4>
                  <p className="text-gray-600">{branch.address}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Phone className="h-5 w-5 text-[#0e1353] mt-1 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-700">Phone</h4>
                  <p className="text-gray-600">{branch.phone}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="h-5 w-5 text-[#0e1353] mt-1 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-700">Business Hours</h4>
                  <p className="text-gray-600">{branch.hours}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        
      </div></center>

      {/* Google Maps Section */}
      <div className="mt-12 bg-white p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Branch Location on Map</h2>
        <p className="text-gray-600 mb-6">Click on a branch above to view its location on the map.</p>

        {/* Google Map displaying the selected branch */}
        <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg">
          <iframe
            src={`https://www.google.com/maps?q=${encodeURIComponent(selectedBranch.address)}&output=embed`}
            width="100%"
            height="100%"
            allowFullScreen=""
            loading="lazy"
            className="border-none"
            title="Google Maps Location"
          ></iframe>
        </div>

        {/* Display Selected Address Below Map */}
        <p className="mt-4 text-lg font-semibold text-gray-800">
          {selectedBranch.name}: {selectedBranch.address}
        </p>
      </div></div>
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

export default Location;
