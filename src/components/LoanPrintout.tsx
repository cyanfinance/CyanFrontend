import React from 'react';

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
  onClose: () => void;
}

const LoanPrintout: React.FC<LoanPrintoutProps> = ({ loanData, onClose }) => {
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

  const handlePrint = () => {
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
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Description</th>
                  <th class="text-right">Gross Weight (g)</th>
                  <th class="text-right">Net Weight (g)</th>
                </tr>
              </thead>
              <tbody>
                ${loanData.goldItems.map((item, index) => `
                  <tr>
                    <td>Item ${index + 1}</td>
                    <td>${item.description}</td>
                    <td class="text-right">${item.grossWeight}</td>
                    <td class="text-right">${item.netWeight}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
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
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                🖨️ Print
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
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-left">Item</th>
                      <th className="border border-gray-300 p-3 text-left">Description</th>
                      <th className="border border-gray-300 p-3 text-right">Gross Weight (g)</th>
                      <th className="border border-gray-300 p-3 text-right">Net Weight (g)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanData.goldItems.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 p-3">Item {index + 1}</td>
                        <td className="border border-gray-300 p-3">{item.description}</td>
                        <td className="border border-gray-300 p-3 text-right">{item.grossWeight}</td>
                        <td className="border border-gray-300 p-3 text-right">{item.netWeight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
