import React from 'react';

// プロフェッショナルSVGカードフレームアセット
export const CardFrames = {
  // ゴールドラグジュアリーフレーム
  GoldLuxury: ({ width = 200, height = 280 }: { width?: number; height?: number }) => (
    <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
          <stop offset="25%" stopColor="#FFA500" stopOpacity="1" />
          <stop offset="50%" stopColor="#FFD700" stopOpacity="1" />
          <stop offset="75%" stopColor="#DAA520" stopOpacity="1" />
          <stop offset="100%" stopColor="#B8860B" stopOpacity="1" />
        </linearGradient>
        
        <linearGradient id="innerGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF8DC" stopOpacity="1" />
          <stop offset="50%" stopColor="#F0E68C" stopOpacity="1" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="1" />
        </linearGradient>

        <filter id="goldEmboss" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="2" dy="2" result="offset"/>
          <feSpecularLighting in="offset" surfaceScale="3" specularConstant="0.8" 
                              specularExponent="10" lightingColor="white">
            <fePointLight x="50" y="50" z="200"/>
          </feSpecularLighting>
          <feComposite in2="SourceAlpha" operator="in"/>
        </filter>

        <pattern id="ornatePattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1" fill="#FFD700" opacity="0.3"/>
          <path d="M5,5 L15,15 M15,5 L5,15" stroke="#DAA520" strokeWidth="0.5" opacity="0.2"/>
        </pattern>
      </defs>

      {/* 外枠 */}
      <path d="M8,8 Q8,0 16,0 L184,0 Q192,0 192,8 L192,272 Q192,280 184,280 L16,280 Q8,280 8,272 Z" 
            fill="url(#goldGradient)" filter="url(#goldEmboss)" stroke="#B8860B" strokeWidth="1"/>
      
      {/* 装飾内枠 */}
      <path d="M12,12 Q12,6 18,6 L182,6 Q188,6 188,12 L188,268 Q188,274 182,274 L18,274 Q12,274 12,268 Z" 
            fill="url(#innerGoldGradient)" stroke="#DAA520" strokeWidth="0.5"/>

      {/* コーナー装飾 */}
      <g fill="#FFD700" stroke="#B8860B" strokeWidth="0.5">
        {/* 左上 */}
        <path d="M20,20 L35,20 Q40,20 40,25 L40,35 L35,30 L25,30 L25,25 Q25,20 20,20"/>
        <circle cx="30" cy="30" r="3" fill="#FFA500"/>
        
        {/* 右上 */}
        <path d="M180,20 L165,20 Q160,20 160,25 L160,35 L165,30 L175,30 L175,25 Q175,20 180,20"/>
        <circle cx="170" cy="30" r="3" fill="#FFA500"/>
        
        {/* 左下 */}
        <path d="M20,260 L35,260 Q40,260 40,255 L40,245 L35,250 L25,250 L25,255 Q25,260 20,260"/>
        <circle cx="30" cy="250" r="3" fill="#FFA500"/>
        
        {/* 右下 */}
        <path d="M180,260 L165,260 Q160,260 160,255 L160,245 L165,250 L175,250 L175,255 Q175,260 180,260"/>
        <circle cx="170" cy="250" r="3" fill="#FFA500"/>
      </g>

      {/* 装飾パターン */}
      <rect x="15" y="15" width="170" height="250" fill="url(#ornatePattern)" opacity="0.1"/>
    </svg>
  ),

  // サイバーネオンフレーム
  CyberNeon: ({ width = 200, height = 280, color = "#00FFFF" }: { width?: number; height?: number; color?: string }) => (
    <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="cyberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="50%" stopColor="#0080FF" stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0.8" />
        </linearGradient>

        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <pattern id="circuitPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="none"/>
          <path d="M0,20 L40,20 M20,0 L20,40" stroke={color} strokeWidth="0.5" opacity="0.3"/>
          <circle cx="20" cy="20" r="2" fill={color} opacity="0.5"/>
        </pattern>
      </defs>

      {/* 背景グリッド */}
      <rect x="0" y="0" width={width} height={height} fill="#0a0a0a"/>
      <rect x="5" y="5" width={width-10} height={height-10} fill="url(#circuitPattern)" opacity="0.3"/>

      {/* メインフレーム */}
      <rect x="4" y="4" width={width-8} height={height-8} 
            fill="none" stroke="url(#cyberGradient)" strokeWidth="2" 
            filter="url(#neonGlow)" rx="8"/>

      {/* コーナーマーカー */}
      <g stroke={color} strokeWidth="2" fill="none" filter="url(#neonGlow)">
        <path d="M15,15 L25,15 L25,25"/>
        <path d="M185,15 L175,15 L175,25"/>
        <path d="M15,265 L25,265 L25,255"/>
        <path d="M185,265 L175,265 L175,255"/>
      </g>

      {/* データライン */}
      <g stroke={color} strokeWidth="1" opacity="0.6">
        <line x1="30" y1="20" x2="170" y2="20"/>
        <line x1="30" y1="260" x2="170" y2="260"/>
        <line x1="20" y1="40" x2="20" y2="240"/>
        <line x1="180" y1="40" x2="180" y2="240"/>
      </g>
    </svg>
  ),

  // エレガントクラシックフレーム
  ElegantClassic: ({ width = 200, height = 280 }: { width?: number; height?: number }) => (
    <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="elegantGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5F5DC" stopOpacity="1" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="100%" stopColor="#F0F0F0" stopOpacity="1" />
        </linearGradient>

        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B4513" stopOpacity="1" />
          <stop offset="50%" stopColor="#A0522D" stopOpacity="1" />
          <stop offset="100%" stopColor="#8B4513" stopOpacity="1" />
        </linearGradient>

        <filter id="paperTexture" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence baseFrequency="0.9" numOctaves="4" result="noise"/>
          <feColorMatrix in="noise" type="saturate" values="0"/>
          <feComposite in="SourceGraphic" in2="noise" operator="multiply"/>
        </filter>
      </defs>

      {/* 背景 */}
      <rect x="0" y="0" width={width} height={height} fill="url(#elegantGradient)" filter="url(#paperTexture)"/>

      {/* 装飾ボーダー */}
      <rect x="8" y="8" width={width-16} height={height-16} 
            fill="none" stroke="url(#accentGradient)" strokeWidth="3" rx="12"/>
      
      <rect x="12" y="12" width={width-24} height={height-24} 
            fill="none" stroke="url(#accentGradient)" strokeWidth="1" rx="8" opacity="0.7"/>

      {/* 装飾要素 */}
      <g fill="url(#accentGradient)" opacity="0.8">
        {/* フローラル装飾 */}
        <path d="M30,30 Q35,25 40,30 Q35,35 30,30" />
        <path d="M170,30 Q165,25 160,30 Q165,35 170,30" />
        <path d="M30,250 Q35,245 40,250 Q35,255 30,250" />
        <path d="M170,250 Q165,245 160,250 Q165,255 170,250" />
        
        {/* 中央装飾 */}
        <circle cx={width/2} cy="25" r="4"/>
        <circle cx={width/2} cy={height-25} r="4"/>
        <circle cx="25" cy={height/2} r="4"/>
        <circle cx={width-25} cy={height/2} r="4"/>
      </g>

      {/* 内側ライン */}
      <rect x="16" y="16" width={width-32} height={height-32} 
            fill="none" stroke="#8B4513" strokeWidth="0.5" rx="4" opacity="0.5"/>
    </svg>
  )
};

