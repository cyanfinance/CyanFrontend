import React, { useState, useEffect } from 'react';
// Logo is now loaded directly from public directory
import Logo from './Logo';

// Import logo directly for better reliability in deployment
import cyanlogo1 from '../assets/cyanlogo1.png';
import cyanlogo from '../assets/cyanlogo.png';

interface LoanPrintoutProps {
  loanData: {
    _id: string;
    loanId: string;
    name: string;
    aadharNumber: string;
    email: string;
    primaryMobile: string;
    secondaryMobile?: string;
    emergencyContact: {
      mobile: string;
      relation: string;
      _id: string;
    };
    presentAddress: string;
    permanentAddress: string;
    amount: number;
    interestRate: number;
    term: number;
    monthlyPayment: number;
    totalPayment: number;
    remainingBalance: number;
    dailyInterestRate: number;
    goldItems: Array<{
      description: string;
      grossWeight: number;
      netWeight: number;
    }>;
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
        const response = await fetch(`${API_URL}/loans/${loanData._id}/photos`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const responseData = await response.json();
          console.log('Fetched photos data:', responseData);
          const photosByItem: {[key: number]: any[]} = {};
          
          // Extract the actual photos array from the response
          const photos = responseData.data || responseData;
          console.log('Photos array:', photos);
          
          if (Array.isArray(photos)) {
            photos.forEach((photo: any) => {
              console.log('Processing photo:', photo);
              console.log('Photo goldItemIndex:', photo.goldItemIndex);
              console.log('Photo itemIndex:', photo.itemIndex);
              console.log('Photo keys:', Object.keys(photo));
              // Use goldItemIndex instead of itemIndex
              const itemIndex = photo.goldItemIndex !== undefined ? photo.goldItemIndex : (photo.itemIndex !== undefined ? photo.itemIndex : 0);
              console.log('Using item index:', itemIndex);
              if (!photosByItem[itemIndex]) {
                photosByItem[itemIndex] = [];
              }
              photosByItem[itemIndex].push(photo);
            });
          }
          
          console.log('Photos by item:', photosByItem);
          setPhotos(photosByItem);
        } else {
          console.error('Failed to fetch photos:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setLoadingPhotos(false);
      }
    };

    fetchPhotos();
  }, [loanData._id, token, API_URL]);

  const getImageUrl = (photo: any) => {
    const url = `${API_URL}/loans/${loanData._id}/photos/${photo._id}/image`;
    console.log('Generated image URL:', url);
    return url;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAuctionDate = (disbursementDate: string) => {
    // Calculate auction date: disbursement date + 3 months (first upgrade) + 3 months (second upgrade) + 3 months (third upgrade) + 3 months (final grace period)
    // Total: 12 months from disbursement date
    const disbursement = new Date(disbursementDate);
    const auctionDate = new Date(disbursement);
    auctionDate.setMonth(auctionDate.getMonth() + 12); // 12 months total
    
    return auctionDate.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Function to load logo as base64 - same approach as simplePdfGenerator.ts for deployment reliability
  const loadLogoAsBase64 = async (): Promise<string> => {
    // Try direct imports first (most reliable)
    const importedLogos = [cyanlogo1, cyanlogo];
    
    for (const logoPath of importedLogos) {
      try {
        console.log(`🔄 Attempting to load imported logo: ${logoPath}`);
        const response = await fetch(logoPath);
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.startsWith('image/')) {
            const blob = await response.blob();
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                if (result && result.length > 1000 && result.includes('data:image/png;base64,')) {
                  console.log(`✅ Logo loaded successfully from imported path: ${logoPath}`);
                  resolve(result);
                } else {
                  console.warn(`Invalid logo data from ${logoPath}, trying next`);
                  resolve('');
                }
              };
              reader.onerror = () => {
                console.warn(`Error reading logo from ${logoPath}`);
                resolve('');
              };
              reader.readAsDataURL(blob);
            });
          }
        }
      } catch (error) {
        console.warn(`Error loading imported logo from ${logoPath}:`, error);
      }
    }
    
    // Fallback to public paths if imports fail
    const publicPaths = ['/cyanlogo1.png', '/cyanlogo.png'];
    
    for (const path of publicPaths) {
      try {
        console.log(`🔄 Attempting to load logo from public path: ${path}`);
        const response = await fetch(path);
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.startsWith('image/')) {
            const blob = await response.blob();
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                if (result && result.length > 1000 && result.includes('data:image/png;base64,')) {
                  console.log(`✅ Logo loaded successfully from public path: ${path}`);
                  resolve(result);
                } else {
                  console.warn(`Invalid logo data from ${path}, trying next`);
                  resolve('');
                }
              };
              reader.onerror = () => {
                console.warn(`Error reading logo from ${path}`);
                resolve('');
              };
              reader.readAsDataURL(blob);
            });
          }
        }
      } catch (error) {
        console.warn(`Error loading logo from ${path}:`, error);
      }
    }
    
    console.log('⚠️ No logo could be loaded, using text fallback');
    return '';
  };

  const getImageAsBase64 = async (photo: any): Promise<string> => {
    try {
      console.log('Converting image to base64:', photo._id, getImageUrl(photo));
      
      // Use fetch with timeout for faster response
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(getImageUrl(photo), {
        signal: controller.signal,
        cache: 'force-cache' // Use cached version if available
      });
      
      clearTimeout(timeoutId);
      console.log('Image fetch response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('Image blob size:', blob.size);
      
      // Optimize blob size for faster conversion
      let optimizedBlob = blob;
      if (blob.size > 500000) { // If larger than 500KB, compress
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        return new Promise((resolve) => {
          img.onload = () => {
            // Resize to max 200x200 for print
            const maxSize = 200;
            const ratio = Math.min(maxSize / img.width, maxSize / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            console.log('Compressed image for faster conversion');
            resolve(compressedDataUrl);
          };
          img.src = URL.createObjectURL(blob);
        });
      }
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          console.log('Base64 conversion result length:', result.length);
          resolve(result);
        };
        reader.readAsDataURL(optimizedBlob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return '';
    }
  };


  const generateWithoutImagesHTML = async (base64Images: {[key: string]: string} = {}) => {
    // Load logo as base64 for embedding in print HTML using robust method
    const logoBase64 = await loadLogoAsBase64();
    return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="robots" content="noindex, nofollow">
          <title>Loan Agreement - ${loanData.loanId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 5px; background: white; }
            .container { max-width: 100%; margin: 0 auto; }
            .duplicate-section { 
              width: 48%; 
              float: left; 
              margin-right: 2%; 
              border: 2px solid #1e40af; 
              padding: 8px; 
              box-sizing: border-box;
              page-break-inside: avoid;
              position: relative;
              min-height: 90vh;
            }
            .duplicate-section:last-child { margin-right: 0; }
            .header { text-align: center; margin-bottom: 6px; }
            .section { margin-bottom: 4px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .terms { background: #f9f9f9; padding: 6px; border-radius: 3px; font-size: 9px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 10px; }
            .signature { text-align: center; }
            h1, h2, h3 { color: #1e40af; margin: 1px 0; }
            h1 { font-size: 12px; }
            h2 { font-size: 10px; }
            h3 { font-size: 8px; }
            p { margin: 0.5px 0; font-size: 8px; }
            .border { border: 1px solid #ccc; padding: 8px; margin: 5px 0; }
            @media print { 
              body { margin: 0; }
              .duplicate-section { page-break-inside: avoid; }
              .container { page-break-inside: avoid; }
              * { page-break-inside: avoid; }
              * { -webkit-print-color-adjust: exact; color-adjust: exact; }
            }
            @page { 
              size: A4 landscape; 
              margin: 3mm; 
             }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- First Copy -->
            <div class="duplicate-section">
          <div class="header">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <div style="flex: 0 0 auto; margin-right: 10px;">
                ${logoBase64 ? `<img src="${logoBase64}" alt="Cyan Finance Logo" style="max-width: 100%; height: auto; max-height: 40px;" />` : '<div style="font-size: 16px; font-weight: bold; color: #003366;">CYAN FINANCE</div>'}
              </div>
              <div style="flex: 1; text-align: center;">
                <h2>GOLD LOAN AGREEMENT</h2>
              </div>
            </div>
            <p><strong>Loan ID:</strong> ${loanData.loanId}</p>
          </div>

            <div class="section" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${loanData.name}</p>
                <p><strong>Aadhar Number:</strong> ${loanData.aadharNumber}</p>
                <p><strong>Email:</strong> ${loanData.email}</p>
                <p><strong>Primary Mobile:</strong> ${loanData.primaryMobile}</p>
                <p><strong>Emergency Contact:</strong> ${loanData.emergencyContact.mobile} (${loanData.emergencyContact.relation})</p>
              </div>
              <div>
                <h3>Office Address</h3>
                <p><strong>Cyan Finance</strong></p>
                <p>BK Towers, Akkayyapalem</p>
                <p>Visakhapatnam, Andhra Pradesh - 530016</p>
                <p><strong>Phone:</strong> +91-9700049444</p>
                <p><strong>Email:</strong> support@cyanfinance.in</p>
              </div>
            </div>

            <div class="section">
              <h3>Address Information</h3>
                <p><strong>Present Address:</strong> ${loanData.presentAddress}</p>
                <p><strong>Permanent Address:</strong> ${loanData.permanentAddress}</p>
          </div>

          <div class="section">
            <h3>Gold Items Pledged</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
              <thead>
                    <tr style="background: #f0f0f0;">
                      <th style="border: 1px solid #ccc; padding: 3px; text-align: left; font-size: 8px; font-weight: bold;">Item</th>
                      <th style="border: 1px solid #ccc; padding: 3px; text-align: left; font-size: 8px; font-weight: bold;">Description</th>
                      <th style="border: 1px solid #ccc; padding: 3px; text-align: center; font-size: 8px; font-weight: bold;">Gross Weight</th>
                      <th style="border: 1px solid #ccc; padding: 3px; text-align: center; font-size: 8px; font-weight: bold;">Net Weight</th>
                </tr>
              </thead>
              <tbody>
                ${loanData.goldItems.map((item, index) => {
                  return `
                    <tr>
                          <td style="border: 1px solid #ccc; padding: 3px; font-size: 8px; text-align: center; font-weight: bold;">${index + 1}</td>
                          <td style="border: 1px solid #ccc; padding: 3px; font-size: 8px; font-weight: bold;">${item.description}</td>
                          <td style="border: 1px solid #ccc; padding: 3px; font-size: 8px; text-align: center; font-weight: bold;">${item.grossWeight} g</td>
                          <td style="border: 1px solid #ccc; padding: 3px; font-size: 8px; text-align: center; font-weight: bold;">${item.netWeight} g</td>
                    </tr>
                  `;
                }).join('')}
                <tr style="background: #f8f9fa; font-weight: bold;">
                  <td style="border: 1px solid #ccc; padding: 3px; font-size: 8px; text-align: center;" colspan="2">TOTAL WEIGHT</td>
                  <td style="border: 1px solid #ccc; padding: 3px; font-size: 8px; text-align: center; font-weight: bold;">${loanData.goldItems.reduce((sum, item) => sum + (parseFloat(String(item.grossWeight)) || 0), 0).toFixed(2)} g</td>
                  <td style="border: 1px solid #ccc; padding: 3px; font-size: 8px; text-align: center; font-weight: bold;">${loanData.goldItems.reduce((sum, item) => sum + (parseFloat(String(item.netWeight)) || 0), 0).toFixed(2)} g</td>
                  </tr>
              </tbody>
            </table>
            
            <!-- Photos Section -->
            <div style="margin-top: 8px;">
              <h4 style="font-size: 9px; font-weight: bold; margin-bottom: 4px; color: #1e40af;">All Items Photo</h4>
              <div style="display: flex; justify-content: center;">
                ${(() => {
                  const allItemsPhotos = photos[-1] || photos['-1'] || [];
                  if (allItemsPhotos.length > 0) {
                    const firstPhoto = allItemsPhotos[0];
                    const base64Key = `-1_${firstPhoto._id}`;
                    const base64Data = base64Images[base64Key] || '';
                    const imageUrl = base64Data || `http://localhost:5001/api/loans/${loanData._id}/photos/${firstPhoto._id}/image`;
                    
                    return `
                      <div style="text-align: center; border: 2px solid #dc2626; padding: 4px; border-radius: 4px; background: #fef2f2;">
                        <img src="${imageUrl}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 3px; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                        <div style="width: 100px; height: 100px; border: 1px solid #ccc; display: none; align-items: center; justify-content: center; color: #666; font-size: 8px; border-radius: 3px;">No Photo</div>
                        <div style="font-size: 7px; color: #dc2626; margin-top: 2px; font-weight: bold;">All Items</div>
                      </div>
                    `;
                  } else {
                    return `
                      <div style="text-align: center; border: 2px solid #dc2626; padding: 4px; border-radius: 4px; background: #fef2f2;">
                        <div style="width: 100px; height: 100px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; color: #666; font-size: 8px; border-radius: 3px;">No Photo Available</div>
                        <div style="font-size: 7px; color: #dc2626; margin-top: 2px; font-weight: bold;">All Items</div>
                      </div>
                    `;
                  }
                })()}
              </div>
            </div>
          </div>

          <div class="grid">
            <div class="section">
              <h3>Loan Terms</h3>
                  <p><strong>Loan Amount:</strong> ₹${formatCurrency(loanData.amount)}</p>
                  <p><strong>Interest Rate:</strong> ${Number(loanData.interestRate)}% per annum</p>
                  <p><strong>Loan Term:</strong> ${loanData.term} months</p>
                </div>
                <div class="section">
                  <h3>Auction Information</h3>
                  <p><strong>Loan Disbursement Date:</strong> ${formatDate(loanData.createdAt)}</p>
                  <p><strong>Final Auction Date:</strong> <span style="color: #dc2626; font-weight: bold;">${calculateAuctionDate(loanData.createdAt)}</span></p>
                </div>
              </div>

              <div class="terms">
                <h3>Terms and Conditions</h3>
                <p>1. The above mentioned ornaments are legally acquired by me. In case there are any legal consequences arise, Cyan Finance can take Civil and Criminal action against me.</p>
                <p style="color: #dc2626; font-weight: bold; background: #fef2f2; padding: 4px; border: 1px solid #dc2626; border-radius: 3px; margin: 4px 0;">⚠️ IMPORTANT: The above gold items will be auctioned if loan is not paid before the final upgrade date.</p>
              </div>

              <div class="signatures" style="position: absolute; bottom: 20px; left: 0; right: 0; display: flex; justify-content: space-between; padding: 0 20px;">
                <div class="signature">
                  <div><strong>Borrower Signature</strong></div>
                  <div style="height: 30px; border-bottom: 1px solid #000; margin: 10px 0;"></div>
                  <div>${loanData.name}</div>
                </div>
                <div class="signature">
                  <div><strong>Lender Signature</strong></div>
                  <div style="height: 30px; border-bottom: 1px solid #000; margin: 10px 0;"></div>
                  <div>Cyan Finance</div>
                </div>
              </div>
            </div>

            <!-- Second Copy -->
            <div class="duplicate-section">
              <div class="header">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <div style="flex: 0 0 auto; margin-right: 10px;">
                    ${logoBase64 ? `<img src="${logoBase64}" alt="Cyan Finance Logo" style="max-width: 100%; height: auto; max-height: 40px;" />` : '<div style="font-size: 16px; font-weight: bold; color: #003366;">CYAN FINANCE</div>'}
                  </div>
                  <div style="flex: 1; text-align: center;">
                    <h2>GOLD LOAN AGREEMENT</h2>
                  </div>
                </div>
                <p><strong>Loan ID:</strong> ${loanData.loanId}</p>
              </div>

              <div class="section" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <h3>Customer Information</h3>
                  <p><strong>Name:</strong> ${loanData.name}</p>
                  <p><strong>Aadhar Number:</strong> ${loanData.aadharNumber}</p>
                  <p><strong>Email:</strong> ${loanData.email}</p>
                  <p><strong>Primary Mobile:</strong> ${loanData.primaryMobile}</p>
                  <p><strong>Emergency Contact:</strong> ${loanData.emergencyContact.mobile} (${loanData.emergencyContact.relation})</p>
                </div>
                <div>
                  <h3>Office Address</h3>
                  <p><strong>Cyan Finance</strong></p>
                  <p>BK Towers, Akkayyapalem</p>
                  <p>Visakhapatnam, Andhra Pradesh - 530016</p>
                  <p><strong>Phone:</strong> +91-9700049444</p>
                  <p><strong>Email:</strong> support@cyanfinance.in</p>
                </div>
              </div>

              <div class="section">
                <h3>Address Information</h3>
                <p><strong>Present Address:</strong> ${loanData.presentAddress}</p>
                <p><strong>Permanent Address:</strong> ${loanData.permanentAddress}</p>
              </div>

              <div class="section">
                <h3>Gold Items Pledged</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
                  <thead>
                    <tr style="background: #f0f0f0;">
                      <th style="border: 1px solid #ccc; padding: 3px; text-align: left; font-size: 8px; font-weight: bold;">Item</th>
                      <th style="border: 1px solid #ccc; padding: 3px; text-align: left; font-size: 8px; font-weight: bold;">Description</th>
                      <th style="border: 1px solid #ccc; padding: 3px; text-align: center; font-size: 8px; font-weight: bold;">Gross Weight</th>
                      <th style="border: 1px solid #ccc; padding: 3px; text-align: center; font-size: 8px; font-weight: bold;">Net Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${loanData.goldItems.map((item, index) => {
                      return `
                        <tr>
                              <td style="border: 1px solid #ccc; padding: 3px; font-size: 8px; text-align: center; font-weight: bold;">${index + 1}</td>
                              <td style="border: 1px solid #ccc; padding: 3px; font-size: 8px; font-weight: bold;">${item.description}</td>
                              <td style="border: 1px solid #ccc; padding: 3px; font-size: 8px; text-align: center; font-weight: bold;">${item.grossWeight} g</td>
                              <td style="border: 1px solid #ccc; padding: 3px; font-size: 8px; text-align: center; font-weight: bold;">${item.netWeight} g</td>
                        </tr>
                      `;
                    }).join('')}
                    <tr style="background: #f8f9fa; font-weight: bold;">
                      <td style="border: 1px solid #ccc; padding: 3px; font-size: 8px; text-align: center;" colspan="2">TOTAL WEIGHT</td>
                      <td style="border: 1px solid #ccc; padding: 3px; font-size: 8px; text-align: center; font-weight: bold;">${loanData.goldItems.reduce((sum, item) => sum + (parseFloat(String(item.grossWeight)) || 0), 0).toFixed(2)} g</td>
                      <td style="border: 1px solid #ccc; padding: 3px; font-size: 8px; text-align: center; font-weight: bold;">${loanData.goldItems.reduce((sum, item) => sum + (parseFloat(String(item.netWeight)) || 0), 0).toFixed(2)} g</td>
                    </tr>
                  </tbody>
                </table>
                
                <!-- Photos Section -->
                <div style="margin-top: 8px;">
                  <h4 style="font-size: 9px; font-weight: bold; margin-bottom: 4px; color: #1e40af;">All Items Photo</h4>
                  <div style="display: flex; justify-content: center;">
                    ${(() => {
                      const allItemsPhotos = photos[-1] || photos['-1'] || [];
                      if (allItemsPhotos.length > 0) {
                        const firstPhoto = allItemsPhotos[0];
                        const base64Key = `-1_${firstPhoto._id}`;
                        const base64Data = base64Images[base64Key] || '';
                        const imageUrl = base64Data || `http://localhost:5001/api/loans/${loanData._id}/photos/${firstPhoto._id}/image`;
                        
                        return `
                          <div style="text-align: center; border: 2px solid #dc2626; padding: 4px; border-radius: 4px; background: #fef2f2;">
                            <img src="${imageUrl}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 3px; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                            <div style="width: 100px; height: 100px; border: 1px solid #ccc; display: none; align-items: center; justify-content: center; color: #666; font-size: 8px; border-radius: 3px;">No Photo</div>
                            <div style="font-size: 7px; color: #dc2626; margin-top: 2px; font-weight: bold;">All Items</div>
                          </div>
                        `;
                      } else {
                        return `
                          <div style="text-align: center; border: 2px solid #dc2626; padding: 4px; border-radius: 4px; background: #fef2f2;">
                            <div style="width: 100px; height: 100px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; color: #666; font-size: 8px; border-radius: 3px;">No Photo Available</div>
                            <div style="font-size: 7px; color: #dc2626; margin-top: 2px; font-weight: bold;">All Items</div>
                          </div>
                        `;
                      }
                    })()}
                  </div>
                </div>
              </div>

              <div class="grid">
                <div class="section">
                  <h3>Loan Terms</h3>
                  <p><strong>Loan Amount:</strong> ₹${formatCurrency(loanData.amount)}</p>
                  <p><strong>Interest Rate:</strong> ${Number(loanData.interestRate)}% per annum</p>
                  <p><strong>Loan Term:</strong> ${loanData.term} months</p>
                </div>
            <div class="section">
              <h3>Auction Information</h3>
              <p><strong>Loan Disbursement Date:</strong> ${formatDate(loanData.createdAt)}</p>
              <p><strong>Final Auction Date:</strong> <span style="color: #dc2626; font-weight: bold;">${calculateAuctionDate(loanData.createdAt)}</span></p>
            </div>
          </div>

          <div class="terms">
            <h3>Terms and Conditions</h3>
            <p>1. The above mentioned ornaments are legally acquired by me. In case there are any legal consequences arise, Cyan Finance can take Civil and Criminal action against me.</p>
            <p style="color: #dc2626; font-weight: bold; background: #fef2f2; padding: 4px; border: 1px solid #dc2626; border-radius: 3px; margin: 4px 0;">⚠️ IMPORTANT: The above gold items will be auctioned if loan is not paid before the final upgrade date.</p>
          </div>

          <div class="signatures" style="position: absolute; bottom: 20px; left: 0; right: 0; display: flex; justify-content: space-between; padding: 0 20px;">
            <div class="signature">
              <div><strong>Borrower Signature</strong></div>
              <div style="height: 30px; border-bottom: 1px solid #000; margin: 10px 0;"></div>
              <div>${loanData.name}</div>
            </div>
            <div class="signature">
              <div><strong>Lender Signature</strong></div>
              <div style="height: 30px; border-bottom: 1px solid #000; margin: 10px 0;"></div>
              <div>Cyan Finance</div>
            </div>
          </div>
            </div>
          </div>
        </body>
        <script>
          // Print immediately for landscape format
          setTimeout(() => window.print(), 500);
        </script>
        </html>
      `;
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

    // Convert all images to base64 for printing (landscape format uses images)
    const base64Images: {[key: string]: string} = {};
    
    // Always convert images for landscape format
    if (true) {
      // Count total images for progress
      let totalImages = 0;
      for (const itemPhotos of Object.values(photos)) {
        totalImages += itemPhotos.length;
      }

      // Show loading message with progress
      const loadingMessage = document.createElement('div');
      loadingMessage.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    z-index: 10000; text-align: center; font-family: Arial, sans-serif;">
          <div style="margin-bottom: 10px;">🖼️ Preparing ${totalImages} image${totalImages !== 1 ? 's' : ''} for print...</div>
          <div style="font-size: 14px; color: #666;">This may take a few seconds</div>
          <div style="margin-top: 10px; width: 200px; height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden;">
            <div id="progress-bar" style="width: 0%; height: 100%; background: #3b82f6; transition: width 0.3s ease;"></div>
          </div>
        </div>
      `;
      document.body.appendChild(loadingMessage);

      try {
        console.log('Starting optimized base64 conversion for photos:', photos);
        
        // Convert photos in parallel for faster processing
        const conversionPromises: Promise<{key: string, base64: string}>[] = [];
        let completedImages = 0;
        
        for (const [itemIndex, itemPhotos] of Object.entries(photos)) {
          for (const photo of itemPhotos) {
            const promise = getImageAsBase64(photo).then(base64 => {
              completedImages++;
              const progress = (completedImages / totalImages) * 100;
              const progressBar = document.getElementById('progress-bar');
              if (progressBar) {
                progressBar.style.width = `${progress}%`;
              }
              return {
                key: `${itemIndex}_${photo._id}`,
                base64
              };
            });
            conversionPromises.push(promise);
          }
        }

        // Wait for all conversions to complete
        const results = await Promise.all(conversionPromises);
        
        // Build base64 images object
        results.forEach(({key, base64}) => {
          base64Images[key] = base64;
        });

        console.log('Optimized base64 conversion completed. Results:', Object.keys(base64Images));

      } catch (error) {
        console.error('Error preparing images for printing:', error);
        alert('Error preparing images for printing. Please try again.');
        setPreparingPrint(false);
        return;
      } finally {
        // Remove loading message
        if (document.body.contains(loadingMessage)) {
          document.body.removeChild(loadingMessage);
        }
      }
    }

    // Generate HTML content using landscape format only
    const htmlContent = await generateWithoutImagesHTML(base64Images);

    // Create a blob URL for the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create a new window for printing with clean settings
    const printWindow = window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (printWindow) {
      printWindow.onload = () => {
        // Set clean title and hide any potential URL display
        printWindow.document.title = 'Loan Agreement';
        
        // Add additional CSS to ensure clean printing
        const cleanPrintCSS = `
          <style>
            @media print {
              body::after { display: none !important; }
              body::before { display: none !important; }
              * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
            }
          </style>
        `;
        printWindow.document.head.insertAdjacentHTML('beforeend', cleanPrintCSS);
        
        // Small delay to ensure content is fully loaded, then print
        setTimeout(() => {
      printWindow.print();
          URL.revokeObjectURL(url);
        }, 500);
      };
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
            <div className="flex items-center justify-center mb-4">
              <Logo className="mr-4" size="medium" />
              <div>
            <h1 className="text-3xl font-bold text-blue-800">CYAN FINANCE</h1>
            <p className="text-lg text-gray-600">Gold Loan Agreement</p>
              </div>
            </div>
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

              {/* Office Address */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">Office Address</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Cyan Finance</strong></div>
                  <div>BK Towers, Akkayyapalem</div>
                  <div>Visakhapatnam, Andhra Pradesh - 530016</div>
                  <div><strong>Phone:</strong> +91-22-1234-5678</div>
                  <div><strong>Email:</strong> info@cyanfinance.in</div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">Address Information</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Present Address:</strong> {loanData.presentAddress}</div>
                  <div><strong>Permanent Address:</strong> {loanData.permanentAddress}</div>
                </div>
              </div>
            </div>

            {/* Gold Items */}
            <div className="mb-8 avoid-break">
              <h3 className="text-lg font-semibold mb-4 text-blue-800">Gold Items Pledged</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 bg-white">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-blue-800">Item</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-blue-800">Description</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-blue-800">Gross Weight</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-blue-800">Net Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanData.goldItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 font-bold text-gray-700">
                          {index + 1}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 font-bold text-gray-700">
                          {item.description}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 font-bold text-gray-700">
                          {item.grossWeight} g
                        </td>
                        <td className="border border-gray-300 px-4 py-3 font-bold text-gray-700">
                          {item.netWeight} g
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="border border-gray-300 px-4 py-3 text-center" colSpan={2}>
                        TOTAL WEIGHT
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center font-bold">
                        {loanData.goldItems.reduce((sum, item) => sum + (parseFloat(String(item.grossWeight)) || 0), 0).toFixed(2)} g
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center font-bold">
                        {loanData.goldItems.reduce((sum, item) => sum + (parseFloat(String(item.netWeight)) || 0), 0).toFixed(2)} g
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Photos Section */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-3 text-blue-800">All Items Photo</h4>
                <div className="flex justify-center">
                  {(() => {
                    const allItemsPhotos = photos[-1] || photos['-1'] || [];
                    if (allItemsPhotos.length > 0) {
                      const firstPhoto = allItemsPhotos[0];
                      return (
                        <div className="text-center border-2 border-red-500 p-3 rounded-lg bg-red-50 shadow-sm">
                          <img 
                            src={getImageUrl(firstPhoto)} 
                            alt="All Items Together"
                            className="w-32 h-32 object-cover border border-red-300 rounded shadow-sm"
                            onError={(e) => {
                              console.error('Image failed to load:', getImageUrl(firstPhoto));
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('Image loaded successfully:', getImageUrl(firstPhoto));
                            }}
                          />
                          <div className="text-sm text-red-600 mt-2 font-bold">
                            All Items
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-center border-2 border-red-500 p-3 rounded-lg bg-red-50 shadow-sm">
                          <div className="w-32 h-32 border border-red-300 rounded flex items-center justify-center text-gray-500 text-sm">
                            No Photo Available
                          </div>
                          <div className="text-sm text-red-600 mt-2 font-bold">
                            All Items
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>

            {/* Loan Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">Loan Terms</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Loan Amount:</strong> ₹{formatCurrency(loanData.amount)}</div>
                  <div><strong>Interest Rate:</strong> {Number(loanData.interestRate)}% per annum</div>
                  <div><strong>Loan Term:</strong> {loanData.term} months</div>
                  <div><strong>Remaining Balance:</strong> ₹{formatCurrency(loanData.remainingBalance)}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">Auction Information</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Loan Disbursement Date:</strong> {formatDate(loanData.createdAt)}</div>
                  <div><strong>Final Auction Date:</strong> <span className="text-red-600 font-bold">{calculateAuctionDate(loanData.createdAt)}</span></div>
                  {/* <div className="text-red-600 font-bold text-xs">⚠️ Gold items will be auctioned if loan is not paid before the final auction date.</div> */}
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold mb-4 text-blue-800">Terms and Conditions</h3>
              <div className="space-y-2 text-sm">
                <p>1. The borrower agrees to repay the loan amount along with interest as per the agreed terms.</p>
                <p>2. The gold items pledged as security will be returned upon full repayment of the loan.</p>
                <p>3. In case of default, the lender has the right to sell the pledged gold items to recover the outstanding amount.</p>
                <p>4. The borrower is responsible for maintaining the gold items in good condition.</p>
                <p>5. Any changes to the loan terms must be agreed upon by both parties in writing.</p>
                <p>6. This agreement is subject to the laws of India and any disputes will be resolved in the appropriate court of law.</p>
                <p>7. The above mentioned ornaments are legally acquired by me. In case there are any legal consequences arise, Cyan Finance can take Civil and Criminal action against me.</p>
              </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end mt-8 pt-6 border-t" style={{ position: 'sticky', bottom: 0, backgroundColor: 'white', paddingTop: '20px' }}>
              <div className="text-center">
                <div className="font-semibold mb-2">Borrower Signature</div>
                <div className="h-8 border-b border-gray-400 mb-2"></div>
                <div className="text-sm text-gray-600">{loanData.name}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold mb-2">Lender Signature</div>
                <div className="h-8 border-b border-gray-400 mb-2"></div>
                <div className="text-sm text-gray-600">Cyan Finance</div>
              </div>
            </div>

          {/* Footer */}
            {/* <div className="text-center text-xs text-gray-500 border-t pt-4">
            <p>Generated on: {formatDate(loanData.createdAt)}</p>
            <p>Created by: {loanData.createdBy.name} ({loanData.createdBy.email})</p>
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default LoanPrintout;