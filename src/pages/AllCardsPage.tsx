import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { YuGiOhOrikaGenerator } from '../components/cardgame/YuGiOhOrikaGenerator';
import { ProCardV9 } from '../components/cardgame/ProCardV9';
import { GameCard } from '../types/cardgame';
import { usePosts } from '../hooks/usePosts';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Search, Filter, Grid, List, Download } from 'lucide-react';

const AllCardsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { allPosts } = usePosts(); // postsではなくallPostsを使用
  const [allCards, setAllCards] = useState<GameCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<GameCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRarity, setFilterRarity] = useState<'ALL' | 'N' | 'R' | 'SR' | 'UR'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'attack' | 'totalScore' | 'rarity'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cardStyle, setCardStyle] = useState<'yugioh'>('yugioh');
  
  // 表示するカード数を5枚に制限（遊戯王風4枚 + 元のカード枠1枚）
  const displayCards = filteredCards.slice(0, 5);
  const yugiohCards = displayCards.slice(0, 4); // 遊戯王風4枚
  const originalCard = displayCards[4]; // 元のカード枠1枚

  // 投稿をゲームカードに変換
  useEffect(() => {
    if (allPosts.length > 0) {
      const cards: GameCard[] = allPosts
        // 全ての投稿をカード化（写真スコアがない場合はデフォルト値を使用）
        .map(post => {
          // 写真スコアがない場合はデフォルト値を設定
          const score = post.photoScore || {
            score_level: 'C',
            total_score: 50,
            technical_score: 5.0,
            composition_score: 5.0,
            creativity_score: 5.0,
            engagement_score: 5.0
          };
          
          // レベル計算 (S=8, A=6, B=4, C=2)
          const levelMap: Record<string, number> = {
            'S': 8, 'A': 6, 'B': 4, 'C': 2
          };
          const level = levelMap[score.score_level] || 2;

          // レアリティ計算（テスト用に確実に分散）
          const cardIndex = allPosts.indexOf(post);
          let rarity: 'N' | 'R' | 'SR' | 'UR' = 'N';
          
          // テスト用：4枚のカードに異なるレア度を強制割り当て
          if (cardIndex === 0) rarity = 'UR';
          else if (cardIndex === 1) rarity = 'SR';
          else if (cardIndex === 2) rarity = 'R';
          else if (cardIndex === 3) rarity = 'N';
          else {
            // 5枚目以降は通常の計算
            if (score.total_score >= 85) rarity = 'UR';
            else if (score.total_score >= 70) rarity = 'SR';
            else if (score.total_score >= 50) rarity = 'R';
          }
          
          // デバッグ用にレア度確認
          console.log(`カード "${post.title}" (${cardIndex}): スコア${score.total_score} → レア度${rarity}`);

          // 改善されたステータス計算
          const stats = {
            attack: Math.round((score.technical_score * 12 + score.creativity_score * 8) * 10),
            defense: Math.round((score.composition_score * 15 + score.technical_score * 5) * 10),
            speed: Math.round((score.engagement_score * 8 + score.total_score * 5) * 10),
            special: Math.round((score.creativity_score * 10 + score.total_score * 2) * 5)
          };

          // 投稿内容に基づく詳細な効果テキスト生成
          const generateEffectText = (post: any, score: any): string => {
            // ユーザーコメントがある場合は優先使用
            if (post.userComment && post.userComment.length > 10) {
              return post.userComment;
            }
            
            // タグベースの効果生成
            const tags = post.tags.map((tag: any) => tag.name);
            const hasNatureTag = tags.some((tag: string) => ['自然', '風景', '空', '花', '植物'].includes(tag));
            const hasFoodTag = tags.some((tag: string) => ['料理', '食べ物', 'グルメ', '食事'].includes(tag));
            const hasArtTag = tags.some((tag: string) => ['アート', '芸術', 'デザイン', '建築'].includes(tag));
            const hasTechTag = tags.some((tag: string) => ['技術', 'IT', 'ガジェット', 'プログラミング'].includes(tag));
            
            let baseEffect = '';
            
            if (hasNatureTag) {
              baseEffect = `【自然の力】このカードが場に存在する限り、自分のライフポイントを毎ターン${Math.round(score.total_score * 5)}回復する。`;
            } else if (hasFoodTag) {
              baseEffect = `【美食の恵み】このカードが召喚に成功した時、ライフポイントを${Math.round(score.total_score * 15)}回復し、カードを1枚ドローする。`;
            } else if (hasArtTag) {
              baseEffect = `【芸術の魂】このカードの攻撃力は相手フィールドのカード数×${Math.round(score.creativity_score * 50)}ポイントアップする。`;
            } else if (hasTechTag) {
              baseEffect = `【テクノロジー】1ターンに1度、相手フィールドのカード1枚を選択して破壊できる。この効果は相手ターンでも発動できる。`;
            } else {
              // デフォルト効果
              const defaultEffects = [
                `【${post.title}の記憶】このカードが召喚に成功した時、デッキから好きなカードを1枚手札に加える。`,
                `【思い出の力】このカードが戦闘で相手モンスターを破壊した時、その攻撃力分のダメージを相手に与える。`,
                `【心の絆】このカードがフィールドに存在する限り、自分の手札上限を10枚にする。`,
                `【希望の光】このカードが破壊された時、自分のライフポイントが相手より少ない場合、ライフポイントを1000回復する。`
              ];
              const effectIndex = Math.abs(post.id.charCodeAt(0)) % defaultEffects.length;
              baseEffect = defaultEffects[effectIndex];
            }
            
            // スコアレベルによる追加効果
            let additionalEffect = '';
            if (score.score_level === 'S') {
              additionalEffect = '【レジェンド級】このカードは相手の効果では破壊されない。';
            } else if (score.score_level === 'A') {
              additionalEffect = '【エキスパート級】このカードは戦闘では破壊されない。';
            } else if (score.score_level === 'B') {
              additionalEffect = '【上級者】このカードの攻撃力は500ポイントアップ。';
            }
            
            return additionalEffect ? `${baseEffect} ${additionalEffect}` : baseEffect;
          };

          // 属性を投稿内容から自動決定
          const determineAttribute = (post: any): string => {
            const tags = post.tags.map((tag: any) => tag.name);
            
            if (tags.some((tag: string) => ['自然', '風景', '空', '海', '山'].includes(tag))) return '風';
            if (tags.some((tag: string) => ['料理', '食べ物', '火', 'BBQ'].includes(tag))) return '炎';
            if (tags.some((tag: string) => ['水', '雨', '海', '川', '湖'].includes(tag))) return '水';
            if (tags.some((tag: string) => ['技術', 'IT', 'ガジェット', '機械'].includes(tag))) return '光';
            if (tags.some((tag: string) => ['夜', '暗い', 'ミステリー', 'ホラー'].includes(tag))) return '闇';
            if (tags.some((tag: string) => ['土', '植物', '花', '庭', '農業'].includes(tag))) return '地';
            
            // デフォルトは光属性
            return '光';
          };

          // モンスター種族を投稿内容から自動決定
          const determineType = (post: any): string => {
            const tags = post.tags.map((tag: any) => tag.name);
            
            if (tags.some((tag: string) => ['動物', 'ペット', '犬', '猫'].includes(tag))) return '獣族';
            if (tags.some((tag: string) => ['魚', '海', '水族館'].includes(tag))) return '魚族';
            if (tags.some((tag: string) => ['鳥', '空', '飛行'].includes(tag))) return '鳥獣族';
            if (tags.some((tag: string) => ['花', '植物', '木', '森'].includes(tag))) return '植物族';
            if (tags.some((tag: string) => ['技術', 'IT', 'ロボット', '機械'].includes(tag))) return '機械族';
            if (tags.some((tag: string) => ['魔法', 'ファンタジー', '神秘'].includes(tag))) return '魔法使い族';
            if (tags.some((tag: string) => ['戦い', 'スポーツ', '格闘'].includes(tag))) return '戦士族';
            if (tags.some((tag: string) => ['ドラゴン', '伝説', '神話'].includes(tag))) return 'ドラゴン族';
            
            // デフォルトは戦士族
            return '戦士族';
          };

          const attribute = determineAttribute(post);
          const monsterType = determineType(post);

          return {
            id: post.id,
            title: post.title,
            imageUrl: post.imageUrl,
            level,
            rarity,
            attribute: [attribute], // 属性配列として保存
            effectText: generateEffectText(post, score),
            stats,
            totalScore: score.total_score,
            // 追加情報
            monsterType, // モンスター種族
            createdAt: post.createdAt, // 投稿日時
            authorName: post.authorName || 'Unknown', // 投稿者名
            tags: post.tags.map((tag: any) => tag.name), // タグリスト
            likesCount: post.likesCount || 0, // いいね数
            viewsCount: post.viewsCount || 0 // 閲覧数
          };
        });

      setAllCards(cards);
      setFilteredCards(cards);
    }
  }, [allPosts]);

  // フィルタリングとソート
  useEffect(() => {
    let filtered = [...allCards];

    // 検索フィルタ
    if (searchTerm) {
      filtered = filtered.filter(card => 
        card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.effectText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.attribute.some(attr => attr.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // レアリティフィルタ
    if (filterRarity !== 'ALL') {
      filtered = filtered.filter(card => card.rarity === filterRarity);
    }

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'attack':
          return b.stats.attack - a.stats.attack;
        case 'totalScore':
          return b.totalScore - a.totalScore;
        case 'rarity':
          const rarityOrder = { 'UR': 4, 'SR': 3, 'R': 2, 'N': 1 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        case 'date':
        default:
          return 0; // 元の順序を保持
      }
    });

    setFilteredCards(filtered);
  }, [allCards, searchTerm, filterRarity, sortBy]);

  const rarityColors = {
    UR: 'text-yellow-500 bg-yellow-100',
    SR: 'text-purple-600 bg-purple-100',
    R: 'text-blue-600 bg-blue-100',
    N: 'text-gray-600 bg-gray-100'
  };

  const exportDeck = () => {
    const deckData = {
      name: `${user?.displayName || 'Player'}のデッキ`,
      cards: filteredCards.map(card => ({
        id: card.id,
        title: card.title,
        rarity: card.rarity,
        attack: card.stats.attack,
        defense: card.stats.defense
      })),
      totalCards: filteredCards.length,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(deckData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-deck.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>ホームに戻る</span>
          </button>
          
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🎴 遊戯王オリカデッキ
            </h1>
            <p className="text-gray-600 text-lg">
              遊戯王オリカスタイル4枚 + オリジナルスタイル1枚
            </p>
          </div>

          {/* コントロールパネル */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* 検索 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="カードを検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* レアリティフィルタ */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={filterRarity}
                  onChange={(e) => setFilterRarity(e.target.value as any)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="ALL">全レアリティ</option>
                  <option value="UR">ウルトラレア</option>
                  <option value="SR">スーパーレア</option>
                  <option value="R">レア</option>
                  <option value="N">ノーマル</option>
                </select>
              </div>

              {/* ソート */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">投稿順</option>
                <option value="attack">攻撃力順</option>
                <option value="totalScore">総合スコア順</option>
                <option value="rarity">レアリティ順</option>
              </select>

              {/* エクスポート */}
              <button
                onClick={exportDeck}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <Download size={20} />
                <span className="hidden sm:inline">デッキ出力</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              {/* 表示モード */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List size={20} />
                </button>
              </div>

              {/* カードスタイル */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-600">
                  遊戯王オリカスタイル
                </div>
              </div>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {['UR', 'SR', 'R', 'N'].map(rarity => {
              const count = filteredCards.filter(card => card.rarity === rarity).length;
              return (
                <div key={rarity} className="bg-white rounded-lg shadow-sm border p-4 text-center">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${rarityColors[rarity as keyof typeof rarityColors]}`}>
                    {rarity}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-2">{count}</div>
                  <div className="text-gray-500 text-sm">枚</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* カード表示エリア */}
        {filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎴</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">カードが見つかりません</h3>
            <p className="text-gray-500">検索条件を変更してください</p>
          </div>
        ) : viewMode === 'grid' ? (
          <>
            {/* 遊戯王風カード4枚 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">🎴 遊戯王オリカスタイル</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
                {yugiohCards.map((card) => (
                  <div key={card.id} className="flex flex-col items-center">
                    <div className="transform hover:scale-105 transition-transform duration-300">
                      <YuGiOhOrikaGenerator
                        title={card.title}
                        level={card.level}
                        attribute={card.attribute[0] || '光'}
                        type={card.monsterType || '戦士族'}
                        attack={Math.round(card.stats.attack / 10)}
                        defense={Math.round(card.stats.defense / 10)}
                        effectText={card.effectText}
                        imageUrl={card.imageUrl}
                        cardType="effect"
                        rarity={card.rarity}
                        size="medium"
                        debugMode={false}
                      />
                    </div>
                    <div className="mt-3 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${rarityColors[card.rarity]}`}>
                          {card.rarity}
                        </span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                          Lv.{card.level}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        【{card.attribute[0] || '光'}】【{card.monsterType || '戦士族'}】
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        ATK: {Math.round(card.stats.attack / 10)} / DEF: {Math.round(card.stats.defense / 10)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* オリジナルカード1枚 */}
            {originalCard && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">🎯 オリジナルスタイル</h2>
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    <div className="transform hover:scale-105 transition-transform duration-300">
                      <ProCardV9 card={originalCard} size="medium" />
                    </div>
                    <div className="mt-3 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${rarityColors[originalCard.rarity]}`}>
                          {originalCard.rarity}
                        </span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                          Lv.{originalCard.level}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        【{originalCard.attribute[0] || '光'}】【{originalCard.monsterType || '戦士族'}】
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        ATK: {Math.round(originalCard.stats.attack / 10)} / DEF: {Math.round(originalCard.stats.defense / 10)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {/* 遊戯王風カード（リスト表示） */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">🎴 遊戯王オリカスタイル</h2>
              <div className="space-y-4">
                {yugiohCards.map((card) => (
                  <div key={card.id} className="bg-white rounded-lg shadow-sm border p-6 flex items-center gap-6">
                    <div className="flex-shrink-0">
                      <YuGiOhOrikaGenerator
                        title={card.title}
                        level={card.level}
                        attribute={card.attribute[0] || '光'}
                        type={card.monsterType || '戦士族'}
                        attack={Math.round(card.stats.attack / 10)}
                        defense={Math.round(card.stats.defense / 10)}
                        effectText={card.effectText}
                        imageUrl={card.imageUrl}
                        cardType="effect"
                        rarity={card.rarity}
                        size="small"
                        debugMode={false}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${rarityColors[card.rarity]}`}>
                          {card.rarity}
                        </span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                          Lv.{card.level}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                        <span>【{card.attribute[0] || '光'}属性】</span>
                        <span>【{card.monsterType || '戦士族'}】</span>
                        {card.authorName && <span>投稿者: {card.authorName}</span>}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3">{card.effectText}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">ATK:</span>
                          <span className="font-bold ml-1 text-red-600">{Math.round(card.stats.attack / 10)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">DEF:</span>
                          <span className="font-bold ml-1 text-blue-600">{Math.round(card.stats.defense / 10)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Score:</span>
                          <span className="font-bold ml-1 text-purple-600">{card.totalScore}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">♥:</span>
                          <span className="font-bold ml-1 text-pink-600">{card.likesCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* オリジナルカード（リスト表示） */}
            {originalCard && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 オリジナルスタイル</h2>
                <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <ProCardV9 card={originalCard} size="small" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{originalCard.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${rarityColors[originalCard.rarity]}`}>
                        {originalCard.rarity}
                      </span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                        Lv.{originalCard.level}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                      <span>【{originalCard.attribute[0] || '光'}属性】</span>
                      <span>【{originalCard.monsterType || '戦士族'}】</span>
                      {originalCard.authorName && <span>投稿者: {originalCard.authorName}</span>}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">{originalCard.effectText}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">ATK:</span>
                        <span className="font-bold ml-1 text-red-600">{Math.round(originalCard.stats.attack / 10)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">DEF:</span>
                        <span className="font-bold ml-1 text-blue-600">{Math.round(originalCard.stats.defense / 10)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Score:</span>
                        <span className="font-bold ml-1 text-purple-600">{originalCard.totalScore}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">♥:</span>
                        <span className="font-bold ml-1 text-pink-600">{originalCard.likesCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* フッター情報 */}
        <div className="mt-12 text-center text-gray-500">
          <p>表示中: {displayCards.length} / {allCards.length} 枚</p>
          <p className="text-sm mt-1">遊戯王オリカスタイル4枚 + オリジナルスタイル1枚</p>
          <p className="text-sm mt-1">レア度に応じたフレームと特殊エフェクト付き</p>
          {filteredCards.length > 5 && (
            <p className="text-sm mt-1 text-blue-600">※ 上位5枚のみ表示されています</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllCardsPage;