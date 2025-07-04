import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';

interface MobilePointsDisplayProps {
  currentPoints: number;
  level: number;
  levelName: string;
  previousPoints?: number;
  variant?: 'compact' | 'inline' | 'navbar';
}

interface Particle {
  id: number;
  x: number;
  y: number;
}

export const MobilePointsDisplay: React.FC<MobilePointsDisplayProps> = ({
  currentPoints,
  level,
  levelName,
  previousPoints,
  variant = 'compact'
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [displayPoints, setDisplayPoints] = useState(currentPoints);
  const prevPointsRef = useRef(currentPoints);

  // ポイント変化を検知してアニメーションを開始
  useEffect(() => {
    console.log('📱 MobilePointsDisplay - ポイント変化チェック:', {
      currentPoints,
      previousPoints,
      isIncrease: previousPoints !== undefined && previousPoints < currentPoints,
      isDifferent: previousPoints !== currentPoints,
      variant
    });
    
    // 前回のポイントが設定されており、かつ現在のポイントより小さい場合（増加）
    if (previousPoints !== undefined && previousPoints !== currentPoints && previousPoints < currentPoints) {
      // ポイントが増加した場合
      console.log('✨ モバイルアニメーション開始！ 増加分:', currentPoints - previousPoints, 'variant:', variant);
      setIsAnimating(true);
      
      // パーティクルを生成（モバイル向けに少なめ）
      const newParticles: Particle[] = [];
      const particleCount = Math.min(6, currentPoints - previousPoints);
      
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: Date.now() + i,
          x: Math.random() * 40 - 20, // モバイル向けに範囲を狭く
          y: Math.random() * 40 - 20
        });
      }
      
      setParticles(newParticles);
      
      // アニメーション終了後にリセット
      setTimeout(() => {
        setIsAnimating(false);
        setParticles([]);
      }, 1200); // モバイル向けに少し短く
    }
    
    prevPointsRef.current = currentPoints;
    setDisplayPoints(currentPoints);
  }, [currentPoints, previousPoints]);

  // ナビゲーションバー用のコンパクト表示
  if (variant === 'navbar') {
    return (
      <div className="relative flex items-center justify-center">
        {/* ポイント表示 */}
        <div className="flex flex-col items-center">
          <motion.div
            animate={isAnimating ? {
              scale: [1, 1.3, 1],
              color: ['#374151', '#FCD34D', '#374151']
            } : {}}
            transition={{ duration: 0.5 }}
            className="text-xs font-bold text-gray-700 dark:text-gray-300"
          >
            <CountUp
              start={previousPoints || currentPoints}
              end={currentPoints}
              duration={0.8}
              separator=","
              preserveValue
            />
          </motion.div>
          <span className="text-xs text-gray-500 dark:text-gray-400">pt</span>
        </div>
        
        {/* パーティクルエフェクト */}
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute pointer-events-none"
              initial={{ 
                opacity: 1, 
                scale: 0,
                x: 0,
                y: 0
              }}
              animate={{ 
                opacity: 0, 
                scale: 1.2,
                x: particle.x,
                y: particle.y - 25
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="text-yellow-400 text-sm">⭐</span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* 波紋エフェクト */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              className="absolute inset-0 rounded-full bg-yellow-400"
              initial={{ scale: 0.5, opacity: 0.3 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{ transformOrigin: 'center' }}
            />
          )}
        </AnimatePresence>
        
        {/* ポイント増加通知 */}
        <AnimatePresence>
          {isAnimating && previousPoints !== undefined && (
            <motion.div
              className="absolute -top-6 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                +{currentPoints - previousPoints}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // インライン表示
  if (variant === 'inline') {
    return (
      <div className="relative flex items-center gap-2">
        <motion.span
          className="text-xs text-gray-500"
          animate={isAnimating ? {
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          } : {}}
          transition={{ duration: 0.5 }}
        >
          ⭐
        </motion.span>
        
        <motion.div
          animate={isAnimating ? {
            scale: [1, 1.4, 1],
            color: ['#111827', '#FCD34D', '#111827']
          } : {}}
          transition={{ duration: 0.5 }}
          className="text-sm font-bold text-gray-900 dark:text-gray-100"
        >
          <CountUp
            start={previousPoints || currentPoints}
            end={currentPoints}
            duration={0.8}
            separator=","
            preserveValue
          />
        </motion.div>
        
        <span className="text-xs text-gray-500">pt</span>
        
        {/* パーティクルエフェクト */}
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute pointer-events-none"
              initial={{ 
                opacity: 1, 
                scale: 0,
                x: 0,
                y: 0
              }}
              animate={{ 
                opacity: 0, 
                scale: 1.3,
                x: particle.x,
                y: particle.y - 30
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            >
              <span className="text-yellow-400 text-base">⭐</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // コンパクト表示（デフォルト）
  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.span
            className="text-sm text-gray-500"
            animate={isAnimating ? {
              rotate: [0, 360],
              scale: [1, 1.3, 1]
            } : {}}
            transition={{ duration: 0.6 }}
          >
            ⭐
          </motion.span>
          
          <motion.div
            animate={isAnimating ? {
              scale: [1, 1.5, 1],
              color: ['#111827', '#FCD34D', '#111827']
            } : {}}
            transition={{ duration: 0.6 }}
            className="text-lg font-bold text-gray-900 dark:text-gray-100"
          >
            <CountUp
              start={previousPoints || currentPoints}
              end={currentPoints}
              duration={1}
              separator=","
              preserveValue
            />
          </motion.div>
          
          <span className="text-sm text-gray-500">pt</span>
        </div>
        
        <motion.div 
          className="flex flex-col items-end"
          animate={isAnimating ? {
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <span className="text-xs text-gray-500 font-medium">Lv.{level}</span>
          <span className="text-xs text-gray-400">{levelName}</span>
        </motion.div>
      </div>
      
      {/* パーティクルエフェクト */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute pointer-events-none"
            initial={{ 
              opacity: 1, 
              scale: 0,
              x: 15,
              y: 15
            }}
            animate={{ 
              opacity: 0, 
              scale: 1.5,
              x: particle.x + 15,
              y: particle.y - 25
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <span className="text-yellow-400 text-lg">⭐</span>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* 波紋エフェクト */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            className="absolute inset-0 rounded-lg bg-yellow-400"
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{ transformOrigin: 'center' }}
          />
        )}
      </AnimatePresence>
      
      {/* ポイント増加通知 */}
      <AnimatePresence>
        {isAnimating && previousPoints !== undefined && (
          <motion.div
            className="absolute -top-6 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              +{currentPoints - previousPoints}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};