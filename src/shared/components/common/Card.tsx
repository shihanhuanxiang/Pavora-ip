
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: 'default' | 'glass' | 'solid';
  isLoading?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ children, className, variant = 'glass', isLoading, ...props }, ref) => {
  const baseClasses = 'transition-all duration-500 relative overflow-hidden';
  
  const variantClasses = {
    // Ultra-thin border, deep blur, less rounding for a sharper "architectural" look
    glass: 'glass-panel rounded-lg border-[var(--color-border)] hover:border-[var(--color-gold)]/50 shadow-2xl hover:shadow-[var(--color-gold)]/5',
    solid: 'bg-[var(--color-bg-deep)] border border-[var(--color-border)] rounded-lg',
    default: 'bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-lg'
  };

  const interactiveClasses = props.onClick 
    ? 'cursor-pointer hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:-translate-y-1 active:scale-[0.98] group' 
    : '';
  
  return (
    <div
      {...props}
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${interactiveClasses} p-6 ${className || ''}`}
    >
      {/* Subtle sheen animation on hover */}
      {props.onClick && (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      )}
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
