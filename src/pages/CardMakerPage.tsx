import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CardMaker } from '../components/cardgame/CardMaker';

const CardMakerPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <div className="max-w-7xl mx-auto p-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white hover:text-yellow-300 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>ホームに戻る</span>
        </button>
      </div>

      {/* メインコンテンツ */}
      <CardMaker />
    </div>
  );
};

export default CardMakerPage;