import React from 'react';
import { Award } from 'lucide-react';
import { PhotoScore } from '../../types';

interface PhotoScoreBadgeProps {
  score: PhotoScore;
  size?: 'small' | 'medium';
}

export const PhotoScoreBadge: React.FC<PhotoScoreBadgeProps> = ({ score, size = 'small' }) => {
  const getLevelColor = (level: string) => {
    const colors: { [key: string]: string } = {
      'S': 'from-yellow-400 to-amber-500',
      'A': 'from-red-400 to-pink-500',
      'B': 'from-cyan-400 to-teal-500',
      'C': 'from-blue-400 to-indigo-500',
      'D': 'from-green-400 to-emerald-500',
      'E': 'from-gray-400 to-slate-500'
    };
    return colors[level] || 'from-gray-400 to-gray-500';
  };

  const sizeClasses = {
    small: {
      container: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    medium: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      text: 'text-sm'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div 
      className={`inline-flex items-center space-x-1 rounded-full bg-gradient-to-r ${getLevelColor(score.score_level)} text-white font-bold shadow-sm ${classes.container}`}
      title={`AI採点: ${score.total_score}点 (${score.level_description})`}
    >
      <Award className={classes.icon} />
      <span className={classes.text}>
        {score.score_level}級 {score.total_score}pt
      </span>
    </div>
  );
};