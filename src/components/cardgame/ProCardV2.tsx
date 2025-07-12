import React from 'react';
import { GameCard } from '../../types/cardgame';
import { CardFrames, HologramEffect } from './assets/CardFrames';
import { CardTypography, TextEffects } from './assets/Typography';

interface ProCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V2: プロフェッショナル・サイバーネオンカード
export const ProCardV2: React.FC<ProCardProps> = ({ card, size = 'medium' }) => {
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
    UR: '#00FFFF',
    SR: '#FF00FF', 
    R: '#00FF00',
    N: '#FFFFFF'
  };

  const neonColor = rarityColors[card.rarity as keyof typeof rarityColors];

  return (
    <div 
      className={`${sizeClasses[size]} relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10`}
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        filter: `drop-shadow(0 0 20px ${neonColor}40)`
      }}
    >
      {/* メインフレーム */}
      <CardFrames.CyberNeon width={dim.width} height={dim.height} color={neonColor} />
      
      {/* ホログラム効果 */}
      <HologramEffect 
        width={dim.width} 
        height={dim.height} 
        intensity={card.rarity === 'UR' ? 0.5 : card.rarity === 'SR' ? 0.4 : card.rarity === 'R' ? 0.3 : 0.2} 
      />

      {/* エネルギーコア（左上） */}
      <div className="absolute top-4 left-4 z-20">
        <svg width="35" height="35" viewBox="0 0 35 35">
          <defs>
            <radialGradient id="energyCore" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="30%" stopColor={neonColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor="#000000" stopOpacity="1" />
            </radialGradient>
            <filter id="coreGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* 外側リング */}
          <circle cx="17.5" cy="17.5" r="16" fill="none" stroke={neonColor} strokeWidth="2" filter="url(#coreGlow)">
            <animate attributeName="stroke-dasharray" values="0,100;50,50;0,100" dur="2s" repeatCount="indefinite"/>
          </circle>
          
          {/* 内側コア */}
          <circle cx="17.5" cy="17.5" r="12" fill="url(#energyCore)" filter="url(#coreGlow)"/>
          
          {/* ヘキサゴンパターン */}
          <polygon points="17.5,8 25,12.5 25,22.5 17.5,27 10,22.5 10,12.5" 
                   fill="none" stroke={neonColor} strokeWidth="1" opacity="0.7"/>
          
          {/* エネルギーレベル */}
          <text x="17.5" y="22" textAnchor="middle" 
                style={{ 
                  fontSize: '12px', 
                  fontWeight: 'black', 
                  fill: neonColor,
                  fontFamily: 'Orbitron, monospace',
                  filter: `drop-shadow(0 0 3px ${neonColor})`
                }}>
            {card.level}
          </text>
        </svg>
      </div>

      {/* データクリスタル（右上） */}
      <div className="absolute top-4 right-4 z-20">
        <svg width="25" height="35" viewBox="0 0 25 35">
          <defs>
            <linearGradient id="dataGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={neonColor} stopOpacity="0.9" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.5" />
              <stop offset="100%" stopColor={neonColor} stopOpacity="0.9" />
            </linearGradient>
          </defs>
          
          {/* クリスタル形状 */}
          <path d="M12.5,3 L22,10 L19,30 L6,30 L3,10 Z" 
                fill="url(#dataGrad)" 
                stroke={neonColor} 
                strokeWidth="1.5"
                filter="url(#coreGlow)" />
                
          {/* 内部グリッド */}
          <line x1="12.5" y1="10" x2="12.5" y2="25" stroke={neonColor} strokeWidth="0.5" opacity="0.6"/>
          <line x1="7" y1="15" x2="18" y2="15" stroke={neonColor} strokeWidth="0.5" opacity="0.6"/>
          
          {/* レアリティマーカー */}
          <text x="12.5" y="20" textAnchor="middle" 
                style={{ 
                  fontSize: '8px', 
                  fontWeight: 'bold', 
                  fill: '#000000',
                  fontFamily: 'Orbitron, monospace'
                }}>
            {card.rarity}
          </text>
        </svg>
      </div>

      {/* ホログラム画像ディスプレイ */}
      <div className="absolute top-16 left-4 right-4 z-10" style={{ height: `${dim.height * 0.35}px` }}>
        <div className="relative w-full h-full">
          {/* ホログラム枠 */}
          <svg width="100%" height="100%" viewBox={`0 0 ${dim.width-32} ${dim.height * 0.35}`} className="absolute inset-0">
            <defs>
              <pattern id="holoGrid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <rect width="10" height="10" fill="none"/>
                <path d="M0,0 L10,10 M10,0 L0,10" stroke={neonColor} strokeWidth="0.3" opacity="0.3"/>
              </pattern>
            </defs>
            
            {/* ホログラム境界 */}
            <rect x="2" y="2" width={dim.width-36} height={dim.height * 0.35 - 4} 
                  fill="url(#holoGrid)" 
                  stroke={neonColor} 
                  strokeWidth="2" 
                  filter="url(#coreGlow)" 
                  rx="4"/>
                  
            {/* スキャンライン */}
            <line x1="0" x2={dim.width-32} y1="50%" y2="50%" 
                  stroke={neonColor} strokeWidth="1" opacity="0.8">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
            </line>
          </svg>
          
          {/* 画像 */}
          <div className="absolute inset-1 rounded overflow-hidden">
            <img 
              src={card.imageUrl} 
              alt={card.title}
              className="w-full h-full object-cover"
              style={{ 
                filter: `contrast(1.3) saturate(1.4) hue-rotate(${card.rarity === 'UR' ? '10deg' : card.rarity === 'SR' ? '280deg' : card.rarity === 'R' ? '120deg' : '0deg'})` 
              }}
            />
            
            {/* ホログラム干渉パターン */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent pointer-events-none"></div>
            <div className="absolute inset-0"
                 style={{
                   background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${neonColor}15 2px, ${neonColor}15 4px)`,
                   pointerEvents: 'none'
                 }}>
            </div>
          </div>
          
          {/* コーナーマーカー */}
          <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2" style={{ borderColor: neonColor }}></div>
          <div className="absolute top-1 right-1 w-3 h-3 border-r-2 border-t-2" style={{ borderColor: neonColor }}></div>
          <div className="absolute bottom-1 left-1 w-3 h-3 border-l-2 border-b-2" style={{ borderColor: neonColor }}></div>
          <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2" style={{ borderColor: neonColor }}></div>
        </div>
      </div>

      {/* データパネル - タイトル */}
      <div className="absolute z-15 left-4 right-4" style={{ top: `${dim.height * 0.55}px` }}>
        <div className="relative">
          {/* データパネル背景 */}
          <svg width="100%" height="45" viewBox={`0 0 ${dim.width-32} 45`} className="absolute inset-0">
            <defs>
              <linearGradient id="panelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#1a1a2e" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width={dim.width-32} height="45" 
                  fill="url(#panelGrad)" 
                  stroke={neonColor} 
                  strokeWidth="1" 
                  filter="url(#coreGlow)" 
                  rx="6" />
          </svg>
          
          {/* タイトルテキスト */}
          <div className="relative px-4 py-2">
            <div className="text-center mb-1">
              <CardTypography.CyberText size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'medium'} color={neonColor}>
                <TextEffects.GlowText color={neonColor} intensity={0.8}>
                  {card.title.toUpperCase()}
                </TextEffects.GlowText>
              </CardTypography.CyberText>
            </div>
            <div className="text-center">
              <CardTypography.CyberText size="small" color={neonColor} glow={false}>
                &gt; DIGITAL_ASSET.{(card.attribute[0] || 'ART').toUpperCase()}
              </CardTypography.CyberText>
            </div>
          </div>
        </div>
      </div>

      {/* システムログ */}
      <div className="absolute z-10 left-4 right-4" style={{ top: `${dim.height * 0.72}px`, height: `${dim.height * 0.15}px` }}>
        <div className="relative w-full h-full">
          {/* ログパネル */}
          <svg width="100%" height="100%" viewBox={`0 0 ${dim.width-32} ${dim.height * 0.15}`} className="absolute inset-0">
            <rect x="0" y="0" width={dim.width-32} height={dim.height * 0.15} 
                  fill="#000000" 
                  stroke={neonColor} 
                  strokeWidth="1" 
                  opacity="0.8" 
                  rx="4" />
          </svg>
          
          <div className="relative px-3 py-2 overflow-hidden">
            <div className="text-left mb-1">
              <CardTypography.CyberText size="small" color={neonColor} glow={false}>
                &gt; SYSTEM_LOG:
              </CardTypography.CyberText>
            </div>
            <p className="text-xs leading-tight font-mono"
               style={{ 
                 color: '#00FF00',
                 fontFamily: 'Orbitron, monospace',
                 lineHeight: '1.3',
                 textShadow: `0 0 5px #00FF0060`
               }}>
              {card.effectText.length > 60 ? card.effectText.substring(0, 60) + '...' : card.effectText}
            </p>
          </div>
        </div>
      </div>

      {/* バトルスタッツ */}
      <div className="absolute bottom-4 left-4 right-4 z-15 flex justify-between">
        {/* パワーレベル */}
        <div className="relative">
          <svg width="45" height="50" viewBox="0 0 45 50">
            <defs>
              <linearGradient id="powerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF0000" />
                <stop offset="100%" stopColor="#8B0000" />
              </linearGradient>
            </defs>
            <rect x="5" y="15" width="35" height="30" 
                  fill="url(#powerGrad)" 
                  stroke="#FF0000" 
                  strokeWidth="2" 
                  filter="url(#coreGlow)" 
                  rx="4" />
            <text x="22.5" y="32" textAnchor="middle" 
                  style={{ fontSize: '8px', fontWeight: 'bold', fill: 'white', fontFamily: 'Orbitron' }}>
              PWR
            </text>
          </svg>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
            <div className="text-center">
              <div className="text-lg font-black" style={{ 
                color: '#FF0000', 
                fontFamily: 'Orbitron, monospace',
                textShadow: '0 0 8px #FF000080'
              }}>
                {Math.round(card.stats.attack / 100)}
              </div>
            </div>
          </div>
        </div>

        {/* ディフェンスレベル */}
        <div className="relative">
          <svg width="45" height="50" viewBox="0 0 45 50">
            <defs>
              <linearGradient id="defGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0080FF" />
                <stop offset="100%" stopColor="#000080" />
              </linearGradient>
            </defs>
            <rect x="5" y="15" width="35" height="30" 
                  fill="url(#defGrad)" 
                  stroke="#0080FF" 
                  strokeWidth="2" 
                  filter="url(#coreGlow)" 
                  rx="4" />
            <text x="22.5" y="32" textAnchor="middle" 
                  style={{ fontSize: '8px', fontWeight: 'bold', fill: 'white', fontFamily: 'Orbitron' }}>
              DEF
            </text>
          </svg>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
            <div className="text-center">
              <div className="text-lg font-black" style={{ 
                color: '#0080FF', 
                fontFamily: 'Orbitron, monospace',
                textShadow: '0 0 8px #0080FF80'
              }}>
                {Math.round(card.stats.defense / 100)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部データストリーム */}
      <div className="absolute bottom-1 left-4 right-4 h-0.5 opacity-60">
        <div className="w-full h-full bg-gradient-to-r from-transparent via-current to-transparent" style={{ color: neonColor }}>
          <div className="w-2 h-full bg-current animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};