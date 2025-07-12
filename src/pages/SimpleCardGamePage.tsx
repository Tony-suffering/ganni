import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SimpleCardBattleGame } from '../components/cardgame/SimpleCardBattleGame';

export const SimpleCardGamePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーション */}
      <div className="p-4 flex gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>ホームに戻る</span>
        </button>
        <button
          onClick={() => navigate('/card-portal')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span>🎴 カードポータル</span>
        </button>
      </div>

      {/* ゲーム本体 */}
      <SimpleCardBattleGame />
    </div>
  );
};