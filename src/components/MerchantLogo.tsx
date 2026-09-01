import React from 'react';

interface MerchantLogoProps {
  merchantName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MerchantLogo: React.FC<MerchantLogoProps> = ({
  merchantName,
  className = '',
  size = 'md',
}) => {
  const norm = merchantName.toLowerCase();

  // Dimensions
  const containerClasses = {
    sm: 'h-8 px-2.5 py-1',
    md: 'h-10 px-3.5 py-1.5',
    lg: 'h-12 px-4 py-2',
  };

  // 1. AMAZON FRANCE (Logo officiel Amazon : mot amazon blanc + flèche sourire orange pointant de a vers z)
  if (norm.includes('amazon')) {
    return (
      <div
        className={`bg-[#131921] rounded-xl flex items-center justify-center border border-slate-700/50 shadow-2xs ${containerClasses[size]} ${className}`}
        title="Amazon.fr"
      >
        <svg viewBox="0 0 100 30" className="h-full w-auto max-w-[80px] sm:max-w-[90px]" aria-label="Amazon">
          {/* Mot amazon */}
          <text
            x="4"
            y="18"
            fill="#FFFFFF"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="800"
            fontSize="18"
            letterSpacing="-0.8px"
          >
            amazon
          </text>
          {/* Flèche sourire orange iconique d'Amazon de a vers z */}
          <path
            d="M 12 22 Q 40 28 66 21"
            fill="none"
            stroke="#FF9900"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Pointe de flèche orange */}
          <path
            d="M 64 19 L 68 21.5 L 63 24 Z"
            fill="#FF9900"
          />
        </svg>
      </div>
    );
  }

  // 2. FNAC (Véritable logo officiel Fnac : cartouche jaune safran #E1A000 avec typographie italique noire)
  if (norm.includes('fnac')) {
    return (
      <div
        className={`bg-[#E1A000] rounded-xl flex items-center justify-center border border-[#C58B00] shadow-2xs ${containerClasses[size]} ${className}`}
        title="Fnac"
      >
        <svg viewBox="0 0 80 32" className="h-full w-auto max-w-[65px] sm:max-w-[75px]" aria-label="Fnac">
          <rect width="80" height="32" rx="6" fill="#E1A000" />
          <text
            x="40"
            y="23"
            textAnchor="middle"
            fill="#111111"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontStyle="italic"
            fontWeight="900"
            fontSize="24"
            letterSpacing="-1.2px"
          >
            fnac
          </text>
        </svg>
      </div>
    );
  }

  // 3. CDISCOUNT (Véritable logo officiel Cdiscount : C noir majuscule + discount rouge)
  if (norm.includes('cdiscount')) {
    return (
      <div
        className={`bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-2xs ${containerClasses[size]} ${className}`}
        title="Cdiscount"
      >
        <svg viewBox="0 0 115 30" className="h-full w-auto max-w-[85px] sm:max-w-[95px]" aria-label="Cdiscount">
          {/* C */}
          <text
            x="4"
            y="21"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="900"
            fontSize="22"
            fill="#1A1A1A"
          >
            C
          </text>
          {/* discount */}
          <text
            x="22"
            y="21"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="800"
            fontSize="18"
            letterSpacing="-0.4px"
            fill="#E01E2B"
          >
            discount
          </text>
          {/* Point final */}
          <circle cx="108" cy="20" r="2.2" fill="#E01E2B" />
        </svg>
      </div>
    );
  }

  // 4. BOULANGER (Véritable logo officiel Boulanger : fond orange vif #F15A24 avec 'b' blanc dans cercle)
  if (norm.includes('boulanger')) {
    return (
      <div
        className={`bg-[#F15A24] rounded-xl flex items-center justify-center border border-[#D94917] shadow-2xs ${containerClasses[size]} ${className}`}
        title="Boulanger"
      >
        <div className="flex items-center gap-1.5 px-0.5">
          {/* Rond blanc avec 'b' souriant */}
          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
            <span className="text-[#F15A24] font-black text-xs -mt-0.5 leading-none">b</span>
          </div>
          <span className="text-white font-black text-xs tracking-tight hidden sm:inline">
            boulanger
          </span>
        </div>
      </div>
    );
  }

  // 5. MICROMANIA - ZING (Logo officiel Micromania : fond bleu marine avec typographie bold blanche et Zing)
  if (norm.includes('micromania')) {
    return (
      <div
        className={`bg-[#0B1E48] rounded-xl flex items-center justify-center border border-[#162D68] shadow-2xs ${containerClasses[size]} ${className}`}
        title="Micromania-Zing"
      >
        <div className="flex items-center gap-1 px-1">
          <span className="text-white font-black text-xs sm:text-sm tracking-tight uppercase">
            Micro<span className="text-[#FFCC00]">mania</span>
          </span>
        </div>
      </div>
    );
  }

