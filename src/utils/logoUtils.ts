// Logo utility functions for consistent logo handling across the application

// Production logo path - will be resolved by Vite during build
const PRODUCTION_LOGO_PATH = '/cyanlogo1.png';

// Fallback base64 logo (simple 1x1 transparent PNG)
const FALLBACK_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Check if we should skip logo image and use text only
export const shouldUseTextOnly = (base64: string): boolean => {
  return base64 === FALLBACK_LOGO_BASE64 || base64.length < 200;
};

// Check if the loaded logo is a fallback (very small base64)
export const isFallbackLogo = (base64: string): boolean => {
  return base64 === FALLBACK_LOGO_BASE64 || base64.length < 200;
};

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
        
        // Validate the base64 data
        if (dataURL && dataURL.length > 100 && dataURL.startsWith('data:image/png;base64,')) {
          console.log('✅ Successfully converted image to base64, length:', dataURL.length);
          resolve(dataURL);
        } else {
          console.warn('❌ Invalid base64 data generated');
          resolve('');
        }
      } catch (error) {
        console.warn('Error converting image to base64:', error);
        resolve('');
      }
    };
    
    img.onerror = (error) => {
      console.warn('Could not load logo image from:', imagePath, error);
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
    '/cyanlogo1.png',          // New logo (production)
    '/cyanlogo.png',           // Public directory (production)
    './cyanlogo1.png',         // Relative path
    './cyanlogo.png',          // Relative path
    'favicon.png',             // Root directory favicon
    '/favicon.png',            // Alternative logo
    'cyanlogo1.png',           // Simple filename
    'cyanlogo.png'             // Simple filename
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
  
  console.warn('⚠️ No logo could be loaded from any path, using fallback base64 logo');
  return FALLBACK_LOGO_BASE64;
};

/**
 * Alternative method to load logo using fetch API (more reliable for some environments)
 * @returns Promise<string> - Base64 encoded logo or empty string if failed
 */
export const getLogoBase64ViaFetch = async (): Promise<string> => {
  const fetchPaths = ['/cyanlogo1.png', '/cyanlogo.png', './cyanlogo1.png', './cyanlogo.png', 'favicon.png', '/favicon.png', 'cyanlogo1.png', 'cyanlogo.png'];
  
  for (const path of fetchPaths) {
    try {
      console.log('🔄 Trying to load logo via fetch API from:', path);
      const response = await fetch(path);
      if (!response.ok) {
        console.warn(`❌ HTTP ${response.status}: ${response.statusText} for path: ${path}`);
        continue;
      }
      
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          
          // Validate the base64 data
          if (result && result.length > 100 && result.startsWith('data:image/png;base64,')) {
            console.log('✅ Logo loaded successfully via fetch API from:', path, 'length:', result.length);
            resolve(result);
          } else {
            console.warn('❌ Invalid base64 data from fetch API for path:', path);
            resolve('');
          }
        };
        reader.onerror = () => {
          console.warn('❌ Failed to convert logo blob to base64 for path:', path);
          resolve('');
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('❌ Failed to load logo via fetch API from path:', path, error);
      continue;
    }
  }
  
  console.warn('❌ All fetch paths failed for logo loading, using fallback base64 logo');
  return FALLBACK_LOGO_BASE64;
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
    img.onload = () => {
      console.log(`✅ Image loaded successfully from: ${path}`);
      resolve(true);
    };
    img.onerror = (error) => {
      console.log(`❌ Image failed to load from: ${path}`, error);
      resolve(false);
    };
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
  if (base64Logo && base64Logo.length > 1000) {
    return `<img src="${base64Logo}" class="${className}" alt="${altText}" style="max-width: 100%; height: auto; max-height: 40px;" />`;
  } else {
    return `
      <div class="${className}" style="text-align: center; font-family: Arial, sans-serif;">
        <div style="font-size: 24px; font-weight: bold; color: #003366;">CYAN</div>
        <div style="font-size: 16px; color: #000;">FINANCE</div>
      </div>
    `;
  }
};