// ホログラム効果エフェクト
export const HologramEffect = ({ width = 200, height = 280, intensity = 0.3 }: { width?: number; height?: number; intensity?: number }) => (
  <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full pointer-events-none">
    <defs>
      <linearGradient id="holoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF00FF" stopOpacity={intensity * 0.5} />
        <stop offset="25%" stopColor="#00FFFF" stopOpacity={intensity * 0.3} />
        <stop offset="50%" stopColor="#FFFF00" stopOpacity={intensity * 0.4} />
        <stop offset="75%" stopColor="#FF00FF" stopOpacity={intensity * 0.2} />
        <stop offset="100%" stopColor="#00FFFF" stopOpacity={intensity * 0.5} />
      </linearGradient>

      <pattern id="holoPattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
        <rect width="30" height="30" fill="none"/>
        <circle cx="15" cy="15" r="1" fill="#FFFFFF" opacity={intensity}/>
        <circle cx="5" cy="5" r="0.5" fill="#FF00FF" opacity={intensity * 0.7}/>
        <circle cx="25" cy="25" r="0.5" fill="#00FFFF" opacity={intensity * 0.7}/>
      </pattern>
    </defs>

    <rect x="0" y="0" width={width} height={height} fill="url(#holoGradient)"/>
    <rect x="0" y="0" width={width} height={height} fill="url(#holoPattern)"/>
    
    {/* 動的シマー効果 */}
    <rect x="0" y="0" width="20" height={height} fill="url(#holoGradient)" opacity={intensity * 0.8}>
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="translate"
        values={`-20,0;${width + 20},0;-20,0`}
        dur="3s"
        repeatCount="indefinite"
      />
    </rect>
  </svg>
);