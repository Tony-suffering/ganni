import React from 'react';
import { GameCard } from '../../types/cardgame';

interface DiaryCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V11: プロフェッショナル・モダンデザイン（視覚的階層重視）
export const DiaryCardV11: React.FC<DiaryCardProps> = ({ card, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-[140px] h-[196px]',
    medium: 'w-[200px] h-[280px]',
    large: 'w-[280px] h-[392px]'
  };

  return (
    <div className={`${sizeClasses[size]} relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden`}
         style={{ 
           borderRadius: '12px',
           boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
         }}>
      
      {/* トップバー - コスト＆レアリティ */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-r from-amber-600 to-orange-600 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-lg font-black text-slate-800">{card.level}</span>
          </div>
          <span className="text-white text-xs font-semibold tracking-wide">ENERGY</span>
        </div>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: card.rarity === 'UR' ? 4 : card.rarity === 'SR' ? 3 : card.rarity === 'R' ? 2 : 1 }).map((_, i) => (
            <div key={i} className="w-2 h-2 bg-yellow-300 rounded-full shadow-sm" />
          ))}
        </div>
      </div>

      {/* メイン画像エリア */}
      <div className="mt-12 mx-3 mb-3 relative">
        <div className="aspect-[4/3] rounded-lg overflow-hidden border-2 border-slate-600 shadow-xl">
          <img 
            src={card.imageUrl} 
            alt={card.title}
            className="w-full h-full object-cover"
            style={{ filter: 'contrast(1.1) saturate(1.1)' }}
          />
          
          {/* 画像オーバーレイ効果 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>
        
        {/* レアリティインジケーター */}
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white shadow-lg"
             style={{
               background: card.rarity === 'UR' ? 'linear-gradient(45deg, #fbbf24, #f59e0b)' :
                          card.rarity === 'SR' ? 'linear-gradient(45deg, #a855f7, #7c3aed)' :
                          card.rarity === 'R' ? 'linear-gradient(45deg, #3b82f6, #2563eb)' :
                          'linear-gradient(45deg, #6b7280, #4b5563)'
             }}>
        </div>
      </div>

      {/* カード情報エリア */}
      <div className="px-3 pb-3 text-white">
        {/* タイトル */}
        <h3 className="text-sm font-bold leading-tight mb-2 text-center"
            style={{ 
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
          {card.title}
        </h3>

        {/* タイプライン */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center px-3 py-1 bg-slate-700/80 rounded-full border border-slate-600">
            <span className="text-xs font-medium text-slate-200">
              Digital Creature
            </span>
            <span className="mx-2 text-slate-400">•</span>
            <span className="text-xs text-slate-300">
              {card.attribute[0] || 'Art'}
            </span>
          </div>
        </div>

        {/* 効果テキスト */}
        <div className="bg-slate-800/60 rounded-lg p-2 mb-3 border border-slate-700">
          <p className="text-xs leading-relaxed text-slate-100"
             style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
            {card.effectText.length > 80 ? card.effectText.substring(0, 80) + '...' : card.effectText}
          </p>
        </div>

        {/* ステータス */}
        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="text-lg font-black text-red-400" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
              {Math.round(card.stats.attack / 100)}
            </div>
            <div className="text-xs font-semibold text-red-300 tracking-wide">POWER</div>
          </div>
          
          <div className="w-px h-8 bg-slate-600"></div>
          
          <div className="text-center">
            <div className="text-lg font-black text-blue-400" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
              {Math.round(card.stats.defense / 100)}
            </div>
            <div className="text-xs font-semibold text-blue-300 tracking-wide">SHIELD</div>
          </div>
        </div>
      </div>

      {/* 底部グロー効果 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
    </div>
  );
};