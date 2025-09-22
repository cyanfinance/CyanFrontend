import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

// Import logo directly for better reliability in deployment
import cyanlogo1 from '../assets/cyanlogo1.png';
import cyanlogo from '../assets/cyanlogo.png';

interface PaymentReceiptData {
  customerName: string;
  paymentDate: string;
  paymentAmount: number;
  totalLoanAmount: number;
  totalPaid: number;
  remainingBalance: number;
  loanId: string;
  receiptNumber: string;
}

// Simple function to add text logo
const addTextLogo = (doc: jsPDF, x: number, y: number, pageWidth: number) => {
  doc.setFontSize(20);
  doc.setTextColor(0, 51, 102); // Dark blue
  doc.text('CYAN', x, y, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0); // Black
  doc.text('FINANCE', x, y + 8, { align: 'center' });
};

// Function to load logo as base64 - simplified approach for deployment reliability
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

export const generatePaymentReceipt = async (data: PaymentReceiptData): Promise<jsPDF> => {
  // Use a custom receipt size (full A4 width, optimized height for better space utilization)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [210, 148.5] // Custom size: 210mm width (A4 width), 148.5mm height (half of A4 height)
  });
  const pageWidth = doc.internal.pageSize.width;

  // Debug environment info
  console.log('🔍 Environment info:', {
    origin: window.location.origin,
    pathname: window.location.pathname,
    isLocalhost: window.location.hostname === 'localhost',
    isVercel: window.location.hostname.includes('vercel.app')
  });

  // Load and add company logo
  const logoBase64 = await loadLogoAsBase64();
  
  // Try to add logo image, fallback to text if it fails
  if (logoBase64 && logoBase64.length > 1000 && !logoBase64.includes('iVBORw0KGgoAAAANs...')) {
    try {
      const logoWidth = 30;
      const logoHeight = 10;
      const logoX = (pageWidth - logoWidth) / 2;
      
      doc.addImage(logoBase64, 'PNG', logoX, 10, logoWidth, logoHeight);
      console.log('✅ Logo successfully added to payment receipt');
    } catch (error) {
      console.warn('❌ Failed to add logo image, using text fallback:', error);
      addTextLogo(doc, pageWidth / 2, 20, pageWidth);
    }
  } else {
    console.log('⚠️ Logo not available, using text fallback');
    addTextLogo(doc, pageWidth / 2, 20, pageWidth);
  }

  // Add title (position based on whether logo was displayed)
  const titleY = logoBase64 && logoBase64.length > 1000 ? 25 : 25;
  doc.setFontSize(16);
  doc.setTextColor(255, 193, 7); // Golden yellow
  doc.text('Payment Receipt', pageWidth / 2, titleY, { align: 'center' });

  // Add company details with proper spacing and alignment
  const detailsStartY = titleY + 6;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Cyan Finance', pageWidth / 2, detailsStartY, { align: 'center' });
  doc.text('BK Towers, Akkayyapalem, Visakhapatnam', pageWidth / 2, detailsStartY + 6, { align: 'center' });
  doc.text('Andhra Pradesh - 530016', pageWidth / 2, detailsStartY + 12, { align: 'center' });
  doc.text('Phone: +91-9700049444', pageWidth / 2, detailsStartY + 18, { align: 'center' });
  doc.text('Email: support@cyanfinance.in', pageWidth / 2, detailsStartY + 24, { align: 'center' });

  

  // Format date for better readability and compact display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Prepare table data
  const tableData = [
    ['Date', 'Receipt No', 'Customer Name', 'Payment Amount', 'Total Paid', 'Total Loan Amount', 'To Be Paid'],
    [
      formatDate(data.paymentDate),
      data.receiptNumber,
      data.customerName,
      ` ${data.paymentAmount.toLocaleString()}`,
      ` ${data.totalPaid.toLocaleString()}`,
      ` ${data.totalLoanAmount.toLocaleString()}`,
      ` ${Math.max(0, data.remainingBalance).toLocaleString()}`
    ]
  ];

  // Add "Payment Details" heading above the table
  const headingY = detailsStartY + 30;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold'); // Bold font
  doc.setTextColor(0, 0, 0); // Black
  doc.text('Payment Details:', 10, headingY, { align: 'left' }); // Left aligned

  // Add table (position based on content above)
  const tableStartY = headingY + 4; // Spacing after heading
  autoTable(doc, {
    startY: tableStartY,
    margin: { left: 5, right: 5 }, // Balanced margins for deployment
    tableWidth: 210, // Increased width for better column spacing
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: 'grid',
    headStyles: { 
      fillColor: [255, 255, 255], // White background
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9, // Slightly larger font for better readability
      lineColor: [255, 193, 7], // Golden yellow borders
      lineWidth: 0.5,
      halign: 'center', // Center align headers
      cellPadding: 1 // Increased padding for better spacing
    },
    styles: { 
      fontSize: 9, // Slightly larger font for better readability
      cellPadding: 1, // Reduced padding for better fit
      lineColor: [255, 193, 7], // Golden yellow borders
      lineWidth: 0.5,
      fillColor: [255, 255, 255] // White background for all cells
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' }, // Date - centered
      1: { cellWidth: 20, halign: 'center' }, // Receipt No - centered
      2: { cellWidth: 25, halign: 'center' }, // Customer Name - centered
      3: { cellWidth: 18, halign: 'center' }, // Payment Amount - centered
      4: { cellWidth: 18, halign: 'center' }, // Total Paid - centered
      5: { cellWidth: 18, halign: 'center' }, // Total Loan Amount - centered
      6: { cellWidth: 18, halign: 'center' }  // To Be Paid - centered
    }
  });
  
  // Thank you message (position after table with proper spacing)
  const thankYouY = tableStartY + 30; // Increased spacing to prevent overlap
  doc.setFontSize(12);
  doc.setTextColor(0, 128, 0); // Green color
  doc.text('Thank you for your payment!', pageWidth / 2, thankYouY, { align: 'center' });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(0,0,0); // Gray color
  doc.text('Sign & Stamp', pageWidth - 20, thankYouY + 15, { align: 'right' });

  return doc;
};

// Export function for downloading receipt
export const downloadReceipt = async (data: PaymentReceiptData) => {
  const doc = await generatePaymentReceipt(data);
  doc.save(`payment_receipt_${data.receiptNumber}.pdf`);
};
