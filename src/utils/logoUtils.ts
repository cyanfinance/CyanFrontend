// Logo utility functions for consistent logo handling across the application

// Production logo path - will be resolved by Vite during build
const PRODUCTION_LOGO_PATH = '/cyanlogo.png';

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
  // Try the production logo path first
  try {
    const base64 = await getImageAsBase64(PRODUCTION_LOGO_PATH);
    if (base64) {
      console.log('✅ Logo loaded successfully from production path:', PRODUCTION_LOGO_PATH);
      return base64;
    }
  } catch (error) {
    console.warn('❌ Failed to load logo from production path:', error);
  }
  
  // Fallback to trying other paths
  const possiblePaths = [
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
 * Alternative method to load logo using fetch API (more reliable for some environments)
 * @returns Promise<string> - Base64 encoded logo or empty string if failed
 */
export const getLogoBase64ViaFetch = async (): Promise<string> => {
  try {
    console.log('🔄 Trying to load logo via fetch API...');
    const response = await fetch('/cyanlogo.png');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        console.log('✅ Logo loaded successfully via fetch API');
        resolve(result);
      };
      reader.onerror = () => {
        console.warn('❌ Failed to convert logo blob to base64');
        resolve('');
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('❌ Failed to load logo via fetch API:', error);
    return '';
  }
};

/**
 * Get the best available logo path for direct use in img src
 * @returns string - Path to logo or empty string if none found
 */
export const getLogoPath = (): string => {
  // Use the production logo path first
  return PRODUCTION_LOGO_PATH;
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
