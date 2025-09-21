import React, { useState } from 'react';
// Import the logo directly
import cyanlogo1 from '/cyanlogo1.png?url';
import cyanlogo from '/cyanlogo.png?url';
import favicon from '/favicon.png?url';

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
  fallbackText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  style = {}, 
  alt = 'Cyan Finance Logo',
  fallbackText = true,
  size = 'medium'
}) => {
  const [imageError, setImageError] = useState(false);
  const [logoPath, setLogoPath] = useState(cyanlogo1);

  const sizeClasses = {
    small: 'h-8 w-auto',
    medium: 'h-12 w-auto', 
    large: 'h-16 w-auto'
  };

  const sizeStyles = {
    small: { height: 32, width: 'auto' },
    medium: { height: 48, width: 'auto' },
    large: { height: 64, width: 'auto' }
  };

  // Try different imported logos if the first one fails
  const handleImageError = () => {
    console.warn('❌ Primary logo failed to load, trying fallback');
    if (logoPath === cyanlogo1) {
      setLogoPath(cyanlogo);
    } else if (logoPath === cyanlogo) {
      setLogoPath(favicon);
    } else {
      console.warn('❌ All logos failed to load, using fallback text');
      setImageError(true);
    }
  };

  if (imageError && fallbackText) {
    return (
      <div 
        className={`flex flex-col items-center justify-center ${className}`}
        style={style}
      >
        <div className="font-bold text-blue-800" style={{ 
          fontSize: size === 'large' ? '20px' : size === 'medium' ? '16px' : '12px',
          lineHeight: '1.1',
          letterSpacing: '0.5px'
        }}>
          CYAN
        </div>
        <div className="text-gray-600 font-semibold" style={{ 
          fontSize: size === 'large' ? '14px' : size === 'medium' ? '12px' : '10px',
          lineHeight: '1.1',
          letterSpacing: '0.3px'
        }}>
          FINANCE
        </div>
      </div>
    );
  }

  return (
    <img
      src={logoPath}
      alt={alt}
      className={`${sizeClasses[size]} ${className}`}
      style={{ ...sizeStyles[size], ...style }}
      onError={handleImageError}
    />
  );
};

export default Logo;
