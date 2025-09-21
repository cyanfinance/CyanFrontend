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
  try {
    const response = await fetch('/cyanlogo.png');
    if (response.ok) {
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.warn('Error loading logo:', error);
  }
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
  
  if (logoBase64 && logoBase64.length > 1000 && !logoBase64.includes('iVBORw0KGgoAAAANs...')) {
    try {
      // Add logo image to PDF
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
    console.log('⚠️ Logo not available or fallback detected, using text fallback');
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
    margin: { left: 3, right: 3 }, // Minimal margins for deployment
    tableWidth: 'auto', // Auto width for better fitting
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: 'grid',
    headStyles: { 
      fillColor: [255, 255, 255], // White background
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 7, // Reduced for deployment
      lineColor: [255, 193, 7], // Golden yellow borders
      lineWidth: 0.5,
      halign: 'center', // Center align headers
      cellPadding: 2 // Reduced padding for deployment
    },
    styles: { 
      fontSize: 7, // Reduced for deployment
      cellPadding: 2, // Reduced padding for deployment
      lineColor: [255, 193, 7], // Golden yellow borders
      lineWidth: 0.5,
      fillColor: [255, 255, 255] // White background for all cells
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'left' }, // Date - further reduced for deployment
      1: { cellWidth: 18, halign: 'left' }, // Receipt No - further reduced for deployment
      2: { cellWidth: 18, halign: 'left' }, // Customer Name - further reduced for deployment
      3: { cellWidth: 18, halign: 'right' }, // Payment Amount - further reduced for deployment
      4: { cellWidth: 18, halign: 'right' }, // Total Paid - further reduced for deployment
      5: { cellWidth: 18, halign: 'right' }, // Total Loan Amount - further reduced for deployment
      6: { cellWidth: 16, halign: 'right' }  // To Be Paid - further reduced for deployment
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
