import React from 'react';
import { GameCard } from '../../types/cardgame';

interface DiaryCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V13: ネオン・サイバーパンク（未来的デザイン）
export const DiaryCardV13: React.FC<DiaryCardProps> = ({ card, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-[140px] h-[196px]',
    medium: 'w-[200px] h-[280px]',
    large: 'w-[280px] h-[392px]'
  };

  const rarityGlow = {
    UR: { color: '#00FFFF', shadow: '0 0 20px #00FFFF40, 0 0 40px #00FFFF20' },
    SR: { color: '#FF00FF', shadow: '0 0 20px #FF00FF40, 0 0 40px #FF00FF20' },
    R: { color: '#00FF00', shadow: '0 0 20px #00FF0040, 0 0 40px #00FF0020' },
    N: { color: '#FFFFFF', shadow: '0 0 20px #FFFFFF20, 0 0 40px #FFFFFF10' }
  };

  const rarity = rarityGlow[card.rarity as keyof typeof rarityGlow];

  return (
    <div className={`${sizeClasses[size]} relative bg-gray-900 overflow-hidden border border-gray-800`}
         style={{ 
           borderRadius: '8px',
           boxShadow: `${rarity.shadow}, 0 8px 32px rgba(0,0,0,0.6)`,
           background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
         }}>
      
      {/* 上部ネオンライン */}
      <div className="h-0.5" 
           style={{ 
             background: `linear-gradient(90deg, transparent, ${rarity.color}, transparent)`,
             boxShadow: `0 0 10px ${rarity.color}60`
           }}>
      </div>
      
      {/* ヘッダーマトリックス */}
      <div className="p-3 border-b border-gray-800 relative overflow-hidden">
        {/* 背景グリッド */}
        <div className="absolute inset-0 opacity-10"
             style={{
               backgroundImage: `linear-gradient(${rarity.color}30 1px, transparent 1px), linear-gradient(90deg, ${rarity.color}30 1px, transparent 1px)`,
               backgroundSize: '8px 8px'
             }}>
        </div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gray-800 border-2 rounded-lg flex items-center justify-center"
                   style={{ 
                     borderColor: rarity.color,
                     boxShadow: `inset 0 0 10px ${rarity.color}30`
                   }}>
                <span className="text-lg font-black font-mono" style={{ color: rarity.color }}>
                  {card.level}
                </span>
              </div>
              {/* コーナー装飾 */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2"
                   style={{ borderColor: rarity.color }}>
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2"
                   style={{ borderColor: rarity.color }}>
              </div>
            </div>
            <div>
              <div className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                ENERGY_LVL
              </div>
              <div className="text-xs font-mono" style={{ color: rarity.color }}>
                {String(card.level).padStart(2, '0')}.exe
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">
              RARITY_CLASS
            </div>
            <div className="inline-flex items-center px-2 py-1 bg-gray-800 border rounded font-mono text-xs"
                 style={{ 
                   borderColor: rarity.color,
                   color: rarity.color,
                   textShadow: `0 0 5px ${rarity.color}60`
                 }}>
              [{card.rarity}]
            </div>
          </div>
        </div>
      </div>

      {/* ホログラム画像エリア */}
      <div className="mx-3 my-3 relative">
        <div className="aspect-[4/3] rounded bg-gray-800 border border-gray-700 overflow-hidden relative"
             style={{ boxShadow: `inset 0 0 20px ${rarity.color}20` }}>
          <img 
            src={card.imageUrl} 
            alt={card.title}
            className="w-full h-full object-cover"
            style={{ 
              filter: `contrast(1.2) saturate(1.3) hue-rotate(${card.rarity === 'UR' ? '10deg' : card.rarity === 'SR' ? '280deg' : card.rarity === 'R' ? '120deg' : '0deg'})`
            }}
          />
          
          {/* ホログラム効果 */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
          
          {/* スキャンライン */}
          <div className="absolute inset-0 pointer-events-none"
               style={{
                 background: `repeating-linear-gradient(90deg, transparent, transparent 2px, ${rarity.color}08 2px, ${rarity.color}08 4px)`
               }}>
          </div>
          
          {/* コーナーマーカー */}
          <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2" style={{ borderColor: rarity.color }}></div>
          <div className="absolute top-1 right-1 w-3 h-3 border-r-2 border-t-2" style={{ borderColor: rarity.color }}></div>
          <div className="absolute bottom-1 left-1 w-3 h-3 border-l-2 border-b-2" style={{ borderColor: rarity.color }}></div>
          <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2" style={{ borderColor: rarity.color }}></div>
        </div>
      </div>

      {/* データエリア */}
      <div className="px-3 pb-3 text-white">
        {/* タイトル */}
        <div className="text-center mb-3 p-2 bg-gray-800/50 rounded border border-gray-700">
          <h3 className="text-sm font-bold font-mono leading-tight mb-1"
              style={{ 
                color: rarity.color,
                textShadow: `0 0 5px ${rarity.color}40`,
                fontFamily: 'monospace'
              }}>
            {card.title.toUpperCase()}
          </h3>
          <div className="text-xs text-gray-400 font-mono">
            &gt; DIGITAL_ASSET.{card.attribute[0]?.toUpperCase() || 'ART'}
          </div>
        </div>

        {/* システム情報 */}
        <div className="mb-3 p-2 bg-gray-900/70 rounded border border-gray-700">
          <div className="text-xs font-mono text-gray-400 mb-1">SYSTEM_LOG:</div>
          <p className="text-xs font-mono leading-relaxed text-gray-300">
            {card.effectText.length > 70 ? card.effectText.substring(0, 70) + '...' : card.effectText}
          </p>
        </div>

        {/* ステータス表示 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-800/70 border border-gray-700 rounded p-2 text-center">
            <div className="text-xs font-mono text-gray-400 mb-1">PWR_LVL</div>
            <div className="text-lg font-black font-mono" 
                 style={{ 
                   color: '#FF4444',
                   textShadow: '0 0 5px #FF444460'
                 }}>
              {Math.round(card.stats.attack / 100)}
            </div>
          </div>
          <div className="bg-gray-800/70 border border-gray-700 rounded p-2 text-center">
            <div className="text-xs font-mono text-gray-400 mb-1">DEF_LVL</div>
            <div className="text-lg font-black font-mono"
                 style={{ 
                   color: '#4444FF',
                   textShadow: '0 0 5px #4444FF60'
                 }}>
              {Math.round(card.stats.defense / 100)}
            </div>
          </div>
        </div>
      </div>

      {/* 底部ネオンライン */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5"
           style={{ 
             background: `linear-gradient(90deg, transparent, ${rarity.color}, transparent)`,
             boxShadow: `0 0 10px ${rarity.color}60`
           }}>
      </div>
    </div>
  );
};