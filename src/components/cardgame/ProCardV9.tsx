import React from 'react';
import { GameCard } from '../../types/cardgame';
import { YuGiOhOrikaGenerator } from './YuGiOhOrikaGenerator';

interface ProCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

// V9: orika.jpg テンプレート完全版
export const ProCardV9: React.FC<ProCardProps> = ({ card, size = 'medium' }) => {
  return (
    <YuGiOhOrikaGenerator
      title={card.title}
      level={card.level}
      attribute={card.attribute[0] || '光'}
      type={card.monsterType || `${card.attribute[0] || '戦士'}族`}
      attack={Math.round(card.stats.attack / 10)}
      defense={Math.round(card.stats.defense / 10)}
      effectText={card.effectText}
      imageUrl={card.imageUrl}
      cardType="effect"
      size={size}
    />
  );
};