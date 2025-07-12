import React from 'react';
import { motion } from 'framer-motion';
import { GameCard } from '../../types/cardgame';

interface DiaryCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V9: ハースストーン風の重厚なカード
export const DiaryCardV9: React.FC<DiaryCardProps> = ({ card, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-[140px] h-[196px]',
    medium: 'w-[200px] h-[280px]',
    large: 'w-[280px] h-[392px]'
  };

  const fontSizes = {
    small: {
      cost: 'text-[16px]',
      title: 'text-[8px]',
      type: 'text-[6px]',
      effect: 'text-[5px]',
      stats: 'text-[14px]'
    },
    medium: {
      cost: 'text-[24px]',
      title: 'text-[12px]',
      type: 'text-[8px]',
      effect: 'text-[7px]',
      stats: 'text-[20px]'
    },
    large: {
      cost: 'text-[32px]',
      title: 'text-[16px]',
      type: 'text-[11px]',
      effect: 'text-[9px]',
      stats: 'text-[28px]'
    }
  };

  const getClassColor = () => {
    const classes = [
      { name: 'メイジ', color: 'from-blue-600 to-blue-800', gem: 'from-cyan-400 to-blue-500' },
      { name: 'パラディン', color: 'from-yellow-500 to-yellow-700', gem: 'from-yellow-300 to-yellow-500' },
      { name: 'ハンター', color: 'from-green-600 to-green-800', gem: 'from-green-400 to-green-600' },
      { name: 'ローグ', color: 'from-gray-700 to-gray-900', gem: 'from-gray-500 to-gray-700' },
      { name: 'プリースト', color: 'from-purple-600 to-purple-800', gem: 'from-purple-400 to-purple-600' },
      { name: 'シャーマン', color: 'from-blue-500 to-indigo-700', gem: 'from-blue-300 to-blue-500' },
      { name: 'ウォーロック', color: 'from-purple-800 to-purple-900', gem: 'from-purple-600 to-purple-800' },
      { name: 'ウォリアー', color: 'from-red-600 to-red-800', gem: 'from-red-400 to-red-600' },
      { name: 'ドルイド', color: 'from-amber-600 to-amber-800', gem: 'from-amber-400 to-amber-600' }
    ];
    return classes[Math.floor(Math.random() * classes.length)];
  };

  const classInfo = getClassColor();
  const manaCost = Math.min(10, card.level);
  const isLegendary = card.rarity === 'UR';

  return (
    <motion.div
      className={`${sizeClasses[size]} relative`}
      whileHover={{ 
        scale: 1.06, 
        rotateY: 10,
        rotateX: 5,
        z: 100
      }}
      whileTap={{ scale: 0.94 }}
      style={{ 
        perspective: '1500px',
        aspectRatio: '5/7'
      }}
    >
      {/* 外枠（重厚な金属フレーム） */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-700 rounded-[12px] shadow-2xl" />
      
      {/* 装飾外枠 */}
      <div className="absolute inset-[2px] bg-gradient-to-br from-amber-200 to-amber-400 rounded-[10px]" />
      
      {/* クラス色内枠 */}
      <div className={`absolute inset-[4px] bg-gradient-to-br ${classInfo.color} rounded-[8px]`} />
      
      {/* カード本体 */}
      <div className="absolute inset-[6px] bg-gradient-to-b from-gray-100 to-gray-200 rounded-[6px] overflow-hidden">
        
        {/* 上部装飾バー */}
        <div className={`h-8 bg-gradient-to-r ${classInfo.color} flex items-center justify-center border-b-2 border-amber-400`}>
          <span className={`${fontSizes[size].type} font-bold text-white drop-shadow-lg`}>
            {classInfo.name} • ミニオン
          </span>
        </div>

        {/* メイン画像 */}
        <div className="relative mx-2 mt-2 mb-4" style={{ paddingBottom: '60%' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg p-[2px]">
            <div className="relative w-full h-full bg-black rounded-md overflow-hidden">
              <img 
                src={card.imageUrl} 
                alt={card.title}
                className="w-full h-full object-cover"
                style={{
                  filter: isLegendary ? 'brightness(1.15) contrast(1.1) saturate(1.2) drop-shadow(0 0 10px rgba(255,215,0,0.5))' : 'brightness(1.1)'
                }}
              />
              
              {/* レジェンダリーエフェクト */}
              {isLegendary && (
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-300/30 to-transparent animate-pulse" />
                  <div className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-ping" />
                </div>
              )}
            </div>
          </div>
          
          {/* レジェンダリードラゴン装飾 */}
          {isLegendary && (
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <div className="w-8 h-6 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">★</span>
              </div>
            </div>
          )}
        </div>

        {/* カード名プレート */}
        <div className="mx-2 mb-2">
          <div className="bg-gradient-to-r from-amber-200 to-amber-300 border-2 border-amber-500 rounded-lg p-2 shadow-inner">
            <h3 className={`${fontSizes[size].title} font-bold text-gray-800 text-center`} style={{
              fontFamily: 'Cinzel, serif',
              textShadow: '1px 1px 2px rgba(255,255,255,0.8)'
            }}>
              {card.title}
            </h3>
          </div>
        </div>

        {/* 効果テキスト */}
        <div className="mx-2 mb-4">
          <div className="bg-gradient-to-b from-yellow-50 to-yellow-100 border border-yellow-400 rounded-lg p-2 shadow-inner">
            <p className={`${fontSizes[size].effect} text-gray-800 leading-tight text-center`} style={{
              fontFamily: 'Crimson Text, serif'
            }}>
              <strong>戦吼:</strong> {card.effectText.substring(0, 50)}...
            </p>
          </div>
        </div>

        {/* 下部ステータス */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
          <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg">
            <span className={`${fontSizes[size].stats} font-black text-white drop-shadow-md`}>
              {Math.round(card.stats.attack / 100)}
            </span>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg">
            <span className={`${fontSizes[size].stats} font-black text-white drop-shadow-md`}>
              {Math.round(card.stats.defense / 100)}
            </span>
          </div>
        </div>

        {/* マナコスト（左上角） */}
        <div className="absolute -top-2 -left-2">
          <div className={`w-10 h-10 bg-gradient-to-br ${classInfo.gem} rounded-full border-3 border-white shadow-xl flex items-center justify-center`}>
            <span className={`${fontSizes[size].cost} font-black text-white drop-shadow-lg`}>
              {manaCost}
            </span>
          </div>
        </div>

        {/* レアリティジェム（右上角） */}
        <div className="absolute -top-2 -right-2">
          <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg ${
            card.rarity === 'UR' ? 'bg-gradient-to-br from-orange-400 to-red-500 animate-pulse' :
            card.rarity === 'SR' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
            card.rarity === 'R' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
            'bg-gradient-to-br from-gray-400 to-gray-600'
          }`}>
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {card.rarity === 'UR' ? '★' : card.rarity === 'SR' ? '◆' : card.rarity === 'R' ? '●' : '○'}
              </span>
            </div>
          </div>
        </div>

        {/* ホログラムと質感エフェクト */}
        {card.rarity !== 'N' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent animate-shimmer" />
            <div className="absolute inset-0 opacity-40" style={{
              backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.2) 0%, transparent 50%)'
            }} />
          </div>
        )}
      </div>
    </motion.div>
  );
};