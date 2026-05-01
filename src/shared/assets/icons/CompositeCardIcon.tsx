import React from 'react';

const CompositeCardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 1.5m1-1.5l1 1.5m0 0l1.5-2.25m-1.5 2.25l-1.5-2.25m6-13.5V3.75m0 11.25V15m0 0a2.25 2.25 0 002.25 2.25h1.5M12 15v2.25" />
    </svg>
);

export default CompositeCardIcon;