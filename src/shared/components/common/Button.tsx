
import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'light' | 'danger';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading = false, ...props }) => {
  const { className, disabled, ...domProps } = props;
  const baseClasses = 'relative px-6 lg:px-8 py-3 min-h-[44px] font-sans font-medium tracking-[0.1em] text-xs rounded-sm transition-all duration-300 ease-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group overflow-hidden border';

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    light: 'bg-[var(--color-text-title)] text-[var(--color-bg-deep)] border-[var(--color-text-title)] hover:opacity-80 shadow-md font-bold',
    danger: 'bg-red-600/10 text-red-600 border-red-600/40 hover:bg-red-600 hover:text-white'
  };

  const finalClassName = `${baseClasses} ${variantClasses[variant]} ${className || ''}`;

  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...domProps} 
      className={finalClassName} 
      disabled={isLoading || disabled}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
};

export default Button;
