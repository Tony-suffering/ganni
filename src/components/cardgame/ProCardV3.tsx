import React from 'react';
import { GameCard } from '../../types/cardgame';
import { CardFrames, HologramEffect } from './assets/CardFrames';
import { CardTypography, TextEffects } from './assets/Typography';

interface ProCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V3: プロフェッショナル・エレガントクラシックカード
export const ProCardV3: React.FC<ProCardProps> = ({ card, size = 'medium' }) => {
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
    UR: { primary: '#8B4513', accent: '#DAA520', highlight: '#FFD700', text: '#2C1810' },
    SR: { primary: '#4B0082', accent: '#8A2BE2', highlight: '#DDA0DD', text: '#2C1B2C' },
    R: { primary: '#000080', accent: '#4169E1', highlight: '#87CEEB', text: '#1B1B2C' },
    N: { primary: '#2F4F4F', accent: '#708090', highlight: '#C0C0C0', text: '#2C2C2C' }
  };

  const palette = rarityPalettes[card.rarity as keyof typeof rarityPalettes];

  return (
    <div 
      className={`${sizeClasses[size]} relative overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:z-10`}
      style={{
        background: 'linear-gradient(135deg, #FFFEF7 0%, #F5F5DC 50%, #FFF8DC 100%)',
        filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.2))'
      }}
    >
      {/* メインフレーム */}
      <CardFrames.ElegantClassic width={dim.width} height={dim.height} />
      
      {/* 高品質ホログラム効果 */}
      {card.rarity !== 'N' && (
        <HologramEffect 
          width={dim.width} 
          height={dim.height} 
          intensity={card.rarity === 'UR' ? 0.25 : card.rarity === 'SR' ? 0.2 : 0.15} 
        />
      )}

      {/* エレガントコストメダリオン */}
      <div className="absolute top-6 left-6 z-20">
        <svg width="45" height="45" viewBox="0 0 45 45">
          <defs>
            <radialGradient id="medallionGrad" cx="30%" cy="30%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="40%" stopColor={palette.highlight} stopOpacity="0.9" />
              <stop offset="80%" stopColor={palette.accent} stopOpacity="1" />
              <stop offset="100%" stopColor={palette.primary} stopOpacity="1" />
            </radialGradient>
            <filter id="elegantShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor={palette.primary} floodOpacity="0.4"/>
            </filter>
          </defs>
          
          {/* 外側装飾リング */}
          <circle cx="22.5" cy="22.5" r="20" fill="none" stroke={palette.primary} strokeWidth="1.5" opacity="0.6"/>
          <circle cx="22.5" cy="22.5" r="18" fill="url(#medallionGrad)" filter="url(#elegantShadow)"/>
          
          {/* 内側装飾 */}
          <circle cx="22.5" cy="22.5" r="15" fill="none" stroke={palette.accent} strokeWidth="1" opacity="0.8"/>
          <circle cx="22.5" cy="22.5" r="12" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.9"/>
          
          {/* 装飾十字 */}
          <path d="M22.5,10 L22.5,35 M10,22.5 L35,22.5" stroke={palette.primary} strokeWidth="0.5" opacity="0.4"/>
          
          {/* レベル数値 */}
          <text x="22.5" y="28" textAnchor="middle" 
                style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  fill: palette.primary,
                  fontFamily: 'Playfair Display, serif'
                }}>
            {card.level}
          </text>
        </svg>
      </div>

      {/* レアリティエンブレム */}
      <div className="absolute top-6 right-6 z-20">
        <svg width="35" height="50" viewBox="0 0 35 50">
          <defs>
            <linearGradient id="emblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.highlight} />
              <stop offset="50%" stopColor={palette.accent} />
              <stop offset="100%" stopColor={palette.primary} />
            </linearGradient>
          </defs>
          
          {/* エンブレム形状 */}
          <path d="M17.5,5 L30,15 L25,45 L10,45 L5,15 Z" 
                fill="url(#emblemGrad)" 
                stroke={palette.primary} 
                strokeWidth="1.5"
                filter="url(#elegantShadow)" />
                
          {/* 内部装飾 */}
          <path d="M17.5,12 L24,18 L22,35 L13,35 L11,18 Z" 
                fill="none" 
                stroke="#FFFFFF" 
                strokeWidth="1" 
                opacity="0.7" />
                
          {/* レアリティマーカー */}
          <text x="17.5" y="27" textAnchor="middle" 
                style={{ 
                  fontSize: '10px', 
                  fontWeight: 'bold', 
                  fill: 'white',
                  fontFamily: 'Playfair Display, serif',
                  textShadow: `0 1px 2px ${palette.primary}`
                }}>
            {card.rarity}
          </text>
        </svg>
      </div>

      {/* アートギャラリー風画像フレーム */}
      <div className="absolute top-20 left-6 right-6 z-10" style={{ height: `${dim.height * 0.4}px` }}>
        <div className="relative w-full h-full">
          {/* 額縁 */}
          <svg width="100%" height="100%" viewBox={`0 0 ${dim.width-48} ${dim.height * 0.4}`} className="absolute inset-0">
            <defs>
              <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={palette.primary} />
                <stop offset="50%" stopColor={palette.accent} />
                <stop offset="100%" stopColor={palette.primary} />
              </linearGradient>
            </defs>
            
            {/* 外枠 */}
            <rect x="0" y="0" width={dim.width-48} height={dim.height * 0.4} 
                  fill="url(#frameGrad)" rx="8" />
                  
            {/* マット */}
            <rect x="6" y="6" width={dim.width-60} height={dim.height * 0.4 - 12} 
                  fill="#FFFFFF" rx="4" />
                  
            {/* 画像領域 */}
            <rect x="12" y="12" width={dim.width-72} height={dim.height * 0.4 - 24} 
                  fill="#F8F8F8" stroke={palette.accent} strokeWidth="1" rx="2" />
          </svg>
          
          {/* 画像 */}
          <div className="absolute inset-3 rounded overflow-hidden">
            <img 
              src={card.imageUrl} 
              alt={card.title}
              className="w-full h-full object-cover"
              style={{ filter: 'sepia(8%) contrast(1.05) saturate(1.1)' }}
            />
            
            {/* ギャラリーライティング */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>
          </div>
          
          {/* フレーム装飾 */}
          <div className="absolute top-2 left-2 w-4 h-4 bg-gradient-to-br" style={{ background: `linear-gradient(45deg, ${palette.highlight}, ${palette.accent})` }}></div>
          <div className="absolute top-2 right-2 w-4 h-4 bg-gradient-to-bl" style={{ background: `linear-gradient(45deg, ${palette.highlight}, ${palette.accent})` }}></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 bg-gradient-to-tr" style={{ background: `linear-gradient(45deg, ${palette.highlight}, ${palette.accent})` }}></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 bg-gradient-to-tl" style={{ background: `linear-gradient(45deg, ${palette.highlight}, ${palette.accent})` }}></div>
        </div>
      </div>

      {/* エレガントタイトルプレート */}
      <div className="absolute z-15 left-6 right-6" style={{ top: `${dim.height * 0.65}px` }}>
        <div className="relative">
          {/* プレート背景 */}
          <svg width="100%" height="55" viewBox={`0 0 ${dim.width-48} 55`} className="absolute inset-0">
            <defs>
              <linearGradient id="plateBack" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFEF7" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F5F5DC" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width={dim.width-48} height="55" 
                  fill="url(#plateBack)" 
                  stroke={palette.accent} 
                  strokeWidth="2" 
                  rx="8" 
                  filter="url(#elegantShadow)" />
            <rect x="4" y="4" width={dim.width-56} height="47" 
                  fill="none" 
                  stroke={palette.primary} 
                  strokeWidth="1" 
                  rx="4" 
                  opacity="0.6" />
          </svg>
          
          {/* タイトルテキスト */}
          <div className="relative px-6 py-3">
            <CardTypography.ElegantTitle 
              size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'medium'}
              color={palette.primary}
            >
              <TextEffects.EmbossedText color={palette.primary}>
                {card.title}
              </TextEffects.EmbossedText>
            </CardTypography.ElegantTitle>
            
            <div className="mt-2 text-center flex items-center justify-center space-x-2">
              <div className="w-6 h-px" style={{ backgroundColor: palette.accent }}></div>
              <CardTypography.ClassicLabel variant="secondary" size="small">
                {card.attribute[0] || 'Classical'} Masterpiece
              </CardTypography.ClassicLabel>
              <div className="w-6 h-px" style={{ backgroundColor: palette.accent }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 古典的効果テキスト */}
      <div className="absolute z-10 left-6 right-6" style={{ top: `${dim.height * 0.82}px`, height: `${dim.height * 0.12}px` }}>
        <div className="relative w-full h-full">
          {/* 羊皮紙風背景 */}
          <svg width="100%" height="100%" viewBox={`0 0 ${dim.width-48} ${dim.height * 0.12}`} className="absolute inset-0">
            <defs>
              <pattern id="parchmentTexture" x="0" y="0" width="15" height="15" patternUnits="userSpaceOnUse">
                <rect width="15" height="15" fill="#FFFEF7"/>
                <circle cx="7.5" cy="7.5" r="0.3" fill={palette.accent} opacity="0.2"/>
                <path d="M0,0 L15,15 M15,0 L0,15" stroke={palette.accent} strokeWidth="0.1" opacity="0.1"/>
              </pattern>
            </defs>
            <rect x="0" y="0" width={dim.width-48} height={dim.height * 0.12} 
                  fill="url(#parchmentTexture)" 
                  stroke={palette.primary} 
                  strokeWidth="1.5" 
                  rx="6" />
          </svg>
          
          <div className="relative px-4 py-2 overflow-hidden">
            <div className="text-center mb-1">
              <CardTypography.ClassicLabel size="small" variant="primary">
                ✦ Inscription ✦
              </CardTypography.ClassicLabel>
            </div>
            <p className="text-center text-xs leading-tight italic"
               style={{ 
                 fontFamily: 'Playfair Display, serif',
                 color: palette.text,
                 lineHeight: '1.2'
               }}>
              "{card.effectText.length > 65 ? card.effectText.substring(0, 65) + '...' : card.effectText}"
            </p>
          </div>
        </div>
      </div>

      {/* クラシカルステータス */}
      <div className="absolute bottom-4 left-6 right-6 z-15 flex justify-between">
        {/* 威力の紋章 */}
        <div className="relative">
          <svg width="50" height="65" viewBox="0 0 50 65">
            <defs>
              <radialGradient id="powerCrest" cx="40%" cy="30%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="60%" stopColor="#DC143C" />
                <stop offset="100%" stopColor="#8B0000" />
              </radialGradient>
            </defs>
            
            {/* 紋章台座 */}
            <ellipse cx="25" cy="50" rx="23" ry="12" fill={palette.primary} opacity="0.8"/>
            
            {/* メイン紋章 */}
            <path d="M25,10 L40,25 L35,45 L15,45 L10,25 Z" 
                  fill="url(#powerCrest)" 
                  stroke={palette.primary} 
                  strokeWidth="2" 
                  filter="url(#elegantShadow)" />
                  
            {/* 装飾 */}
            <circle cx="25" cy="27" r="8" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.8"/>
            <text x="25" y="30" textAnchor="middle" 
                  style={{ fontSize: '12px', fontWeight: 'bold', fill: 'white' }}>
              ⚔
            </text>
          </svg>
          
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <CardTypography.OrnateStat 
              value={Math.round(card.stats.attack / 100)} 
              label="Power" 
              color={palette.primary}
              size={size === 'large' ? 'medium' : 'small'} 
            />
          </div>
        </div>

        {/* 守護の紋章 */}
        <div className="relative">
          <svg width="50" height="65" viewBox="0 0 50 65">
            <defs>
              <radialGradient id="defenseCrest" cx="40%" cy="30%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="60%" stopColor="#4169E1" />
                <stop offset="100%" stopColor="#000080" />
              </radialGradient>
            </defs>
            
            {/* 紋章台座 */}
            <ellipse cx="25" cy="50" rx="23" ry="12" fill={palette.primary} opacity="0.8"/>
            
            {/* メイン紋章 */}
            <path d="M25,10 L40,25 L35,45 L15,45 L10,25 Z" 
                  fill="url(#defenseCrest)" 
                  stroke={palette.primary} 
                  strokeWidth="2" 
                  filter="url(#elegantShadow)" />
                  
            {/* 装飾 */}
            <circle cx="25" cy="27" r="8" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.8"/>
            <text x="25" y="30" textAnchor="middle" 
                  style={{ fontSize: '12px', fontWeight: 'bold', fill: 'white' }}>
              🛡
            </text>
          </svg>
          
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <CardTypography.OrnateStat 
              value={Math.round(card.stats.defense / 100)} 
              label="Defense" 
              color={palette.primary}
              size={size === 'large' ? 'medium' : 'small'} 
            />
          </div>
        </div>
      </div>

      {/* 底部装飾ライン */}
      <div className="absolute bottom-1 left-8 right-8 h-px bg-gradient-to-r from-transparent to-transparent opacity-60"
           style={{ backgroundImage: `linear-gradient(90deg, transparent, ${palette.accent}, transparent)` }}>
      </div>
    </div>
  );
};