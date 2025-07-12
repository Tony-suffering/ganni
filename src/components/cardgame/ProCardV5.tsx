import React from 'react';
import { GameCard } from '../../types/cardgame';
import { CardFrames, HologramEffect } from './assets/CardFrames';
import { CardTypography, TextEffects } from './assets/Typography';

interface ProCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V5: プロフェッショナル・ミニマルモダンカード
export const ProCardV5: React.FC<ProCardProps> = ({ card, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-[140px] h-[196px]',
    medium: 'w-[200px] h-[280px]',
    large: 'w-[280px] h-[392px]'
  };

  const dimensions = {
    small: { width: 140, height: 196 },
    medium: { width: 200, height: 280 },
    large: { width: 280, height: 392 }
  };

  const dim = dimensions[size];

  const rarityColors = {
    UR: { primary: '#212121', accent: '#FF6B35', light: '#FFF3E0' },
    SR: { primary: '#263238', accent: '#8E24AA', light: '#F3E5F5' },
    R: { primary: '#1B2631', accent: '#1976D2', light: '#E3F2FD' },
    N: { primary: '#37474F', accent: '#757575', light: '#F5F5F5' }
  };

  const colorScheme = rarityColors[card.rarity as keyof typeof rarityColors];

  return (
    <div 
      className={`${sizeClasses[size]} relative overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:z-10`}
      style={{
        background: `linear-gradient(145deg, #FFFFFF 0%, ${colorScheme.light} 100%)`,
        boxShadow: '0 2px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      {/* ミニマルフレーム */}
      <svg viewBox={`0 0 ${dim.width} ${dim.height}`} className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="minimalAccent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorScheme.accent} stopOpacity="0" />
            <stop offset="50%" stopColor={colorScheme.accent} stopOpacity="1" />
            <stop offset="100%" stopColor={colorScheme.accent} stopOpacity="0" />
          </linearGradient>
          
          <filter id="subtleShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor={colorScheme.primary} floodOpacity="0.1"/>
          </filter>
        </defs>

        {/* トップアクセントライン */}
        <rect x="0" y="0" width={dim.width} height="3" fill="url(#minimalAccent)"/>
        
        {/* サイドライン */}
        <rect x="0" y="0" width="1" height={dim.height} fill={colorScheme.primary} opacity="0.1"/>
        <rect x={dim.width-1} y="0" width="1" height={dim.height} fill={colorScheme.primary} opacity="0.1"/>
        
        {/* ボトムライン */}
        <rect x="0" y={dim.height-1} width={dim.width} height="1" fill={colorScheme.primary} opacity="0.1"/>
      </svg>

      {/* サブトルホログラム */}
      {card.rarity !== 'N' && (
        <HologramEffect 
          width={dim.width} 
          height={dim.height} 
          intensity={card.rarity === 'UR' ? 0.15 : card.rarity === 'SR' ? 0.12 : 0.08} 
        />
      )}

      {/* レベルインジケーター */}
      <div className="absolute top-4 left-4 z-20">
        <div className="flex items-center space-x-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colorScheme.accent }}
          >
            <span 
              className="text-white text-sm font-bold"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {card.level}
            </span>
          </div>
          <div 
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ 
              backgroundColor: colorScheme.light,
              color: colorScheme.primary,
              fontFamily: 'system-ui, sans-serif'
            }}
          >
            {card.rarity}
          </div>
        </div>
      </div>

      {/* クリーン画像エリア */}
      <div 
        className="absolute left-4 right-4 z-10 rounded-lg overflow-hidden" 
        style={{ 
          top: `${dim.height * 0.15}px`, 
          height: `${dim.height * 0.45}px`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
        }}
      >
        <div className="relative w-full h-full bg-white">
          <img 
            src={card.imageUrl} 
            alt={card.title}
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(1.05) contrast(1.02)' }}
          />
          
          {/* サブトルグラデーション */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, transparent 0%, ${colorScheme.accent}08 100%)`
            }}
          ></div>
        </div>
      </div>

      {/* タイポグラフィセクション */}
      <div className="absolute z-15 left-4 right-4" style={{ top: `${dim.height * 0.65}px` }}>
        <div className="space-y-2">
          {/* タイトル */}
          <div>
            <h3 
              className="text-lg font-semibold leading-tight"
              style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: colorScheme.primary,
                lineHeight: '1.2'
              }}
            >
              {card.title}
            </h3>
            <div 
              className="text-xs uppercase tracking-wider mt-1"
              style={{ 
                color: colorScheme.accent,
                fontFamily: 'system-ui, sans-serif',
                fontWeight: '500'
              }}
            >
              {card.attribute[0] || 'Modern'} Collection
            </div>
          </div>
          
          {/* セパレーター */}
          <div 
            className="h-px w-full"
            style={{ backgroundColor: colorScheme.primary, opacity: 0.1 }}
          ></div>
        </div>
      </div>

      {/* 効果テキスト */}
      <div className="absolute z-10 left-4 right-4" style={{ top: `${dim.height * 0.78}px`, height: `${dim.height * 0.13}px` }}>
        <div className="h-full flex flex-col justify-center">
          <p 
            className="text-xs leading-relaxed"
            style={{ 
              fontFamily: 'system-ui, sans-serif',
              color: colorScheme.primary,
              opacity: 0.8,
              lineHeight: '1.4'
            }}
          >
            {card.effectText.length > 85 ? card.effectText.substring(0, 85) + '...' : card.effectText}
          </p>
        </div>
      </div>

      {/* ステータスバー */}
      <div className="absolute bottom-4 left-4 right-4 z-15">
        <div className="flex items-center justify-between">
          {/* アタック */}
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: '#FF5722' }}
            ></div>
            <div>
              <div 
                className="text-lg font-bold"
                style={{ 
                  color: '#FF5722',
                  fontFamily: 'system-ui, sans-serif',
                  lineHeight: '1'
                }}
              >
                {Math.round(card.stats.attack / 100)}
              </div>
              <div 
                className="text-xs font-medium"
                style={{ 
                  color: colorScheme.primary,
                  opacity: 0.6,
                  fontFamily: 'system-ui, sans-serif'
                }}
              >
                ATK
              </div>
            </div>
          </div>

          {/* 中央セパレーター */}
          <div 
            className="h-8 w-px"
            style={{ backgroundColor: colorScheme.primary, opacity: 0.2 }}
          ></div>

          {/* ディフェンス */}
          <div className="flex items-center space-x-2">
            <div>
              <div 
                className="text-lg font-bold text-right"
                style={{ 
                  color: '#2196F3',
                  fontFamily: 'system-ui, sans-serif',
                  lineHeight: '1'
                }}
              >
                {Math.round(card.stats.defense / 100)}
              </div>
              <div 
                className="text-xs font-medium text-right"
                style={{ 
                  color: colorScheme.primary,
                  opacity: 0.6,
                  fontFamily: 'system-ui, sans-serif'
                }}
              >
                DEF
              </div>
            </div>
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: '#2196F3' }}
            ></div>
          </div>
        </div>
      </div>

      {/* マイクロインタラクション要素 */}
      <div 
        className="absolute top-0 left-0 w-full h-1 transition-all duration-300 opacity-0 hover:opacity-100"
        style={{ backgroundColor: colorScheme.accent }}
      ></div>
    </div>
  );
};