import React from 'react';
import { GameCard } from '../../types/cardgame';

interface ProCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V7: card.png画像ベース・オーバーレイ版
export const ProCardV7: React.FC<ProCardProps> = ({ card, size = 'medium' }) => {
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
        backgroundImage: 'url(/card.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* コスト数値オーバーレイ（左上円形エリア） */}
      <div 
        className="absolute flex items-center justify-center z-20"
        style={{
          top: `${dim.height * 0.04}px`,
          left: `${dim.width * 0.08}px`,
          width: `${dim.width * 0.16}px`,
          height: `${dim.width * 0.16}px`
        }}
      >
        <span 
          className="text-white font-black text-center"
          style={{ 
            fontSize: size === 'large' ? '18px' : size === 'small' ? '12px' : '16px',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          {card.level}
        </span>
      </div>

      {/* 投稿画像オーバーレイ（中央画像エリア） */}
      <div 
        className="absolute overflow-hidden z-10"
        style={{
          top: `${dim.height * 0.12}px`,
          left: `${dim.width * 0.08}px`,
          width: `${dim.width * 0.84}px`,
          height: `${dim.height * 0.52}px`,
          borderRadius: '8px'
        }}
      >
        <img 
          src={card.imageUrl} 
          alt={card.title}
          className="w-full h-full object-cover"
          style={{ 
            filter: 'contrast(1.1) saturate(1.2) brightness(1.05)',
            mixBlendMode: 'multiply'
          }}
        />
        
        {/* 画像上のグラデーションオーバーレイ */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(168, 85, 247, 0.1) 50%, transparent 100%)'
          }}
        ></div>
      </div>

      {/* カード名オーバーレイ（中央下部バー） */}
      <div 
        className="absolute z-20 flex items-center justify-center"
        style={{
          top: `${dim.height * 0.67}px`,
          left: `${dim.width * 0.08}px`,
          width: `${dim.width * 0.84}px`,
          height: `${dim.height * 0.08}px`
        }}
      >
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.9) 50%, rgba(0,0,0,0.8) 100%)',
            borderRadius: '4px'
          }}
        >
          <span 
            className="text-white font-bold text-center px-2"
            style={{ 
              fontSize: size === 'large' ? '14px' : size === 'small' ? '10px' : '12px',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              fontFamily: 'Arial, sans-serif',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}
          >
            {card.title.length > 15 ? card.title.substring(0, 15) + '...' : card.title}
          </span>
        </div>
      </div>

      {/* 効果テキストオーバーレイ（下部黒エリア） */}
      <div 
        className="absolute z-20"
        style={{
          top: `${dim.height * 0.77}px`,
          left: `${dim.width * 0.08}px`,
          width: `${dim.width * 0.84}px`,
          height: `${dim.height * 0.15}px`
        }}
      >
        <div 
          className="w-full h-full p-2"
          style={{
            background: 'rgba(0,0,0,0.85)',
            borderRadius: '4px'
          }}
        >
          <div className="mb-1">
            <span 
              className="text-xs font-bold uppercase tracking-wide"
              style={{ 
                color: '#C084FC',
                fontFamily: 'Arial, sans-serif'
              }}
            >
              {card.attribute[0] || 'RARE'} POWER
            </span>
          </div>
          <p 
            className="text-white text-xs leading-tight"
            style={{ 
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.2'
            }}
          >
            {card.effectText.length > 60 ? card.effectText.substring(0, 60) + '...' : card.effectText}
          </p>
        </div>
      </div>

      {/* ATK値オーバーレイ（左下） */}
      <div 
        className="absolute z-20 flex items-center justify-center"
        style={{
          bottom: `${dim.height * 0.02}px`,
          left: `${dim.width * 0.08}px`,
          width: `${dim.width * 0.25}px`,
          height: `${dim.height * 0.06}px`
        }}
      >
        <div 
          className="bg-black bg-opacity-80 rounded px-2 py-1"
        >
          <span 
            className="text-white font-black"
            style={{ 
              fontSize: size === 'large' ? '16px' : size === 'small' ? '12px' : '14px',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              fontFamily: 'Arial, sans-serif',
              color: '#FF4444'
            }}
          >
            {Math.round(card.stats.attack / 10) * 100}
          </span>
        </div>
      </div>

      {/* レアリティマーカーオーバーレイ（右上） */}
      <div 
        className="absolute z-20 flex items-center justify-center"
        style={{
          top: `${dim.height * 0.04}px`,
          right: `${dim.width * 0.08}px`,
          width: `${dim.width * 0.12}px`,
          height: `${dim.width * 0.12}px`
        }}
      >
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{
            background: card.rarity === 'UR' ? '#9333EA' : 
                       card.rarity === 'SR' ? '#DC2626' :
                       card.rarity === 'R' ? '#2563EB' : '#6B7280',
            transform: 'rotate(45deg)',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.3)'
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

      {/* 属性情報オーバーレイ（右下） */}
      <div 
        className="absolute z-20 flex items-center justify-center"
        style={{
          bottom: `${dim.height * 0.02}px`,
          right: `${dim.width * 0.08}px`,
          width: `${dim.width * 0.25}px`,
          height: `${dim.height * 0.06}px`
        }}
      >
        <div 
          className="bg-black bg-opacity-80 rounded px-2 py-1"
        >
          <span 
            className="text-white text-xs font-medium"
            style={{ 
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {card.attribute[0] ? card.attribute[0].substring(0, 4).toUpperCase() : 'ART'}
          </span>
        </div>
      </div>

      {/* ホバー効果 */}
      <div 
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
          borderRadius: '16px'
        }}
      ></div>
    </div>
  );
};