import React from 'react';

const ReplaceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001a.75.75 0 01.75.75v3.666a.75.75 0 01-.75.75h-4.992v.001a.75.75 0 01-.75-.75V10.1c0-.414.336-.75.75-.75z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12.75h4.992v.001a.75.75 0 00.75-.75V8.334a.75.75 0 00-.75-.75H3.75v-.001a.75.75 0 00-.75.75v3.666a.75.75 0 00.75.75z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15l-3-3m0 0l3-3m-3 3h12m6 0l-3-3m0 0l3-3" />
  </svg>
);

export default ReplaceIcon;