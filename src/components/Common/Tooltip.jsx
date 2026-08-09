import React from "react";

/**
 * Reusable Modern Custom Tooltip
 * Enhances hover tooltips with modern aesthetics, clean spacing, high-contrast dark theme, and smooth transitions.
 */
export default function Tooltip({ text, children, position = "top", className = "" }) {
  if (!text) return children;

  const positionClasses = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  }[position] || "bottom-full mb-2 left-1/2 -translate-x-1/2";

  const arrowClasses = {
    top: "-bottom-1 left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent",
    bottom: "-top-1 left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent",
    left: "-right-1 top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent",
    right: "-left-1 top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent",
  }[position] || "-bottom-1 left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent";

  return (
    <div className={`relative group inline-flex items-center justify-center ${className}`}>
      {children}

      <div
        className={`absolute ${positionClasses} hidden group-hover:flex flex-col items-center pointer-events-none z-[180] transition-all duration-150 ease-out opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100`}
      >
        <div className="bg-slate-900/95 backdrop-blur-md text-slate-50 text-[10.5px] font-extrabold px-3 py-1.5 rounded-xl shadow-2xl border border-slate-700/80 whitespace-nowrap text-center tracking-tight leading-none pointer-events-none">
          {text}
        </div>
        {/* Arrow pointer */}
        <div className={`absolute w-0 h-0 border-4 ${arrowClasses}`} />
      </div>
    </div>
  );
}
