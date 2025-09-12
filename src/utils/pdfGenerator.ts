// @ts-ignore
import 'jspdf-autotable';
import jsPDF from 'jspdf';

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

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (...args: any[]) => jsPDF;
  }
}

export const generatePaymentReceipt = (data: PaymentReceiptData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Company Header
  doc.setFontSize(24);
  doc.setTextColor(0, 51, 102); // Dark blue color
  doc.text('Cyan Finance', pageWidth / 2, 20, { align: 'center' });
  
  // Receipt title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Payment Receipt', pageWidth / 2, 35, { align: 'center' });
  
  // Receipt number and date
  doc.setFontSize(10);
  doc.text(`Receipt No: ${data.receiptNumber}`, 20, 50);
  doc.text(`Date: ${new Date(data.paymentDate).toLocaleDateString()}`, pageWidth - 20, 50, { align: 'right' });
  
  // Customer details
  doc.setFontSize(12);
  doc.text('Customer Details', 20, 65);
  doc.setFontSize(10);
  doc.text(`Name: ${data.customerName}`, 20, 75);
  doc.text(`Loan ID: ${data.loanId}`, 20, 85);
  
  // Payment details table
  const tableData = [
    ['Description', 'Amount (₹)'],
    ['Total Loan Amount', data.totalLoanAmount.toLocaleString()],
    ['Payment Amount', data.paymentAmount.toLocaleString()],
    ['Total Amount Paid', data.totalPaid.toLocaleString()],
    ['Remaining Balance', data.remainingBalance.toLocaleString()]
  ];
  
  doc.autoTable({
    startY: 100,
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [0, 51, 102], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 5 }
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  // doc.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, 260, { align: 'center' });
  doc.text('Thank you for your business!', pageWidth / 2, 265, { align: 'center' });
  
  return doc;
};

export const downloadReceipt = (data: PaymentReceiptData): void => {
  const doc = generatePaymentReceipt(data);
  doc.save(`payment_receipt_${data.receiptNumber}.pdf`);
};

export const printReceipt = (data: PaymentReceiptData): void => {
  const doc = generatePaymentReceipt(data);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}; 