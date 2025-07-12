import React from 'react';
import { GameCard } from '../../types/cardgame';

interface DiaryCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V12: エレガント・ミニマリスト（高級感重視）
export const DiaryCardV12: React.FC<DiaryCardProps> = ({ card, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-[140px] h-[196px]',
    medium: 'w-[200px] h-[280px]',
    large: 'w-[280px] h-[392px]'
  };

  const rarityColors = {
    UR: { primary: '#D4AF37', secondary: '#FFD700', accent: '#B8860B' },
    SR: { primary: '#9333EA', secondary: '#A855F7', accent: '#7C3AED' },
    R: { primary: '#2563EB', secondary: '#3B82F6', accent: '#1D4ED8' },
    N: { primary: '#6B7280', secondary: '#9CA3AF', accent: '#4B5563' }
  };

  const rarity = rarityColors[card.rarity as keyof typeof rarityColors];

  return (
    <div className={`${sizeClasses[size]} relative bg-white overflow-hidden`}
         style={{ 
           borderRadius: '16px',
           boxShadow: '0 12px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)',
           border: `1px solid ${rarity.primary}20`
         }}>
      
      {/* 上部装飾ライン */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${rarity.primary}, ${rarity.secondary}, ${rarity.primary})` }}></div>
      
      {/* ヘッダーエリア */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ 
                   background: `linear-gradient(135deg, ${rarity.primary}15, ${rarity.secondary}25)`,
                   border: `1px solid ${rarity.primary}30`
                 }}>
              <span className="text-lg font-black" style={{ color: rarity.primary }}>
                {card.level}
              </span>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Level</div>
              <div className="text-xs text-gray-600">Energy Cost</div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Rarity</div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                 style={{ 
                   background: `linear-gradient(135deg, ${rarity.primary}, ${rarity.secondary})`,
                   color: 'white'
                 }}>
              {card.rarity}
            </div>
          </div>
        </div>
      </div>

      {/* 画像エリア */}
      <div className="mx-4 mb-4">
        <div className="aspect-[5/4] rounded-2xl overflow-hidden relative" 
             style={{ border: `2px solid ${rarity.primary}30` }}>
          <img 
            src={card.imageUrl} 
            alt={card.title}
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(1.05) contrast(1.02)' }}
          />
          
          {/* 画像フレーム効果 */}
          <div className="absolute inset-0 rounded-2xl"
               style={{ 
                 background: `linear-gradient(135deg, ${rarity.primary}10 0%, transparent 30%, transparent 70%, ${rarity.secondary}15 100%)`,
                 pointerEvents: 'none'
               }}>
          </div>
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="px-4 pb-4">
        {/* タイトル */}
        <h3 className="text-base font-semibold text-gray-900 mb-3 leading-tight text-center"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          {card.title}
        </h3>

        {/* タイプライン */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-sm font-medium text-gray-700">Digital Asset</span>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span className="text-sm text-gray-600">{card.attribute[0] || 'Artwork'}</span>
          </div>
        </div>

        {/* 効果テキスト */}
        <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Ability</div>
          <p className="text-sm text-gray-700 leading-relaxed"
             style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {card.effectText.length > 85 ? card.effectText.substring(0, 85) + '...' : card.effectText}
          </p>
        </div>

        {/* ステータス */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-xl" 
               style={{ background: `${rarity.primary}08`, border: `1px solid ${rarity.primary}20` }}>
            <div className="text-xl font-black mb-1" style={{ color: rarity.accent }}>
              {Math.round(card.stats.attack / 100)}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: rarity.primary }}>
              Power
            </div>
          </div>
          <div className="text-center p-3 rounded-xl" 
               style={{ background: `${rarity.primary}08`, border: `1px solid ${rarity.primary}20` }}>
            <div className="text-xl font-black mb-1" style={{ color: rarity.accent }}>
              {Math.round(card.stats.defense / 100)}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: rarity.primary }}>
              Defense
            </div>
          </div>
        </div>
      </div>

      {/* 底部装飾 */}
      <div className="absolute bottom-0 left-4 right-4 h-px" 
           style={{ background: `linear-gradient(90deg, transparent, ${rarity.primary}60, transparent)` }}>
      </div>
    </div>
  );
};