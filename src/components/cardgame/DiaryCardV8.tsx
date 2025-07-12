import React from 'react';
import { motion } from 'framer-motion';
import { GameCard } from '../../types/cardgame';

interface DiaryCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V8: シャドウバース風の美麗カード
export const DiaryCardV8: React.FC<DiaryCardProps> = ({ card, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-[140px] h-[196px]',
    medium: 'w-[200px] h-[280px]',
    large: 'w-[280px] h-[392px]'
  };

  const fontSizes = {
    small: {
      cost: 'text-[14px]',
      title: 'text-[9px]',
      type: 'text-[6px]',
      effect: 'text-[5px]',
      stats: 'text-[12px]'
    },
    medium: {
      cost: 'text-[20px]',
      title: 'text-[13px]',
      type: 'text-[9px]',
      effect: 'text-[7px]',
      stats: 'text-[18px]'
    },
    large: {
      cost: 'text-[28px]',
      title: 'text-[17px]',
      type: 'text-[12px]',
      effect: 'text-[10px]',
      stats: 'text-[24px]'
    }
  };

  const getCraftColor = () => {
    const crafts = [
      { name: 'ロイヤル', color: 'from-yellow-500 to-yellow-700', gem: 'from-yellow-400 to-yellow-600' },
      { name: 'ウィッチ', color: 'from-purple-500 to-purple-700', gem: 'from-purple-400 to-purple-600' },
      { name: 'ドラゴン', color: 'from-red-500 to-red-700', gem: 'from-red-400 to-red-600' },
      { name: 'ネクロ', color: 'from-gray-600 to-gray-800', gem: 'from-gray-500 to-gray-700' },
      { name: 'ヴァンプ', color: 'from-pink-500 to-pink-700', gem: 'from-pink-400 to-pink-600' },
      { name: 'ビショップ', color: 'from-blue-500 to-blue-700', gem: 'from-blue-400 to-blue-600' },
      { name: 'ネメシス', color: 'from-green-500 to-green-700', gem: 'from-green-400 to-green-600' }
    ];
    return crafts[Math.floor(Math.random() * crafts.length)];
  };

  const craft = getCraftColor();
  const isEvolved = card.level >= 5;

  return (
    <motion.div
      className={`${sizeClasses[size]} relative`}
      whileHover={{ scale: 1.05, rotateY: 8, z: 50 }}
      whileTap={{ scale: 0.95 }}
      style={{ 
        perspective: '1200px',
        aspectRatio: '5/7'
      }}
    >
      {/* 外枠（クラフト色） */}
      <div className={`absolute inset-0 bg-gradient-to-br ${craft.color} rounded-[10px] shadow-2xl`} />
      
      {/* 装飾フレーム */}
      <div className="absolute inset-[2px] bg-gradient-to-b from-gray-100 to-gray-300 rounded-[8px]" />
      <div className="absolute inset-[4px] bg-black rounded-[6px]" />
      
      {/* メイン画像エリア */}
      <div className="absolute inset-[6px] rounded-[4px] overflow-hidden">
        <img 
          src={card.imageUrl} 
          alt={card.title}
          className="w-full h-full object-cover"
          style={{
            filter: isEvolved ? 'brightness(1.2) contrast(1.1) saturate(1.3) hue-rotate(10deg)' : 'brightness(1.1) contrast(1.05)'
          }}
        />

        {/* 進化エフェクト */}
        {isEvolved && (
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-400/20 to-transparent animate-pulse" />
        )}

        {/* コストオーブ（左上） */}
        <div className="absolute top-3 left-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${craft.gem} rounded-full border-3 border-white shadow-xl flex items-center justify-center`}>
            <span className={`${fontSizes[size].cost} font-black text-white drop-shadow-lg`}>
              {card.level}
            </span>
          </div>
        </div>

        {/* レアリティジェム（右上） */}
        <div className="absolute top-3 right-3">
          {card.rarity === 'UR' && (
            <div className="w-6 h-6 bg-gradient-to-br from-rainbow-start to-rainbow-end rounded-full animate-spin-slow border-2 border-white shadow-lg" />
          )}
          {card.rarity === 'SR' && (
            <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse border-2 border-white shadow-lg" />
          )}
          {card.rarity === 'R' && (
            <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white shadow-lg" />
          )}
        </div>

        {/* 進化マーク */}
        {isEvolved && (
          <div className="absolute top-12 left-3">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-1 rounded-full border border-white shadow-lg">
              <span className={`${fontSizes[size].type} font-bold text-white`}>進化</span>
            </div>
          </div>
        )}

        {/* カード名プレート */}
        <div className="absolute bottom-16 left-2 right-2">
          <div className="bg-gradient-to-r from-black/80 to-black/60 backdrop-blur-md rounded-lg p-2 border border-white/30">
            <h3 className={`${fontSizes[size].title} font-bold text-white mb-1`} style={{
              fontFamily: 'Yu Gothic, sans-serif',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}>
              {card.title}
            </h3>
            <p className={`${fontSizes[size].type} text-gray-200`}>
              {card.level >= 5 ? 'フォロワー' : 'フォロワー'} • {craft.name}
            </p>
          </div>
        </div>

        {/* 効果テキスト */}
        <div className="absolute bottom-8 left-2 right-2">
          <div className="bg-gradient-to-b from-amber-50 to-amber-100 border-2 border-amber-400 rounded-lg p-2 shadow-lg">
            <p className={`${fontSizes[size].effect} text-gray-800 leading-tight`} style={{
              fontFamily: 'Yu Mincho, serif'
            }}>
              <strong>【ファンファーレ】</strong> {card.effectText.substring(0, 60)}...
            </p>
          </div>
        </div>

        {/* ATK/HP表示 */}
        <div className="absolute bottom-1 right-2 flex items-center space-x-2">
          <div className="bg-gradient-to-r from-red-500 to-red-700 rounded-lg px-2 py-1 border border-white shadow-lg">
            <span className={`${fontSizes[size].stats} font-black text-white drop-shadow-md`}>
              {Math.round(card.stats.attack / 100)}
            </span>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-lg px-2 py-1 border border-white shadow-lg">
            <span className={`${fontSizes[size].stats} font-black text-white drop-shadow-md`}>
              {Math.round(card.stats.defense / 100)}
            </span>
          </div>
        </div>

        {/* ホログラムエフェクト */}
        {card.rarity !== 'N' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent animate-shimmer pointer-events-none" />
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.3) 0%, transparent 50%)',
              animation: 'float 4s ease-in-out infinite'
            }} />
          </>
        )}
      </div>
    </motion.div>
  );
};