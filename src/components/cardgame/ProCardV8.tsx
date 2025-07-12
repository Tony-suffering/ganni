import React from 'react';
import { GameCard } from '../../types/cardgame';
import { CanvasCardGenerator } from './CanvasCardGenerator';

interface ProCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V8: Canvas API完全合成版
export const ProCardV8: React.FC<ProCardProps> = ({ card, size = 'medium' }) => {
  return <CanvasCardGenerator card={card} size={size} />;
};