import React from 'react';
import { GameCard } from '../../types/cardgame';
import { CardFrames, HologramEffect } from './assets/CardFrames';
import { CardTypography, TextEffects } from './assets/Typography';

interface ProCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V1: プロフェッショナル・ゴールドラグジュアリーカード
export const ProCardV1: React.FC<ProCardProps> = ({ card, size = 'medium' }) => {
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

  return (
    <div 
      className={`${sizeClasses[size]} relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10`}
      style={{
        filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))',
        background: 'linear-gradient(135deg, #F5F5DC 0%, #FFFAF0 50%, #F0E68C 100%)'
      }}
    >
      {/* メインフレーム */}
      <CardFrames.GoldLuxury width={dim.width} height={dim.height} />
      
      {/* レアリティベースのホログラム効果 */}
      {card.rarity !== 'N' && (
        <HologramEffect 
          width={dim.width} 
          height={dim.height} 
          intensity={card.rarity === 'UR' ? 0.4 : card.rarity === 'SR' ? 0.3 : 0.2} 
        />
      )}

      {/* コストオーブ（左上） */}
      <div className="absolute top-4 left-4 z-20">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <defs>
            <radialGradient id="costOrb" cx="30%" cy="30%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#FFD700" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#B8860B" stopOpacity="1" />
            </radialGradient>
            <filter id="orbGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <circle cx="20" cy="20" r="18" fill="url(#costOrb)" filter="url(#orbGlow)" stroke="#8B4513" strokeWidth="2"/>
          <circle cx="20" cy="20" r="12" fill="none" stroke="#DAA520" strokeWidth="1" opacity="0.7"/>
          <text x="20" y="26" textAnchor="middle" 
                style={{ 
                  fontSize: '16px', 
                  fontWeight: 'black', 
                  fill: '#8B4513',
                  fontFamily: 'Playfair Display, serif'
                }}>
            {card.level}
          </text>
        </svg>
      </div>

      {/* レアリティクリスタル（右上） */}
      <div className="absolute top-4 right-4 z-20">
        <svg width="30" height="40" viewBox="0 0 30 40">
          <defs>
            <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={
                card.rarity === 'UR' ? '#FFD700' :
                card.rarity === 'SR' ? '#9370DB' :
                card.rarity === 'R' ? '#4169E1' : '#C0C0C0'
              } />
              <stop offset="100%" stopColor={
                card.rarity === 'UR' ? '#FF8C00' :
                card.rarity === 'SR' ? '#4B0082' :
                card.rarity === 'R' ? '#000080' : '#808080'
              } />
            </linearGradient>
          </defs>
          <path d="M15,5 L25,15 L20,35 L10,35 L5,15 Z" 
                fill="url(#crystalGrad)" 
                stroke="#FFFFFF" 
                strokeWidth="1"
                filter="url(#orbGlow)" />
          <text x="15" y="25" textAnchor="middle" 
                style={{ 
                  fontSize: '10px', 
                  fontWeight: 'bold', 
                  fill: 'white',
                  fontFamily: 'system-ui'
                }}>
            {card.rarity}
          </text>
        </svg>
      </div>

      {/* メイン画像エリア */}
      <div className="absolute top-16 left-4 right-4 z-10" style={{ height: `${dim.height * 0.35}px` }}>
        <div className="relative w-full h-full rounded-lg overflow-hidden"
             style={{
               background: 'linear-gradient(45deg, #8B4513, #DAA520, #8B4513)',
               padding: '3px'
             }}>
          <div className="w-full h-full bg-white rounded-md overflow-hidden relative">
            <img 
              src={card.imageUrl} 
              alt={card.title}
              className="w-full h-full object-cover"
              style={{ filter: 'sepia(10%) contrast(1.1) saturate(1.2)' }}
            />
            
            {/* 画像上装飾オーバーレイ */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-200/20 via-transparent to-amber-800/30 pointer-events-none"></div>
            
            {/* 装飾コーナー */}
            <div className="absolute top-1 left-1 w-4 h-4 border-l-2 border-t-2 border-amber-400"></div>
            <div className="absolute top-1 right-1 w-4 h-4 border-r-2 border-t-2 border-amber-400"></div>
            <div className="absolute bottom-1 left-1 w-4 h-4 border-l-2 border-b-2 border-amber-400"></div>
            <div className="absolute bottom-1 right-1 w-4 h-4 border-r-2 border-b-2 border-amber-400"></div>
          </div>
        </div>
      </div>

      {/* タイトルプレート */}
      <div className="absolute z-15 left-4 right-4" style={{ top: `${dim.height * 0.55}px` }}>
        <div className="relative">
          {/* 装飾背景 */}
          <svg width="100%" height="50" viewBox="0 0 192 50" className="absolute inset-0">
            <defs>
              <linearGradient id="plateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F5DEB3" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F5DEB3" />
              </linearGradient>
            </defs>
            <path d="M10,10 Q10,5 15,5 L177,5 Q182,5 182,10 L182,40 Q182,45 177,45 L15,45 Q10,45 10,40 Z" 
                  fill="url(#plateGrad)" 
                  stroke="#DAA520" 
                  strokeWidth="2" />
            <path d="M15,15 L177,15 L172,35 L20,35 Z" 
                  fill="none" 
                  stroke="#B8860B" 
                  strokeWidth="1" 
                  opacity="0.5" />
          </svg>
          
          {/* タイトルテキスト */}
          <div className="relative px-6 py-3">
            <CardTypography.ElegantTitle size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'medium'}>
              <TextEffects.EmbossedText color="#8B4513">
                {card.title}
              </TextEffects.EmbossedText>
            </CardTypography.ElegantTitle>
            <div className="mt-1 text-center">
              <CardTypography.ClassicLabel variant="secondary">
                {card.attribute[0] || 'Mystical'} Artifact
              </CardTypography.ClassicLabel>
            </div>
          </div>
        </div>
      </div>

      {/* 効果テキストスクロール */}
      <div className="absolute z-10 left-4 right-4" style={{ top: `${dim.height * 0.72}px`, height: `${dim.height * 0.15}px` }}>
        <div className="relative w-full h-full">
          {/* 古文書風背景 */}
          <svg width="100%" height="100%" viewBox="0 0 192 42" className="absolute inset-0">
            <defs>
              <pattern id="parchment" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="#FFFEF7"/>
                <circle cx="10" cy="10" r="0.5" fill="#F5DEB3" opacity="0.3"/>
              </pattern>
            </defs>
            <rect x="5" y="5" width="182" height="32" fill="url(#parchment)" 
                  stroke="#D2691E" strokeWidth="1" rx="4" />
            <rect x="8" y="8" width="176" height="26" fill="none" 
                  stroke="#DAA520" strokeWidth="0.5" rx="2" />
          </svg>
          
          <div className="relative px-4 py-2 overflow-hidden">
            <div className="text-center mb-1">
              <CardTypography.ClassicLabel size="small">
                ✦ Enchantment ✦
              </CardTypography.ClassicLabel>
            </div>
            <p className="text-xs leading-tight text-center italic"
               style={{ 
                 fontFamily: 'Playfair Display, serif',
                 color: '#8B4513',
                 lineHeight: '1.2'
               }}>
              {card.effectText.length > 70 ? card.effectText.substring(0, 70) + '...' : card.effectText}
            </p>
          </div>
        </div>
      </div>

      {/* ステータスオーブ */}
      <div className="absolute bottom-4 left-4 right-4 z-15 flex justify-between">
        {/* パワーオーブ */}
        <div className="relative">
          <svg width="50" height="60" viewBox="0 0 50 60">
            <defs>
              <radialGradient id="powerOrb" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#FFE4E1" />
                <stop offset="70%" stopColor="#FF6347" />
                <stop offset="100%" stopColor="#8B0000" />
              </radialGradient>
            </defs>
            <ellipse cx="25" cy="40" rx="22" ry="18" fill="url(#powerOrb)" 
                     stroke="#8B4513" strokeWidth="2" filter="url(#orbGlow)" />
            <circle cx="25" cy="30" r="12" fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.6" />
            <text x="25" y="35" textAnchor="middle" 
                  style={{ fontSize: '14px', fontWeight: 'black', fill: '#8B0000' }}>
              ⚔
            </text>
          </svg>
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
            <CardTypography.OrnateStat 
              value={Math.round(card.stats.attack / 100)} 
              label="Power" 
              color="#8B0000"
              size={size === 'large' ? 'medium' : 'small'} 
            />
          </div>
        </div>

        {/* ディフェンスオーブ */}
        <div className="relative">
          <svg width="50" height="60" viewBox="0 0 50 60">
            <defs>
              <radialGradient id="defenseOrb" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#E6F3FF" />
                <stop offset="70%" stopColor="#4169E1" />
                <stop offset="100%" stopColor="#000080" />
              </radialGradient>
            </defs>
            <ellipse cx="25" cy="40" rx="22" ry="18" fill="url(#defenseOrb)" 
                     stroke="#8B4513" strokeWidth="2" filter="url(#orbGlow)" />
            <circle cx="25" cy="30" r="12" fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.6" />
            <text x="25" y="35" textAnchor="middle" 
                  style={{ fontSize: '14px', fontWeight: 'black', fill: '#000080' }}>
              🛡
            </text>
          </svg>
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
            <CardTypography.OrnateStat 
              value={Math.round(card.stats.defense / 100)} 
              label="Defense" 
              color="#000080"
              size={size === 'large' ? 'medium' : 'small'} 
            />
          </div>
        </div>
      </div>

      {/* 底部装飾ライン */}
      <div className="absolute bottom-2 left-6 right-6 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60"></div>
    </div>
  );
};