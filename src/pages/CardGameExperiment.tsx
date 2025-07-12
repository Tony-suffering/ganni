import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DiaryCard } from '../components/cardgame/DiaryCard';
import { DiaryCardV1 } from '../components/cardgame/DiaryCardV1';
import { DiaryCardV3 } from '../components/cardgame/DiaryCardV3';
import { DiaryCardV4 } from '../components/cardgame/DiaryCardV4';
import { DiaryCardV5 } from '../components/cardgame/DiaryCardV5';
import { DiaryCardV6 } from '../components/cardgame/DiaryCardV6';
import { DiaryCardV7 } from '../components/cardgame/DiaryCardV7';
import { DiaryCardV1Fixed } from '../components/cardgame/DiaryCardV1_Fixed';
import { DiaryCardV8 } from '../components/cardgame/DiaryCardV8';
import { DiaryCardV9 } from '../components/cardgame/DiaryCardV9';
import { DiaryCardV10 } from '../components/cardgame/DiaryCardV10';
import { DiaryCardV11 } from '../components/cardgame/DiaryCardV11';
import { DiaryCardV12 } from '../components/cardgame/DiaryCardV12';
import { DiaryCardV13 } from '../components/cardgame/DiaryCardV13';
import { DiaryCardV14 } from '../components/cardgame/DiaryCardV14';
import { DiaryCardV15 } from '../components/cardgame/DiaryCardV15';
import { ProCardV1 } from '../components/cardgame/ProCardV1';
import { ProCardV2 } from '../components/cardgame/ProCardV2';
import { ProCardV3 } from '../components/cardgame/ProCardV3';
import { ProCardV4 } from '../components/cardgame/ProCardV4';
import { ProCardV5 } from '../components/cardgame/ProCardV5';
import { ProCardV6 } from '../components/cardgame/ProCardV6';
import { ProCardV7 } from '../components/cardgame/ProCardV7';
import { ProCardV8 } from '../components/cardgame/ProCardV8';
import { ProCardV9 } from '../components/cardgame/ProCardV9';
import { GameCard } from '../types/cardgame';
import { usePosts } from '../hooks/usePosts';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

