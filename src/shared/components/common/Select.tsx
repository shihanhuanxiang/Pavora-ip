
import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  tooltip?: string;
  options: (SelectOption | SelectGroup)[];
}

const Select: React.FC<SelectProps> = ({ label, tooltip, options, className, ...props }) => {
  const isGroup = (opt: SelectOption | SelectGroup): opt is SelectGroup => 'options' in opt;

  return (
    <div className="relative group w-full">
      {label && (
        <div className="flex items-start gap-1.5 mb-2 min-h-[3rem]">
          <label htmlFor={props.id || (typeof label === 'string' ? label : undefined)} className="block text-[13px] font-bold uppercase tracking-[0.1em] font-display group-hover:text-[var(--color-gold)] transition-colors leading-tight text-left">
            {typeof label === 'string' && label.includes(' (') ? (
              <>
                <span className="block mb-0.5">{label.split(' (')[0]}</span>
                <span className="block text-[10px] opacity-50 font-normal">({label.split(' (')[1]}</span>
              </>
            ) : (
              label
            )}
          </label>
          {tooltip && (
            <div className="relative group/tooltip">
              <div className="w-3.5 h-3.5 rounded-full border border-[var(--color-text-dim)] flex items-center justify-center text-[9px] text-[var(--color-text-dim)] cursor-help hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors">
                i
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                <p className="text-[10px] text-[var(--color-text-main)] leading-relaxed normal-case tracking-normal font-sans">{tooltip}</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[var(--color-border)]"></div>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="relative">
        <select
          id={props.id || (typeof label === 'string' ? label : undefined)}
          className={`appearance-none bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text-main)] text-sm rounded-md w-full py-2.5 px-4 focus:border-[var(--color-gold)] focus:outline-none transition-all duration-300 hover:border-[var(--color-gold)]/50 font-sans active:scale-[0.98] cursor-pointer ${className || ''}`}
          {...props}
        >
          {options.map((option, idx) => {
            if (isGroup(option)) {
              return (
                <optgroup key={idx} label={option.label} className="bg-[var(--color-bg-deep)] text-[var(--color-gold)] font-bold italic">
                  {option.options.map(subOpt => (
                    <option key={subOpt.value} value={subOpt.value} className="bg-[var(--color-bg-deep)] text-[var(--color-text-main)] font-normal not-italic">
                      {subOpt.label}
                    </option>
                  ))}
                </optgroup>
              );
            }
            return (
              <option key={option.value} value={option.value} className="bg-[var(--color-bg-deep)] text-[var(--color-text-main)]">
                {option.label}
              </option>
            );
          })}
        </select>
        {/* Custom Minimal Chevron */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--color-text-dim)] group-hover:text-[var(--color-gold)] transition-colors">
          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Select;
