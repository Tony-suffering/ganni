import React, { useState } from 'react';
import { YuGiOhOrikaGenerator } from '../components/cardgame/YuGiOhOrikaGenerator';
import { determineRarity, determineCardType, generateCardData } from '../utils/cardGenerator';

export const CardsShowcasePage: React.FC = () => {
  const [selectedRarity, setSelectedRarity] = useState<'all' | 'N' | 'R' | 'SR' | 'UR'>('all');
  
  // 実際のSupabase投稿データに基づくカード（レア度追加）
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
      rarity: 'R' as const, // 63点なのでR
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
      rarity: 'R' as const, // 67点なのでR
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
      rarity: 'SR' as const, // 70点なのでSR
      size: 'medium' as const
    },
    // テスト用カード（各レア度）
    {
      id: 'card4',
      title: '日常の記録者',
      level: 2,
      attribute: '光',
      type: '日記族',
      attack: 800,
      defense: 600,
      effectText: '今日も一日お疲れさまでした。このカードが場にある限り、あなたは日常の小さな幸せに気づくことができる。',
      imageUrl: '/placeholder-image.jpg',
      cardType: 'normal' as const,
      rarity: 'N' as const,
      size: 'medium' as const
    },
    {
      id: 'card5',
      title: '究極の日記師',
      level: 8,
      attribute: '光',
      type: '創造族',
      attack: 3000,
      defense: 2500,
      effectText: '1年間毎日投稿を続けた証。このカードが場にある時、全ての日記族モンスターの攻撃力は1000ポイントアップ。',
      imageUrl: '/placeholder-image.jpg',
      cardType: 'effect' as const,
      rarity: 'UR' as const,
      size: 'medium' as const
    },
    {
      id: 'card6',
      title: '創造の魔法',
      level: 0,
      attribute: '魔法',
      type: '通常魔法',
      attack: 0,
      defense: 0,
      effectText: 'あなたの手札から日記族モンスター1体を特殊召喚する。その後、デッキから1枚ドローする。',
      imageUrl: '/placeholder-image.jpg',
      cardType: 'spell' as const,
      rarity: 'SR' as const,
      size: 'medium' as const
    },
    {
      id: 'card7',
      title: '継続の罠',
      level: 0,
      attribute: '罠',
      type: '永続罠',
      attack: 0,
      defense: 0,
      effectText: '相手が3日間投稿をサボった時、相手フィールドのモンスター1体を破壊する。',
      imageUrl: '/placeholder-image.jpg',
      cardType: 'trap' as const,
      rarity: 'R' as const,
      size: 'medium' as const
    }
  ];

  // レア度でフィルタリング
  const filteredCards = selectedRarity === 'all' 
    ? sampleCards 
    : sampleCards.filter(card => card.rarity === selectedRarity);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'UR': return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white';
      case 'SR': return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
      case 'R': return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
      case 'N': return 'bg-gray-200 text-gray-700';
      default: return 'bg-gray-100';
    }
  };

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
          <p className="text-gray-600 text-lg mb-6">
            投稿された写真が遊戯王風カードに変身！
          </p>
          
          {/* レア度フィルター */}
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              onClick={() => setSelectedRarity('all')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                selectedRarity === 'all' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              全て
            </button>
            {['N', 'R', 'SR', 'UR'].map(rarity => (
              <button
                key={rarity}
                onClick={() => setSelectedRarity(rarity as any)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  selectedRarity === rarity 
                    ? getRarityColor(rarity) + ' shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {rarity}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {filteredCards.map((card, index) => (
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
                  rarity={card.rarity}
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
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRarityColor(card.rarity)}`}>
                    {card.rarity}
                  </span>
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