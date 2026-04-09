import React from 'react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "w-8 h-8" }: LogoProps) {
  return (
    <img 
      src="/logo.svg" 
      alt="CineStream Logo" 
      className={className}
      referrerPolicy="no-referrer"
    />
  );
}
