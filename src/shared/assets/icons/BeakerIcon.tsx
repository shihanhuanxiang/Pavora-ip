import React from 'react';

const BeakerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.596 15.12a2 2 0 00-1.022.547l-2.396 2.396a2 2 0 000 2.828l2.396 2.396a2 2 0 002.828 0l2.396-2.396a2 2 0 00.547-1.022l.477-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 01-.517-3.86l.477-2.387a2 2 0 00-.547-1.022L5.596 3.12a2 2 0 00-2.828 0L.372 5.516a2 2 0 000 2.828l2.396 2.396z" />
  </svg>
);

export default BeakerIcon;
