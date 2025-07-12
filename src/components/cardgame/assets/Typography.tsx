import React from 'react';

// プロフェッショナルタイポグラフィコンポーネント
export const CardTypography = {
  // エレガントタイトル
  ElegantTitle: ({ 
    children, 
    size = 'medium',
    color = '#2C1810',
    shadow = true 
  }: { 
    children: React.ReactNode; 
    size?: 'small' | 'medium' | 'large';
    color?: string;
    shadow?: boolean;
  }) => {
    const sizeMap = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg'
    };

    return (
      <h3 
        className={`${sizeMap[size]} font-bold leading-tight text-center`}
        style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          color: color,
          textShadow: shadow ? '0 1px 2px rgba(255,255,255,0.8)' : 'none',
          letterSpacing: '0.02em'
        }}
      >
        {children}
      </h3>
    );
  },

  // サイバーテキスト
  CyberText: ({ 
    children, 
    size = 'medium',
    color = '#00FFFF',
    glow = true 
  }: { 
    children: React.ReactNode; 
    size?: 'small' | 'medium' | 'large';
    color?: string;
    glow?: boolean;
  }) => {
    const sizeMap = {
      small: 'text-xs',
      medium: 'text-sm',
      large: 'text-base'
    };

    return (
      <span 
        className={`${sizeMap[size]} font-bold uppercase tracking-wider`}
        style={{
          fontFamily: 'Orbitron, monospace',
          color: color,
          textShadow: glow ? `0 0 8px ${color}60, 0 0 16px ${color}30` : 'none',
          letterSpacing: '0.1em'
        }}
      >
        {children}
      </span>
    );
  },

  // クラシックラベル
  ClassicLabel: ({ 
    children, 
    size = 'small',
    variant = 'primary' 
  }: { 
    children: React.ReactNode; 
    size?: 'small' | 'medium';
    variant?: 'primary' | 'secondary';
  }) => {
    const sizeMap = {
      small: 'text-xs',
      medium: 'text-sm'
    };

    const colorMap = {
      primary: '#8B4513',
      secondary: '#A0522D'
    };

    return (
      <span 
        className={`${sizeMap[size]} font-medium uppercase tracking-widest`}
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: colorMap[variant],
          letterSpacing: '0.15em'
        }}
      >
        {children}
      </span>
    );
  },

  // 装飾数値
  OrnateStat: ({ 
    value, 
    label,
    color = '#DAA520',
    size = 'medium' 
  }: { 
    value: number; 
    label: string;
    color?: string;
    size?: 'small' | 'medium' | 'large';
  }) => {
    const valueSize = {
      small: 'text-lg',
      medium: 'text-xl',
      large: 'text-2xl'
    };

    const labelSize = {
      small: 'text-xs',
      medium: 'text-xs',
      large: 'text-sm'
    };

    return (
      <div className="text-center">
        <div 
          className={`${valueSize[size]} font-black leading-none mb-1`}
          style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            color: color,
            textShadow: '0 1px 2px rgba(0,0,0,0.3), 0 0 8px rgba(218,165,32,0.3)'
          }}
        >
          {value}
        </div>
        <div 
          className={`${labelSize[size]} font-semibold uppercase tracking-wider`}
          style={{
            fontFamily: 'system-ui, sans-serif',
            color: color,
            letterSpacing: '0.1em',
            opacity: 0.9
          }}
        >
          {label}
        </div>
      </div>
    );
  }
};

// テキストエフェクトユーティリティ
export const TextEffects = {
  // エンボステキスト
  EmbossedText: ({ children, color = '#8B4513' }: { children: React.ReactNode; color?: string }) => (
    <span style={{
      color: color,
      textShadow: `
        1px 1px 0 rgba(255,255,255,0.8),
        -1px -1px 0 rgba(0,0,0,0.3),
        0 0 5px rgba(0,0,0,0.1)
      `
    }}>
      {children}
    </span>
  ),

  // グローテキスト
  GlowText: ({ children, color = '#00FFFF', intensity = 0.6 }: { children: React.ReactNode; color?: string; intensity?: number }) => (
    <span style={{
      color: color,
      textShadow: `
        0 0 5px ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')},
        0 0 10px ${color}${Math.round(intensity * 128).toString(16).padStart(2, '0')},
        0 0 15px ${color}${Math.round(intensity * 64).toString(16).padStart(2, '0')}
      `
    }}>
      {children}
    </span>
  ),

  // 3Dテキスト
  Text3D: ({ children, color = '#DAA520' }: { children: React.ReactNode; color?: string }) => (
    <span style={{
      color: color,
      textShadow: `
        1px 1px 0 rgba(0,0,0,0.8),
        2px 2px 0 rgba(0,0,0,0.6),
        3px 3px 0 rgba(0,0,0,0.4),
        4px 4px 0 rgba(0,0,0,0.2),
        5px 5px 10px rgba(0,0,0,0.5)
      `
    }}>
      {children}
    </span>
  )
};