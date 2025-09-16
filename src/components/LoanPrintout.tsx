import React, { useState, useEffect } from 'react';

interface LoanPrintoutProps {
  loanData: {
    _id: string;
    loanId: string;
    customerId: string;
    aadharNumber: string;
    name: string;
    email: string;
    primaryMobile: string;
    secondaryMobile: string;
    presentAddress: string;
    permanentAddress: string;
    emergencyContact: {
      mobile: string;
      relation: string;
    };
    goldItems: Array<{
      description: string;
      grossWeight: number;
      netWeight: number;
    }>;
    amount: number;
    term: number;
    interestRate: number;
    monthlyPayment: number;
    totalPayment: number;
    dailyInterestRate: number;
    totalDays: number;
    dailyInterestAmount: number;
    remainingBalance: number;
    status: string;
    createdAt: string;
    createdBy: {
      name: string;
      email: string;
    };
  };
  token: string;
  onClose: () => void;
}

const LoanPrintout: React.FC<LoanPrintoutProps> = ({ loanData, token, onClose }) => {
  const [photos, setPhotos] = useState<{[key: number]: any[]}>({});
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [preparingPrint, setPreparingPrint] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || '';

  // Fetch photos for the loan
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        console.log('Fetching photos for loan:', loanData._id);
        const response = await fetch(`${API_URL}/loans/${loanData._id}/photos/public`);
        console.log('Photos response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Photos response data:', data);
          
          if (data.success && data.data) {
            console.log('Found photos:', data.data.length);
            // Group photos by goldItemIndex
            const groupedPhotos: {[key: number]: any[]} = {};
            data.data.forEach((photo: any) => {
              console.log('Processing photo:', photo.goldItemIndex, photo.filename);
              if (!groupedPhotos[photo.goldItemIndex]) {
                groupedPhotos[photo.goldItemIndex] = [];
              }
              groupedPhotos[photo.goldItemIndex].push(photo);
            });
            console.log('Grouped photos:', groupedPhotos);
            setPhotos(groupedPhotos);
          } else {
            console.log('No photos found or API error');
          }
        } else {
          console.log('Failed to fetch photos, status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setLoadingPhotos(false);
      }
    };

    fetchPhotos();
  }, [loanData._id, API_URL]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getImageUrl = (photo: any) => {
    return `${API_URL}/loans/${loanData._id}/photos/${photo._id}/image`;
  };

  // Convert image to base64 for printing
  const getImageAsBase64 = async (photo: any): Promise<string> => {
    try {
      console.log('Converting image to base64:', photo._id, getImageUrl(photo));
      const response = await fetch(getImageUrl(photo));
      
      console.log('Image fetch response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('Image blob size:', blob.size);
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          console.log('Base64 conversion successful, length:', result.length);
          resolve(result);
        };
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(error);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return '';
    }
  };

  const handlePrint = async () => {
    // Wait for photos to load before printing
    if (loadingPhotos) {
      alert('Please wait for photos to load before printing.');
      return;
    }

    if (preparingPrint) {
      return; // Already preparing
    }

    setPreparingPrint(true);

    // Convert all images to base64 for printing
    const base64Images: {[key: string]: string} = {};
    
    try {
      console.log('Starting base64 conversion for photos:', photos);
      
      // Convert all photos to base64
      for (const [itemIndex, itemPhotos] of Object.entries(photos)) {
        console.log(`Processing item ${itemIndex} with ${itemPhotos.length} photos`);
        for (const photo of itemPhotos) {
          console.log(`Converting photo ${photo._id} for item ${itemIndex}`);
          const base64 = await getImageAsBase64(photo);
          base64Images[`${itemIndex}_${photo._id}`] = base64;
          console.log(`Base64 result for ${photo._id}:`, base64 ? 'SUCCESS' : 'FAILED');
        }
      }

      console.log('Base64 conversion completed. Results:', Object.keys(base64Images));

    } catch (error) {
      console.error('Error preparing images for printing:', error);
      alert('Error preparing images for printing. Please try again.');
      setPreparingPrint(false);
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Loan Agreement - ${loanData.loanId}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
             body {
               font-family: Arial, sans-serif;
               font-size: 14px;
               line-height: 1.4;
               margin: 0;
               padding: 0;
               color: black;
               background: white;
             }
             .loading {
               color: #666;
               font-style: italic;
             }
             .header {
               text-align: center;
               margin-bottom: 15px;
               border-bottom: 2px solid #000;
               padding-bottom: 10px;
             }
             .header h1 {
               font-size: 20px;
               font-weight: bold;
               margin: 0 0 4px 0;
               color: #1e40af;
             }
             .header p {
               margin: 0 0 2px 0;
               color: black;
             }
             .grid {
               display: grid;
               grid-template-columns: 1fr 1fr;
               gap: 12px;
               margin-bottom: 12px;
             }
             .section {
               background: #f9f9f9;
               padding: 8px;
               border: 1px solid #ccc;
             }
             .section h3 {
               font-size: 14px;
               font-weight: 600;
               margin: 0 0 4px 0;
               color: black;
               border-bottom: 1px solid #000;
               padding-bottom: 2px;
             }
             .section div {
               margin-bottom: 2px;
               font-size: 11px;
               color: black;
             }
             table {
               width: 100%;
               border-collapse: collapse;
               margin: 8px 0;
               border: 1px solid #000;
             }
             th, td {
               border: 1px solid #000;
               padding: 4px;
               text-align: left;
               font-size: 11px;
             }
             th {
               background: #e0e0e0;
               color: black;
               font-weight: bold;
             }
             td {
               background: white;
               color: black;
             }
             .text-right {
               text-align: right;
             }
             .terms {
               background: #f5f5f5;
               padding: 8px;
               margin: 12px 0;
               border: 1px solid #000;
             }
             .terms h3 {
               color: black;
               margin: 0 0 4px 0;
               font-size: 14px;
               font-weight: 600;
               border-bottom: 1px solid #000;
               padding-bottom: 2px;
             }
             .terms p {
               margin: 0 0 2px 0;
               font-size: 11px;
               color: black;
             }
             .signatures {
               display: grid;
               grid-template-columns: 1fr 1fr;
               gap: 30px;
               margin: 15px 0;
             }
             .signature {
               text-align: center;
               border-top: 2px solid #000;
               padding-top: 4px;
               background: white;
               padding: 8px;
               border: 1px solid #000;
             }
             .signature div:first-child {
               color: black;
               font-weight: 600;
               font-size: 12px;
             }
             .signature div:last-child {
               color: black;
               font-size: 10px;
             }
             .footer {
               text-align: center;
               font-size: 9px;
               color: black;
               border-top: 1px solid #000;
               padding-top: 4px;
               margin-top: 10px;
               background: white;
               padding: 8px;
             }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CYAN FINANCE</h1>
            <p>Gold Loan Agreement</p>
            <p>Loan ID: ${loanData.loanId}</p>
          </div>

          <div class="grid">
            <div class="section">
              <h3>Customer Information</h3>
              <div><strong>Name:</strong> ${loanData.name}</div>
              <div><strong>Aadhar Number:</strong> ${loanData.aadharNumber}</div>
              <div><strong>Email:</strong> ${loanData.email}</div>
              <div><strong>Primary Mobile:</strong> ${loanData.primaryMobile}</div>
              ${loanData.secondaryMobile ? `<div><strong>Secondary Mobile:</strong> ${loanData.secondaryMobile}</div>` : ''}
              <div><strong>Emergency Contact:</strong> ${loanData.emergencyContact.mobile} (${loanData.emergencyContact.relation})</div>
            </div>

            <div class="section">
              <h3>Address Information</h3>
              <div><strong>Present Address:</strong><br>${loanData.presentAddress}</div>
              ${loanData.permanentAddress ? `<div><strong>Permanent Address:</strong><br>${loanData.permanentAddress}</div>` : ''}
            </div>
          </div>

          <div class="section">
            <h3>Gold Items Pledged</h3>
            ${loanData.goldItems.map((item, index) => `
              <div style="margin-bottom: 20px; border: 1px solid #ccc; padding: 10px;">
                <h4 style="margin: 0 0 10px 0; color: #1e40af;">Item ${index + 1}: ${item.description}</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                  <div><strong>Gross Weight:</strong> ${item.grossWeight} g</div>
                  <div><strong>Net Weight:</strong> ${item.netWeight} g</div>
                </div>
                ${photos[index] && photos[index].length > 0 ? `
                  <div style="margin-top: 10px;">
                    <h5 style="margin: 0 0 5px 0; color: #1e40af;">Photos:</h5>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                      ${photos[index].map(photo => {
                        const base64Key = `${index}_${photo._id}`;
                        const base64Data = base64Images[base64Key] || '';
                        console.log(`Generating HTML for photo ${photo._id}, base64Key: ${base64Key}, hasData: ${!!base64Data}`);
                        return `
                        <div style="text-align: center;">
                          ${base64Data ? `<img src="${base64Data}" style="max-width: 150px; max-height: 150px; border: 1px solid #ccc; margin-bottom: 5px;" />` : '<div style="width: 150px; height: 150px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; color: #666;">Image not available</div>'}
                          <div style="font-size: 10px; color: #666;">${photo.description || 'Gold Item Photo'}</div>
                        </div>
                      `;
                      }).join('')}
                    </div>
                  </div>
                ` : '<div style="color: #666; font-style: italic;">No photos available</div>'}
              </div>
            `).join('')}
          </div>

          <div class="grid">
            <div class="section">
              <h3>Loan Terms</h3>
              <div><strong>Loan Amount:</strong> ${formatCurrency(loanData.amount)}</div>
              <div><strong>Interest Rate:</strong> ${loanData.interestRate}% per annum</div>
              <div><strong>Loan Term:</strong> ${loanData.term} months</div>
              <div><strong>Monthly Payment:</strong> ${formatCurrency(loanData.monthlyPayment)}</div>
              <div><strong>Total Payment:</strong> ${formatCurrency(loanData.totalPayment)}</div>
              <div><strong>Remaining Balance:</strong> ${formatCurrency(loanData.remainingBalance)}</div>
            </div>

            <div class="section">
              <h3>Interest Calculation</h3>
              <div><strong>Daily Interest Rate:</strong> ${(loanData.dailyInterestRate * 100).toFixed(6)}%</div>
              <div><strong>Total Days:</strong> ${loanData.totalDays}</div>
              <div><strong>Daily Interest Amount:</strong> ${formatCurrency(loanData.dailyInterestAmount)}</div>
              <div><strong>Status:</strong> ${loanData.status.charAt(0).toUpperCase() + loanData.status.slice(1)}</div>
            </div>
          </div>

          <div class="terms">
            <h3>Terms and Conditions</h3>
            <p>1. The borrower agrees to repay the loan amount along with interest as per the agreed terms.</p>
            <p>2. The gold items pledged as security will be returned upon full repayment of the loan.</p>
            <p>3. In case of default, the lender has the right to sell the pledged gold items to recover the outstanding amount.</p>
            <p>4. The borrower is responsible for maintaining the gold items in good condition.</p>
            <p>5. Any changes to the loan terms must be agreed upon by both parties in writing.</p>
            <p>6. This agreement is subject to the laws of India and any disputes will be resolved in the appropriate court of law.</p>
          </div>

          <div class="signatures">
            <div class="signature">
              <div><strong>Borrower Signature</strong></div>
              <div>${loanData.name}</div>
            </div>
            <div class="signature">
              <div><strong>Lender Signature</strong></div>
              <div>Cyan Finance</div>
            </div>
          </div>

          <div class="footer">
            <p>Generated on: ${formatDate(loanData.createdAt)}</p>
            <p>Created by: ${loanData.createdBy.name} (${loanData.createdBy.email})</p>
           
          </div>
        </body>
        <script>
          // Wait for all images to load before printing
          function waitForImagesAndPrint() {
            const images = document.querySelectorAll('img');
            let loadedCount = 0;
            const totalImages = images.length;
            
            console.log('Waiting for', totalImages, 'images to load...');
            
            if (totalImages === 0) {
              // No images, print immediately
              setTimeout(() => window.print(), 100);
              return;
            }
            
            images.forEach((img, index) => {
              if (img.complete && img.naturalHeight !== 0) {
                loadedCount++;
                console.log('Image', index, 'already loaded');
              } else {
                img.onload = () => {
                  loadedCount++;
                  console.log('Image', index, 'loaded, total:', loadedCount, '/', totalImages);
                  if (loadedCount === totalImages) {
                    console.log('All images loaded, printing...');
                    setTimeout(() => window.print(), 500);
                  }
                };
                img.onerror = () => {
                  loadedCount++;
                  console.log('Image', index, 'failed to load, total:', loadedCount, '/', totalImages);
                  if (loadedCount === totalImages) {
                    console.log('All images processed, printing...');
                    setTimeout(() => window.print(), 500);
                  }
                };
              }
            });
            
            // Fallback timeout in case some images don't load
            setTimeout(() => {
              console.log('Timeout reached, printing anyway...');
              window.print();
            }, 5000);
          }
          
          // Start the process when DOM is ready
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', waitForImagesAndPrint);
          } else {
            waitForImagesAndPrint();
          }
        </script>
        </html>
      `);
      printWindow.document.close();
      
      // Don't close the window immediately, let the script handle printing
      // The window will close automatically after printing
    }
    
    setPreparingPrint(false);
  };

  return (
    <>
      {/* Modal for screen display */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Loan Agreement</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                disabled={loadingPhotos || preparingPrint}
                className={`px-4 py-2 rounded-md transition-colors ${
                  loadingPhotos || preparingPrint
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loadingPhotos ? '⏳ Loading...' : preparingPrint ? '🔄 Preparing...' : '🖨️ Print'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* Screen Content */}
          <div className="p-6">
          {/* Company Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-800">CYAN FINANCE</h1>
            <p className="text-lg text-gray-600">Gold Loan Agreement</p>
            <p className="text-sm text-gray-500">Loan ID: {loanData.loanId}</p>
          </div>

            {/* Loan Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Customer Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {loanData.name}</div>
                  <div><strong>Aadhar Number:</strong> {loanData.aadharNumber}</div>
                  <div><strong>Email:</strong> {loanData.email}</div>
                  <div><strong>Primary Mobile:</strong> {loanData.primaryMobile}</div>
                  {loanData.secondaryMobile && (
                    <div><strong>Secondary Mobile:</strong> {loanData.secondaryMobile}</div>
                  )}
                  <div><strong>Emergency Contact:</strong> {loanData.emergencyContact.mobile} ({loanData.emergencyContact.relation})</div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">Address Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Present Address:</strong><br />
                    <span className="text-gray-700">{loanData.presentAddress}</span>
                  </div>
                  {loanData.permanentAddress && (
                    <div>
                      <strong>Permanent Address:</strong><br />
                      <span className="text-gray-700">{loanData.permanentAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Gold Items */}
            <div className="mb-8 avoid-break">
              <h3 className="text-lg font-semibold mb-4 text-blue-800">Gold Items Pledged</h3>
              {loanData.goldItems.map((item, index) => (
                <div key={index} className="mb-6 border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <h4 className="text-md font-semibold mb-3 text-blue-700">
                    Item {index + 1}: {item.description}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div><strong>Gross Weight:</strong> {item.grossWeight} g</div>
                    <div><strong>Net Weight:</strong> {item.netWeight} g</div>
                  </div>
                  
                  {/* Photos Section */}
                  {loadingPhotos ? (
                    <div className="text-gray-500 italic">Loading photos...</div>
                  ) : photos[index] && photos[index].length > 0 ? (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold mb-2 text-blue-700">Photos:</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {photos[index].map((photo, photoIndex) => (
                          <div key={photoIndex} className="text-center">
                            <img 
                              src={getImageUrl(photo)} 
                              alt={`${item.description} - Photo ${photoIndex + 1}`}
                              className="w-full h-32 object-cover border border-gray-300 rounded mb-2"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <div className="text-xs text-gray-600">
                              {photo.description || 'Gold Item Photo'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">
                      No photos available
                      {process.env.NODE_ENV === 'development' && (
                        <div className="text-xs mt-1">
                          Debug: photos[{index}] = {JSON.stringify(photos[index])}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Loan Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">Loan Terms</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Loan Amount:</strong> {formatCurrency(loanData.amount)}</div>
                  <div><strong>Interest Rate:</strong> {loanData.interestRate}% per annum</div>
                  <div><strong>Loan Term:</strong> {loanData.term} months</div>
                  <div><strong>Monthly Payment:</strong> {formatCurrency(loanData.monthlyPayment)}</div>
                  <div><strong>Total Payment:</strong> {formatCurrency(loanData.totalPayment)}</div>
                  <div><strong>Remaining Balance:</strong> {formatCurrency(loanData.remainingBalance)}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">Interest Calculation</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Daily Interest Rate:</strong> {(loanData.dailyInterestRate * 100).toFixed(6)}%</div>
                  <div><strong>Total Days:</strong> {loanData.totalDays}</div>
                  <div><strong>Daily Interest Amount:</strong> {formatCurrency(loanData.dailyInterestAmount)}</div>
                  <div><strong>Status:</strong> <span className="capitalize">{loanData.status}</span></div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-8 avoid-break">
              <h3 className="text-lg font-semibold mb-4 text-blue-800">Terms and Conditions</h3>
              <div className="text-sm space-y-2 bg-gray-50 p-4 rounded-lg">
                <p>1. The borrower agrees to repay the loan amount along with interest as per the agreed terms.</p>
                <p>2. The gold items pledged as security will be returned upon full repayment of the loan.</p>
                <p>3. In case of default, the lender has the right to sell the pledged gold items to recover the outstanding amount.</p>
                <p>4. The borrower is responsible for maintaining the gold items in good condition.</p>
                <p>5. Any changes to the loan terms must be agreed upon by both parties in writing.</p>
                <p>6. This agreement is subject to the laws of India and any disputes will be resolved in the appropriate court of law.</p>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="text-center">
                <div className="border-t-2 border-gray-400 pt-2 mt-16">
                  <p className="text-sm font-semibold">Borrower Signature</p>
                  <p className="text-xs text-gray-500 mt-1">{loanData.name}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-gray-400 pt-2 mt-16">
                  <p className="text-sm font-semibold">Lender Signature</p>
                  <p className="text-xs text-gray-500 mt-1">Cyan Finance</p>
                </div>
              </div>
            </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 border-t pt-4">
            <p>Generated on: {formatDate(loanData.createdAt)}</p>
            <p>Created by: {loanData.createdBy.name} ({loanData.createdBy.email})</p>
          </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default LoanPrintout;
