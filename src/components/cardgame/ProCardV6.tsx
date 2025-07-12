import React from 'react';
import { GameCard } from '../../types/cardgame';
import { HologramEffect } from './assets/CardFrames';

interface ProCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V6: card.png参考リアルスタイルカード
export const ProCardV6: React.FC<ProCardProps> = ({ card, size = 'medium' }) => {
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
    UR: { primary: '#9333EA', accent: '#C084FC', bg: '#1E1B4B' },
    SR: { primary: '#DC2626', accent: '#F87171', bg: '#1F2937' },
    R: { primary: '#2563EB', accent: '#60A5FA', bg: '#1E293B' },
    N: { primary: '#6B7280', accent: '#9CA3AF', bg: '#374151' }
  };

  const colorScheme = rarityColors[card.rarity as keyof typeof rarityColors];

  return (
    <div 
      className={`${sizeClasses[size]} relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10`}
      style={{
        background: `linear-gradient(135deg, #000000 0%, ${colorScheme.bg} 100%)`,
        borderRadius: '16px',
        border: '3px solid #2A2A2A',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)'
      }}
    >
      {/* ホログラム効果 */}
      {card.rarity !== 'N' && (
        <HologramEffect 
          width={dim.width} 
          height={dim.height} 
          intensity={card.rarity === 'UR' ? 0.25 : card.rarity === 'SR' ? 0.2 : 0.15} 
        />
      )}

      {/* コストアイコン（左上） */}
      <div className="absolute top-3 left-3 z-20">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center border-2"
          style={{ 
            backgroundColor: colorScheme.primary,
            borderColor: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}
        >
          <span 
            className="text-white text-sm font-black"
            style={{ 
              fontFamily: 'Arial, sans-serif',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)'
            }}
          >
            {card.level}
          </span>
        </div>
      </div>

      {/* レアリティアイコン（右上） */}
      <div className="absolute top-3 right-3 z-20">
        <div 
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{ 
            backgroundColor: colorScheme.accent,
            transform: 'rotate(45deg)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
          }}
        >
          <span 
            className="text-white text-xs font-bold"
            style={{ 
              transform: 'rotate(-45deg)',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {card.rarity}
          </span>
        </div>
      </div>

      {/* メイン画像エリア */}
      <div 
        className="absolute left-3 right-3 rounded-lg overflow-hidden"
        style={{ 
          top: `${dim.height * 0.08}px`, 
          height: `${dim.height * 0.52}px`,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
          border: '2px solid #404040'
        }}
      >
        <div className="relative w-full h-full">
          <img 
            src={card.imageUrl} 
            alt={card.title}
            className="w-full h-full object-cover"
            style={{ 
              filter: `contrast(1.2) saturate(1.3) hue-rotate(${card.rarity === 'UR' ? '10deg' : card.rarity === 'SR' ? '350deg' : card.rarity === 'R' ? '200deg' : '0deg'})` 
            }}
          />
          
          {/* 画像上オーバーレイ */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, transparent 30%, ${colorScheme.primary}20 100%)`
            }}
          ></div>
          
          {/* エッジライト */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              boxShadow: `inset 0 0 20px ${colorScheme.accent}40`
            }}
          ></div>
        </div>
      </div>

      {/* カード名バー */}
      <div 
        className="absolute left-3 right-3 z-15 rounded"
        style={{ 
          top: `${dim.height * 0.62}px`,
          height: `${dim.height * 0.08}px`,
          background: 'linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
          border: '1px solid #404040'
        }}
      >
        <div className="h-full flex items-center justify-center px-2">
          <h3 
            className="text-white font-bold text-center leading-tight"
            style={{ 
              fontFamily: 'Arial, sans-serif',
              fontSize: size === 'large' ? '14px' : size === 'small' ? '10px' : '12px',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              letterSpacing: '0.5px'
            }}
          >
            {card.title.toUpperCase()}
          </h3>
        </div>
      </div>

      {/* 効果テキストエリア */}
      <div 
        className="absolute left-3 right-3 z-10 rounded"
        style={{ 
          top: `${dim.height * 0.72}px`,
          height: `${dim.height * 0.16}px`,
          backgroundColor: '#000000',
          border: '1px solid #333333'
        }}
      >
        <div className="h-full p-2 overflow-hidden">
          <div className="mb-1">
            <div 
              className="text-xs font-bold uppercase tracking-wide"
              style={{ 
                color: colorScheme.accent,
                fontFamily: 'Arial, sans-serif'
              }}
            >
              {card.attribute[0] || 'POWER'} EFFECT
            </div>
          </div>
          <p 
            className="text-white text-xs leading-tight"
            style={{ 
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.2'
            }}
          >
            {card.effectText.length > 80 ? card.effectText.substring(0, 80) + '...' : card.effectText}
          </p>
        </div>
      </div>

      {/* ステータスバー */}
      <div 
        className="absolute bottom-2 left-3 right-3 z-15 flex justify-between items-center"
        style={{ height: `${dim.height * 0.08}px` }}
      >
        {/* ATK値 */}
        <div 
          className="px-3 py-1 rounded flex items-center"
          style={{ 
            backgroundColor: '#1a1a1a',
            border: '1px solid #404040'
          }}
        >
          <div 
            className="text-lg font-black"
            style={{ 
              color: '#FF4444',
              fontFamily: 'Arial, sans-serif',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)'
            }}
          >
            {Math.round(card.stats.attack / 100) * 1000}
          </div>
        </div>

        {/* 中央情報 */}
        <div className="text-center">
          <div 
            className="text-xs font-medium"
            style={{ 
              color: colorScheme.accent,
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {card.attribute[0] || 'ART'} CARD
          </div>
        </div>

        {/* DEF値 */}
        <div 
          className="px-3 py-1 rounded flex items-center"
          style={{ 
            backgroundColor: '#1a1a1a',
            border: '1px solid #404040'
          }}
        >
          <div 
            className="text-lg font-black"
            style={{ 
              color: '#4444FF',
              fontFamily: 'Arial, sans-serif',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)'
            }}
          >
            {Math.round(card.stats.defense / 100) * 1000}
          </div>
        </div>
      </div>

      {/* 内側枠線 */}
      <div 
        className="absolute inset-1 rounded-xl pointer-events-none"
        style={{
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      ></div>

      {/* コーナー装飾 */}
      <div 
        className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 rounded-tl-lg"
        style={{ borderColor: colorScheme.accent }}
      ></div>
      <div 
        className="absolute top-1 right-1 w-3 h-3 border-r-2 border-t-2 rounded-tr-lg"
        style={{ borderColor: colorScheme.accent }}
      ></div>
      <div 
        className="absolute bottom-1 left-1 w-3 h-3 border-l-2 border-b-2 rounded-bl-lg"
        style={{ borderColor: colorScheme.accent }}
      ></div>
      <div 
        className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 rounded-br-lg"
        style={{ borderColor: colorScheme.accent }}
      ></div>
    </div>
  );
};