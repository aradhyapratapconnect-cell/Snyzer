import React, { useState } from 'react';
import logoImg from '../assets/images/snyzer_official_logo_1789996287248.jpg';

interface SnyzerLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function SnyzerLogo({ className = '', size = 'md', showText = true }: SnyzerLogoProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none cursor-pointer ${className}`} id="snyzer-brand-header">
      <div className="relative group">
        {/* Subtle radial aura behind the official circular medallion */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-teal-500 via-emerald-400 to-cyan-400 opacity-50 blur-[6px] group-hover:opacity-80 transition duration-300 pointer-events-none" />
        
        <div className={`relative ${sizeClasses} rounded-full bg-[#04111d] border border-teal-400/50 shadow-[0_0_18px_rgba(45,212,191,0.35)] flex items-center justify-center overflow-hidden shrink-0`}>
          {!imgError ? (
            <img
              src={logoImg}
              alt="Snyzer Official Logo"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover rounded-full select-none transform transition-transform duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          ) : (
            <img
              src="/snyzer-logo.jpg"
              alt="Snyzer Official Logo"
              className="w-full h-full object-cover rounded-full select-none"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="font-headline-sm text-2xl font-bold tracking-tight text-white flex items-center group-hover:text-teal-200 transition-colors">
            Snyzer
          </span>
        </div>
      )}
    </div>
  );
}

