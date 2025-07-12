import React from 'react';
import { motion } from 'framer-motion';
import { GameCard } from '../../types/cardgame';

interface DiaryCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// バージョン7: 次世代デジタルカード（未来的デザイン）
export const DiaryCardV7: React.FC<DiaryCardProps> = ({ card, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-[170px] h-[240px]',
    medium: 'w-[250px] h-[350px]',
    large: 'w-[340px] h-[476px]'
  };

  const fontSizes = {
    small: {
      title: 'text-[10px]',
      subtitle: 'text-[7px]',
      stats: 'text-[14px]',
      effect: 'text-[6px]',
      data: 'text-[5px]'
    },
    medium: {
      title: 'text-[14px]',
      subtitle: 'text-[9px]',
      stats: 'text-[20px]',
      effect: 'text-[8px]',
      data: 'text-[7px]'
    },
    large: {
      title: 'text-[19px]',
      subtitle: 'text-[12px]',
      stats: 'text-[28px]',
      effect: 'text-[11px]',
      data: 'text-[9px]'
    }
  };

  const getDigitalTheme = () => {
    const themes = [
      {
        primary: 'from-cyan-400 to-blue-500',
        secondary: 'from-cyan-50 to-blue-100',
        accent: 'cyan-400',
        glow: 'shadow-cyan-500/50',
        name: 'サイバー'
      },
      {
        primary: 'from-purple-400 to-pink-500',
        secondary: 'from-purple-50 to-pink-100',
        accent: 'purple-400',
        glow: 'shadow-purple-500/50',
        name: 'ネオン'
      },
      {
        primary: 'from-green-400 to-emerald-500',
        secondary: 'from-green-50 to-emerald-100',
        accent: 'green-400',
        glow: 'shadow-green-500/50',
        name: 'マトリックス'
      },
      {
        primary: 'from-orange-400 to-red-500',
        secondary: 'from-orange-50 to-red-100',
        accent: 'orange-400',
        glow: 'shadow-orange-500/50',
        name: 'ファイア'
      }
    ];
    return themes[Math.floor(Math.random() * themes.length)];
  };

  const theme = getDigitalTheme();
  const powerLevel = Math.round(card.totalScore * 50); // デジタルパワー
  const dataIntegrity = Math.round((card.stats.attack + card.stats.defense + card.stats.speed + card.stats.special) / 40);

  return (
    <motion.div
      className={`${sizeClasses[size]} relative`}
      whileHover={{ 
        scale: 1.08,
        rotateY: 12,
        rotateX: 5,
        z: 150
      }}
      whileTap={{ scale: 0.95 }}
      style={{ 
        perspective: '1500px',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* 外部エネルギーフィールド */}
      <div className={`absolute inset-[-4px] bg-gradient-to-br ${theme.primary} rounded-[16px] ${theme.glow} shadow-2xl animate-pulse`} />
      
      {/* ホログラム境界 */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-[12px] shadow-inner" />
      
      {/* デジタルグリッド背景 */}
      <div className="absolute inset-[2px] bg-black rounded-[10px] overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            linear-gradient(90deg, #${theme.accent.replace('-', '')} 1px, transparent 1px),
            linear-gradient(180deg, #${theme.accent.replace('-', '')} 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }} />
        
        {/* 走査線エフェクト */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent animate-scan" />
      </div>

      {/* メインコンテンツエリア */}
      <div className={`absolute inset-[4px] bg-gradient-to-b ${theme.secondary} rounded-[8px] overflow-hidden border border-gray-700`}>
        
        {/* ヘキサゴンパターン（レア以上） */}
        {card.rarity !== 'N' && (
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ffff' fill-opacity='0.1'%3E%3Cpolygon points='30,0 52,15 52,45 30,60 8,45 8,15'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '30px 30px'
            }} />
          </div>
        )}

        <div className="relative h-full flex flex-col p-[4%]">
          
          {/* デジタルヘッダー */}
          <div className="mb-[3%]">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-t-lg p-2 border-b-2 border-cyan-400">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`${fontSizes[size].title} font-bold text-white leading-none`} style={{
                    fontFamily: 'monospace',
                    letterSpacing: '0.1em',
                    textShadow: `0 0 10px cyan`
                  }}>
                    {card.title.toUpperCase()}
                  </h3>
                  <div className={`${fontSizes[size].subtitle} text-cyan-400 font-medium mt-1`}>
                    DIGITAL ART ENTITY • {theme.name}タイプ
                  </div>
                </div>
                <div className="text-right">
                  <div className={`${fontSizes[size].data} text-gray-400`}>PWR</div>
                  <div className={`${fontSizes[size].stats} font-bold text-cyan-400`} style={{
                    fontFamily: 'monospace',
                    textShadow: `0 0 8px currentColor`
                  }}>
                    {powerLevel}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* データビジュアライゼーション */}
          <div className="mb-[3%]">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg p-2 border border-gray-700">
              <div className="grid grid-cols-4 gap-1">
                <div className="text-center">
                  <div className={`${fontSizes[size].data} text-red-400`}>TEC</div>
                  <div className={`${fontSizes[size].subtitle} text-red-300 font-mono`}>
                    {(card.stats.attack / 10).toFixed(1)}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-red-400 h-1 rounded-full"
                      style={{ width: `${(card.stats.attack / 10) * 10}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className={`${fontSizes[size].data} text-blue-400`}>COM</div>
                  <div className={`${fontSizes[size].subtitle} text-blue-300 font-mono`}>
                    {(card.stats.defense / 10).toFixed(1)}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-400 h-1 rounded-full"
                      style={{ width: `${(card.stats.defense / 10) * 10}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className={`${fontSizes[size].data} text-green-400`}>CRE</div>
                  <div className={`${fontSizes[size].subtitle} text-green-300 font-mono`}>
                    {(card.stats.speed / 10).toFixed(1)}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-400 h-1 rounded-full"
                      style={{ width: `${(card.stats.speed / 10) * 10}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className={`${fontSizes[size].data} text-purple-400`}>ENG</div>
                  <div className={`${fontSizes[size].subtitle} text-purple-300 font-mono`}>
                    {(card.stats.special / 10).toFixed(1)}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-400 h-1 rounded-full"
                      style={{ width: `${(card.stats.special / 10) * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ホログラム画像エリア */}
          <div className="relative mb-[3%] flex-1">
            <div className="relative w-full h-full bg-gradient-to-br from-gray-800 to-black rounded-lg p-1 border border-gray-600">
              <div className="relative w-full h-full bg-black rounded-md overflow-hidden">
                <img 
                  src={card.imageUrl} 
                  alt={card.title}
                  className="w-full h-full object-cover"
                  style={{
                    filter: `
                      brightness(1.2) 
                      contrast(1.3) 
                      saturate(1.4) 
                      hue-rotate(${card.rarity === 'UR' ? '10deg' : '0deg'})
                    `
                  }}
                />
                
                {/* デジタル歪みエフェクト */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-400/20 to-transparent animate-glitch" />
                
                {/* スキャンライン */}
                <div className="absolute inset-0" style={{
                  backgroundImage: 'linear-gradient(90deg, transparent 98%, rgba(0,255,255,0.3) 100%)',
                  backgroundSize: '3px 100%',
                  animation: 'scan 2s linear infinite'
                }} />
                
                {/* レアリティインジケーター */}
                <div className="absolute top-2 right-2">
                  {card.rarity === 'UR' && (
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded p-1 animate-pulse">
                      <span className="text-black text-xs font-bold">ULTRA</span>
                    </div>
                  )}
                  {card.rarity === 'SR' && (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded p-1">
                      <span className="text-white text-xs font-bold">SUPER</span>
                    </div>
                  )}
                  {card.rarity === 'R' && (
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded p-1">
                      <span className="text-white text-xs font-bold">RARE</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* データログ */}
          <div className="mb-[2%]">
            <div className="bg-gradient-to-r from-gray-900 to-black rounded-lg p-2 border border-gray-700">
              <div className={`${fontSizes[size].data} text-cyan-400 font-bold mb-1`} style={{
                fontFamily: 'monospace'
              }}>
                &gt; SYSTEM.LOG
              </div>
              <p className={`${fontSizes[size].effect} text-gray-300 font-mono leading-tight`}>
                {card.effectText.substring(0, 80)}...
              </p>
              <div className={`${fontSizes[size].data} text-gray-500 mt-1`}>
                EXEC_TIME: {Math.random().toFixed(3)}ms | MEM: {dataIntegrity}%
              </div>
            </div>
          </div>

          {/* フッター情報 */}
          <div className="mt-auto">
            <div className="flex justify-between items-center bg-gradient-to-r from-gray-800 to-gray-900 rounded-b-lg p-1 border-t border-gray-600">
              <div className={`${fontSizes[size].data} text-gray-400 font-mono`}>
                ID: {card.id.substring(0, 8).toUpperCase()}
              </div>
              <div className={`${fontSizes[size].data} text-cyan-400 font-mono`}>
                INTEGRITY: {card.totalScore}%
              </div>
              <div className={`${fontSizes[size].data} text-gray-400 font-mono`}>
                v{card.level}.0.{card.rarity}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 最終エフェクトレイヤー */}
      {card.rarity === 'UR' && (
        <div className="absolute inset-0 pointer-events-none rounded-[12px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/10 via-transparent to-cyan-400/10 animate-pulse" />
          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-transparent via-white/10 to-transparent animate-ultra-shine" />
        </div>
      )}
    </motion.div>
  );
};