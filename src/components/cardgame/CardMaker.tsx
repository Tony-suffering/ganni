import React, { useState, useRef } from 'react';
import { Download, Upload, RefreshCw, Save } from 'lucide-react';
import { YuGiOhOrikaGenerator } from './YuGiOhOrikaGenerator';
import { GameCard } from '../../types/cardgame';

interface CardMakerState {
  title: string;
  effectText: string;
  level: number;
  rarity: 'N' | 'R' | 'SR' | 'UR';
  attribute: string;
  type: string;
  attack: number;
  defense: number;
  imageUrl: string;
  cardType: 'normal' | 'effect' | 'spell' | 'trap';
}

export const CardMaker: React.FC = () => {
  const [cardData, setCardData] = useState<CardMakerState>({
    title: '空',
    effectText: 'フィールドの全てのモンスターを破壊する。',
    level: 8,
    rarity: 'R',
    attribute: '光',
    type: '戦士族',
    attack: 1200,
    defense: 1200,
    imageUrl: '/placeholder-image.jpg',
    cardType: 'normal'
  });

  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // フォーム更新ハンドラー
  const updateCard = (field: keyof CardMakerState, value: any) => {
    setCardData(prev => ({ ...prev, [field]: value }));
  };

  // 画像アップロード処理
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        updateCard('imageUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ランダムカード生成
  const generateRandomCard = () => {
    const titles = [
      'AI日記ドラゴン', 'デジタル・クリエイター', '写真の魔術師', 'SNSの戦士',
      'ブログの賢者', 'インスタの女王', 'ツイートの騎士', '投稿の守護者'
    ];
    
    const effects = [
      'このカードが召喚に成功した時、ライフポイントを500回復する。',
      '1ターンに1度、手札から1枚ドローできる。',
      'このカードが戦闘で破壊された時、相手に800ポイントのダメージを与える。',
      'フィールド上に存在する限り、自分の手札上限を8枚にする。',
      'このカードが特殊召喚された場合、デッキから魔法カードを1枚手札に加える。'
    ];

    const attributes = ['光', '闇', '炎', '水', '地', '風', '神'];
    const types = ['戦士族', '魔法使い族', 'ドラゴン族', '機械族', '悪魔族', '天使族', '獣族', 'サイバース族'];
    const rarities: ('N' | 'R' | 'SR' | 'UR')[] = ['N', 'R', 'SR', 'UR'];
    const cardTypes: ('normal' | 'effect')[] = ['normal', 'effect'];

    setCardData({
      title: titles[Math.floor(Math.random() * titles.length)],
      effectText: effects[Math.floor(Math.random() * effects.length)],
      level: Math.floor(Math.random() * 8) + 1,
      rarity: rarities[Math.floor(Math.random() * rarities.length)],
      attribute: attributes[Math.floor(Math.random() * attributes.length)],
      type: types[Math.floor(Math.random() * types.length)],
      attack: Math.floor(Math.random() * 3000) + 100,
      defense: Math.floor(Math.random() * 3000) + 100,
      imageUrl: cardData.imageUrl,
      cardType: cardTypes[Math.floor(Math.random() * cardTypes.length)]
    });
  };

  // カードエクスポート
  const exportCard = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${cardData.title.replace(/\s+/g, '_')}_card.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 text-center mb-8">
          🎴 AI日記カードメーカー
        </h1>
        <p className="text-white/80 text-center mb-8">
          遊戯王風オリジナルカードを作成しよう！
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側: 編集フォーム */}
          <div className="bg-black/50 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-2xl text-white mb-6 flex items-center gap-2">
              <Save className="w-6 h-6" />
              カード設定
            </h2>

            {/* 基本情報 */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-white mb-2 font-semibold">カード名</label>
                <input
                  type="text"
                  value={cardData.title}
                  onChange={(e) => updateCard('title', e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none"
                  placeholder="カード名を入力"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2 font-semibold">レベル</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={cardData.level}
                    onChange={(e) => updateCard('level', parseInt(e.target.value))}
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-semibold">レアリティ</label>
                  <select
                    value={cardData.rarity}
                    onChange={(e) => updateCard('rarity', e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="N">ノーマル (N)</option>
                    <option value="R">レア (R)</option>
                    <option value="SR">スーパーレア (SR)</option>
                    <option value="UR">ウルトラレア (UR)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2 font-semibold">属性</label>
                  <select
                    value={cardData.attribute}
                    onChange={(e) => updateCard('attribute', e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="光">光属性</option>
                    <option value="闇">闇属性</option>
                    <option value="炎">炎属性</option>
                    <option value="水">水属性</option>
                    <option value="地">地属性</option>
                    <option value="風">風属性</option>
                    <option value="神">神属性</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white mb-2 font-semibold">種族</label>
                  <select
                    value={cardData.type}
                    onChange={(e) => updateCard('type', e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="戦士族">戦士族</option>
                    <option value="魔法使い族">魔法使い族</option>
                    <option value="ドラゴン族">ドラゴン族</option>
                    <option value="機械族">機械族</option>
                    <option value="悪魔族">悪魔族</option>
                    <option value="天使族">天使族</option>
                    <option value="獣族">獣族</option>
                    <option value="サイバース族">サイバース族</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white mb-2 font-semibold">カードタイプ</label>
                <select
                  value={cardData.cardType}
                  onChange={(e) => updateCard('cardType', e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none"
                >
                  <option value="normal">通常モンスター</option>
                  <option value="effect">効果モンスター</option>
                  <option value="spell">魔法カード</option>
                  <option value="trap">罠カード</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2 font-semibold">攻撃力</label>
                  <input
                    type="number"
                    min="0"
                    max="9999"
                    step="50"
                    value={cardData.attack}
                    onChange={(e) => updateCard('attack', parseInt(e.target.value))}
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-semibold">守備力</label>
                  <input
                    type="number"
                    min="0"
                    max="9999"
                    step="50"
                    value={cardData.defense}
                    onChange={(e) => updateCard('defense', parseInt(e.target.value))}
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 効果テキスト */}
            <div className="mb-6">
              <label className="block text-white mb-2 font-semibold">効果テキスト</label>
              <textarea
                value={cardData.effectText}
                onChange={(e) => updateCard('effectText', e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none h-24 resize-none"
                placeholder="カードの効果を入力..."
              />
            </div>

            {/* 画像アップロード */}
            <div className="mb-6">
              <label className="block text-white mb-2 font-semibold">カード画像</label>
              <div className="flex gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  画像をアップロード
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="プレビュー"
                    className="w-full h-32 object-cover rounded-lg border border-gray-600"
                  />
                </div>
              )}
            </div>

            {/* アクションボタン */}
            <div className="flex gap-4">
              <button
                onClick={generateRandomCard}
                className="flex-1 p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                ランダム生成
              </button>
              <button
                onClick={exportCard}
                className="flex-1 p-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                ダウンロード
              </button>
            </div>
          </div>

          {/* 右側: リアルタイムプレビュー */}
          <div className="bg-black/50 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-2xl text-white mb-6">プレビュー</h2>
            
            <div className="flex justify-center">
                <YuGiOhOrikaGenerator
                title={cardData.title}
                level={cardData.level}
                attribute={cardData.attribute}
                type={cardData.type}
                attack={cardData.attack}
                defense={cardData.defense}
                effectText={cardData.effectText}
                imageUrl={imagePreview || cardData.imageUrl}
                cardType={cardData.cardType}
                size="large"
              />
            </div>

            {/* カード詳細表示 */}
            <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg text-white mb-3 font-semibold">カード詳細</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">レベル:</span>
                  <span className="text-white ml-2">★{cardData.level}</span>
                </div>
                <div>
                  <span className="text-gray-400">レアリティ:</span>
                  <span className="text-white ml-2">{cardData.rarity}</span>
                </div>
                <div>
                  <span className="text-gray-400">属性:</span>
                  <span className="text-white ml-2">{cardData.attribute}</span>
                </div>
                <div>
                  <span className="text-gray-400">種族:</span>
                  <span className="text-white ml-2">{cardData.type}</span>
                </div>
                <div>
                  <span className="text-gray-400">攻撃力:</span>
                  <span className="text-red-400 ml-2">{cardData.attack}</span>
                </div>
                <div>
                  <span className="text-gray-400">守備力:</span>
                  <span className="text-blue-400 ml-2">{cardData.defense}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 使い方 */}
        <div className="mt-12 bg-black/30 rounded-lg p-6">
          <h3 className="text-xl text-white mb-4 font-semibold">🎯 使い方</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white/80">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-sm">1</div>
              <div>
                <h4 className="font-semibold mb-1">フォーム入力</h4>
                <p className="text-sm">カード名、効果、ステータスを設定</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-sm">2</div>
              <div>
                <h4 className="font-semibold mb-1">画像アップロード</h4>
                <p className="text-sm">お気に入りの画像をカードに設定</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-sm">3</div>
              <div>
                <h4 className="font-semibold mb-1">ダウンロード</h4>
                <p className="text-sm">完成したカードを画像保存</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};