import React from 'react';

const DiceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.27 6.96 12 12.01l8.73-5.05" />
    <path d="M12 22.08V12" />
    {/* Top face: 1 dot */}
    <circle cx="12" cy="8.5" r="0.5" fill="currentColor" stroke="none" />
    {/* Left face: 2 dots */}
    <circle cx="8" cy="10.5" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="8" cy="13.5" r="0.5" fill="currentColor" stroke="none" />
    {/* Right face: 3 dots */}
    <circle cx="16" cy="10.5" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="16" cy="13.5" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="16" cy="12" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

export default DiceIcon;