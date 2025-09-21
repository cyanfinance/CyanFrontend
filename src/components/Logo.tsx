import React, { useState } from 'react';
import { getLogoPath } from '../utils/logoUtils';

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

  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12', 
    large: 'h-16 w-16'
  };

  const sizeStyles = {
    small: { height: 32, width: 32 },
    medium: { height: 48, width: 48 },
    large: { height: 64, width: 64 }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError && fallbackText) {
    return (
      <div 
        className={`flex flex-col items-center justify-center ${className}`}
        style={style}
      >
        <div className="font-bold text-blue-800" style={{ fontSize: size === 'large' ? '20px' : size === 'medium' ? '16px' : '12px' }}>
          CYAN
        </div>
        <div className="text-gray-600" style={{ fontSize: size === 'large' ? '14px' : size === 'medium' ? '12px' : '10px' }}>
          FINANCE
        </div>
      </div>
    );
  }

  return (
    <img
      src={getLogoPath()}
      alt={alt}
      className={`${sizeClasses[size]} ${className}`}
      style={{ ...sizeStyles[size], ...style }}
      onError={handleImageError}
    />
  );
};

export default Logo;
