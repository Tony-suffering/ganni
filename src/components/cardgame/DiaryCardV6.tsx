import React from 'react';
import { motion } from 'framer-motion';
import { GameCard } from '../../types/cardgame';

interface DiaryCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// バージョン6: 超高品質ポケモン風（プロ仕様）
export const DiaryCardV6: React.FC<DiaryCardProps> = ({ card, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-[170px] h-[240px]',
    medium: 'w-[250px] h-[350px]',
    large: 'w-[340px] h-[476px]'
  };

  const fontSizes = {
    small: {
      title: 'text-[11px]',
      hp: 'text-[14px]',
      type: 'text-[7px]',
      attack: 'text-[10px]',
      damage: 'text-[16px]',
      effect: 'text-[6px]',
      weakness: 'text-[5px]'
    },
    medium: {
      title: 'text-[15px]',
      hp: 'text-[20px]',
      type: 'text-[9px]',
      attack: 'text-[13px]',
      damage: 'text-[22px]',
      effect: 'text-[8px]',
      weakness: 'text-[7px]'
    },
    large: {
      title: 'text-[20px]',
      hp: 'text-[28px]',
      type: 'text-[12px]',
      attack: 'text-[18px]',
      damage: 'text-[30px]',
      effect: 'text-[11px]',
      weakness: 'text-[9px]'
    }
  };

  const getTypeInfo = () => {
    const types = [
      { 
        name: '火', 
        gradient: 'from-red-400 via-orange-400 to-yellow-400',
        bg: 'from-red-50 via-orange-50 to-yellow-50',
        shadow: 'shadow-red-500/30',
        border: 'border-red-300',
        weakness: '水'
      },
      { 
        name: '水', 
        gradient: 'from-blue-400 via-cyan-400 to-blue-500',
        bg: 'from-blue-50 via-cyan-50 to-blue-100',
        shadow: 'shadow-blue-500/30',
        border: 'border-blue-300',
        weakness: '雷'
      },
      { 
        name: '雷', 
        gradient: 'from-yellow-300 via-yellow-400 to-orange-400',
        bg: 'from-yellow-50 via-yellow-100 to-orange-50',
        shadow: 'shadow-yellow-500/30',
        border: 'border-yellow-300',
        weakness: '地'
      },
      { 
        name: '草', 
        gradient: 'from-green-400 via-emerald-400 to-green-500',
        bg: 'from-green-50 via-emerald-50 to-green-100',
        shadow: 'shadow-green-500/30',
        border: 'border-green-300',
        weakness: '火'
      },
      { 
        name: '超', 
        gradient: 'from-purple-400 via-pink-400 to-purple-500',
        bg: 'from-purple-50 via-pink-50 to-purple-100',
        shadow: 'shadow-purple-500/30',
        border: 'border-purple-300',
        weakness: '悪'
      }
    ];
    return types[Math.floor(Math.random() * types.length)];
  };

  const typeInfo = getTypeInfo();
  const hp = Math.round(card.totalScore * 1.2);
  const evolutionStage = card.level <= 3 ? 'たね' : card.level <= 6 ? '1進化' : '2進化';

  return (
    <motion.div
      className={`${sizeClasses[size]} relative`}
      whileHover={{ 
        scale: 1.05, 
        rotateY: 8,
        rotateX: 2,
        z: 100
      }}
      whileTap={{ scale: 0.98 }}
      style={{ 
        perspective: '1200px',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* カード外枠 - 立体感のある金属フレーム */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-100 to-gray-300 rounded-[12px] shadow-2xl" />
      
      {/* レアリティボーダー */}
      <div className={`absolute inset-[2px] bg-gradient-to-br ${
        card.rarity === 'UR' ? 'from-yellow-400 via-orange-400 to-red-400' :
        card.rarity === 'SR' ? 'from-purple-400 via-pink-400 to-purple-500' :
        card.rarity === 'R' ? 'from-blue-400 via-cyan-400 to-blue-500' :
        'from-gray-400 to-gray-500'
      } rounded-[11px] ${card.rarity !== 'N' ? 'animate-pulse' : ''}`} />
      
      {/* 内枠 */}
      <div className="absolute inset-[6px] bg-gray-800 rounded-[8px]" />
      
      {/* カード本体 */}
      <div className={`absolute inset-[8px] bg-gradient-to-b ${typeInfo.bg} rounded-[6px] overflow-hidden`}>
        
        {/* ホログラム効果（レア以上） */}
        {card.rarity !== 'N' && (
          <div className="absolute inset-0 opacity-40">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent animate-shimmer" />
            <div className="absolute inset-0" style={{
              backgroundImage: `
                radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%),
                linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.1) 49%, rgba(255,255,255,0.1) 51%, transparent 52%)
              `,
            }} />
          </div>
        )}

        <div className="relative h-full flex flex-col p-[3%]">
          
          {/* 上部ヘッダー */}
          <div className="flex justify-between items-start mb-[2%]">
            {/* カード名とステージ */}
            <div className="flex-1">
              <h3 className={`${fontSizes[size].title} font-bold text-gray-800 leading-none mb-[2px]`} style={{
                fontFamily: 'Yu Gothic, Hiragino Sans, sans-serif',
                letterSpacing: '-0.02em',
                textShadow: '0 1px 2px rgba(255,255,255,0.8)'
              }}>
                {card.title}
              </h3>
              <div className={`${fontSizes[size].type} text-gray-600 font-medium`}>
                {evolutionStage}ポケモン
              </div>
            </div>
            
            {/* HP表示 */}
            <div className="flex items-center">
              <span className={`${fontSizes[size].type} text-gray-700 font-bold mr-1`}>HP</span>
              <span className={`${fontSizes[size].hp} font-bold text-red-600`} style={{
                fontFamily: 'Arial Black, sans-serif',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
              }}>{hp}</span>
            </div>
          </div>

          {/* タイプシンボル */}
          <div className="flex justify-end mb-[2%]">
            <div className={`w-8 h-8 bg-gradient-to-br ${typeInfo.gradient} rounded-full flex items-center justify-center ${typeInfo.shadow} border-2 border-white shadow-lg`}>
              <span className="text-white font-bold text-sm drop-shadow-md">
                {typeInfo.name}
              </span>
            </div>
          </div>

          {/* メイン画像エリア */}
          <div className="relative mb-[3%]" style={{ paddingBottom: '65%' }}>
            <div className={`absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg p-[2px] ${typeInfo.shadow} shadow-lg`}>
              <div className="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-md overflow-hidden">
                <img 
                  src={card.imageUrl} 
                  alt={card.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    filter: card.rarity === 'UR' ? 'brightness(1.1) contrast(1.05) saturate(1.1)' : 'none'
                  }}
                />
                
                {/* 画像上のホログラム効果 */}
                {card.rarity === 'UR' && (
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-300/20 to-transparent animate-shine" />
                    <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse shadow-lg" />
                  </div>
                )}
                
                {/* レアリティマーク */}
                <div className="absolute bottom-2 right-2">
                  {card.rarity === 'UR' && (
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-1 shadow-lg">
                      <span className="text-white text-xs font-bold">★★★</span>
                    </div>
                  )}
                  {card.rarity === 'SR' && (
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-1 shadow-lg">
                      <span className="text-white text-xs font-bold">★★</span>
                    </div>
                  )}
                  {card.rarity === 'R' && (
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full p-1 shadow-lg">
                      <span className="text-white text-xs font-bold">★</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* スペシャル能力セクション */}
          <div className="mb-[3%]">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-2 border border-gray-300 shadow-inner">
              <div className={`${fontSizes[size].type} text-gray-700 font-bold mb-1`}>
                【特性】アートインスピレーション
              </div>
              <p className={`${fontSizes[size].effect} text-gray-700 leading-tight`} style={{
                fontFamily: 'Yu Mincho, serif'
              }}>
                このポケモンがベンチにいる限り、自分の番に1回、山札から「{card.attribute[0] || 'アート'}」ポケモンを1枚手札に加えることができる。
              </p>
            </div>
          </div>

          {/* 攻撃技 */}
          <div className="mb-[3%]">
            <div className="border-t-2 border-gray-300 pt-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <div className={`w-4 h-4 bg-gradient-to-br ${typeInfo.gradient} rounded-full mr-1`} />
                  <div className={`w-4 h-4 bg-gradient-to-br ${typeInfo.gradient} rounded-full mr-2`} />
                  <span className={`${fontSizes[size].attack} font-bold text-gray-800`}>
                    フォトブラスト
                  </span>
                </div>
                <span className={`${fontSizes[size].damage} font-bold text-gray-800`} style={{
                  fontFamily: 'Arial Black, sans-serif'
                }}>
                  {Math.round(card.stats.attack / 10) * 10}
                </span>
              </div>
              <p className={`${fontSizes[size].effect} text-gray-700 leading-tight pl-10`}>
                {card.effectText.substring(0, 60)}...
              </p>
            </div>
          </div>

          {/* 下部情報 */}
          <div className="mt-auto">
            <div className="flex justify-between items-end">
              {/* 弱点・抵抗力 */}
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className={`${fontSizes[size].weakness} text-gray-600`}>弱点</div>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full`} />
                    <span className={`${fontSizes[size].weakness} text-gray-700 ml-1`}>×2</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`${fontSizes[size].weakness} text-gray-600`}>抵抗力</div>
                  <div className={`${fontSizes[size].weakness} text-gray-700`}>-20</div>
                </div>
                <div className="text-center">
                  <div className={`${fontSizes[size].weakness} text-gray-600`}>逃げる</div>
                  <div className="flex">
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full ml-0.5" />
                  </div>
                </div>
              </div>
              
              {/* スコア情報 */}
              <div className="text-right">
                <div className={`${fontSizes[size].weakness} text-gray-500`}>
                  総合: {card.totalScore}pt
                </div>
                <div className={`${fontSizes[size].weakness} text-gray-500`}>
                  {card.rarity} • No.{card.level.toString().padStart(3, '0')}
                </div>
              </div>
            </div>
          </div>

          {/* 最下部のコピーライト */}
          <div className={`${fontSizes[size].weakness} text-gray-400 text-center mt-1`} style={{ fontSize: '6px' }}>
            ©2024 AI-DIARY Project. All rights reserved.
          </div>
        </div>
      </div>

      {/* 最終的なプレミアムエフェクト */}
      {card.rarity === 'UR' && (
        <div className="absolute inset-0 pointer-events-none rounded-[12px] overflow-hidden">
          <div className="absolute -top-full -left-full w-[300%] h-[300%] bg-gradient-to-br from-transparent via-white/20 to-transparent animate-shine" />
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/10 via-transparent to-orange-400/10 animate-pulse" />
        </div>
      )}
    </motion.div>
  );
};