const CardGameExperiment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { posts } = usePosts();
  const [gameCards, setGameCards] = useState<GameCard[]>([]);

  // 投稿をゲームカードに変換
  useEffect(() => {
    if (posts.length > 0) {
      const cards: GameCard[] = posts
        .filter(post => post.photoScore) // 写真スコアがある投稿のみ
        .map(post => {
          const score = post.photoScore!;
          
          // レベル計算 (S=8, A=6, B=4, C=2)
          const levelMap: Record<string, number> = {
            'S': 8, 'A': 6, 'B': 4, 'C': 2
          };
          const level = levelMap[score.score_level] || 2;

          // レアリティ計算
          let rarity: 'N' | 'R' | 'SR' | 'UR' = 'N';
          if (score.total_score >= 90) rarity = 'UR';
          else if (score.total_score >= 80) rarity = 'SR';
          else if (score.total_score >= 70) rarity = 'R';

          // ステータス計算（各スコア×10）
          const stats = {
            attack: Math.round(score.technical_score * 10),
            defense: Math.round(score.composition_score * 10),
            speed: Math.round(score.creativity_score * 10),
            special: Math.round(score.engagement_score * 10)
          };

          return {
            id: post.id,
            title: post.title,
            imageUrl: post.imageUrl,
            level,
            rarity,
            attribute: post.tags.map(tag => tag.name),
            effectText: post.userComment || '効果なし',
            stats,
            totalScore: score.total_score
          };
        });

      setGameCards(cards);
    }
  }, [posts]);

  // 実際の投稿から15つの異なるサンプルカードを生成
  const createSampleCards = (): GameCard[] => {
    const validPosts = posts.filter(post => post.photoScore);
    
    // モックデータを追加（投稿が少ない場合のため）
    const mockPosts = [];
    for (let i = validPosts.length; i < 15; i++) {
      mockPosts.push({
        id: `mock-${i}`,
        title: `サンプルカード ${i + 1}`,
        imageUrl: validPosts[0]?.imageUrl || '/placeholder-image.jpg',
        tags: [{ name: 'アート' }],
        userComment: 'これはサンプルカードの効果テキストです。',
        photoScore: {
          score_level: 'A',
          total_score: 75 + (i * 5),
          technical_score: 7.5,
          composition_score: 8.0,
          creativity_score: 7.0,
          engagement_score: 6.5
        }
      });
    }
    
    const allPosts = [...validPosts, ...mockPosts];
    const shuffled = [...allPosts].sort(() => Math.random() - 0.5);
    const selectedPosts = shuffled.slice(0, 15);
    
    return selectedPosts.map((post, index) => {
      const score = post.photoScore!;
      
      const levelMap: Record<string, number> = {
        'S': 8, 'A': 6, 'B': 4, 'C': 2
      };
      const level = levelMap[score.score_level] || 2;

      let rarity: 'N' | 'R' | 'SR' | 'UR' = 'N';
      if (score.total_score >= 90) rarity = 'UR';
      else if (score.total_score >= 80) rarity = 'SR';
      else if (score.total_score >= 70) rarity = 'R';

      const stats = {
        attack: Math.round(score.technical_score * 10),
        defense: Math.round(score.composition_score * 10),
        speed: Math.round(score.creativity_score * 10),
        special: Math.round(score.engagement_score * 10)
      };

      const effectTexts = [
        `このカードが召喚・特殊召喚に成功した時、デッキから「${post.tags[0]?.name || 'AI'}」カードを1枚手札に加える事ができる。`,
        `1ターンに1度、相手フィールド上のカード1枚を選択して破壊できる。この効果を発動したターン、このカードは攻撃できない。`,
        `このカードが戦闘で相手モンスターを破壊した時、その攻撃力分のダメージを相手に与える。`,
        `このカードが手札から特殊召喚された場合、ライフポイントを500回復する。また、このカードは破壊されない。`,
        `フィールド上に存在する限り、自分のライフポイントが500以上の場合、このカードの攻撃力と守備力は1000ポイントアップする。`,
        `このカードがフィールドに存在する限り、自分の手札上限を10枚にする。また、ドローフェイズに追加で1枚ドローできる。`,
        `このカードが墓地に送られた時、デッキから魔法・罠カードを1枚手札に加え、相手に300ポイントのダメージを与える。`,
        `【ファンファーレ】自分の場に「${post.tags[0]?.name || 'アート'}」フォロワーがいるなら、相手のフォロワー1体に2ダメージ。`,
        `【戦吼】このターン中、味方ミニオンは全て+2/+1を得る。このカードの攻撃力が5以上なら、カードを1枚引く。`,
        `このアミュレットが場に出た時、自分の妖精・プリンセストークンを1枚手札に加える。カウントダウン3開始。`
      ];

      return {
        id: `${post.id}-v${index}`,
        title: post.title,
        imageUrl: post.imageUrl,
        level,
        rarity,
        attribute: post.tags.map(tag => tag.name),
        effectText: post.userComment || effectTexts[index % effectTexts.length],
        stats,
        totalScore: score.total_score
      };
    });
  };

  const sampleCards = createSampleCards();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
      {/* ヘッダー */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white hover:text-yellow-300 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>ホームに戻る</span>
        </button>
        
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 text-center mb-2">
          AI日記カードゲーム実験室
        </h1>
        <p className="text-white/80 text-center mb-4">
          あなたの投稿がカードに変身！プロフェッショナル版も追加！
        </p>
        
        {/* ポータルリンク */}
        <div className="text-center mb-4">
          <button
            onClick={() => navigate('/card-portal')}
            className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg mb-4"
          >
            🎴 カードゲームポータルに戻る
          </button>
        </div>

        {/* 直接リンク */}
        <div className="text-center mb-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/simple-card-game')}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🎮 シンプルカードバトルをプレイ
            </button>
            <button
              onClick={() => navigate('/card-maker')}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🎴 オリジナルカードを作成する
            </button>
          </div>
        </div>
      </div>

      {/* カード表示エリア */}
      <div className="max-w-7xl mx-auto">
        {/* サンプルカード表示 - 3バージョン比較 */}
        {sampleCards.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl text-white mb-8 text-center font-bold">
              カードデザイン比較 - 24種類（実際の投稿から生成）
            </h2>
            
            {/* プロフェッショナル版セクション */}
            <div className="mb-12">
              <h3 className="text-2xl text-yellow-300 mb-6 text-center font-bold">
                🎨 プロフェッショナル版（SVG+高品質）
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 max-w-[1800px] mx-auto">
                {/* ProCard V1 */}
                {sampleCards[0] && (
                  <div className="text-center">
                    <h4 className="text-lg text-amber-400 mb-3 font-semibold">Pro V1: ゴールドラグジュアリー</h4>
                    <div className="flex justify-center mb-2">
                      <ProCardV1 card={sampleCards[0]} size="medium" />
                    </div>
                    <p className="text-white/70 text-xs mt-2">
                      SVG製高級ゴールドフレーム
                    </p>
                  </div>
                )}
                
                {/* ProCard V2 */}
                {sampleCards[1] && (
                  <div className="text-center">
                    <h4 className="text-lg text-cyan-400 mb-3 font-semibold">Pro V2: サイバーネオン</h4>
                    <div className="flex justify-center mb-2">
                      <ProCardV2 card={sampleCards[1]} size="medium" />
                    </div>
                    <p className="text-white/70 text-xs mt-2">
                      未来感あふれるホログラム
                    </p>
                  </div>
                )}
                
                {/* ProCard V3 */}
                {sampleCards[2] && (
                  <div className="text-center">
                    <h4 className="text-lg text-amber-300 mb-3 font-semibold">Pro V3: エレガントクラシック</h4>
                    <div className="flex justify-center mb-2">
                      <ProCardV3 card={sampleCards[2]} size="medium" />
                    </div>
                    <p className="text-white/70 text-xs mt-2">
                      美術館品質の古典的デザイン
                    </p>
                  </div>
                )}
                
                {/* ProCard V4 */}
                {sampleCards[3] && (
                  <div className="text-center">
                    <h4 className="text-lg text-orange-400 mb-3 font-semibold">Pro V4: アールデコ</h4>
                    <div className="flex justify-center mb-2">
                      <ProCardV4 card={sampleCards[3]} size="medium" />
                    </div>
                    <p className="text-white/70 text-xs mt-2">
                      幾何学模様の芸術的カード
                    </p>
                  </div>
                )}
                
                {/* ProCard V5 */}
                {sampleCards[4] && (
                  <div className="text-center">
                    <h4 className="text-lg text-gray-300 mb-3 font-semibold">Pro V5: ミニマルモダン</h4>
                    <div className="flex justify-center mb-2">
                      <ProCardV5 card={sampleCards[4]} size="medium" />
                    </div>
                    <p className="text-white/70 text-xs mt-2">
                      究極のクリーンデザイン
                    </p>
                  </div>
                )}
                
                {/* ProCard V6 */}
                {sampleCards[5] && (
                  <div className="text-center">
                    <h4 className="text-lg text-purple-400 mb-3 font-semibold">Pro V6: リアル参考版</h4>
                    <div className="flex justify-center mb-2">
                      <ProCardV6 card={sampleCards[5]} size="medium" />
                    </div>
                    <p className="text-white/70 text-xs mt-2">
                      card.png完全再現スタイル
                    </p>
                  </div>
                )}
                
                {/* ProCard V7 */}
                {sampleCards[6] && (
                  <div className="text-center">
                    <h4 className="text-lg text-pink-400 mb-3 font-semibold">Pro V7: 実画像オーバーレイ</h4>
                    <div className="flex justify-center mb-2">
                      <ProCardV7 card={sampleCards[6]} size="medium" />
                    </div>
                    <p className="text-white/70 text-xs mt-2">
                      card.png + 投稿画像合成
                    </p>
                  </div>
                )}
                
                {/* ProCard V8 */}
                {sampleCards[7] && (
                  <div className="text-center">
                    <h4 className="text-lg text-yellow-400 mb-3 font-semibold">Pro V8: Canvas完全合成</h4>
                    <div className="flex justify-center mb-2">
                      <ProCardV8 card={sampleCards[7]} size="medium" />
                    </div>
                    <p className="text-white/70 text-xs mt-2">
                      Canvas API Photoshop級
                    </p>
                  </div>
                )}
                
                {/* ProCard V9 */}
                {sampleCards[8] && (
                  <div className="text-center">
                    <h4 className="text-lg text-orange-400 mb-3 font-semibold">Pro V9: 遊戯王オリカ完全版</h4>
                    <div className="flex justify-center mb-2">
                      <ProCardV9 card={sampleCards[8]} size="medium" />
                    </div>
                    <p className="text-white/70 text-xs mt-2">
                      orika.jpg + 遊戯王フォント
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <h3 className="text-2xl text-blue-300 mb-6 text-center font-bold">
              🔧 従来版（CSS+Tailwind）
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-[1600px] mx-auto">
              {/* バージョン1 */}
              {sampleCards[0] && (
                <div className="text-center">
                  <h3 className="text-lg text-yellow-400 mb-3 font-semibold">V1: シンプル</h3>
                  <div className="flex justify-center mb-2">
                    <DiaryCardV1 card={sampleCards[0]} size="medium" />
                  </div>
                  <p className="text-white/70 text-xs mt-2">
                    基本的なカードゲーム風デザイン
                  </p>
                </div>
              )}
              
              {/* バージョン2 */}
              {sampleCards[1] && (
                <div className="text-center">
                  <h3 className="text-lg text-yellow-400 mb-3 font-semibold">V2: 遊戯王風</h3>
                  <div className="flex justify-center mb-2">
                    <DiaryCard card={sampleCards[1]} size="medium" />
                  </div>
                  <p className="text-white/70 text-xs mt-2">
                    遊戯王カードに近いデザイン
                  </p>
                </div>
              )}
              
              {/* バージョン3 */}
              {sampleCards[2] && (
                <div className="text-center">
                  <h3 className="text-lg text-yellow-400 mb-3 font-semibold">V3: 超リアル</h3>
                  <div className="flex justify-center mb-2">
                    <DiaryCardV3 card={sampleCards[2]} size="medium" />
                  </div>
                  <p className="text-white/70 text-xs mt-2">
                    最新の遊戯王カード風
                  </p>
                </div>
              )}
              
              {/* バージョン4 */}
              {sampleCards[3] && (
                <div className="text-center">
                  <h3 className="text-lg text-yellow-400 mb-3 font-semibold">V4: ポケモン風</h3>
                  <div className="flex justify-center mb-2">
                    <DiaryCardV4 card={sampleCards[3]} size="medium" />
                  </div>
                  <p className="text-white/70 text-xs mt-2">
                    ポケモンカードスタイル
                  </p>
                </div>
              )}
              
              {/* バージョン5 */}
              {sampleCards[4] && (
                <div className="text-center">
                  <h3 className="text-lg text-yellow-400 mb-3 font-semibold">V5: MTG風</h3>
                  <div className="flex justify-center mb-2">
                    <DiaryCardV5 card={sampleCards[4]} size="medium" />
                  </div>
                  <p className="text-white/70 text-xs mt-2">
                    マジック：ザ・ギャザリング風
                  </p>
                </div>
              )}
              
              {/* バージョン6 */}
              {sampleCards[5] && (
                <div className="text-center">
                  <h3 className="text-lg text-yellow-400 mb-3 font-semibold">V6: プロ級ポケモン</h3>
                  <div className="flex justify-center mb-2">
                    <DiaryCardV6 card={sampleCards[5]} size="medium" />
                  </div>
                  <p className="text-white/70 text-xs mt-2">
                    超高品質ポケモンスタイル
                  </p>
                </div>
              )}
              
              {/* バージョン7 */}
              {sampleCards[6] && (
                <div className="text-center">
                  <h3 className="text-lg text-yellow-400 mb-3 font-semibold">V7: 未来デジタル</h3>
                  <div className="flex justify-center mb-2">
                    <DiaryCardV7 card={sampleCards[6]} size="medium" />
                  </div>
                  <p className="text-white/70 text-xs mt-2">
                    次世代デジタルカード
                  </p>
                </div>
              )}
              
              {/* バージョン8 */}
              {sampleCards[7] && (
                <div className="text-center">
                  <h3 className="text-lg text-yellow-400 mb-3 font-semibold">V8: Shadowverse風</h3>
                  <div className="flex justify-center mb-2">
                    <DiaryCardV8 card={sampleCards[7]} size="medium" />
                  </div>
                  <p className="text-white/70 text-xs mt-2">
                    シャドウバース風デザイン
                  </p>
                </div>
              )}
              
              {/* バージョン9 */}
              {sampleCards[8] && (
                <div className="text-center">
                  <h3 className="text-lg text-yellow-400 mb-3 font-semibold">V9: ハースストーン風</h3>
                  <div className="flex justify-center mb-2">
                    <DiaryCardV9 card={sampleCards[8]} size="medium" />
                  </div>
                  <p className="text-white/70 text-xs mt-2">
                    重厚なハースストーン風
                  </p>
                </div>
              )}
              
              {/* バージョン10 */}
              {sampleCards[9] && (
                <div className="text-center">
                  <h3 className="text-lg text-yellow-400 mb-3 font-semibold">V10: 完全再現版</h3>
                  <div className="flex justify-center mb-2">
                    <DiaryCardV10 card={sampleCards[9]} size="medium" />
                  </div>
                  <p className="text-white/70 text-xs mt-2">
                    参考画像完全再現
                  </p>
                </div>
              )}
              
              {/* バージョン11 */}
              {sampleCards[10] && (
                <div className="text-center">
                  <h3 className="text-lg text-yellow-400 mb-3 font-semibold">V11: クリーンミニマル</h3>
                  <div className="flex justify-center mb-2">
                    <DiaryCardV11 card={sampleCards[10]} size="medium" />
                  </div>
                  <p className="text-white/70 text-xs mt-2">
                    強いタイポグラフィ重視
                  </p>
                </div>
              )}
              
              {/* バージョン12 */}
              {sampleCards[11] && (
                <div className="text-center">
                  <h3 className="text-lg text-yellow-400 mb-3 font-semibold">V12: マテリアルデザイン</h3>
                  <div className="flex justify-center mb-2">
                    <DiaryCardV12 card={sampleCards[11]} size="medium" />
                  </div>
                  <p className="text-white/70 text-xs mt-2">
                    Google Material Design 3.0風
                  </p>
                </div>
              )}
              
              {/* バージョン13 */}
              {sampleCards[12] && (
                <div className="text-center">
                  <h3 className="text-lg text-yellow-400 mb-3 font-semibold">V13: ボールドタイポ</h3>
                  <div className="flex justify-center mb-2">
                    <DiaryCardV13 card={sampleCards[12]} size="medium" />
                  </div>
                  <p className="text-white/70 text-xs mt-2">
                    白黒・強い文字
                  </p>
                </div>
              )}
              
              {/* バージョン14 */}
              {sampleCards[13] && (
                <div className="text-center">
                  <h3 className="text-lg text-yellow-400 mb-3 font-semibold">V14: コーポレート</h3>
                  <div className="flex justify-center mb-2">
                    <DiaryCardV14 card={sampleCards[13]} size="medium" />
                  </div>
                  <p className="text-white/70 text-xs mt-2">
                    ビジネス名刺風
                  </p>
                </div>
              )}
              
              {/* バージョン15 */}
              {sampleCards[14] && (
                <div className="text-center">
                  <h3 className="text-lg text-yellow-400 mb-3 font-semibold">V15: 北欧ミニマル</h3>
                  <div className="flex justify-center mb-2">
                    <DiaryCardV15 card={sampleCards[14]} size="medium" />
                  </div>
                  <p className="text-white/70 text-xs mt-2">
                    スカンジナビア風
                  </p>
                </div>
              )}
            </div>
            
            {/* カード情報表示 */}
            <div className="mt-8 bg-black/50 rounded-lg p-6 max-w-4xl mx-auto">
              <h4 className="text-lg text-white mb-4">カードステータス計算式</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-red-400 font-bold">ATK（攻撃力）</div>
                  <div className="text-white/80">技術スコア × 10</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-400 font-bold">DEF（守備力）</div>
                  <div className="text-white/80">構成スコア × 10</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 font-bold">SPD（素早さ）</div>
                  <div className="text-white/80">創造性スコア × 10</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-400 font-bold">SP（特殊）</div>
                  <div className="text-white/80">エンゲージメント × 10</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ユーザーのカード */}
        {!user ? (
          <div className="text-center text-white">
            <p className="mb-4">ログインして、あなたの投稿をカード化しよう！</p>
            <button
              onClick={() => navigate('/')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded"
            >
              ログインページへ
            </button>
          </div>
        ) : gameCards.length === 0 ? (
          <div className="text-center text-white">
            <p>まだ写真スコアがある投稿がありません。</p>
            <p className="text-sm mt-2">投稿して写真スコアを獲得しよう！</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl text-white mb-4 text-center">あなたのカード</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
              {gameCards.map(card => (
                <DiaryCard key={card.id} card={card} size="medium" />
              ))}
            </div>
          </>
        )}
      </div>

      {/* デバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 max-w-7xl mx-auto">
          <details className="text-white/60 text-sm">
            <summary className="cursor-pointer hover:text-white">デバッグ情報</summary>
            <pre className="mt-2 bg-black/50 p-4 rounded overflow-auto">
              {JSON.stringify({ totalPosts: posts.length, cardsCreated: gameCards.length }, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default CardGameExperiment;