import React from 'react';
import { motion } from 'framer-motion';
import { GameCard } from '../../types/cardgame';

interface DiaryCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V1: 参考画像準拠の完璧なカード
export const DiaryCardV1Fixed: React.FC<DiaryCardProps> = ({ card, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-[140px] h-[196px]',
    medium: 'w-[200px] h-[280px]',
    large: 'w-[280px] h-[392px]'
  };

  const fontSizes = {
    small: {
      cost: 'text-[16px]',
      title: 'text-[10px]',
      type: 'text-[7px]',
      effect: 'text-[6px]',
      rarity: 'text-[8px]'
    },
    medium: {
      cost: 'text-[24px]',
      title: 'text-[14px]',
      type: 'text-[10px]',
      effect: 'text-[8px]',
      rarity: 'text-[12px]'
    },
    large: {
      cost: 'text-[32px]',
      title: 'text-[18px]',
      type: 'text-[14px]',
      effect: 'text-[11px]',
      rarity: 'text-[16px]'
    }
  };

  const getFrameColor = () => {
    switch (card.rarity) {
      case 'UR': return 'from-yellow-400 via-orange-400 to-red-500';
      case 'SR': return 'from-purple-400 via-pink-400 to-purple-600';
      case 'R': return 'from-blue-400 via-cyan-400 to-blue-600';
      default: return 'from-gray-400 via-gray-500 to-gray-600';
    }
  };

  const getTypeColor = () => {
    const colors = [
      'from-green-600 to-green-800',
      'from-blue-600 to-blue-800', 
      'from-red-600 to-red-800',
      'from-purple-600 to-purple-800'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const totalPower = Math.round((card.stats.attack + card.stats.defense + card.stats.speed + card.stats.special) / 100);

  return (
    <motion.div
      className={`${sizeClasses[size]} relative`}
      whileHover={{ scale: 1.05, rotateY: 5 }}
      whileTap={{ scale: 0.95 }}
      style={{ 
        perspective: '1000px',
        aspectRatio: '5/7'
      }}
    >
      {/* 外枠 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getFrameColor()} rounded-[8px] shadow-2xl`} />
      
      {/* 内枠 */}
      <div className="absolute inset-[3px] bg-black rounded-[6px]" />
      
      {/* メイン画像（フルアート） */}
      <div className="absolute inset-[5px] rounded-[4px] overflow-hidden">
        <img 
          src={card.imageUrl} 
          alt={card.title}
          className="w-full h-full object-cover"
          style={{
            filter: 'brightness(1.1) contrast(1.05) saturate(1.2)'
          }}
        />
        
        {/* コストシンボル（左上） */}
        <div className="absolute top-2 left-2">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <span className={`${fontSizes[size].cost} font-black text-black`}>
              {card.level}
            </span>
          </div>
        </div>

        {/* 効果テキスト（画像上） */}
        <div className="absolute bottom-[25%] left-2 right-2">
          <div className="bg-black/75 backdrop-blur-sm rounded-md p-2 border border-white/20">
            <p className={`${fontSizes[size].effect} text-white leading-tight`} style={{
              fontFamily: 'Yu Mincho, serif'
            }}>
              {card.effectText}
            </p>
          </div>
        </div>

        {/* 下部情報バー */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className={`bg-gradient-to-r ${getTypeColor()} p-2 flex justify-between items-center`}>
            <div>
              <h3 className={`${fontSizes[size].title} font-bold text-white`} style={{
                fontFamily: 'Yu Gothic, sans-serif',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>
                {card.title}
              </h3>
              <p className={`${fontSizes[size].type} text-white/90`}>
                AI写真 • {card.attribute[0] || 'アート'}族
              </p>
            </div>
            <div className="text-right">
              <div className={`${fontSizes[size].rarity} font-bold text-white bg-black/30 px-2 py-1 rounded`}>
                {card.rarity}
              </div>
            </div>
          </div>
        </div>

        {/* ステータス表示（右下角） */}
        <div className="absolute bottom-12 right-2">
          <div className="bg-orange-600/90 backdrop-blur-sm rounded-md px-2 py-1 border border-white/30">
            <div className={`${fontSizes[size].effect} text-white font-bold text-center`}>
              PWR: {totalPower}
            </div>
          </div>
        </div>

        {/* ホログラム効果 */}
        {card.rarity !== 'N' && (
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
        )}
      </div>
    </motion.div>
  );
};