import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-2xl font-bold transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-200",
    secondary: "bg-white hover:bg-slate-50 text-indigo-600 border-2 border-indigo-100 shadow-slate-100",
    accent: "bg-pink-500 hover:bg-pink-400 text-white shadow-pink-200"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${isLoading || disabled ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1'} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Thinking...
        </>
      ) : children}
    </button>
  );
};