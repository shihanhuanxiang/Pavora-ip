
import React from 'react';

const StyleAnchorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <rect x="2" y="2" width="8" height="8" rx="1" />
    <rect x="14" y="2" width="8" height="8" rx="1" />
    <rect x="2" y="14" width="8" height="8" rx="1" />
    <path d="M14 14l8 8" />
    <path d="M22 14l-8 8" />
  </svg>
);

export default StyleAnchorIcon;
