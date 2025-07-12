import React from 'react';
import { motion } from 'framer-motion';
import { GameCard } from '../../types/cardgame';

interface DiaryCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// バージョン3: 超リアル遊戯王カード風
export const DiaryCardV3: React.FC<DiaryCardProps> = ({ card, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-[170px] h-[250px]',
    medium: 'w-[250px] h-[363px]',
    large: 'w-[340px] h-[500px]'
  };

  const fontSizes = {
    small: {
      title: 'text-[11px]',
      type: 'text-[7px]',
      stats: 'text-[14px]',
      effect: 'text-[6px]',
      serial: 'text-[6px]'
    },
    medium: {
      title: 'text-[15px]',
      type: 'text-[9px]',
      stats: 'text-[20px]',
      effect: 'text-[8px]',
      serial: 'text-[7px]'
    },
    large: {
      title: 'text-[20px]',
      type: 'text-xs',
      stats: 'text-[26px]',
      effect: 'text-[11px]',
      serial: 'text-[9px]'
    }
  };

  const getCardBackground = () => {
    switch (card.rarity) {
      case 'UR':
        return 'bg-gradient-to-b from-orange-50 via-yellow-50 to-orange-50';
      case 'SR':
        return 'bg-gradient-to-b from-purple-50 via-pink-50 to-purple-50';
      case 'R':
        return 'bg-gradient-to-b from-blue-50 via-sky-50 to-blue-50';
      default:
        return 'bg-gradient-to-b from-gray-50 via-white to-gray-50';
    }
  };

  const getAttributeSymbol = () => {
    const symbols = ['光', '闇', '炎', '水', '風', '地'];
    return symbols[Math.floor(Math.random() * symbols.length)];
  };

  const getAttributeColor = () => {
    const colors = [
      'from-yellow-300 to-yellow-500',
      'from-purple-700 to-purple-900',
      'from-red-500 to-red-700',
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-amber-600 to-amber-800'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} relative`}
      whileHover={{ scale: 1.03, rotateY: 8, z: 50 }}
      whileTap={{ scale: 0.97 }}
      style={{ 
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* 最外枠 - 金属質感 */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-100 to-gray-300 rounded-[4px] shadow-2xl" />
      
      {/* 中枠 - カラー枠 */}
      <div className={`absolute inset-[3px] bg-gradient-to-br ${
        card.rarity === 'UR' ? 'from-yellow-400 via-yellow-500 to-orange-400' :
        card.rarity === 'SR' ? 'from-purple-500 to-purple-700' :
        card.rarity === 'R' ? 'from-blue-500 to-blue-700' :
        'from-gray-500 to-gray-700'
      } rounded-[3px]`} />
      
      {/* 内枠 - 黒枠 */}
      <div className="absolute inset-[7px] bg-black rounded-[2px]" />
      
      {/* カード本体 */}
      <div className={`absolute inset-[9px] ${getCardBackground()} rounded-[2px] overflow-hidden`}>
        
        {/* ホログラムパターン（レア以上） */}
        {card.rarity !== 'N' && (
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent animate-shimmer" />
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`,
            }} />
          </div>
        )}

        {/* コンテンツエリア */}
        <div className="relative h-full flex flex-col p-[6%]">
          
          {/* カード名エリア */}
          <div className="flex justify-between items-start mb-[2%]">
            <h3 className={`${fontSizes[size].title} font-bold text-black leading-none flex-1 mr-2`} style={{
              fontFamily: 'Yu Gothic, sans-serif',
              letterSpacing: '-0.05em'
            }}>
              {card.title}
            </h3>
            
            {/* 属性アイコン */}
            <div className={`bg-gradient-to-br ${getAttributeColor()} rounded-full flex items-center justify-center shadow-lg`} style={{
              width: size === 'large' ? '28px' : size === 'medium' ? '22px' : '16px',
              height: size === 'large' ? '28px' : size === 'medium' ? '22px' : '16px',
            }}>
              <span className="text-white font-bold" style={{
                fontSize: size === 'large' ? '14px' : size === 'medium' ? '11px' : '8px'
              }}>
                {getAttributeSymbol()}
              </span>
            </div>
          </div>

          {/* レベル星 */}
          <div className="flex justify-end mb-[2%]">
            {[...Array(card.level)].map((_, i) => (
              <span key={i} className="text-orange-500" style={{
                fontSize: size === 'large' ? '20px' : size === 'medium' ? '16px' : '12px',
                textShadow: '1px 1px 1px rgba(0,0,0,0.3)'
              }}>★</span>
            ))}
          </div>

          {/* 画像枠 */}
          <div className="relative mb-[3%]" style={{ paddingBottom: '95%' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black p-[2px] shadow-inner">
              <div className="relative w-full h-full overflow-hidden bg-black">
                <img 
                  src={card.imageUrl} 
                  alt={card.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* 画像上のホログラム効果 */}
                {card.rarity === 'UR' && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-300/20 to-transparent animate-shine" />
                )}
              </div>
            </div>
          </div>

          {/* カードタイプバー */}
          <div className="bg-gradient-to-r from-red-800 via-red-700 to-red-800 text-white text-center py-[1.5%] mb-[3%] shadow-md">
            <span className={`${fontSizes[size].type} font-bold tracking-wider`} style={{
              fontFamily: 'Arial, sans-serif',
              textShadow: '1px 1px 1px rgba(0,0,0,0.5)'
            }}>
              【AI日記/効果】
            </span>
          </div>

          {/* 効果テキストエリア */}
          <div className="flex-1 bg-gradient-to-b from-amber-50 to-amber-100 border border-amber-700 p-[4%] shadow-inner mb-[3%]">
            <p className={`${fontSizes[size].effect} text-black leading-tight`} style={{
              fontFamily: 'Yu Mincho, serif'
            }}>
              {card.attribute.length > 0 && (
                <>【{card.attribute[0]}族/効果】<br/></>
              )}
              {card.effectText}
            </p>
          </div>

          {/* ATK/DEF */}
          <div className="flex justify-between items-end">
            {/* シリアルナンバー */}
            <div className={`${fontSizes[size].serial} text-gray-700`}>
              <div style={{ fontFamily: 'monospace' }}>JPD-JP001</div>
              <div className="font-bold">{card.rarity} 1st Edition</div>
            </div>
            
            {/* ATK/DEF値 */}
            <div className="flex gap-4">
              <div className="text-right">
                <div className={`${fontSizes[size].type} text-black font-bold`}>ATK</div>
                <div className={`${fontSizes[size].stats} text-black font-bold leading-none`}>{card.stats.attack}</div>
              </div>
              <div className="text-right">
                <div className={`${fontSizes[size].type} text-black font-bold`}>DEF</div>
                <div className={`${fontSizes[size].stats} text-black font-bold leading-none`}>{card.stats.defense}</div>
              </div>
            </div>
          </div>

          {/* コピーライト */}
          <div className={`${fontSizes[size].serial} text-gray-600 text-center mt-[2%]`} style={{
            fontSize: '6px'
          }}>
            ©2024 AI-DIARY
          </div>
        </div>
      </div>

      {/* 最終的なキラキラエフェクト（UR限定） */}
      {card.rarity === 'UR' && (
        <div className="absolute inset-0 pointer-events-none rounded-[4px] overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute -top-full -left-full w-[200%] h-[200%] bg-gradient-to-br from-transparent via-white/30 to-transparent animate-shine" />
          </div>
        </div>
      )}
    </motion.div>
  );
};