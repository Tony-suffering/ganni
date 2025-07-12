import React from 'react';
import { GameCard } from '../../types/cardgame';

interface DiaryCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V14: クラシック・ラグジュアリー（伝統的高級感）
export const DiaryCardV14: React.FC<DiaryCardProps> = ({ card, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-[140px] h-[196px]',
    medium: 'w-[200px] h-[280px]',
    large: 'w-[280px] h-[392px]'
  };

  const rarityStyles = {
    UR: { 
      gradient: 'linear-gradient(135deg, #8B4513, #DAA520, #FFD700, #DAA520, #8B4513)',
      accent: '#FFD700',
      shadow: '0 0 30px rgba(255, 215, 0, 0.4)'
    },
    SR: { 
      gradient: 'linear-gradient(135deg, #4B0082, #8A2BE2, #9370DB, #8A2BE2, #4B0082)',
      accent: '#9370DB',
      shadow: '0 0 25px rgba(147, 112, 219, 0.3)'
    },
    R: { 
      gradient: 'linear-gradient(135deg, #000080, #4169E1, #87CEEB, #4169E1, #000080)',
      accent: '#4169E1',
      shadow: '0 0 20px rgba(65, 105, 225, 0.3)'
    },
    N: { 
      gradient: 'linear-gradient(135deg, #2F4F4F, #708090, #C0C0C0, #708090, #2F4F4F)',
      accent: '#C0C0C0',
      shadow: '0 0 15px rgba(192, 192, 192, 0.2)'
    }
  };

  const rarity = rarityStyles[card.rarity as keyof typeof rarityStyles];

  return (
    <div className={`${sizeClasses[size]} relative bg-gradient-to-br from-amber-50 to-amber-100 overflow-hidden`}
         style={{ 
           borderRadius: '24px',
           boxShadow: `${rarity.shadow}, 0 16px 48px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)`,
           border: '3px solid',
           borderImage: rarity.gradient,
           borderImageSlice: 1
         }}>
      
      {/* 装飾フレーム */}
      <div className="absolute inset-2 rounded-2xl border-2 border-amber-200/50 pointer-events-none"></div>
      
      {/* エレガントヘッダー */}
      <div className="relative p-4 pb-2">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/30 to-transparent"></div>
        
        <div className="relative flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-3 flex items-center justify-center"
                   style={{ 
                     background: `conic-gradient(${rarity.gradient})`,
                     padding: '3px'
                   }}>
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <span className="text-xl font-serif font-bold text-amber-800">
                    {card.level}
                  </span>
                </div>
              </div>
              {/* 装飾要素 */}
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full border-2 border-white shadow-lg"></div>
              <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full border border-white shadow-md"></div>
            </div>
            
            <div className="text-left">
              <div className="text-sm font-serif font-semibold text-amber-800 mb-1">
                Energy Level
              </div>
              <div className="text-xs text-amber-600 italic">
                Mystical Power
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs font-serif text-amber-700 mb-2 uppercase tracking-widest">
              Rarity
            </div>
            <div className="relative inline-block">
              <div className="px-4 py-2 rounded-full text-white font-serif font-bold text-sm shadow-lg"
                   style={{ 
                     background: rarity.gradient,
                     textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                   }}>
                {card.rarity}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* エレガント画像フレーム */}
      <div className="mx-4 mb-4 relative">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden"
             style={{ 
               boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.5), inset 0 0 0 6px rgba(180,135,45,0.3), 0 8px 24px rgba(0,0,0,0.15)'
             }}>
          <img 
            src={card.imageUrl} 
            alt={card.title}
            className="w-full h-full object-cover"
            style={{ filter: 'sepia(5%) contrast(1.05) saturate(1.1)' }}
          />
          
          {/* ヴィンテージオーバーレイ */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-200/10 via-transparent to-amber-800/10 pointer-events-none"></div>
          
          {/* 装飾コーナー */}
          <div className="absolute top-2 left-2 w-6 h-6 border-l-3 border-t-3 border-amber-300 rounded-tl-lg"></div>
          <div className="absolute top-2 right-2 w-6 h-6 border-r-3 border-t-3 border-amber-300 rounded-tr-lg"></div>
          <div className="absolute bottom-2 left-2 w-6 h-6 border-l-3 border-b-3 border-amber-300 rounded-bl-lg"></div>
          <div className="absolute bottom-2 right-2 w-6 h-6 border-r-3 border-b-3 border-amber-300 rounded-br-lg"></div>
        </div>
        
        {/* レアリティ装飾 */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="w-8 h-6 rounded-full border-2 border-white shadow-lg"
               style={{ background: rarity.gradient }}>
          </div>
        </div>
      </div>

      {/* エレガントコンテンツ */}
      <div className="px-4 pb-4">
        {/* 装飾タイトル */}
        <div className="text-center mb-4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent rounded-lg"></div>
          <div className="relative py-3">
            <h3 className="text-lg font-serif font-bold text-amber-900 mb-1 leading-tight"
                style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}>
              {card.title}
            </h3>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-amber-400"></div>
              <span className="text-sm font-serif italic text-amber-700">
                {card.attribute[0] || 'Artistic'} Chronicle
              </span>
              <div className="w-8 h-px bg-gradient-to-l from-transparent to-amber-400"></div>
            </div>
          </div>
        </div>

        {/* 装飾効果テキスト */}
        <div className="mb-4 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 shadow-inner"></div>
          <div className="relative p-4">
            <div className="text-xs font-serif text-amber-700 mb-2 text-center uppercase tracking-widest">
              ✦ Mystical Ability ✦
            </div>
            <p className="text-sm font-serif text-amber-800 leading-relaxed text-center italic">
              "{card.effectText.length > 75 ? card.effectText.substring(0, 75) + '...' : card.effectText}"
            </p>
          </div>
        </div>

        {/* エレガントステータス */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 shadow-inner"></div>
            <div className="relative p-3">
              <div className="text-xs font-serif text-red-700 mb-1 uppercase tracking-wider">
                ⚔ Power ⚔
              </div>
              <div className="text-2xl font-serif font-bold text-red-800"
                   style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}>
                {Math.round(card.stats.attack / 100)}
              </div>
            </div>
          </div>
          
          <div className="text-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-inner"></div>
            <div className="relative p-3">
              <div className="text-xs font-serif text-blue-700 mb-1 uppercase tracking-wider">
                🛡 Defense 🛡
              </div>
              <div className="text-2xl font-serif font-bold text-blue-800"
                   style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}>
                {Math.round(card.stats.defense / 100)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部装飾ライン */}
      <div className="absolute bottom-2 left-4 right-4 h-px"
           style={{ background: `linear-gradient(90deg, transparent, ${rarity.accent}80, transparent)` }}>
      </div>
    </div>
  );
};