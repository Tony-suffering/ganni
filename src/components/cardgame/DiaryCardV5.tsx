import React from 'react';
import { motion } from 'framer-motion';
import { GameCard } from '../../types/cardgame';

interface DiaryCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// バージョン5: MTG風デザイン
export const DiaryCardV5: React.FC<DiaryCardProps> = ({ card, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-[170px] h-[240px]',
    medium: 'w-[250px] h-[350px]',
    large: 'w-[340px] h-[476px]'
  };

  const fontSizes = {
    small: {
      title: 'text-[11px]',
      cost: 'text-[14px]',
      type: 'text-[7px]',
      stats: 'text-[18px]',
      effect: 'text-[6px]',
      pt: 'text-[12px]'
    },
    medium: {
      title: 'text-[15px]',
      cost: 'text-[20px]',
      type: 'text-[9px]',
      stats: 'text-[24px]',
      effect: 'text-[8px]',
      pt: 'text-[16px]'
    },
    large: {
      title: 'text-[20px]',
      cost: 'text-[28px]',
      type: 'text-[12px]',
      stats: 'text-[32px]',
      effect: 'text-[11px]',
      pt: 'text-[22px]'
    }
  };

  const getColorIdentity = () => {
    const colors = [
      { name: '白', symbol: 'W', bg: 'from-yellow-50 to-yellow-100', border: 'border-yellow-300', mana: 'bg-yellow-100' },
      { name: '青', symbol: 'U', bg: 'from-blue-50 to-blue-100', border: 'border-blue-300', mana: 'bg-blue-100' },
      { name: '黒', symbol: 'B', bg: 'from-gray-50 to-gray-100', border: 'border-gray-400', mana: 'bg-gray-100' },
      { name: '赤', symbol: 'R', bg: 'from-red-50 to-red-100', border: 'border-red-300', mana: 'bg-red-100' },
      { name: '緑', symbol: 'G', bg: 'from-green-50 to-green-100', border: 'border-green-300', mana: 'bg-green-100' }
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const colorInfo = getColorIdentity();
  const manaCost = Math.max(1, Math.floor(card.level / 2));

  return (
    <motion.div
      className={`${sizeClasses[size]} relative`}
      whileHover={{ scale: 1.05, rotateY: 3 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* 外枠 */}
      <div className={`absolute inset-0 bg-gradient-to-b ${colorInfo.bg} ${colorInfo.border} border-2 rounded-2xl shadow-xl`} />
      
      {/* 内枠 */}
      <div className="absolute inset-[6px] bg-white rounded-xl overflow-hidden">
        
        {/* 上部 - タイトルとマナコスト */}
        <div className="relative px-3 py-2 bg-gradient-to-r from-gray-700 to-gray-800">
          <div className="flex justify-between items-center">
            <h3 className={`${fontSizes[size].title} font-bold text-white leading-tight flex-1 mr-2`}>
              {card.title}
            </h3>
            <div className="flex items-center gap-1">
              {[...Array(manaCost)].map((_, i) => (
                <div key={i} className={`w-6 h-6 ${colorInfo.mana} rounded-full flex items-center justify-center border border-gray-300`}>
                  <span className={`${fontSizes[size].type} font-bold text-gray-700`}>
                    {colorInfo.symbol}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 画像エリア */}
        <div className="relative px-3 pt-3">
          <div className="relative bg-black rounded-lg overflow-hidden shadow-lg" style={{ paddingBottom: '70%' }}>
            <img 
              src={card.imageUrl} 
              alt={card.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* ホイルスタンプ（レア以上） */}
            {card.rarity !== 'N' && (
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-gradient-to-br from-silver-300 to-silver-500 rounded-full opacity-80 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {card.rarity === 'UR' ? '★★★' : card.rarity === 'SR' ? '★★' : '★'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* タイプライン */}
        <div className="px-3 py-2">
          <div className="bg-gray-100 rounded px-2 py-1">
            <span className={`${fontSizes[size].type} text-gray-700 font-medium`}>
              アート・クリーチャー — {card.attribute.slice(0, 2).join(' ')}
            </span>
          </div>
        </div>

        {/* スコア表示（オラクルテキスト風） */}
        <div className="px-3 pb-2">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <div className={`${fontSizes[size].type} text-gray-600 mb-1 font-bold`}>
              写真評価システム
            </div>
            <div className="grid grid-cols-4 gap-1 text-center mb-2">
              <div>
                <div className={`${fontSizes[size].effect} text-red-600 font-bold`}>技術</div>
                <div className={`${fontSizes[size].type} text-red-700`}>{card.stats.attack / 10}</div>
              </div>
              <div>
                <div className={`${fontSizes[size].effect} text-blue-600 font-bold`}>構成</div>
                <div className={`${fontSizes[size].type} text-blue-700`}>{card.stats.defense / 10}</div>
              </div>
              <div>
                <div className={`${fontSizes[size].effect} text-green-600 font-bold`}>創造</div>
                <div className={`${fontSizes[size].type} text-green-700`}>{card.stats.speed / 10}</div>
              </div>
              <div>
                <div className={`${fontSizes[size].effect} text-purple-600 font-bold`}>魅力</div>
                <div className={`${fontSizes[size].type} text-purple-700`}>{card.stats.special / 10}</div>
              </div>
            </div>
            <div className={`${fontSizes[size].effect} text-gray-700 leading-relaxed italic border-t border-yellow-300 pt-1`}>
              "{card.effectText}"
            </div>
          </div>
        </div>

        {/* 下部 - パワー/タフネス風 */}
        <div className="mt-auto px-3 pb-3">
          <div className="flex justify-between items-end">
            <div className={`${fontSizes[size].effect} text-gray-500`}>
              総合評価: {card.totalScore}/100
            </div>
            <div className="bg-gradient-to-br from-amber-200 to-amber-300 rounded-lg px-2 py-1 border border-amber-400">
              <span className={`${fontSizes[size].pt} font-bold text-amber-800`}>
                {Math.round(card.stats.attack / 100)}/{Math.round(card.stats.defense / 100)}
              </span>
            </div>
          </div>
        </div>

        {/* アーティスト情報 */}
        <div className="px-3 pb-2">
          <div className={`${fontSizes[size].effect} text-gray-400 italic text-center`}>
            撮影者: {card.title.split('').slice(0, 6).join('')}... • AI日記 2024
          </div>
        </div>
      </div>
    </motion.div>
  );
};