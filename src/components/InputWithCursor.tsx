import React, { useState } from 'react';

interface InputWithCursorProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const InputWithCursor: React.FC<InputWithCursorProps> = ({ className = '', ...props }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        className={`${className} w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {isHovered && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
          <div className="bg-white border border-gray-300 rounded-md px-2 py-1 shadow-lg">
            <span className="text-lg">✏️</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputWithCursor;
