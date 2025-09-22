// Utility function to convert numbers to words in Indian format
export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function convertHundreds(n: number): string {
    let result = '';
    
    if (n > 99) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    
    if (n > 19) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n > 9) {
      result += teens[n - 10] + ' ';
      return result.trim();
    }
    
    if (n > 0) {
      result += ones[n] + ' ';
    }
    
    return result.trim();
  }
  
  function convertToIndianFormat(n: number): string {
    let result = '';
    
    // Crores (10^7)
    if (n >= 10000000) {
      const crores = Math.floor(n / 10000000);
      result += convertHundreds(crores) + ' Crore ';
      n %= 10000000;
    }
    
    // Lakhs (10^5)
    if (n >= 100000) {
      const lakhs = Math.floor(n / 100000);
      result += convertHundreds(lakhs) + ' Lakh ';
      n %= 100000;
    }
    
    // Thousands (10^3)
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      result += convertHundreds(thousands) + ' Thousand ';
      n %= 1000;
    }
    
    // Hundreds, Tens, Ones
    if (n > 0) {
      result += convertHundreds(n);
    }
    
    return result.trim();
  }
  
  return convertToIndianFormat(num);
}

// Format currency with commas and add "Rupees" prefix
export function formatAmountInWords(amount: number): string {
  const words = numberToWords(amount);
  return `Rupees ${words.toLowerCase()} only`;
}
