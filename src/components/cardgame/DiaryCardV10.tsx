import React from 'react';
import { motion } from 'framer-motion';
import { GameCard } from '../../types/cardgame';

interface DiaryCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V10: 参考画像完全再現版（最高峰）
export const DiaryCardV10: React.FC<DiaryCardProps> = ({ card, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-[140px] h-[196px]',
    medium: 'w-[200px] h-[280px]',
    large: 'w-[280px] h-[392px]'
  };

  const fontSizes = {
    small: {
      cost: 'text-[20px]',
      title: 'text-[9px]',
      type: 'text-[6px]',
      effect: 'text-[5px]',
      rarity: 'text-[10px]'
    },
    medium: {
      cost: 'text-[28px]',
      title: 'text-[13px]',
      type: 'text-[9px]',
      effect: 'text-[7px]',
      rarity: 'text-[14px]'
    },
    large: {
      cost: 'text-[36px]',
      title: 'text-[17px]',
      type: 'text-[12px]',
      effect: 'text-[10px]',
      rarity: 'text-[18px]'
    }
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} relative`}
      whileHover={{ 
        scale: 1.08, 
        rotateY: 12,
        rotateX: 8,
        z: 200
      }}
      whileTap={{ scale: 0.92 }}
      style={{ 
        perspective: '2000px',
        aspectRatio: '5/7'
      }}
    >
      {/* 最外枠（シルバーフレーム） */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-200 to-gray-400 rounded-[6px] shadow-2xl" />
      
      {/* レアリティボーダー */}
      <div className={`absolute inset-[1px] rounded-[5px] ${
        card.rarity === 'UR' ? 'bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500' :
        card.rarity === 'SR' ? 'bg-gradient-to-br from-purple-400 via-pink-400 to-purple-600' :
        card.rarity === 'R' ? 'bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-600' :
        'bg-gradient-to-br from-gray-500 via-gray-400 to-gray-600'
      }`} />
      
      {/* 内枠 */}
      <div className="absolute inset-[2px] bg-black rounded-[4px]" />
      
      {/* フルアート画像 */}
      <div className="absolute inset-[3px] rounded-[3px] overflow-hidden">
        <img 
          src={card.imageUrl} 
          alt={card.title}
          className="w-full h-full object-cover"
          style={{
            filter: 'brightness(1.1) contrast(1.08) saturate(1.15)'
          }}
        />
        
        {/* コストシンボル（完全再現） */}
        <div className="absolute top-1 left-1">
          <div className="relative">
            <div className="w-7 h-7 bg-gradient-to-br from-gray-200 via-white to-gray-300 rounded-full border border-gray-400 shadow-lg flex items-center justify-center">
              <span className={`${fontSizes[size].cost} font-black text-gray-800`} style={{
                fontFamily: 'Arial Black, sans-serif',
                textShadow: '0 1px 1px rgba(0,0,0,0.3)'
              }}>
                {card.level}
              </span>
            </div>
            {/* コストシンボル装飾 */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border border-white shadow-md" />
          </div>
        </div>

        {/* 効果テキストエリア（参考画像通り） */}
        <div className="absolute top-[35%] left-1 right-1">
          <div className="bg-black/80 backdrop-blur-sm rounded-sm p-2 border border-white/30 shadow-lg">
            <p className={`${fontSizes[size].effect} text-white leading-tight`} style={{
              fontFamily: 'Yu Mincho, serif',
              lineHeight: '1.2'
            }}>
              このカードが場に出た時、自分の{card.attribute[0] || 'アート'}トークンを1枚
              手札に加える。ターン終了時、相手に{Math.round(card.stats.attack/100)}ダメージ。
              「{card.title}」は{Math.round(card.totalScore/10)}の威力を持つ。
            </p>
          </div>
        </div>

        {/* 下部情報バー（参考画像完全再現） */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="bg-gradient-to-r from-green-700 via-green-600 to-green-700 px-2 py-2 flex justify-between items-center">
            <div className="flex-1">
              <h3 className={`${fontSizes[size].title} font-bold text-white leading-none mb-0.5`} style={{
                fontFamily: 'Yu Gothic, sans-serif',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>
                {card.title}
              </h3>
              <div className="flex items-center space-x-2">
                <span className={`${fontSizes[size].type} text-white/90 bg-green-800/50 px-1 py-0.5 rounded text-center`}>
                  Amulet
                </span>
                <span className={`${fontSizes[size].type} text-white/90`}>
                  妖精 • {card.attribute[0] || 'プリンセス'}
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-sm px-2 py-1 border border-white/50 shadow-lg">
              <span className={`${fontSizes[size].rarity} font-black text-white drop-shadow-lg`}>
                {card.rarity}
              </span>
            </div>
          </div>
        </div>

        {/* ホログラム効果（最高品質） */}
        {card.rarity !== 'N' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shimmer" />
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0%, transparent 50%),
                linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.15) 49%, rgba(255,255,255,0.15) 51%, transparent 52%)
              `,
              animation: 'hologram 6s ease-in-out infinite'
            }} />
          </div>
        )}

        {/* URカード専用エフェクト */}
        {card.rarity === 'UR' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-400/10 to-transparent animate-pulse" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
            <div className="absolute bottom-8 left-2 w-1 h-1 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
          </div>
        )}

        {/* フレームグロー */}
        <div className={`absolute inset-0 rounded-[3px] ${
          card.rarity === 'UR' ? 'shadow-[inset_0_0_20px_rgba(255,215,0,0.3)]' :
          card.rarity === 'SR' ? 'shadow-[inset_0_0_15px_rgba(147,51,234,0.3)]' :
          card.rarity === 'R' ? 'shadow-[inset_0_0_10px_rgba(59,130,246,0.3)]' :
          'shadow-[inset_0_0_5px_rgba(107,114,128,0.3)]'
        } pointer-events-none`} />
      </div>
    </motion.div>
  );
};