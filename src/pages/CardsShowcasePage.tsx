import React from 'react';
import { YuGiOhOrikaGenerator } from '../components/cardgame/YuGiOhOrikaGenerator';

export const CardsShowcasePage: React.FC = () => {
  // 実際のSupabase投稿データに基づくカード
  const sampleCards = [
    {
      id: 'card1',
      title: 'そうめんの賢者',
      level: 4,
      attribute: '炎',
      type: '戦士族',
      attack: 1630, // total_score * 26 (63 * 26)
      defense: 1508, // technical_score * 26 (58 * 26)
      effectText: '「ナスも」- Sadhguru。このカードが召喚に成功した時、フィールド上のモンスター1体の攻撃力を500ポイント上げる。料理の情景、素朴な雰囲気と日常の美しさ（総合63点・C級評価）',
      imageUrl: 'https://dijtrtaydurrhkgmulnj.supabase.co/storage/v1/object/public/post-images/b20dfe57-4147-4e58-9e8c-2152187f18b6/1752294270055',
      cardType: 'effect' as const,
      size: 'medium' as const
    },
    {
      id: 'card2', 
      title: '遊具の守護者',
      level: 5,
      attribute: '地',
      type: '機械族',
      attack: 1742, // total_score * 26 (67 * 26)
      defense: 1430, // technical_score * 26 (55 * 26)
      effectText: '「いい時間、天気」- エックハルト。このカードがフィールドに存在する限り、お互いのプレイヤーは子供時代の記憶を思い出す。公園の遊具、穏やかで懐かしい写真（総合67点・C級評価）',
      imageUrl: 'https://dijtrtaydurrhkgmulnj.supabase.co/storage/v1/object/public/post-images/3b242145-301f-40fc-ab38-88c54173d73a/1752294147273',
      cardType: 'effect' as const,
      size: 'medium' as const
    },
    {
      id: 'card3',
      title: '洗濯バサミの詩人',
      level: 6,
      attribute: '風', 
      type: '機械族',
      attack: 1820, // total_score * 26 (70 * 26)
      defense: 1612, // technical_score * 26 (62 * 26)
      effectText: '「バサミ」- いわさき。このカードが特殊召喚された場合、手札から装備魔法カード1枚を選んでこのカードに装備できる。洗濯バサミのユニークな構図、日常の芸術的瞬間（総合70点・B級評価）',
      imageUrl: 'https://dijtrtaydurrhkgmulnj.supabase.co/storage/v1/object/public/post-images/e60de5e2-5431-4c30-b4f8-2c1a1670693b/1752294046126',
      cardType: 'effect' as const,
      size: 'medium' as const
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-12">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>← 戻る</span>
          </button>
          <button
            onClick={() => window.open('/card-portal', '_self')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>🎴 カードポータル</span>
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI日記カードコレクション
          </h1>
          <p className="text-gray-600 text-lg">
            投稿された写真が遊戯王風カードに変身！
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {sampleCards.map((card, index) => (
            <div key={card.id} className="transform hover:scale-105 transition-transform duration-300">
              <div className="bg-gradient-to-b from-yellow-200 to-yellow-100 p-4 rounded-lg shadow-2xl">
                <YuGiOhOrikaGenerator
                  title={card.title}
                  level={card.level}
                  attribute={card.attribute}
                  type={card.type}
                  attack={card.attack}
                  defense={card.defense}
                  effectText={card.effectText}
                  imageUrl={card.imageUrl}
                  cardType={card.cardType}
                  size={card.size}
                  debugMode={false}
                />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-gray-900 font-bold text-lg">{card.title}</h3>
                <div className="text-gray-600 text-sm">
                  ⭐ レベル {card.level} | {card.attribute}属性 | {card.type}
                </div>
                <div className="text-gray-700 text-sm mt-1">
                  ATK/{card.attack} DEF/{card.defense}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">カードの仕組み</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <h3 className="text-gray-700 font-bold mb-2">📊 攻撃力・守備力</h3>
                <p className="text-gray-600 text-sm">
                  写真の採点結果（技術スコア、構図スコア等）に基づいて自動計算されます。
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <h3 className="text-gray-700 font-bold mb-2">✨ カード名・効果</h3>
                <p className="text-gray-600 text-sm">
                  投稿のタイトルやコメントから自動生成。思い出が効果テキストになります。
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <h3 className="text-gray-700 font-bold mb-2">🎴 レアリティ</h3>
                <p className="text-gray-600 text-sm">
                  写真の総合スコアによって決まります。S級→UR、A級→SR、B級→R、C級→N
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};