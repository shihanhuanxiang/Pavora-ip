import React from 'react';

const PosterEngineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="m10.1 15.1 1.9-1.9" />
    <path d="M10.7 13.5c.2.2.5.2.7 0l4.3-4.3c.2-.2.2-.5 0-.7l-1.4-1.4c-.2-.2-.5-.2-.7 0l-4.3 4.3c-.2.2-.2.5 0 .7l1.4 1.4Z" />
    <path d="m16.5 13.5-1.5 1.5" />
    <path d="m15.5 12.5 1.5-1.5" />
    <path d="m5 17 3-3" />
  </svg>
);

export default PosterEngineIcon;