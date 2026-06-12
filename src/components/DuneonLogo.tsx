import React from 'react';

interface DuneonLogoProps {
  className?: string;
  logoType?: 'default' | 'no_d' | 'no_logo' | 'no_text';
}

export default function DuneonLogo({ className = 'h-8 md:h-10', logoType = 'default' }: DuneonLogoProps) {
  const getSrc = () => {
    switch (logoType) {
      case 'no_d':
        return '/logo_no_d.svg';
      case 'no_logo':
        return '/logo_no_logo.svg';
      case 'no_text':
        return '/logo_no_text.svg';
      case 'default':
      default:
        return '/logo_default.svg';
    }
  };

  return (
    <img 
      src={getSrc()} 
      alt={`Duneon Logo (${logoType})`} 
      className={`${className} select-none pointer-events-none`}
      referrerPolicy="no-referrer"
    />
  );
}

