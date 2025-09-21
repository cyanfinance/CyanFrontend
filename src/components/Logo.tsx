import React, { useState, useEffect } from 'react';
import { getLogoPath, checkLogoExists } from '../utils/logoUtils';

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
  const [logoPath, setLogoPath] = useState('/cyanlogo1.png');

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

  // Check for logo availability on component mount
  useEffect(() => {
    const checkLogo = async () => {
      const possiblePaths = [
        '/cyanlogo1.png',
        '/cyanlogo.png',
        '/favicon.png',
        './cyanlogo1.png',
        './cyanlogo.png',
        './favicon.png',
        'cyanlogo1.png',
        'cyanlogo.png',
        'favicon.png',
        window.location.origin + '/cyanlogo1.png',
        window.location.origin + '/cyanlogo.png',
        window.location.origin + '/favicon.png',
        // Try with different build paths
        window.location.origin + '/dist/cyanlogo1.png',
        window.location.origin + '/dist/cyanlogo.png',
        window.location.origin + '/assets/cyanlogo1.png',
        window.location.origin + '/assets/cyanlogo.png',
        window.location.origin + '/static/cyanlogo1.png',
        window.location.origin + '/static/cyanlogo.png'
      ];

      console.log('🔍 Checking logo paths...');
      for (const path of possiblePaths) {
        console.log(`🔄 Testing path: ${path}`);
        const exists = await checkLogoExists(path);
        if (exists) {
          console.log('✅ Logo found at:', path);
          setLogoPath(path);
          return;
        } else {
          console.log('❌ Logo not found at:', path);
        }
      }
      console.warn('⚠️ No logo found in any path, will use fallback text');
    };

    checkLogo();
  }, []);

  const handleImageError = () => {
    console.warn('❌ Logo image failed to load, using fallback text');
    setImageError(true);
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
