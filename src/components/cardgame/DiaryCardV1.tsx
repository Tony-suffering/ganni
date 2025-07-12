import React from 'react';
import { motion } from 'framer-motion';
import { GameCard } from '../../types/cardgame';

interface DiaryCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// バージョン1: シンプルなカード風デザイン
export const DiaryCardV1: React.FC<DiaryCardProps> = ({ card, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-[140px] h-[196px]',
    medium: 'w-[200px] h-[280px]',
    large: 'w-[280px] h-[392px]'
  };

  const rarityColors = {
    N: 'from-slate-400 via-slate-500 to-slate-600',
    R: 'from-blue-400 via-blue-500 to-blue-600',
    SR: 'from-purple-400 via-purple-500 to-purple-600',
    UR: 'from-amber-400 via-yellow-400 to-orange-500'
  };

  const rarityGlow = {
    N: 'shadow-lg shadow-slate-500/30',
    R: 'shadow-xl shadow-blue-500/50',
    SR: 'shadow-2xl shadow-purple-500/60',
    UR: 'shadow-2xl shadow-yellow-500/70 drop-shadow-2xl'
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} relative rounded-lg overflow-hidden ${rarityGlow[card.rarity]}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* カード背景 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${rarityColors[card.rarity]} shadow-inner`} />
      
      {/* カード枠 */}
      <div className="absolute inset-[3px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg p-3 flex flex-col border border-gray-700">
        
        {/* ヘッダー部分 */}
        <div className="relative bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 rounded-lg p-3 shadow-lg border border-yellow-500">
          <h3 className="text-white font-bold text-sm truncate pr-16" style={{
            fontFamily: 'Yu Gothic, sans-serif',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
          }}>{card.title}</h3>
          <div className="absolute top-2 right-2 flex">
            {[...Array(card.level)].map((_, i) => (
              <span key={i} className="text-yellow-200 text-sm drop-shadow-md">★</span>
            ))}
          </div>
        </div>

        {/* カード画像 */}
        <div className="relative flex-1 mt-3 border-4 border-gray-600 rounded-lg overflow-hidden shadow-xl">
          <img 
            src={card.imageUrl} 
            alt={card.title}
            className="w-full h-full object-cover"
            style={{
              filter: card.rarity === 'UR' ? 'brightness(1.1) contrast(1.05) saturate(1.1)' : 'brightness(1.05)'
            }}
          />
          
          {/* ホログラム効果 */}
          {card.rarity !== 'N' && (
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
          
          {/* レアリティ表示 */}
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-bold shadow-lg ${
            card.rarity === 'UR' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
            card.rarity === 'SR' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
            card.rarity === 'R' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
            'bg-black/80 text-gray-300'
          }`}>
            {card.rarity}
          </div>
        </div>

        {/* 属性タグ */}
        <div className="flex gap-1 mt-2 justify-center">
          {card.attribute.slice(0, 3).map((attr, i) => (
            <span 
              key={i}
              className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full"
            >
              {attr}
            </span>
          ))}
        </div>

        {/* 効果テキスト */}
        <div className="bg-gradient-to-b from-amber-50 to-yellow-100 border-2 border-amber-500 rounded-lg p-3 mt-3 min-h-[60px] shadow-inner">
          <p className="text-[10px] text-gray-800 leading-relaxed" style={{
            fontFamily: 'Yu Mincho, serif'
          }}>
            {card.effectText}
          </p>
        </div>

        {/* ステータス表示 */}
        <div className="flex justify-between items-center mt-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg px-3 py-2 shadow-lg">
          <div className="text-white">
            <span className="text-[10px] font-bold">ATK/</span>
            <span className="text-sm font-bold" style={{
              fontFamily: 'Arial Black, sans-serif',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
            }}>{card.stats.attack}</span>
          </div>
          <div className="text-white">
            <span className="text-[10px] font-bold">DEF/</span>
            <span className="text-sm font-bold" style={{
              fontFamily: 'Arial Black, sans-serif',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
            }}>{card.stats.defense}</span>
          </div>
        </div>

        {/* スピード・特殊表示 */}
        <div className="flex justify-between text-[10px] text-gray-300 mt-1">
          <span>SPD: {card.stats.speed}</span>
          <span>SP: {card.stats.special}</span>
        </div>
      </div>
    </motion.div>
  );
};