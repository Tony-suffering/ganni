import React from 'react';
import { GameCard } from '../../types/cardgame';

interface DiaryCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V15: アートギャラリー・モダン（美術館品質）
export const DiaryCardV15: React.FC<DiaryCardProps> = ({ card, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-[140px] h-[196px]',
    medium: 'w-[200px] h-[280px]',
    large: 'w-[280px] h-[392px]'
  };

  const rarityPalette = {
    UR: { primary: '#1A1A1A', secondary: '#F5F5DC', accent: '#DAA520', text: '#2C2C2C' },
    SR: { primary: '#2E2E2E', secondary: '#F8F8FF', accent: '#6A5ACD', text: '#333333' },
    R: { primary: '#1E1E1E', secondary: '#F0F8FF', accent: '#4682B4', text: '#2F2F2F' },
    N: { primary: '#262626', secondary: '#F5F5F5', accent: '#708090', text: '#404040' }
  };

  const palette = rarityPalette[card.rarity as keyof typeof rarityPalette];

  return (
    <div className={`${sizeClasses[size]} relative overflow-hidden`}
         style={{ 
           background: palette.secondary,
           borderRadius: '4px',
           boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
           border: `1px solid ${palette.primary}15`
         }}>
      
      {/* ミュージアムラベル風ヘッダー */}
      <div className="p-4 border-b"
           style={{ borderColor: `${palette.primary}10` }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2">
              <span className="text-xs font-medium tracking-wider uppercase"
                    style={{ 
                      color: palette.text,
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}>
                Digital Asset #{String(card.level).padStart(3, '0')}
              </span>
            </div>
            <h3 className="text-base font-medium leading-tight mb-1"
                style={{ 
                  color: palette.primary,
                  fontFamily: 'Georgia, serif'
                }}>
              {card.title}
            </h3>
            <div className="text-sm" style={{ color: palette.text }}>
              {card.attribute[0] || 'Contemporary Art'}, 2024
            </div>
          </div>
          
          <div className="text-right ml-4">
            <div className="w-6 h-6 rounded-sm flex items-center justify-center mb-1"
                 style={{ 
                   backgroundColor: palette.accent,
                   color: palette.secondary
                 }}>
              <span className="text-xs font-bold">{card.rarity}</span>
            </div>
            <div className="text-xs" style={{ color: palette.text }}>
              Class {card.rarity}
            </div>
          </div>
        </div>
      </div>

      {/* メイン画像 - ギャラリー風 */}
      <div className="relative mx-4 my-4">
        <div className="aspect-[4/3] relative"
             style={{ 
               backgroundColor: palette.secondary,
               boxShadow: 'inset 0 0 0 8px white, inset 0 0 0 9px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.15)'
             }}>
          <div className="absolute inset-2 overflow-hidden">
            <img 
              src={card.imageUrl} 
              alt={card.title}
              className="w-full h-full object-cover"
              style={{ filter: 'contrast(1.05) saturate(0.95)' }}
            />
          </div>
          
          {/* 額縁効果 */}
          <div className="absolute inset-0 pointer-events-none"
               style={{
                 background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.05) 100%)'
               }}>
          </div>
        </div>
        
        {/* ギャラリーライティング効果 */}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-16 h-1 opacity-30"
             style={{
               background: `linear-gradient(90deg, transparent, ${palette.accent}40, transparent)`,
               filter: 'blur(2px)'
             }}>
        </div>
      </div>

      {/* ミュージアム情報パネル */}
      <div className="px-4 pb-4">
        {/* 作品説明 */}
        <div className="mb-4 p-3 bg-white border border-gray-100 rounded-sm">
          <div className="text-xs font-medium mb-2 uppercase tracking-wider"
               style={{ color: palette.text }}>
            Artist Statement
          </div>
          <p className="text-sm leading-relaxed"
             style={{ 
               color: palette.primary,
               fontFamily: 'Georgia, serif'
             }}>
            {card.effectText.length > 80 ? card.effectText.substring(0, 80) + '...' : card.effectText}
          </p>
        </div>

        {/* 技術仕様 */}
        <div className="mb-4">
          <div className="text-xs font-medium mb-2 uppercase tracking-wider"
               style={{ color: palette.text }}>
            Technical Specifications
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-white border border-gray-100 rounded-sm">
              <div className="text-xs mb-1" style={{ color: palette.text }}>
                Resolution
              </div>
              <div className="text-lg font-light" style={{ color: palette.primary }}>
                {Math.round(card.stats.attack / 100)}K
              </div>
            </div>
            <div className="text-center p-2 bg-white border border-gray-100 rounded-sm">
              <div className="text-xs mb-1" style={{ color: palette.text }}>
                Quality
              </div>
              <div className="text-lg font-light" style={{ color: palette.primary }}>
                {Math.round(card.stats.defense / 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* 詳細情報 */}
        <div className="text-xs leading-relaxed" style={{ color: palette.text }}>
          <div className="flex justify-between mb-1">
            <span>Medium:</span>
            <span>Digital Creation</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Dimensions:</span>
            <span>{Math.round(card.stats.speed / 100)} × {Math.round(card.stats.special / 100)} units</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Collection:</span>
            <span>AI Diary Series</span>
          </div>
          <div className="flex justify-between">
            <span>Acquisition:</span>
            <span>2024</span>
          </div>
        </div>
      </div>

      {/* 底部アクセント */}
      <div className="absolute bottom-0 left-4 right-4 h-px"
           style={{ backgroundColor: `${palette.accent}30` }}>
      </div>
      
      {/* ミュージアム認証マーク */}
      <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center"
           style={{ 
             borderColor: palette.accent,
             backgroundColor: palette.secondary
           }}>
        <div className="w-1.5 h-1.5 rounded-full"
             style={{ backgroundColor: palette.accent }}>
        </div>
      </div>
    </div>
  );
};