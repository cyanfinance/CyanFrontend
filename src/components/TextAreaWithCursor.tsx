import React, { useState } from 'react';

interface TextAreaWithCursorProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

const TextAreaWithCursor: React.FC<TextAreaWithCursorProps> = ({ className = '', ...props }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      <textarea
        {...props}
        className={`${className} w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white/80`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {isHovered && (
        <div className="absolute right-3 top-3 pointer-events-none z-10">
          <div className="bg-white border border-gray-300 rounded-md px-2 py-1 shadow-lg">
            <span className="text-lg">✏️</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextAreaWithCursor;
