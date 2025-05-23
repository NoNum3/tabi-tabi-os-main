import * as React from "react";

export const ReportIcon = ({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path
      d="M10 2L2 18h16L10 2z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <circle cx="10" cy="14" r="1" fill="currentColor" />
    <rect x="9.25" y="8" width="1.5" height="4" rx="0.75" fill="currentColor" />
  </svg>
); 