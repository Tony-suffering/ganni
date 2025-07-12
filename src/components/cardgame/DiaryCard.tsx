import React from 'react';
import { motion } from 'framer-motion';
import { GameCard } from '../../types/cardgame';

interface DiaryCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

export const DiaryCard: React.FC<DiaryCardProps> = ({ card, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-[170px] h-[250px]',
    medium: 'w-[250px] h-[363px]',
    large: 'w-[340px] h-[500px]'
  };

  const fontSizes = {
    small: {
      title: 'text-[10px]',
      stats: 'text-[12px]',
      effect: 'text-[7px]',
      type: 'text-[8px]'
    },
    medium: {
      title: 'text-sm',
      stats: 'text-lg',
      effect: 'text-[9px]',
      type: 'text-[10px]'
    },
    large: {
      title: 'text-lg',
      stats: 'text-2xl',
      effect: 'text-xs',
      type: 'text-sm'
    }
  };

  const rarityFrameColors = {
    N: 'from-gray-500 to-gray-700',
    R: 'from-blue-500 to-blue-700',
    SR: 'from-purple-500 to-purple-700',
    UR: 'from-yellow-500 via-yellow-400 to-yellow-600'
  };

  const rarityHologram = {
    N: '',
    R: 'bg-gradient-to-br from-transparent via-blue-400/20 to-transparent',
    SR: 'bg-gradient-to-br from-transparent via-purple-400/30 to-transparent',
    UR: 'bg-gradient-to-br from-transparent via-yellow-400/40 to-transparent animate-shimmer'
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} relative overflow-hidden`}
      whileHover={{ scale: 1.02, rotateY: 5 }}
      whileTap={{ scale: 0.98 }}
      style={{ perspective: '1000px' }}
    >
      {/* 外枠 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${rarityFrameColors[card.rarity]} rounded-[3px]`} />
      
      {/* 内枠 */}
      <div className="absolute inset-[6px] bg-gray-900 rounded-[2px]" />
      
      {/* カード本体 */}
      <div className="absolute inset-[8px] bg-gradient-to-b from-gray-100 to-gray-200 rounded-[2px] flex flex-col">
        
        {/* カード名とレベル */}
        <div className="relative px-3 pt-2 pb-1">
          <div className="flex justify-between items-start">
            <h3 className={`font-bold ${fontSizes[size].title} text-black tracking-tight leading-tight flex-1 mr-2`}>
              {card.title}
            </h3>
            <div className="flex flex-shrink-0">
              {[...Array(card.level)].map((_, i) => (
                <span key={i} className="text-yellow-500 text-[16px]">★</span>
              ))}
            </div>
          </div>
        </div>

        {/* カード画像枠 */}
        <div className="mx-3 mb-1">
          <div className="relative border-4 border-gray-800 bg-black" style={{ paddingBottom: '100%' }}>
            <img 
              src={card.imageUrl} 
              alt={card.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* ホログラム効果 */}
            {card.rarity !== 'N' && (
              <div className={`absolute inset-0 ${rarityHologram[card.rarity]} pointer-events-none`} />
            )}
            {/* 属性アイコン（右上） */}
            <div className="absolute top-1 right-1 w-6 h-6 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-bold">光</span>
            </div>
          </div>
        </div>

        {/* カードタイプ */}
        <div className="mx-3 mb-1">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-2 py-0.5 text-center">
            <span className={`${fontSizes[size].type} font-bold tracking-wider`}>
              【AI日記】効果モンスター
            </span>
          </div>
        </div>

        {/* 効果テキスト枠 */}
        <div className="mx-3 mb-2 flex-1">
          <div className="bg-gradient-to-b from-yellow-50 to-yellow-100 border border-gray-400 h-full p-2">
            <p className={`${fontSizes[size].effect} text-black leading-tight`}>
              {card.attribute.slice(0, 2).map(attr => `【${attr}】`).join('')}<br/>
              {card.effectText}
            </p>
          </div>
        </div>

        {/* ATK/DEF表示 */}
        <div className="absolute bottom-2 right-3 flex items-center gap-4">
          <div className="text-right">
            <span className={`${fontSizes[size].type} text-black font-bold`}>ATK/</span>
            <span className={`${fontSizes[size].stats} text-black font-bold`}>{card.stats.attack}</span>
          </div>
          <div className="text-right">
            <span className={`${fontSizes[size].type} text-black font-bold`}>DEF/</span>
            <span className={`${fontSizes[size].stats} text-black font-bold`}>{card.stats.defense}</span>
          </div>
        </div>
        
        {/* カード番号・レアリティ */}
        <div className="absolute bottom-2 left-3">
          <span className="text-[8px] text-gray-600 font-mono">JPD-001</span>
          <span className="ml-2 text-[8px] text-gray-600 font-bold">{card.rarity}</span>
        </div>
      </div>
      
      {/* キラキラエフェクト（URカード用） */}
      {card.rarity === 'UR' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shine" />
        </div>
      )}
    </motion.div>
  );
};