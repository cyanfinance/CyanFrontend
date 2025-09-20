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

// @ts-ignore for jspdf-autotable import

// Helper function to convert image to base64
const getImageAsBase64 = (imagePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.warn('Could not get canvas context, using text fallback');
        resolve('');
        return;
      }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = () => {
      console.warn('Could not load logo image, using text fallback');
      resolve(''); // Return empty string as fallback
    };
    img.src = imagePath;
  });
};

export const generatePaymentReceipt = async (data: PaymentReceiptData): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Try to load the logo image
  let logoBase64 = '';
  try {
    // Try multiple possible paths for the logo
    const possiblePaths = [
      '/cyanlogo.png',
      './cyanlogo.png',
      '/src/pages/cyanlogo.png',
      './src/pages/cyanlogo.png'
    ];
    
    for (const path of possiblePaths) {
      try {
        logoBase64 = await getImageAsBase64(path);
        if (logoBase64) break;
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.warn('Could not load logo, using text fallback');
  }
  
  // Add logo if available, otherwise use text
  if (logoBase64) {
    // Add logo image (resize to fit nicely)
    const logoWidth = 40;
    const logoHeight = 20;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(logoBase64, 'PNG', logoX, 10, logoWidth, logoHeight);
  } else {
    // Fallback to text logo
    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102); // Dark blue color
    doc.text('CYAN', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('FINANCE', pageWidth / 2, 32, { align: 'center' });
  }
  
  // Receipt title
  doc.setFontSize(18);
  doc.setTextColor(255, 193, 7); // Golden yellow color
  doc.text('Payment Receipt', pageWidth / 2, 45, { align: 'center' });
  
  // Company contact information
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Cyan Finance', pageWidth / 2, 55, { align: 'center' });
  doc.text('BK Towers, Akkayyapalem, Visakhapatnam, Andhra Pradesh-530016.', pageWidth / 2, 60, { align: 'center' });
  doc.text('Phone: +91-9700049444', pageWidth / 2, 65, { align: 'center' });
  doc.text('Email: support@cyanfinance.in', pageWidth / 2, 70, { align: 'center' });
  
  // Payment details table
  const tableData = [
    ['Date', 'Receipt No', 'Customer Name', 'Payment Amount', 'Total Paid', 'Total Loan Amount', 'To Be Paid'],
    [
      new Date(data.paymentDate).toLocaleDateString('en-GB'), // DD/MM/YYYY format
      data.receiptNumber,
      data.customerName,
      `INR ${data.paymentAmount.toLocaleString()}`,
      `INR ${data.totalPaid.toLocaleString()}`,
      `INR ${data.totalLoanAmount.toLocaleString()}`,
      `INR ${data.remainingBalance.toLocaleString()}`
    ]
  ];
  
  autoTable(doc, {
    startY: 80,
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: 'grid',
    headStyles: { 
      fillColor: [255, 255, 255], // Transparent/white background
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [255, 193, 7], // Golden yellow borders
      lineWidth: 0.5
    },
    styles: { 
      fontSize: 9, 
      cellPadding: 4,
      lineColor: [255, 193, 7], // Golden yellow borders
      lineWidth: 0.5,
      fillColor: [255, 255, 255] // White background for all cells
    },
    columnStyles: {
      0: { cellWidth: 20 }, // Date
      1: { cellWidth: 30 }, // Receipt No
      2: { cellWidth: 25 }, // Customer Name
      3: { cellWidth: 25 }, // Payment Amount
      4: { cellWidth: 20 }, // Total Paid
      5: { cellWidth: 25 }, // Total Loan Amount
      6: { cellWidth: 20 }  // To Be Paid
    }
  });
  
  // Thank you message
  doc.setFontSize(12);
  doc.setTextColor(0, 128, 0); // Green color
  doc.text('Thank you for your payment!', pageWidth / 2, 130, { align: 'center' });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('System generated, no sign required', pageWidth - 20, 140, { align: 'right' });
  
  return doc;
};

export const downloadReceipt = async (data: PaymentReceiptData): Promise<void> => {
  const doc = await generatePaymentReceipt(data);
  doc.save(`payment_receipt_${data.receiptNumber}.pdf`);
};

export const printReceipt = async (data: PaymentReceiptData): Promise<void> => {
  const doc = await generatePaymentReceipt(data);
  doc.autoPrint({ variant: 'non-conform' });
  window.open(doc.output('bloburl'), '_blank');
}; 