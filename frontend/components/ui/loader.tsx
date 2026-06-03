import React from 'react';
import { cn } from '@/lib/utils';

export function Loader({ className, text, ...props }: React.SVGProps<SVGSVGElement> & { text?: string | boolean }) {
  // Automatically hide text for small button loaders unless explicitly requested
  const isSmall = className?.includes("w-4") || className?.includes("w-5") || className?.includes("w-3") || className?.includes("h-4") || className?.includes("h-5") || className?.includes("h-3");
  const shouldShowText = text === undefined ? !isSmall : text;
  const displayText = typeof text === 'string' ? text : "Loading...";

  const svg = (
    <svg 
      viewBox="25 25 50 50" 
      className={cn("beaver-loader", className)} 
      {...props}
    >
      <circle 
        r={20} cy={50} cx={50} 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="round"
        className="beaver-loader-circle" 
      />
    </svg>
  );

  return (
    <>
      <style>{`
        .beaver-loader {
          width: 1em;
          height: 1em;
          transform-origin: center;
          animation: rotate4 2s linear infinite;
        }
        
        .beaver-loader-circle {
          fill: none;
          stroke: currentColor;
          stroke-width: 4;
          stroke-dasharray: 1, 200;
          stroke-dashoffset: 0;
          stroke-linecap: round;
          animation: dash4 1.5s ease-in-out infinite;
        }

        @keyframes rotate4 {
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes dash4 {
          0% {
            stroke-dasharray: 1, 200;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 90, 200;
            stroke-dashoffset: -35px;
          }
          100% {
            stroke-dashoffset: -125px;
          }
        }
      `}</style>
      
      {shouldShowText ? (
        <div className="flex flex-col items-center justify-center gap-3">
          {svg}
          <span className="text-sm font-medium text-slate-500/80 animate-pulse">{displayText}</span>
        </div>
      ) : (
        svg
      )}
    </>
  );
}
