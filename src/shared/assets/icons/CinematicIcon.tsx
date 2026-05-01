
import React from 'react';

const CinematicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="12" x2="23" y2="12" />
    <line x1="4" y1="12" x2="1" y2="12" />
    <line x1="12" y1="16" x2="12" y2="21" />
  </svg>
);

export default CinematicIcon;
