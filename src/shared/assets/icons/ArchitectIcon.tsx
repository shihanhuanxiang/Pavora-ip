
import React from 'react';

const ArchitectIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M3 21h18" />
    <path d="M5 21V7" />
    <path d="M19 21V7" />
    <path d="M9 21V8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v13" />
    <path d="M5 7a2 2 0 0 1 2-2h3m4 0h3a2 2 0 0 1 2 2" />
    <path d="M12 5V3" />
    <path d="M10 11h4" />
    <path d="M10 15h4" />
  </svg>
);

export default ArchitectIcon;
