// Logo utility functions for consistent logo handling across the application

/**
 * Convert image to base64 for embedding in PDFs and print content
 * @param imagePath - Path to the image file
 * @returns Promise<string> - Base64 encoded image or empty string if failed
 */
export const getImageAsBase64 = (imagePath: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
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
      } catch (error) {
        console.warn('Error converting image to base64:', error);
        resolve('');
      }
    };
    
    img.onerror = () => {
      console.warn('Could not load logo image from:', imagePath);
      resolve('');
    };
    
    img.src = imagePath;
  });
};

/**
 * Try multiple logo paths and return the first one that loads successfully
 * @returns Promise<string> - Base64 encoded logo or empty string if none found
 */
export const getLogoBase64 = async (): Promise<string> => {
  // List of possible logo paths in order of preference
  const possiblePaths = [
    '/cyanlogo.png',           // Public directory (deployed)
    './cyanlogo.png',          // Relative path
    '/favicon.png',            // Alternative logo
    '/logo192.png',            // React default logo
    '/src/pages/cyanlogo.png', // Source directory (development)
    './src/pages/cyanlogo.png' // Relative source path
  ];
  
  for (const path of possiblePaths) {
    try {
      const base64 = await getImageAsBase64(path);
      if (base64) {
        console.log('✅ Logo loaded successfully from:', path);
        return base64;
      }
    } catch (error) {
      console.warn('❌ Failed to load logo from:', path, error);
      continue;
    }
  }
  
  console.warn('⚠️ No logo could be loaded from any path, using text fallback');
  return '';
};

/**
 * Get the best available logo path for direct use in img src
 * @returns string - Path to logo or empty string if none found
 */
export const getLogoPath = (): string => {
  // In production, these paths should work
  const possiblePaths = [
    '/cyanlogo.png',
    '/favicon.png',
    '/logo192.png'
  ];
  
  // Return the first path - the browser will handle 404s gracefully
  return possiblePaths[0];
};

/**
 * Check if logo file exists by attempting to load it
 * @param path - Path to check
 * @returns Promise<boolean> - True if logo exists
 */
export const checkLogoExists = async (path: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = path;
  });
};

/**
 * Generate a fallback text logo for PDFs when image fails to load
 * @param doc - jsPDF document instance
 * @param x - X position
 * @param y - Y position for "CYAN"
 * @param width - Page width for centering
 */
export const addTextLogo = (doc: any, x: number, y: number, width: number) => {
  // CYAN text
  doc.setFontSize(20);
  doc.setTextColor(0, 51, 102); // Dark blue color
  doc.text('CYAN', x, y, { align: 'center' });
  
  // FINANCE text
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('FINANCE', x, y + 7, { align: 'center' });
};

/**
 * Generate HTML for logo with fallback text
 * @param base64Logo - Base64 encoded logo (optional)
 * @param className - CSS classes for the image
 * @param altText - Alt text for the image
 * @returns string - HTML string
 */
export const getLogoHTML = (base64Logo?: string, className: string = '', altText: string = 'Cyan Finance Logo'): string => {
  if (base64Logo) {
    return `<img src="${base64Logo}" class="${className}" alt="${altText}" style="max-width: 100%; height: auto;" />`;
  } else {
    return `
      <div class="${className}" style="text-align: center; font-family: Arial, sans-serif;">
        <div style="font-size: 24px; font-weight: bold; color: #003366;">CYAN</div>
        <div style="font-size: 16px; color: #000;">FINANCE</div>
      </div>
    `;
  }
};
