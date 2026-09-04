import React from 'react';

interface MerchantLogoProps {
  merchantName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Présentation du marchand (Règle stricte : AUCUN faux logo ni pseudo-logo).
 * Typographie sobre, propre, élégante et parfaitement lisible.
 */
export const MerchantLogo: React.FC<MerchantLogoProps> = ({
  merchantName,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm font-bold',
    lg: 'text-base font-extrabold',
  };

  return (
    <span
      className={`text-slate-900 tracking-tight font-bold select-none ${sizeClasses[size]} ${className}`}
    >
      {merchantName}
    </span>
  );
};
