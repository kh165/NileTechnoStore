import React from "react";

export default function Logo({ className = "h-12" }) {
  return (
    <a
      href="https://www.niletechno.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center cursor-pointer"
      title="NileTechno"
    >
      <img
        src="/logo3.webp"
        alt="NileTechno Logo"
        className={`${className} object-contain`}
      />
    </a>
  );
}

