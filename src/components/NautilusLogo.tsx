import React from 'react';
import { LogoConfig } from '../types';

interface NautilusLogoProps {
  variant?: 'light' | 'dark' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  logoConfig?: LogoConfig;
  hideTextOnMobile?: boolean;
}

export const NautilusLogo: React.FC<NautilusLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showSubtitle = true,
  className = '',
  logoConfig,
  hideTextOnMobile = false,
}) => {
  // Height scale mapping
  const heightMap = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20',
  };

  const companyName = logoConfig?.nomeEmpresa || 'NAUTILUS';
  const subtitle = logoConfig?.subtitulo || 'ENGENHARIA NAVAL';
  const customImg = logoConfig?.imagemUrl;

  // Determine if we are on a dark background (e.g. Header bar)
  const isDarkBg = variant === 'white' || variant === 'light';

  // Text color classes
  const primaryTextColor = isDarkBg ? 'text-white' : 'text-[#001738]';
  const secondaryTextColor = isDarkBg ? 'text-slate-200' : 'text-[#001738]';

  // Render the configured institutional image, including the official
  // /logo.svg. The previous exception for that path silently replaced the
  // configured artwork with a different logo assembled in React.
  if (customImg) {
    if (isDarkBg) {
      // On dark background header, wrap custom uploaded images in a clean white badge so dark text logos are 100% visible
      return (
        <div className={`flex items-center select-none ${className}`}>
          <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-md border border-white/20 flex items-center justify-center">
            <img
              src={customImg}
              alt={companyName}
              className={`${heightMap[size]} w-auto object-contain shrink-0`}
            />
          </div>
        </div>
      );
    }

    return (
      <div className={`flex items-center select-none ${className}`}>
        <img
          src={customImg}
          alt={companyName}
          className={`${heightMap[size]} w-auto object-contain shrink-0`}
        />
      </div>
    );
  }

  // Vector SVG rendering with adaptive colors (pure white on dark bg, dark navy on light bg)
  const mainColor = isDarkBg ? '#FFFFFF' : '#001738';
  const waveColor = isDarkBg ? '#3B82F6' : '#2563EB';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Visual Mark: Solid N with Navy/White Hull & Vibrant Royal Blue Wave */}
      <svg
        className={`${heightMap[size]} w-auto object-contain shrink-0`}
        viewBox="0 0 180 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Capital N Shape */}
        <path
          d="M 20 18 L 56 18 L 56 75 L 124 18 L 160 18 L 160 102 L 124 102 L 124 45 L 56 102 L 20 102 Z"
          fill={mainColor}
        />
        {/* Curved Wave / Hull */}
        <path
          d="M 20 78 C 55 78 85 96 120 96 C 148 96 165 86 180 80 C 160 106 130 114 98 114 C 62 114 38 102 20 92 Z"
          fill={waveColor}
        />
      </svg>

      {/* Typography */}
      <div className={`flex flex-col justify-center ${hideTextOnMobile ? 'hidden sm:flex' : ''}`}>
        <span
          className={`font-black tracking-wider leading-none uppercase ${primaryTextColor} ${
            size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : size === 'lg' ? 'text-3xl' : 'text-5xl'
          }`}
          style={{ fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif" }}
        >
          {companyName}
        </span>
        {showSubtitle && (
          <span
            className={`font-bold tracking-[0.22em] leading-tight uppercase ${secondaryTextColor} mt-1 ${
              size === 'sm' ? 'text-[9px]' : size === 'md' ? 'text-[11px]' : size === 'lg' ? 'text-xs' : 'text-sm'
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

