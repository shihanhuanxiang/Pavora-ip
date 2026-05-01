import React from 'react';
import { motion } from 'motion/react';
import SkullIcon from '../../assets/icons/SkullIcon';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-[100]"
    >
      <div className="relative">
        <SkullIcon className="w-24 h-24 text-[var(--color-gold)] animate-pulse" />
        <div className="absolute inset-0 border-4 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8 text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-title)]"
      >
        {message}
      </motion.p>
      <div className="mt-4 flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.div 
            key={i}
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
            className="w-2 h-2 bg-[var(--color-gold)] rounded-full"
          />
        ))}
      </div>
    </motion.div>
  );
};

export default Loader;
