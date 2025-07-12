import React from 'react';
import { GameCard } from '../../types/cardgame';
import { CardFrames, HologramEffect } from './assets/CardFrames';
import { CardTypography, TextEffects } from './assets/Typography';

interface ProCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V4: プロフェッショナル・アールデコラグジュアリーカード
export const ProCardV4: React.FC<ProCardProps> = ({ card, size = 'medium' }) => {
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

  const rarityPalettes = {
    UR: { primary: '#000000', accent: '#FFD700', highlight: '#FFFFFF', bg: '#1a1a1a' },
    SR: { primary: '#2C1810', accent: '#C0392B', highlight: '#F8C471', bg: '#FDF2E9' },
    R: { primary: '#1B263B', accent: '#415A77', highlight: '#E0E1DD', bg: '#F1FAEE' },
    N: { primary: '#2F3E46', accent: '#84A98C', highlight: '#CAD2C5', bg: '#F8F9FA' }
  };

  const palette = rarityPalettes[card.rarity as keyof typeof rarityPalettes];

  return (
    <div 
      className={`${sizeClasses[size]} relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10`}
      style={{
        background: `linear-gradient(135deg, ${palette.bg} 0%, ${palette.highlight} 50%, ${palette.bg} 100%)`,
        filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.2))'
      }}
    >
      {/* アールデコフレーム */}
      <svg viewBox={`0 0 ${dim.width} ${dim.height}`} className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="decoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.accent} />
            <stop offset="50%" stopColor={palette.primary} />
            <stop offset="100%" stopColor={palette.accent} />
          </linearGradient>
          
          <pattern id="decoPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="none"/>
            <path d="M0,10 L10,0 L20,10 L10,20 Z" fill={palette.accent} opacity="0.1"/>
            <circle cx="10" cy="10" r="1" fill={palette.primary} opacity="0.3"/>
          </pattern>

          <filter id="decoShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor={palette.primary} floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* メインフレーム */}
        <rect x="4" y="4" width={dim.width-8} height={dim.height-8} 
              fill="none" stroke="url(#decoGradient)" strokeWidth="3" rx="2"/>
        
        {/* 幾何学装飾 */}
        <g fill={palette.accent} opacity="0.8">
          {/* 上部中央装飾 */}
          <path d={`M${dim.width/2-15},8 L${dim.width/2},18 L${dim.width/2+15},8 L${dim.width/2+10},12 L${dim.width/2},22 L${dim.width/2-10},12 Z`}/>
          
          {/* 下部中央装飾 */}
          <path d={`M${dim.width/2-15},${dim.height-8} L${dim.width/2},${dim.height-18} L${dim.width/2+15},${dim.height-8} L${dim.width/2+10},${dim.height-12} L${dim.width/2},${dim.height-22} L${dim.width/2-10},${dim.height-12} Z`}/>
          
          {/* サイド装飾 */}
          <path d={`M8,${dim.height/2-15} L18,${dim.height/2} L8,${dim.height/2+15} L12,${dim.height/2+10} L22,${dim.height/2} L12,${dim.height/2-10} Z`}/>
          <path d={`M${dim.width-8},${dim.height/2-15} L${dim.width-18},${dim.height/2} L${dim.width-8},${dim.height/2+15} L${dim.width-12},${dim.height/2+10} L${dim.width-22},${dim.height/2} L${dim.width-12},${dim.height/2-10} Z`}/>
        </g>

        {/* 装飾パターン */}
        <rect x="10" y="10" width={dim.width-20} height={dim.height-20} fill="url(#decoPattern)" opacity="0.2"/>
      </svg>

      {/* ホログラム効果 */}
      {card.rarity !== 'N' && (
        <HologramEffect 
          width={dim.width} 
          height={dim.height} 
          intensity={card.rarity === 'UR' ? 0.3 : card.rarity === 'SR' ? 0.25 : 0.2} 
        />
      )}

      {/* ダイヤモンドコスト */}
      <div className="absolute top-4 left-4 z-20">
        <svg width="40" height="50" viewBox="0 0 40 50">
          <defs>
            <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="30%" stopColor={palette.accent} />
              <stop offset="70%" stopColor={palette.primary} />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
          </defs>
          
          {/* ダイヤモンド形状 */}
          <path d="M20,5 L35,15 L30,35 L10,35 L5,15 Z" 
                fill="url(#diamondGrad)" 
                stroke={palette.primary} 
                strokeWidth="2" 
                filter="url(#decoShadow)"/>
                
          {/* 内部装飾 */}
          <path d="M20,10 L28,16 L26,28 L14,28 L12,16 Z" 
                fill="none" 
                stroke="#FFFFFF" 
                strokeWidth="1" 
                opacity="0.8"/>
                
          {/* レベル数値 */}
          <text x="20" y="25" textAnchor="middle" 
                style={{ 
                  fontSize: '14px', 
                  fontWeight: 'black', 
                  fill: '#FFFFFF',
                  fontFamily: 'system-ui, sans-serif',
                  textShadow: `0 0 3px ${palette.primary}`
                }}>
            {card.level}
          </text>
        </svg>
      </div>

      {/* レアリティバッジ */}
      <div className="absolute top-4 right-4 z-20">
        <svg width="30" height="40" viewBox="0 0 30 40">
          <defs>
            <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.highlight} />
              <stop offset="50%" stopColor={palette.accent} />
              <stop offset="100%" stopColor={palette.primary} />
            </linearGradient>
          </defs>
          
          {/* バッジ形状 */}
          <path d="M15,5 L25,10 L22,35 L8,35 L5,10 Z" 
                fill="url(#badgeGrad)" 
                stroke={palette.primary} 
                strokeWidth="1.5"
                filter="url(#decoShadow)"/>
                
          {/* 装飾ライン */}
          <line x1="15" y1="12" x2="15" y2="28" stroke={palette.primary} strokeWidth="0.5"/>
          <line x1="10" y1="18" x2="20" y2="18" stroke={palette.primary} strokeWidth="0.5"/>
                
          {/* レアリティ文字 */}
          <text x="15" y="23" textAnchor="middle" 
                style={{ 
                  fontSize: '8px', 
                  fontWeight: 'bold', 
                  fill: palette.primary,
                  fontFamily: 'system-ui, sans-serif'
                }}>
            {card.rarity}
          </text>
        </svg>
      </div>

      {/* 幾何学画像フレーム */}
      <div className="absolute top-16 left-4 right-4 z-10" style={{ height: `${dim.height * 0.4}px` }}>
        <div className="relative w-full h-full">
          <svg width="100%" height="100%" viewBox={`0 0 ${dim.width-32} ${dim.height * 0.4}`} className="absolute inset-0">
            <defs>
              <clipPath id="hexFrame">
                <path d={`M20,10 L${dim.width-52},10 L${dim.width-42},${dim.height * 0.4 - 10} L20,${dim.height * 0.4 - 10} Z`}/>
              </clipPath>
            </defs>
            
            {/* フレーム背景 */}
            <rect x="0" y="0" width={dim.width-32} height={dim.height * 0.4} 
                  fill={palette.primary} rx="4"/>
            <rect x="4" y="4" width={dim.width-40} height={dim.height * 0.4 - 8} 
                  fill="#FFFFFF" rx="2"/>
            <rect x="8" y="8" width={dim.width-48} height={dim.height * 0.4 - 16} 
                  fill="#F8F8F8" rx="1"/>
          </svg>
          
          {/* 画像 */}
          <div className="absolute inset-2 overflow-hidden" style={{ clipPath: 'polygon(10% 5%, 90% 5%, 95% 95%, 5% 95%)' }}>
            <img 
              src={card.imageUrl} 
              alt={card.title}
              className="w-full h-full object-cover"
              style={{ filter: 'contrast(1.15) saturate(1.1) brightness(1.05)' }}
            />
            
            {/* アールデコオーバーレイ */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none"></div>
          </div>
          
          {/* コーナー装飾 */}
          <div className="absolute top-1 left-1 w-6 h-6">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M2,2 L12,2 L22,12 L12,22 L2,12 Z" fill={palette.accent} opacity="0.7"/>
            </svg>
          </div>
          <div className="absolute top-1 right-1 w-6 h-6">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M2,12 L12,2 L22,2 L22,12 L12,22 Z" fill={palette.accent} opacity="0.7"/>
            </svg>
          </div>
        </div>
      </div>

      {/* アールデコタイトルプレート */}
      <div className="absolute z-15 left-4 right-4" style={{ top: `${dim.height * 0.6}px` }}>
        <div className="relative">
          <svg width="100%" height="50" viewBox={`0 0 ${dim.width-32} 50`} className="absolute inset-0">
            <defs>
              <linearGradient id="titlePlate" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={palette.highlight} />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor={palette.highlight} />
              </linearGradient>
            </defs>
            
            {/* プレート背景 */}
            <path d={`M10,5 L${dim.width-42},5 L${dim.width-37},25 L${dim.width-42},45 L10,45 L5,25 Z`}
                  fill="url(#titlePlate)" 
                  stroke={palette.accent} 
                  strokeWidth="2" 
                  filter="url(#decoShadow)"/>
                  
            {/* 装飾ライン */}
            <line x1="15" y1="15" x2={dim.width-47} y2="15" stroke={palette.primary} strokeWidth="1" opacity="0.6"/>
            <line x1="15" y1="35" x2={dim.width-47} y2="35" stroke={palette.primary} strokeWidth="1" opacity="0.6"/>
          </svg>
          
          {/* タイトル */}
          <div className="relative px-6 py-3">
            <CardTypography.ElegantTitle 
              size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'medium'}
              color={palette.primary}
            >
              <TextEffects.Text3D color={palette.primary}>
                {card.title}
              </TextEffects.Text3D>
            </CardTypography.ElegantTitle>
            
            <div className="text-center mt-1">
              <CardTypography.ClassicLabel variant="secondary" size="small">
                ◆ {card.attribute[0] || 'Art Deco'} Design ◆
              </CardTypography.ClassicLabel>
            </div>
          </div>
        </div>
      </div>

      {/* 効果テキストパネル */}
      <div className="absolute z-10 left-4 right-4" style={{ top: `${dim.height * 0.78}px`, height: `${dim.height * 0.12}px` }}>
        <div className="relative w-full h-full">
          <svg width="100%" height="100%" viewBox={`0 0 ${dim.width-32} ${dim.height * 0.12}`} className="absolute inset-0">
            <rect x="0" y="0" width={dim.width-32} height={dim.height * 0.12} 
                  fill={palette.highlight} 
                  stroke={palette.accent} 
                  strokeWidth="1.5" 
                  rx="4"/>
            <rect x="3" y="3" width={dim.width-38} height={dim.height * 0.12 - 6} 
                  fill="none" 
                  stroke={palette.primary} 
                  strokeWidth="0.5" 
                  rx="2" 
                  opacity="0.7"/>
          </svg>
          
          <div className="relative px-4 py-2">
            <div className="text-center mb-1">
              <CardTypography.ClassicLabel size="small" variant="primary">
                ◆ ARTISTIC EFFECT ◆
              </CardTypography.ClassicLabel>
            </div>
            <p className="text-center text-xs leading-tight"
               style={{ 
                 fontFamily: 'system-ui, sans-serif',
                 color: palette.primary,
                 fontWeight: '500',
                 lineHeight: '1.2'
               }}>
              {card.effectText.length > 70 ? card.effectText.substring(0, 70) + '...' : card.effectText}
            </p>
          </div>
        </div>
      </div>

      {/* ステータスダイヤモンド */}
      <div className="absolute bottom-4 left-4 right-4 z-15 flex justify-between">
        {/* パワーダイヤモンド */}
        <div className="relative">
          <svg width="45" height="55" viewBox="0 0 45 55">
            <defs>
              <radialGradient id="powerDiamond" cx="50%" cy="30%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#FF4444" />
                <stop offset="100%" stopColor="#CC0000" />
              </radialGradient>
            </defs>
            
            <path d="M22.5,8 L37,20 L32,45 L13,45 L8,20 Z" 
                  fill="url(#powerDiamond)" 
                  stroke={palette.primary} 
                  strokeWidth="2" 
                  filter="url(#decoShadow)"/>
                  
            <path d="M22.5,15 L30,22 L28,35 L17,35 L15,22 Z" 
                  fill="none" 
                  stroke="#FFFFFF" 
                  strokeWidth="1" 
                  opacity="0.8"/>
          </svg>
          
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <CardTypography.OrnateStat 
              value={Math.round(card.stats.attack / 100)} 
              label="ATK" 
              color="#CC0000"
              size={size === 'large' ? 'medium' : 'small'} 
            />
          </div>
        </div>

        {/* ディフェンスダイヤモンド */}
        <div className="relative">
          <svg width="45" height="55" viewBox="0 0 45 55">
            <defs>
              <radialGradient id="defenseDiamond" cx="50%" cy="30%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#4444FF" />
                <stop offset="100%" stopColor="#0000CC" />
              </radialGradient>
            </defs>
            
            <path d="M22.5,8 L37,20 L32,45 L13,45 L8,20 Z" 
                  fill="url(#defenseDiamond)" 
                  stroke={palette.primary} 
                  strokeWidth="2" 
                  filter="url(#decoShadow)"/>
                  
            <path d="M22.5,15 L30,22 L28,35 L17,35 L15,22 Z" 
                  fill="none" 
                  stroke="#FFFFFF" 
                  strokeWidth="1" 
                  opacity="0.8"/>
          </svg>
          
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <CardTypography.OrnateStat 
              value={Math.round(card.stats.defense / 100)} 
              label="DEF" 
              color="#0000CC"
              size={size === 'large' ? 'medium' : 'small'} 
            />
          </div>
        </div>
      </div>

      {/* 底部装飾 */}
      <div className="absolute bottom-1 left-6 right-6 h-0.5" 
           style={{ 
             background: `linear-gradient(90deg, transparent, ${palette.accent}, transparent)`,
             opacity: 0.8
           }}>
      </div>
    </div>
  );
};