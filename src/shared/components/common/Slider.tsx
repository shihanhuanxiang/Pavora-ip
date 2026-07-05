import React from 'react';
import { motion } from 'motion/react';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label: React.ReactNode;
  tooltip?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  safetyStatus?: 'safe' | 'warning' | 'risky';
  isLoading?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Slider: React.FC<SliderProps> = ({ label, tooltip, value, min, max, step = 1, unit, safetyStatus, isLoading, onChange, ...props }) => {
    const percentage = ((value - min) / (max - min)) * 100;

    const [isDragging, setIsDragging] = React.useState(false);

    const getStatusStyles = () => {
        switch (safetyStatus) {
            case 'safe': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'warning': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'risky': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-[var(--color-gold)] bg-[var(--color-gold)]/10 border-[var(--color-gold)]/20';
        }
    };

    return (
        <div className="group">
        <div className="flex justify-between items-start mb-2 min-h-[3rem]">
            <div className="flex items-start gap-1.5 pt-0.5">
                <label className="text-[13px] font-bold text-[var(--color-text-dim)] uppercase tracking-widest group-hover:text-[var(--color-gold)] transition-colors leading-tight font-display text-left">
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
                <motion.span 
                    key={value}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded border flex flex-col items-center leading-none ${getStatusStyles()}`}
                >
                    <span>{value}{unit}</span>
                    {safetyStatus && (
                        <span className="text-[7px] uppercase tracking-tighter opacity-70 mt-0.5">
                            {safetyStatus === 'safe' ? 'Normal' : safetyStatus === 'warning' ? 'Extreme' : 'Risky'}
                        </span>
                    )}
                </motion.span>
            </div>
            <div className="relative flex items-center h-6">
                {/* Floating Value Bubble */}
                <motion.div 
                    className="absolute bottom-full mb-4 px-2 py-1 bg-[var(--color-gold)] text-black text-[10px] font-bold rounded shadow-lg pointer-events-none z-20"
                    style={{ left: `${percentage}%`, x: '-50%' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ 
                        opacity: isDragging ? 1 : 0, 
                        y: isDragging ? 0 : 10,
                        scale: isDragging ? 1 : 0.8
                    }}
                >
                    {value}{unit}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--color-gold)]"></div>
                </motion.div>

                <div className="absolute w-full h-1 bg-[var(--color-bg-input)] rounded-full overflow-hidden border border-[var(--color-border)]">
                    <motion.div 
                        className="h-full bg-gradient-to-r from-[var(--color-gold-dim)] to-[var(--color-gold)]"
                        initial={false}
                        animate={{ width: `${percentage}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                </div>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={onChange}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={() => setIsDragging(false)}
                    {...props}
                    className="absolute w-full h-1 bg-transparent appearance-none cursor-pointer z-10 
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                               [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white 
                               [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--color-gold)]
                               [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(212,175,55,0.5)]
                               [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-200
                               [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:active:scale-110"
                />
            </div>
        </div>
    );
};

export default Slider;