  // 6. E.LECLERC (Logo officiel E.Leclerc : fond bleu officiel avec pastille orange)
  if (norm.includes('leclerc')) {
    return (
      <div
        className={`bg-[#0054A6] rounded-xl flex items-center justify-center border border-[#004080] shadow-2xs ${containerClasses[size]} ${className}`}
        title="E.Leclerc"
      >
        <div className="flex items-center gap-1 px-1">
          <span className="text-white font-black text-xs tracking-tight">
            E.<span className="text-[#FF8200]">Leclerc</span>
          </span>
        </div>
      </div>
    );
  }

  // 7. PLAYSTATION DIRECT / SONY (Véritable logo officiel PlayStation)
  if (norm.includes('playstation') || norm.includes('sony')) {
    return (
      <div
        className={`bg-[#003791] rounded-xl flex items-center justify-center border border-[#002B73] shadow-2xs ${containerClasses[size]} ${className}`}
        title="PlayStation Direct (Sony officiel)"
      >
        <div className="flex items-center gap-1.5 px-1">
          {/* Symbole officiel PlayStation vectoriel */}
          <svg viewBox="0 0 50 38" className="h-4 sm:h-5 w-auto" aria-label="PlayStation">
            <path
              d="M19.8 3c-2.4.9-3.7 2.7-3.7 5.4v18l5.7 1.8V11.6c0-1.7.8-2.5 2.2-2.5 1.3 0 2.1.8 2.1 2.5v16.6l5.7 1.8V11.3c0-5.6-3.7-8.6-9.7-8.6-1-.1-1.6 0-2.3.3z"
              fill="#0070D1"
            />
            <path
              d="M33.8 27.7c-5-1.8-12.3-2.8-17.7-1.6-1.6.4-2.7 1.1-2.7 2.2 0 1.5 2 2.2 5.2 2.2 5.2 0 11.9-1.4 16.8-3.2 1.3-.5 2.4-1 3.4-1.5l-5 1.9z"
              fill="#2E6DB4"
            />
            <path
              d="M46.8 31.2c-4 1.3-10 2.1-16 2.1-5.2 0-9.9-.7-13.1-1.9-2-.8-3.2-1.8-3.2-3.2 0-2.3 2.8-3.9 7.3-4.7 5.6-1 13 0 18.3 1.7l6.7-1.7c-2.3-.8-5.1-1.3-8.3-1.7l-1.3 3.7c4 .7 6.2 1.6 6.2 2.7 0 .8-.9 1.4-2.6 1.9-3 .9-7.7 1.2-12.6 1.2-4 0-7.5-.3-9.5-.9-1.2-.3-1.7-.7-1.7-1.2 0-.8 1.2-1.3 3.2-1.8 2.4-.6 5.9-.9 9.8-.9V23c-4.7 0-8.8.4-11.7 1.2-3.5.9-5.5 2.2-5.5 4.1 0 2.6 3.5 4.5 9.1 5.3 3.2.4 6.9.6 10.8.6 6.6 0 13.1-.8 17.5-2.2l-3.1-5.9z"
              fill="#E4002B"
            />
          </svg>
          <span className="text-white font-extrabold text-[11px] tracking-tight hidden md:inline">
            PS Direct
          </span>
        </div>
      </div>
    );
  }

  // 8. BACK MARKET (Véritable logo officiel Back Market : fond noir avec typographie officielle blanche et verte menthe)
  if (norm.includes('back market') || norm.includes('backmarket')) {
    return (
      <div
        className={`bg-[#000000] rounded-xl flex items-center justify-center border border-slate-800 shadow-2xs ${containerClasses[size]} ${className}`}
        title="Back Market"
      >
        <svg viewBox="0 0 110 30" className="h-full w-auto max-w-[85px] sm:max-w-[95px]" aria-label="Back Market">
          <text
            x="4"
            y="21"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="900"
            fontSize="17"
            fill="#FFFFFF"
            letterSpacing="-0.5px"
          >
            Back<tspan fill="#3CD371">Market</tspan>
          </text>
        </svg>
      </div>
    );
  }

  // Fallback propre
  return (
    <div
      className={`bg-slate-900 text-white rounded-xl flex items-center justify-center font-extrabold text-xs shadow-2xs ${containerClasses[size]} ${className}`}
    >
      <span>{merchantName}</span>
    </div>
  );
};
