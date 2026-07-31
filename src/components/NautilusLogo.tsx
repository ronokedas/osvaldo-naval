import React from 'react';

interface NautilusLogoProps {
  variant?: 'light' | 'dark' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const NautilusLogo: React.FC<NautilusLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  // Height scale mapping
  const heightMap = {
    sm: 'h-8',
    md: 'h-11',
    lg: 'h-16',
    xl: 'h-24',
  };

  // Text color mapping
  const primaryTextColor = variant === 'white' ? 'text-white' : 'text-[#061224]';
  const secondaryTextColor = variant === 'white' ? 'text-slate-300' : 'text-[#0B192C]';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Visual Icon: Styled N with Navy Hull and Vibrant Wave */}
      <svg
        className={`${heightMap[size]} w-auto object-contain shrink-0`}
        viewBox="0 0 240 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Dark Navy Capital N / Hull Element */}
        <path
          d="M 15 15 L 45 15 L 45 65 L 115 15 L 140 15 L 140 85 L 115 85 L 115 42 L 52 85 L 15 85 Z"
          fill={variant === 'white' ? '#FFFFFF' : '#0B192C'}
        />
        {/* Vibrant Royal Blue Curved Wave Boat Base */}
        <path
          d="M 15 65 C 50 65 80 82 110 82 C 145 82 170 60 200 68 C 170 88 130 92 100 90 C 65 88 35 75 15 75 Z"
          fill="#1D4ED8"
        />
      </svg>

      {/* Typography */}
      <div className="flex flex-col justify-center">
        <span
          className={`font-extrabold tracking-wider leading-none uppercase ${primaryTextColor} ${
            size === 'sm' ? 'text-base' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-4xl'
          }`}
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          NAUTILUS
        </span>
        {showSubtitle && (
          <span
            className={`font-semibold tracking-[0.22em] leading-tight uppercase ${secondaryTextColor} mt-1 ${
              size === 'sm' ? 'text-[9px]' : size === 'md' ? 'text-[11px]' : size === 'lg' ? 'text-xs' : 'text-sm'
            }`}
          >
            ENGENHARIA NAVAL
          </span>
        )}
      </div>
    </div>
  );
};
