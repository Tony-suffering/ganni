import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Palette, Eye, Gamepad2, Sparkles, Zap } from 'lucide-react';

interface PortalItem {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: React.ReactNode;
  gradient: string;
  status: 'stable' | 'beta' | 'new';
  category: 'game' | 'create' | 'showcase';
}

export const CardGamePortalPage: React.FC = () => {
  const navigate = useNavigate();

  const portalItems: PortalItem[] = [
    {
      id: 'simple-game',
      title: 'シンプルカードバトル',
      description: '攻撃力で勝負！3勝先取の簡単カードゲーム。実際の投稿写真でバトル！',
      route: '/simple-card-game',
      icon: <Gamepad2 size={40} />,
      gradient: 'from-green-500 to-blue-500',
      status: 'new',
      category: 'game'
    },
    {
      id: 'card-maker',
      title: 'オリジナルカード作成',
      description: '遊戯王風オリカジェネレーター。写真をアップロードしてカスタムカードを作成！',
      route: '/card-maker',
      icon: <Palette size={40} />,
      gradient: 'from-yellow-500 to-orange-500',
      status: 'stable',
      category: 'create'
    },
    {
      id: 'all-cards',
      title: '全カードデッキ',
      description: 'あなたの全投稿をカード化！フィルタ・ソート・検索機能付きの完全コレクション。',
      route: '/all-cards',
      icon: <Sparkles size={40} />,
      gradient: 'from-cyan-500 to-blue-500',
      status: 'new',
      category: 'showcase'
    },
    {
      id: 'cards-showcase',
      title: 'カードコレクション',
      description: '実際の投稿データから生成された3枚のカードを表示。採点結果がカードの強さに！',
      route: '/cards-showcase',
      icon: <Eye size={40} />,
      gradient: 'from-purple-500 to-pink-500',
      status: 'stable',
      category: 'showcase'
    },
    {
      id: 'card-experiments',
      title: 'カードデザイン実験室',
      description: '24種類のカードデザインを比較。プロ版とCSS版、様々なスタイルを展示！',
      route: '/card-game',
      icon: <Sparkles size={40} />,
      gradient: 'from-cyan-500 to-blue-500',
      status: 'beta',
      category: 'showcase'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">NEW</span>;
      case 'beta':
        return <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">BETA</span>;
      case 'stable':
        return <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">STABLE</span>;
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'game':
        return <Play size={16} className="text-green-400" />;
      case 'create':
        return <Palette size={16} className="text-yellow-400" />;
      case 'showcase':
        return <Eye size={16} className="text-purple-400" />;
      default:
        return null;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'game':
        return 'ゲーム';
      case 'create':
        return '作成ツール';
      case 'showcase':
        return '展示・実験';
      default:
        return '';
    }
  };

  const categorizedItems = {
    game: portalItems.filter(item => item.category === 'game'),
    create: portalItems.filter(item => item.category === 'create'),
    showcase: portalItems.filter(item => item.category === 'showcase')
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            <span>ホームに戻る</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              🎴 AI日記カードゲーム
            </h1>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              実験ポータル
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              投稿された写真がカードに変身！ゲームを楽しんだり、オリジナルカードを作成したり、
              様々な実験を体験できます。
            </p>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-100 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-3xl font-bold text-gray-900">{categorizedItems.game.length}</div>
            <div className="text-gray-600">ゲーム</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-3xl font-bold text-gray-900">{categorizedItems.create.length}</div>
            <div className="text-gray-600">作成ツール</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-3xl font-bold text-gray-900">{categorizedItems.showcase.length}</div>
            <div className="text-gray-600">展示・実験</div>
          </div>
        </div>

        {/* カテゴリ別表示 */}
        {Object.entries(categorizedItems).map(([category, items]) => (
          <div key={category} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              {getCategoryIcon(category)}
              <h3 className="text-2xl font-bold text-gray-900">
                {getCategoryName(category)}
              </h3>
              <div className="h-px bg-gradient-to-r from-gray-300 to-transparent flex-1"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105 cursor-pointer overflow-hidden"
                  onClick={() => navigate(item.route)}
                >
                  {/* 背景グラデーション */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  {/* コンテンツ */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${item.gradient} text-white`}>
                        {item.icon}
                      </div>
                      {getStatusBadge(item.status)}
                    </div>

                    <h4 className="text-xl font-bold text-gray-900 mb-3 transition-all duration-300">
                      {item.title}
                    </h4>

                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {getCategoryIcon(item.category)}
                        <span>{getCategoryName(item.category)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-500 group-hover:text-gray-900 transition-colors">
                        <span className="text-sm">開く</span>
                        <Zap size={16} className="transition-colors" />
                      </div>
                    </div>
                  </div>

                  {/* ホバーエフェクト */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* フッター情報 */}
        <div className="mt-16 text-center">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🚀 開発ロードマップ</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="text-gray-900 font-bold mb-2">Phase 1 ✅</h4>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• シンプルバトルゲーム</li>
                  <li>• カード作成ツール</li>
                  <li>• デザイン実験室</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="text-gray-900 font-bold mb-2">Phase 2 🔄</h4>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• 属性相性システム</li>
                  <li>• 特殊効果追加</li>
                  <li>• マルチプレイヤー</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="text-gray-900 font-bold mb-2">Phase 3 📋</h4>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• デッキ構築</li>
                  <li>• トーナメント</li>
                  <li>• AI対戦相手</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};