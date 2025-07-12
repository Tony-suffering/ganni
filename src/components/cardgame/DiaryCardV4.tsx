import React from 'react';
import { motion } from 'framer-motion';
import { GameCard } from '../../types/cardgame';

interface DiaryCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// バージョン4: ポケモンカード風デザイン
export const DiaryCardV4: React.FC<DiaryCardProps> = ({ card, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-[170px] h-[240px]',
    medium: 'w-[250px] h-[350px]',
    large: 'w-[340px] h-[476px]'
  };

  const fontSizes = {
    small: {
      title: 'text-[12px]',
      hp: 'text-[16px]',
      type: 'text-[8px]',
      stats: 'text-[12px]',
      effect: 'text-[7px]',
      weakness: 'text-[6px]'
    },
    medium: {
      title: 'text-[16px]',
      hp: 'text-[22px]',
      type: 'text-[10px]',
      stats: 'text-[16px]',
      effect: 'text-[9px]',
      weakness: 'text-[8px]'
    },
    large: {
      title: 'text-[22px]',
      hp: 'text-[30px]',
      type: 'text-[14px]',
      stats: 'text-[22px]',
      effect: 'text-[12px]',
      weakness: 'text-[10px]'
    }
  };

  const getTypeColor = () => {
    const types = [
      { name: '光', color: 'from-yellow-300 to-yellow-500', bg: 'bg-yellow-50' },
      { name: '水', color: 'from-blue-400 to-blue-600', bg: 'bg-blue-50' },
      { name: '炎', color: 'from-red-400 to-red-600', bg: 'bg-red-50' },
      { name: '自然', color: 'from-green-400 to-green-600', bg: 'bg-green-50' },
      { name: '超', color: 'from-purple-400 to-purple-600', bg: 'bg-purple-50' }
    ];
    return types[Math.floor(Math.random() * types.length)];
  };

  const typeInfo = getTypeColor();

  return (
    <motion.div
      className={`${sizeClasses[size]} relative`}
      whileHover={{ scale: 1.05, rotateY: 5 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* 外枠 */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-white to-gray-200 rounded-xl shadow-2xl" />
      
      {/* カード本体 */}
      <div className={`absolute inset-[8px] ${typeInfo.bg} rounded-lg overflow-hidden`}>
        
        {/* 上部ヘッダー */}
        <div className="relative p-4 pb-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className={`${fontSizes[size].title} font-bold text-gray-800 leading-tight`}>
                {card.title}
              </h3>
              <div className="flex items-center mt-1">
                <div className={`px-2 py-0.5 bg-gradient-to-r ${typeInfo.color} text-white text-xs rounded-full font-medium`}>
                  {typeInfo.name}タイプ
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`${fontSizes[size].hp} font-bold text-red-600`}>
                HP {Math.round(card.totalScore * 2)}
              </div>
            </div>
          </div>
        </div>

        {/* 画像エリア */}
        <div className="px-4 pb-3">
          <div className="relative bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg p-1 shadow-inner">
            <div className="relative bg-black rounded-md overflow-hidden" style={{ paddingBottom: '75%' }}>
              <img 
                src={card.imageUrl} 
                alt={card.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* レアリティシンボル */}
              <div className="absolute top-2 right-2">
                {card.rarity === 'UR' && (
                  <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">★</span>
                  </div>
                )}
                {card.rarity === 'SR' && (
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">◆</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* スコア表示エリア */}
        <div className="px-4 pb-2">
          <div className="bg-white/80 rounded-lg p-3 shadow-sm">
            <div className={`${fontSizes[size].type} text-gray-600 mb-2 font-medium`}>
              写真スコア詳細
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <div className={`${fontSizes[size].weakness} text-gray-500`}>技術</div>
                <div className={`${fontSizes[size].stats} font-bold text-red-600`}>{card.stats.attack / 10}</div>
              </div>
              <div className="text-center">
                <div className={`${fontSizes[size].weakness} text-gray-500`}>構成</div>
                <div className={`${fontSizes[size].stats} font-bold text-blue-600`}>{card.stats.defense / 10}</div>
              </div>
              <div className="text-center">
                <div className={`${fontSizes[size].weakness} text-gray-500`}>創造性</div>
                <div className={`${fontSizes[size].stats} font-bold text-green-600`}>{card.stats.speed / 10}</div>
              </div>
              <div className="text-center">
                <div className={`${fontSizes[size].weakness} text-gray-500`}>魅力</div>
                <div className={`${fontSizes[size].stats} font-bold text-purple-600`}>{card.stats.special / 10}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 効果テキスト */}
        <div className="px-4 pb-3">
          <div className="bg-white/60 rounded-lg p-3 shadow-sm">
            <div className={`${fontSizes[size].type} text-gray-600 mb-1 font-medium`}>
              作者コメント
            </div>
            <p className={`${fontSizes[size].effect} text-gray-700 leading-relaxed`}>
              {card.effectText}
            </p>
          </div>
        </div>

        {/* 下部情報 */}
        <div className="px-4 pb-3 mt-auto">
          <div className="flex justify-between items-center">
            <div className={`${fontSizes[size].weakness} text-gray-500`}>
              総合スコア: {card.totalScore}点
            </div>
            <div className={`${fontSizes[size].weakness} text-gray-500`}>
              {card.rarity} • {card.level}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};