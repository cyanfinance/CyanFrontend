import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

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

// Function to load logo as base64
const loadLogoAsBase64 = async (): Promise<string> => {
  const possiblePaths = [
    '/cyanlogo.png',
    './cyanlogo.png',
    'cyanlogo.png',
    '/favicon.png',
    'favicon.png'
  ];

  for (const path of possiblePaths) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Validate the base64 data
            if (result && result.length > 1000 && !result.includes('iVBORw0KGgoAAAANs...')) {
              console.log(`✅ Logo loaded successfully from: ${path}`);
              resolve(result);
            } else {
              console.warn(`Invalid logo data from ${path}, trying next path`);
              resolve('');
            }
          };
          reader.onerror = () => {
            console.warn(`Error reading logo file from ${path}`);
            resolve('');
          };
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.warn(`Error loading logo from ${path}:`, error);
      continue;
    }
  }
  
  console.warn('⚠️ No logo could be loaded from any path');
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

  // Load and add company logo
  const logoBase64 = await loadLogoAsBase64();
  
  // Try to add logo image, fallback to text if it fails
  if (logoBase64 && logoBase64.length > 1000 && !logoBase64.includes('iVBORw0KGgoAAAANs...')) {
    try {
      const logoWidth = 20;
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

  // Add table (position based on content above)
  const tableStartY = detailsStartY + 30; // Adjusted spacing without separator line
  autoTable(doc, {
    startY: tableStartY,
    margin: { left: 10, right: 10 }, // Adequate margins for deployment
    tableWidth: 180, // Smaller fixed width to prevent overflow
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: 'grid',
    headStyles: { 
      fillColor: [255, 255, 255], // White background
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8, // Increased font size for readability
      lineColor: [255, 193, 7], // Golden yellow borders
      lineWidth: 0.5,
      halign: 'center', // Center align headers
      cellPadding: 2 // Increased padding for readability
    },
    styles: { 
      fontSize: 8, // Increased font size for readability
      cellPadding: 2, // Increased padding for readability
      lineColor: [255, 193, 7], // Golden yellow borders
      lineWidth: 0.5,
      fillColor: [255, 255, 255] // White background for all cells
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'left' }, // Date - ultra minimal width
      1: { cellWidth: 10, halign: 'left' }, // Receipt No - ultra minimal width
      2: { cellWidth: 10, halign: 'left' }, // Customer Name - ultra minimal width
      3: { cellWidth: 10, halign: 'right' }, // Payment Amount - ultra minimal width
      4: { cellWidth: 10, halign: 'right' }, // Total Paid - ultra minimal width
      5: { cellWidth: 10, halign: 'right' }, // Total Loan Amount - ultra minimal width
      6: { cellWidth: 8, halign: 'right' }  // To Be Paid - ultra minimal width
    }
  });
  
  // Thank you message (position after table with proper spacing)
  const thankYouY = tableStartY + 35; // Increased spacing to prevent overlap
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
