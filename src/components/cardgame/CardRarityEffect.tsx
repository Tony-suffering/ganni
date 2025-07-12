import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CardRarityEffectProps {
  rarity: 'N' | 'R' | 'SR' | 'UR';
  width: number;
  height: number;
  isActive?: boolean;
}

export const CardRarityEffect: React.FC<CardRarityEffectProps> = ({
  rarity,
  width,
  height,
  isActive = false // デフォルトでエフェクトを無効化
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // レア度に応じたエフェクト設定
  const getEffectConfig = () => {
    switch (rarity) {
      case 'UR':
        return {
          particleCount: 20,
          particleColor: '#FFD700', // ゴールド
          glowColor: 'rgba(255, 215, 0, 0.6)',
          animationDuration: 3,
          showHolographic: true
        };
      case 'SR':
        return {
          particleCount: 12,
          particleColor: '#C0C0C0', // シルバー
          glowColor: 'rgba(192, 192, 192, 0.5)',
          animationDuration: 4,
          showHolographic: false
        };
      case 'R':
        return {
          particleCount: 6,
          particleColor: '#4169E1', // ロイヤルブルー
          glowColor: 'rgba(65, 105, 225, 0.4)',
          animationDuration: 5,
          showHolographic: false
        };
      default:
        return null;
    }
  };

  const config = getEffectConfig();

  // パーティクル生成
  useEffect(() => {
    if (!config || !isActive) return;

    const interval = setInterval(() => {
      const newParticle = {
        id: Date.now() + Math.random(),
        x: Math.random() * width,
        y: Math.random() * height
      };
      setParticles(prev => [...prev.slice(-config.particleCount + 1), newParticle]);
    }, 300);

    return () => clearInterval(interval);
  }, [config, width, height, isActive]);

  if (!config || !isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* グロー効果 */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: config.animationDuration,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: `radial-gradient(circle at center, ${config.glowColor}, transparent 70%)`,
          filter: 'blur(20px)'
        }}
      />

      {/* ホログラフィック効果（URのみ） */}
      {config.showHolographic && (
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
              'linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.1) 70%, transparent 90%)',
              'linear-gradient(45deg, transparent 10%, rgba(255,255,255,0.1) 30%, transparent 50%)'
            ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}

      {/* パーティクルエフェクト */}
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute"
            initial={{
              x: particle.x,
              y: particle.y,
              scale: 0,
              opacity: 1
            }}
            animate={{
              y: particle.y - 100,
              scale: [0, 1.5, 0],
              opacity: [1, 1, 0]
            }}
            exit={{
              opacity: 0
            }}
            transition={{
              duration: 2,
              ease: "easeOut"
            }}
            style={{
              left: 0,
              top: 0
            }}
          >
            <div
              className="rounded-full"
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: config.particleColor,
                boxShadow: `0 0 10px ${config.particleColor}`,
                filter: 'blur(1px)'
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 枠の輝き（SR以上） */}
      {(rarity === 'SR' || rarity === 'UR') && (
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            border: `2px solid ${config.particleColor}`,
            borderRadius: '4px',
            boxShadow: `0 0 20px ${config.particleColor}, inset 0 0 20px ${config.particleColor}`,
            filter: 'blur(1px)'
          }}
        />
      )}
    </div>
  );
};