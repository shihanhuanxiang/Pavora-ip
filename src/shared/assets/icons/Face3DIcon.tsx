
import React from 'react';

const Face3DIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <circle cx="12" cy="12" r="9" />
    <path d="M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
    <path d="M12 10.5v-4" />
    <path d="M9 8.5h6" />
    <path d="M9 16.5c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5" />
    <path d="M5.6 5.6l1.5 1.5" />
    <path d="M16.9 5.6l-1.5 1.5" />
  </svg>
);

export default Face3DIcon;
