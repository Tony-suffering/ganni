import React, { useState, useEffect } from 'react';
import { YuGiOhOrikaGenerator } from './YuGiOhOrikaGenerator';
import { supabase } from '../../supabase';
import { Post } from '../../types';

// CSS アニメーション
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeInUp {
    animation: fadeInUp 0.6s ease-out forwards;
  }
  
  @keyframes battleShock {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  .animate-battleShock {
    animation: battleShock 0.5s ease-in-out;
  }
  
  @keyframes levelUpGlow {
    0% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
    50% { box-shadow: 0 0 25px rgba(255, 215, 0, 1), 0 0 35px rgba(255, 215, 0, 0.8); }
    100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
  }
  
  .animate-levelUpGlow {
    animation: levelUpGlow 1s ease-in-out infinite;
  }
`;

// スタイルを注入
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

interface CardData {
  id: string;
  title: string;
  imageUrl: string;
  attack: number;
  defense: number;
  effectText: string;
  author: string;
  score: number;
  element?: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';
  specialAbility?: string;
}

interface GameState {
  playerCards: CardData[];
  cpuCards: CardData[];
  selectedPlayerCard: CardData | null;
  selectedCpuCard: CardData | null;
  playerWins: number;
  cpuWins: number;
  gamePhase: 'initializing' | 'selecting' | 'battle' | 'result' | 'gameOver';
  battleResult: string;
  winner: 'player' | 'cpu' | null;
  cardsAppeared: boolean;
  battleClashActive: boolean;
  playerLevel: number;
  playerExp: number;
  soundEnabled: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  winStreak: number;
  comboActive: boolean;
  lastWinElement?: string;
  specialEffectActive?: string;
}

export const SimpleCardBattleGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    playerCards: [],
    cpuCards: [],
    selectedPlayerCard: null,
    selectedCpuCard: null,
    playerWins: 0,
    cpuWins: 0,
    gamePhase: 'initializing',
    battleResult: '',
    winner: null,
    cardsAppeared: false,
    battleClashActive: false,
    playerLevel: 1,
    playerExp: 0,
    soundEnabled: true,
    difficulty: 'normal',
    winStreak: 0,
    comboActive: false,
    lastWinElement: undefined,
    specialEffectActive: undefined
  });

  // サウンドエフェクト関数
  const playSound = (type: 'cardSelect' | 'cardHover' | 'battleWin' | 'battleLose' | 'battleDraw' | 'gameWin' | 'gameLose' | 'levelUp' | 'cardAppear') => {
    if (!gameState.soundEnabled) return;
    
    try {
      // Web Audio APIを使用してシンプルなサウンドを生成
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // サウンドタイプごとに周波数とパターンを設定
      switch (type) {
        case 'cardHover':
          oscillator.frequency.value = 400;
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.1);
          break;
        case 'cardSelect':
          oscillator.frequency.value = 600;
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
        case 'battleWin':
          // 勝利音（上昇音階）
          [440, 523, 659, 784].forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.15, audioContext.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.15);
            osc.start(audioContext.currentTime + i * 0.15);
            osc.stop(audioContext.currentTime + i * 0.15 + 0.15);
          });
          break;
        case 'battleLose':
          // 敗北音（下降音階）
          [440, 369, 293, 220].forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.15, audioContext.currentTime + i * 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.2 + 0.2);
            osc.start(audioContext.currentTime + i * 0.2);
            osc.stop(audioContext.currentTime + i * 0.2 + 0.2);
          });
          break;
        case 'battleDraw':
          oscillator.frequency.value = 330;
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
        case 'gameWin':
          // 勝利ファンファーレ
          [523, 659, 784, 1047].forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.2 + 0.4);
            osc.start(audioContext.currentTime + i * 0.2);
            osc.stop(audioContext.currentTime + i * 0.2 + 0.4);
          });
          break;
        case 'gameLose':
          // 敗北音
          oscillator.frequency.value = 150;
          oscillator.type = 'sawtooth';
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 1.0);
          break;
        case 'levelUp':
          // レベルアップ音
          [440, 554, 659, 880].forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.15, audioContext.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.3);
            osc.start(audioContext.currentTime + i * 0.1);
            osc.stop(audioContext.currentTime + i * 0.1 + 0.3);
          });
          break;
        case 'cardAppear':
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.4);
          break;
      }
    } catch (error) {
      console.log('サウンド再生エラー:', error);
    }
  };

  // CPU AIの改善関数
  const selectCpuCard = (difficulty: string, playerCard?: CardData): CardData => {
    const availableCards = gameState.cpuCards;
    
    switch (difficulty) {
      case 'easy':
        // ランダム選択
        return availableCards[Math.floor(Math.random() * availableCards.length)];
      
      case 'normal':
        // プレイヤーのカードを知っている場合は少し戦略的に
        if (playerCard) {
          const strongerCards = availableCards.filter(card => card.attack > playerCard.attack);
          if (strongerCards.length > 0 && Math.random() > 0.3) {
            return strongerCards[Math.floor(Math.random() * strongerCards.length)];
          }
        }
        // それ以外は中程度のカードを選ぶ傾向
        const sortedCards = [...availableCards].sort((a, b) => b.attack - a.attack);
        const midIndex = Math.floor(sortedCards.length / 2);
        return sortedCards[Math.max(0, midIndex + Math.floor(Math.random() * 2) - 1)];
      
      case 'hard':
        // プレイヤーのカードを知っている場合は最適戦略
        if (playerCard) {
          const strongerCards = availableCards.filter(card => card.attack > playerCard.attack);
          if (strongerCards.length > 0) {
            // 勝てる中で一番弱いカードを選択（リソース温存）
            return strongerCards.reduce((min, card) => card.attack < min.attack ? card : min);
          } else {
            // 勝てない場合は最強カードで戦う
            return availableCards.reduce((max, card) => card.attack > max.attack ? card : max);
          }
        }
        // それ以外は最強カードを選ぶ傾向
        return availableCards.reduce((max, card) => card.attack > max.attack ? card : max);
      
      default:
        return availableCards[Math.floor(Math.random() * availableCards.length)];
    }
  };

  // 全投稿データから生成されたカードデータ
  const [allCardData, setAllCardData] = useState<CardData[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);

  // 投稿データをカードデータに変換する関数
  const convertPostToCard = (post: Post): CardData => {
    // スコアから攻撃力と守備力を計算
    const totalScore = post.photoScore?.total_score || 50;
    const technicalScore = post.photoScore?.technical_score || 50;
    const compositionScore = post.photoScore?.composition_score || 50;
    const creativityScore = post.photoScore?.creativity_score || 50;
    
    const attack = Math.max(1000, totalScore * 30); // 1000-3000範囲
    const defense = Math.max(800, technicalScore * 25); // 800-2500範囲
    
    // 属性をスコアに基づいて決定
    const elements: Array<'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark'> = ['fire', 'water', 'earth', 'wind', 'light', 'dark'];
    const elementIndex = Math.floor((compositionScore / 100) * elements.length) % elements.length;
    const element = elements[elementIndex];
    
    // 特殊能力を創造性スコアに基づいて決定
    const specialAbilities = [
      'ヒーリング：敵の攻撃力あ50ポイント減少',
      'シールド：攻撃力が100ポイントアップ',
      'スピード：勝利時にボーナス経験値+20',
      'ライト：引き分け時に勝利扱い',
      'バーサーカー：攻撃力が200ポイントアップ',
      'クール：敵の特殊能力を無効化'
    ];
    
    const abilityIndex = Math.floor((creativityScore / 100) * specialAbilities.length) % specialAbilities.length;
    const specialAbility = creativityScore >= 70 ? specialAbilities[abilityIndex] : undefined;
    
    // カード名を生成（タイトルがない場合はAIコメントから）
    let cardTitle = post.title || '神秘の存在';
    if (!post.title && post.aiComments && post.aiComments.length > 0) {
      const comment = post.aiComments[0].content;
      // コメントからキーワードを抜き出してカード名に
      const keywords = comment.match(/[あ-んア-ン一-龯]+/g) || ['神秘'];
      cardTitle = keywords[0] + 'の' + ('謎の存在,魔法使い,守護者,戦士,賢者,詩人'.split(',')[Math.floor(Math.random() * 6)]);
    }
    
    // AIコメントからエフェクトテキストを生成
    let effectText = post.userComment || '神秘な力を秘めている。';
    if (post.photoScore?.ai_comment) {
      effectText = post.photoScore.ai_comment.substring(0, 50) + '...';
    }
    
    return {
      id: post.id,
      title: cardTitle,
      imageUrl: post.imageUrl,
      attack,
      defense,
      effectText,
      author: post.author?.name || post.author_name || '匿名',
      score: totalScore,
      element,
      specialAbility
    };
  };

  // 投稿データを取得してカード化する
  const loadAllPosts = async () => {
    try {
      setIsLoadingCards(true);
      console.log('🎴 全投稿データを取得中...');
      
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (id, name, avatar_url),
          post_tags ( tags ( id, name ) ),
          ai_comments ( id, type, content, created_at ),
          photo_scores ( 
            id, technical_score, composition_score, creativity_score, 
            engagement_score, total_score, score_level, level_description,
            ai_comment, image_analysis, created_at, updated_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50); // 最新50件を取得
      
      if (error) {
        console.error('❗ 投稿データ取得エラー:', error);
        console.error('エラー詳細:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // フォールバック用のサンプルデータを使用
        const fallbackCards: CardData[] = [
          {
            id: 'fallback1',
            title: '神秘の守護者',
            imageUrl: '/yugiura.jpg',
            attack: 1800,
            defense: 1600,
            effectText: 'データ読み込み中...',
            author: 'システム',
            score: 70,
            element: 'light',
            specialAbility: 'ライト：引き分け時に勝利扱い'
          },
          {
            id: 'fallback2',
            title: 'データの賢者',
            imageUrl: '/yugiura.jpg',
            attack: 1500,
            defense: 1200,
            effectText: '情報を収集中...',
            author: 'システム',
            score: 60,
            element: 'wind',
            specialAbility: 'スピード：勝利時にボーナス経験値+20'
          },
          {
            id: 'fallback3',
            title: 'ローディングの戦士',
            imageUrl: '/yugiura.jpg',
            attack: 2000,
            defense: 1800,
            effectText: 'データを取得中...',
            author: 'システム',
            score: 80,
            element: 'fire',
            specialAbility: 'バーサーカー：攻撃力が200ポイントアップ'
          },
          {
            id: 'fallback4',
            title: '接続の魔法使い',
            imageUrl: '/yugiura.jpg',
            attack: 1700,
            defense: 1400,
            effectText: 'サーバーと通信中...',
            author: 'システム',
            score: 65,
            element: 'water',
            specialAbility: 'クール：敵の特殊能力を無効化'
          },
          {
            id: 'fallback5',
            title: '再試行の詩人',
            imageUrl: '/yugiura.jpg',
            attack: 1600,
            defense: 1300,
            effectText: '再接続を試しています...',
            author: 'システム',
            score: 55,
            element: 'earth',
            specialAbility: 'シールド：攻撃力が100ポイントアップ'
          },
          {
            id: 'fallback6',
            title: 'エラーハンドラー',
            imageUrl: '/yugiura.jpg',
            attack: 1400,
            defense: 1100,
            effectText: '問題を解決中...',
            author: 'システム',
            score: 50,
            element: 'dark',
            specialAbility: 'ヒーリング：敵の攻撃力あ50ポイント減少'
          }
        ];
        setAllCardData(fallbackCards);
        console.log('⚠️ フォールバックデータを使用します');
        return;
      }
      
      if (posts && posts.length > 0) {
        const transformedPosts: Post[] = posts.map(post => ({
          id: post.id,
          title: post.title || '',
          userComment: post.userComment || '',
          imageUrl: post.image_url || '',
          author: post.profiles ? {
            id: post.profiles.id,
            name: post.profiles.name || '匿名',
            avatar: post.profiles.avatar_url || ''
          } : {
            id: post.author_id || '',
            name: post.author_name || '匿名',
            avatar: ''
          },
          author_name: post.profiles?.name || post.author_name || '匿名',
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          likeCount: 0,
          commentCount: 0,
          likedByCurrentUser: false,
          bookmarkedByCurrentUser: false,
          tags: post.post_tags?.map(pt => pt.tags) || [],
          aiComments: post.ai_comments?.map(comment => ({
            id: comment.id,
            type: comment.type || 'general',
            content: comment.content,
            createdAt: comment.created_at
          })) || [],
          photoScore: post.photo_scores?.[0] ? {
            technical_score: post.photo_scores[0].technical_score || 50,
            composition_score: post.photo_scores[0].composition_score || 50,
            creativity_score: post.photo_scores[0].creativity_score || 50,
            engagement_score: post.photo_scores[0].engagement_score || 50,
            total_score: post.photo_scores[0].total_score || 50,
            score_level: post.photo_scores[0].score_level || '3',
            level_description: post.photo_scores[0].level_description || 'C級',
            ai_comment: post.photo_scores[0].ai_comment || ''
          } : {
            technical_score: 50,
            composition_score: 50,
            creativity_score: 50,
            engagement_score: 50,
            total_score: 50,
            score_level: '3',
            level_description: 'C級',
            ai_comment: ''
          },
          userComment: post.user_comment || ''
        }));
        
        const cardData = transformedPosts
          .filter(post => post.imageUrl) // 画像がある投稿のみ
          .map(convertPostToCard);
        
        setAllCardData(cardData);
        console.log(`✅ ${cardData.length}枚のカードを生成しました！`);
        
        if (cardData.length === 0) {
          console.log('⚠️ 有効な投稿データがありません。サンプルデータを使用します。');
        }
      }
    } catch (error) {
      console.error('❗ カードデータ読み込みエラー:', error);
      
      // フォールバックデータを使用
      const fallbackCards: CardData[] = [
        {
          id: 'error1',
          title: 'ネットワークの守護者',
          imageUrl: '/yugiura.jpg',
          attack: 1900,
          defense: 1700,
          effectText: '接続の問題を解決しよう',
          author: 'システム',
          score: 75,
          element: 'light',
          specialAbility: 'ライト：引き分け時に勝利扱い'
        },
        {
          id: 'error2',
          title: 'デバッグの賢者',
          imageUrl: '/yugiura.jpg',
          attack: 1600,
          defense: 1300,
          effectText: 'エラーを修正しよう',
          author: 'システム',
          score: 65,
          element: 'wind',
          specialAbility: 'スピード：勝利時にボーナス経験値+20'
        },
        {
          id: 'error3',
          title: '再試行の戦士',
          imageUrl: '/yugiura.jpg',
          attack: 2100,
          defense: 1900,
          effectText: '再び挑戦しよう',
          author: 'システム',
          score: 85,
          element: 'fire',
          specialAbility: 'バーサーカー：攻撃力が200ポイントアップ'
        },
        {
          id: 'error4',
          title: 'サーバーの魔法使い',
          imageUrl: '/yugiura.jpg',
          attack: 1750,
          defense: 1450,
          effectText: 'サーバーとの繋がりを修復しよう',
          author: 'システム',
          score: 70,
          element: 'water',
          specialAbility: 'クール：敵の特殊能力を無効化'
        },
        {
          id: 'error5',
          title: 'バックアップの詩人',
          imageUrl: '/yugiura.jpg',
          attack: 1650,
          defense: 1350,
          effectText: 'データを守っている',
          author: 'システム',
          score: 60,
          element: 'earth',
          specialAbility: 'シールド：攻撃力が100ポイントアップ'
        },
        {
          id: 'error6',
          title: 'ローカルの守護者',
          imageUrl: '/yugiura.jpg',
          attack: 1500,
          defense: 1200,
          effectText: 'ローカルデータで動作している',
          author: 'システム',
          score: 55,
          element: 'dark',
          specialAbility: 'ヒーリング：敵の攻撃力あ50ポイント減少'
        }
      ];
      setAllCardData(fallbackCards);
      console.log('⚠️ エラー発生のためフォールバックデータを使用します');
    } finally {
      setIsLoadingCards(false);
    }
  };

  // 特殊能力の処理
  const applySpecialAbility = (card: CardData, isPlayer: boolean = true): { modifiedAttack: number; effectMessage?: string } => {
    let modifiedAttack = card.attack;
    let effectMessage = '';
    
    if (!card.specialAbility) return { modifiedAttack };
    
    switch (card.specialAbility) {
      case 'ヒーリング：敵の攻撃力あ50ポイント減少':
        effectMessage = `🌱 ${card.title}のヒーリング効果発動！`;
        break;
      case 'シールド：攻撃力が100ポイントアップ':
        modifiedAttack += 100;
        effectMessage = `🛡️ ${card.title}のシールド効果発動！ ATK +100`;
        break;
      case 'スピード：勝利時にボーナス経験値+20':
        effectMessage = `✨ ${card.title}のスピード効果発動！`;
        break;
      case 'ライト：引き分け時に勝利扱い':
        effectMessage = `☀️ ${card.title}のライト効果発動！`;
        break;
      case 'バーサーカー：攻撃力が200ポイントアップ':
        modifiedAttack += 200;
        effectMessage = `🔥 ${card.title}のバーサーカー効果発動！ ATK +200`;
        break;
      case 'クール：敵の特殊能力を無効化':
        effectMessage = `❄️ ${card.title}のクール効果発動！`;
        break;
    }
    
    return { modifiedAttack, effectMessage };
  };

  // コンボシステムの処理
  const checkCombo = (playerCard: CardData): { comboBonus: number; comboMessage?: string } => {
    let comboBonus = 0;
    let comboMessage = '';
    
    // 連勝コンボ
    if (gameState.winStreak >= 2) {
      comboBonus += gameState.winStreak * 50;
      comboMessage = `🔥 ${gameState.winStreak}連勝コンボ！ ATK +${gameState.winStreak * 50}`;
    }
    
    // 属性コンボ
    if (gameState.lastWinElement === playerCard.element && gameState.winStreak >= 1) {
      comboBonus += 100;
      comboMessage += ` ✨ 同属性コンボ！ ATK +100`;
    }
    
    return { comboBonus, comboMessage };
  };

  // ゲーム初期化とカード登場アニメーション
  useEffect(() => {
    loadAllPosts();
  }, []);
  
  useEffect(() => {
    if (allCardData.length > 0) {
      initializeGame();
    }
  }, [allCardData]);

  // カード登場アニメーション
  useEffect(() => {
    if (gameState.gamePhase === 'initializing') {
      setTimeout(() => {
        setGameState(prev => ({ ...prev, cardsAppeared: true }));
        playSound('cardAppear');
        
        // 1秒後にゲーム開始
        setTimeout(() => {
          setGameState(prev => ({ ...prev, gamePhase: 'selecting' }));
        }, 1000);
      }, 500);
    }
  }, [gameState.gamePhase]);

  const initializeGame = () => {
    if (allCardData.length < 6) {
      console.log('⚠️ カードデータが不足しています。最低6枚必要です。');
      return;
    }
    
    // 全カードデータからシャッフルして3枚ずつ配布
    const shuffled = [...allCardData].sort(() => Math.random() - 0.5);
    const playerCards = shuffled.slice(0, 3);
    const cpuCards = shuffled.slice(3, 6);

    setGameState(prev => ({
      ...prev,
      playerCards,
      cpuCards,
      selectedPlayerCard: null,
      selectedCpuCard: null,
      playerWins: 0,
      cpuWins: 0,
      gamePhase: 'initializing',
      battleResult: '',
      winner: null,
      cardsAppeared: false,
      battleClashActive: false
    }));
  };

  const selectPlayerCard = (card: CardData) => {
    if (gameState.gamePhase !== 'selecting') return;

    playSound('cardSelect');

    // CPUが戦略的にカードを選択
    const cpuCard = selectCpuCard(gameState.difficulty, card);

    setGameState(prev => ({
      ...prev,
      selectedPlayerCard: card,
      selectedCpuCard: cpuCard,
      gamePhase: 'battle'
    }));

    // バトルクラッシュアニメーションを開始
    setTimeout(() => {
      setGameState(prev => ({ ...prev, battleClashActive: true }));
      
      // バトル実行
      setTimeout(() => {
        executeBattle(card, cpuCard);
      }, 1000);
    }, 500);
  };

  const executeBattle = (playerCard: CardData, cpuCard: CardData) => {
    // 特殊能力とコンボの適用
    const playerAbility = applySpecialAbility(playerCard, true);
    const cpuAbility = applySpecialAbility(cpuCard, false);
    const playerCombo = checkCombo(playerCard);
    
    let playerAttack = playerAbility.modifiedAttack + playerCombo.comboBonus;
    let cpuAttack = cpuAbility.modifiedAttack;
    
    // 特殊能力の相互作用
    if (playerCard.specialAbility === 'ヒーリング：敵の攻撃力あ50ポイント減少') {
      cpuAttack = Math.max(0, cpuAttack - 50);
    }
    if (cpuCard.specialAbility === 'ヒーリング：敵の攻撃力あ50ポイント減少') {
      playerAttack = Math.max(0, playerAttack - 50);
    }
    if (playerCard.specialAbility === 'クール：敵の特殊能力を無効化') {
      cpuAttack = cpuCard.attack; // 特殊能力無効
    }
    if (cpuCard.specialAbility === 'クール：敵の特殊能力を無効化') {
      playerAttack = playerCard.attack + playerCombo.comboBonus; // 特殊能力無効
    }

    let result: string;
    let newPlayerWins = gameState.playerWins;
    let newCpuWins = gameState.cpuWins;
    let newWinStreak = gameState.winStreak;
    let expGained = 0;
    let battleMessages: string[] = [];
    
    // 特殊能力メッセージを追加
    if (playerAbility.effectMessage) battleMessages.push(playerAbility.effectMessage);
    if (cpuAbility.effectMessage) battleMessages.push(cpuAbility.effectMessage);
    if (playerCombo.comboMessage) battleMessages.push(playerCombo.comboMessage);

    // バトル結果判定
    if (playerAttack > cpuAttack || 
        (playerAttack === cpuAttack && playerCard.specialAbility === 'ライト：引き分け時に勝利扱い')) {
      result = `プレイヤーの勝利！ ATK ${playerAttack} > ${cpuAttack}`;
      newPlayerWins++;
      newWinStreak++;
      expGained = 50;
      
      // スピードボーナス
      if (playerCard.specialAbility === 'スピード：勝利時にボーナス経験値+20') {
        expGained += 20;
        battleMessages.push('✨ スピードボーナス！ EXP +20');
      }
      
      playSound('battleWin');
    } else if (cpuAttack > playerAttack) {
      result = `CPUの勝利！ ATK ${cpuAttack} > ${playerAttack}`;
      newCpuWins++;
      newWinStreak = 0; // 連勝ストップ
      expGained = 20;
      playSound('battleLose');
    } else {
      result = `引き分け！ ATK ${playerAttack} = ${cpuAttack}`;
      expGained = 30;
      playSound('battleDraw');
    }

    // 使用済みカードを除去
    const remainingPlayerCards = gameState.playerCards.filter(c => c.id !== playerCard.id);
    const remainingCpuCards = gameState.cpuCards.filter(c => c.id !== cpuCard.id);

    // レベルアップ計算
    const newExp = gameState.playerExp + expGained;
    let newLevel = gameState.playerLevel;
    let leveledUp = false;
    
    if (newExp >= gameState.playerLevel * 100) {
      newLevel++;
      leveledUp = true;
      setTimeout(() => playSound('levelUp'), 500);
    }

    // ゲーム終了判定
    let gamePhase: 'selecting' | 'battle' | 'result' | 'gameOver' = 'result';
    let winner: 'player' | 'cpu' | null = null;

    if (newPlayerWins >= 3) {
      gamePhase = 'gameOver';
      winner = 'player';
      setTimeout(() => playSound('gameWin'), 1000);
    } else if (newCpuWins >= 3) {
      gamePhase = 'gameOver';
      winner = 'cpu';
      setTimeout(() => playSound('gameLose'), 1000);
    } else if (remainingPlayerCards.length === 0) {
      gamePhase = 'gameOver';
      winner = newPlayerWins > newCpuWins ? 'player' : 'cpu';
      setTimeout(() => playSound(winner === 'player' ? 'gameWin' : 'gameLose'), 1000);
    }

    // 結果に特殊効果メッセージを追加
    const fullResult = battleMessages.length > 0 
      ? result + '\n' + battleMessages.join('\n')
      : result;

    setGameState(prev => ({
      ...prev,
      playerCards: remainingPlayerCards,
      cpuCards: remainingCpuCards,
      playerWins: newPlayerWins,
      cpuWins: newCpuWins,
      battleResult: fullResult,
      gamePhase,
      winner,
      battleClashActive: false,
      playerExp: leveledUp ? newExp - (gameState.playerLevel * 100) : newExp,
      playerLevel: newLevel,
      winStreak: newWinStreak,
      lastWinElement: newPlayerWins > gameState.playerWins ? playerCard.element : gameState.lastWinElement,
      comboActive: playerCombo.comboBonus > 0
    }));
  };

  const nextRound = () => {
    setGameState(prev => ({
      ...prev,
      selectedPlayerCard: null,
      selectedCpuCard: null,
      gamePhase: 'selecting',
      battleResult: ''
    }));
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden p-4"
      style={{
        backgroundImage: `url(/background${Math.floor(Math.random() * 2) + 1}.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-2xl animate-pulse">
            ⚔️ カードバトルアリーナ ⚔️
          </h1>
          <p className="text-white/90 text-xl drop-shadow-lg">
            攻撃力で勝負！3勝先取で勝利を掴め！
          </p>
        </div>

        {/* ゲーム設定・ステータス表示 */}
        <div className="bg-black/70 backdrop-blur-md border-2 border-yellow-400/50 rounded-xl p-6 mb-8 shadow-2xl">
          {/* プレイヤーステータス */}
          <div className="text-center mb-6">
            <div className="flex justify-center items-center gap-4 mb-4">
              <div className="text-lg text-white">
                👤 レベル {gameState.playerLevel} | 
                ⭐ EXP: {gameState.playerExp}/{gameState.playerLevel * 100}
              </div>
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(gameState.playerExp / (gameState.playerLevel * 100)) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* ゲーム設定 */}
            <div className="flex justify-center gap-4 mb-4">
              <select 
                value={gameState.difficulty} 
                onChange={(e) => setGameState(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'normal' | 'hard' }))}
                className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600"
              >
                <option value="easy">😊 初心者</option>
                <option value="normal">😐 普通</option>
                <option value="hard">😤 上級</option>
              </select>
              
              <button
                onClick={() => setGameState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                className={`px-3 py-1 rounded transition-colors ${
                  gameState.soundEnabled 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                {gameState.soundEnabled ? '🔊' : '🔇'} サウンド
              </button>
            </div>
          </div>
          
          {/* スコア表示 */}
          <div className="flex justify-center items-center gap-12">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-300 mb-2">🛡️ プレイヤー</div>
              <div className="text-4xl font-bold text-white bg-blue-600/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto border-2 border-blue-400 shadow-lg shadow-blue-500/50">
                {gameState.playerWins}
              </div>
            </div>
            <div className={`text-5xl text-yellow-400 ${gameState.battleClashActive ? 'animate-ping' : 'animate-bounce'}`}>
              {gameState.battleClashActive ? '💥' : '⚡'}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-300 mb-2">🤖 CPU</div>
              <div className="text-4xl font-bold text-white bg-red-600/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto border-2 border-red-400 shadow-lg shadow-red-500/50">
                {gameState.cpuWins}
              </div>
            </div>
          </div>
        </div>

        {/* 初期化画面 */}
        {(gameState.gamePhase === 'initializing' || isLoadingCards) && (
          <div className="text-center py-20">
            <div className="text-6xl mb-8 animate-pulse">⚔️</div>
            <h2 className="text-4xl text-white font-bold mb-8 drop-shadow-lg">
              {isLoadingCards ? '🎴 カードを生成中...' : '戦いの準備中...'}
            </h2>
            
            {isLoadingCards ? (
              <div className="mb-8">
                <div className="text-white/80 text-lg mb-4">
                  📊 あなたの全投稿からカードを作成中...
                </div>
                <div className="w-64 mx-auto bg-gray-700 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            ) : (
              <div className="mb-8">
                <div className="text-green-400 text-lg mb-4">
                  ✅ {allCardData.length}枚のカードが準備完了！
                </div>
              </div>
            )}
            
            <div className="flex justify-center gap-4">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i}
                  className={`w-20 h-28 bg-yellow-400/20 border-2 border-yellow-400 rounded-lg ${gameState.cardsAppeared ? 'animate-bounce' : 'animate-pulse'}`}
                  style={{ animationDelay: `${i * 200}ms` }}
                >
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    🎴
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ゲーム画面 */}
        {gameState.gamePhase === 'selecting' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl text-white font-bold mb-4 drop-shadow-lg animate-pulse">
                ✨ カードを選択せよ ✨
              </h2>
              <div className="bg-yellow-400/20 border border-yellow-400 rounded-lg p-3 inline-block">
                <p className="text-yellow-200 font-semibold">
                  🎯 戦略を練り、最強のカードで勝利を掴め！
                </p>
              </div>
            </div>
            
            {/* カード選択エリア */}
            <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {gameState.playerCards.map((card, index) => (
                  <div 
                    key={card.id}
                    className={`group relative cursor-pointer transform hover:scale-110 hover:-translate-y-4 transition-all duration-500 ease-out ${
                      gameState.cardsAppeared ? 'animate-fadeInUp' : 'opacity-0'
                    }`}
                    onClick={() => selectPlayerCard(card)}
                    onMouseEnter={() => playSound('cardHover')}
                    style={{
                      animationDelay: `${index * 200}ms`
                    }}
                  >
                    {/* カードグロー効果 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-110"></div>
                    
                    {/* カード本体 */}
                    <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl p-4 border-2 border-gray-600 group-hover:border-yellow-400 transition-all duration-300 shadow-2xl">
                      <YuGiOhOrikaGenerator
                        title={card.title}
                        level={Math.floor(card.score / 15) + 1}
                        attribute="光"
                        type="戦士族"
                        attack={card.attack}
                        defense={card.defense}
                        effectText={card.effectText}
                        imageUrl={card.imageUrl}
                        cardType="effect"
                        size="medium"
                        debugMode={false}
                      />
                      
                      {/* カード情報 */}
                      <div className="mt-3 text-center">
                        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-3 py-1 rounded-full text-lg font-bold shadow-lg">
                          ⚔️ ATK: {card.attack}
                        </div>
                        
                        {/* 属性表示 */}
                        {card.element && (
                          <div className={`mt-2 px-2 py-1 rounded-full text-xs font-bold inline-block ${
                            card.element === 'fire' ? 'bg-red-500 text-white' :
                            card.element === 'water' ? 'bg-blue-500 text-white' :
                            card.element === 'earth' ? 'bg-green-500 text-white' :
                            card.element === 'wind' ? 'bg-gray-300 text-black' :
                            card.element === 'light' ? 'bg-yellow-400 text-black' :
                            'bg-purple-600 text-white'
                          }`}>
                            {
                              card.element === 'fire' ? '🔥 炎' :
                              card.element === 'water' ? '💧 水' :
                              card.element === 'earth' ? '🌍 土' :
                              card.element === 'wind' ? '💨 風' :
                              card.element === 'light' ? '☀️ 光' :
                              '🌑 闇'
                            }
                          </div>
                        )}
                        
                        {/* 特殊能力表示 */}
                        {card.specialAbility && (
                          <div className="mt-2 bg-purple-600/20 border border-purple-400 rounded-lg p-2">
                            <div className="text-purple-300 text-xs font-bold">✨ 特殊能力</div>
                            <div className="text-white text-xs">{card.specialAbility}</div>
                          </div>
                        )}
                        
                        <div className="mt-2 text-white/80 text-sm">
                          {card.author}
                        </div>
                      </div>
                      
                      {/* 選択エフェクト */}
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      
                      {/* ホバー時のスパークル */}
                      <div className="absolute top-2 right-2 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-spin">
                        ✨
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* バトル画面 */}
        {(gameState.gamePhase === 'battle' || gameState.gamePhase === 'result') && gameState.selectedPlayerCard && gameState.selectedCpuCard && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-4xl text-white font-bold mb-4 drop-shadow-lg animate-pulse">
                ⚔️ バトル開始！ ⚔️
              </h2>
              <div className="bg-red-500/20 border border-red-400 rounded-lg p-3 inline-block animate-bounce">
                <p className="text-red-200 font-semibold">
                  🔥 運命を決める一撃が放たれる！
                </p>
              </div>
            </div>

            {/* バトルフィールド */}
            <div className="relative bg-black/60 backdrop-blur-md rounded-3xl p-8 border-2 border-yellow-400/30 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                {/* プレイヤーサイド */}
                <div className="text-center relative">
                  <div className="bg-blue-600/20 rounded-xl p-4 border border-blue-400/50">
                    <h3 className="text-2xl text-blue-300 mb-4 font-bold flex items-center justify-center gap-2">
                      🛡️ プレイヤー
                      <div className="animate-pulse text-blue-400">⚡</div>
                    </h3>
                    
                    <div className="relative transform hover:scale-105 transition-transform duration-300">
                      {/* カードグロー */}
                      <div className="absolute inset-0 bg-blue-500/30 rounded-xl blur-lg animate-pulse"></div>
                      
                      <div className="relative">
                        <YuGiOhOrikaGenerator
                          title={gameState.selectedPlayerCard.title}
                          level={Math.floor(gameState.selectedPlayerCard.score / 15) + 1}
                          attribute="光"
                          type="戦士族"
                          attack={gameState.selectedPlayerCard.attack}
                          defense={gameState.selectedPlayerCard.defense}
                          effectText={gameState.selectedPlayerCard.effectText}
                          imageUrl={gameState.selectedPlayerCard.imageUrl}
                          cardType="effect"
                          size="medium"
                          debugMode={false}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-full text-xl font-bold shadow-lg">
                      ⚔️ ATK: {gameState.selectedPlayerCard.attack}
                    </div>
                  </div>
                </div>

                {/* VS エフェクト - バトルクラッシュ強化 */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className={`text-6xl font-bold drop-shadow-2xl transition-all duration-500 ${
                    gameState.battleClashActive 
                      ? 'text-red-400 animate-ping scale-150' 
                      : 'text-yellow-400 animate-pulse'
                  }`}>
                    {gameState.battleClashActive ? '💥CLASH💥' : '⚡VS⚡'}
                  </div>
                  <div className={`absolute inset-0 rounded-full blur-2xl ${
                    gameState.battleClashActive 
                      ? 'bg-red-400/40 animate-ping' 
                      : 'bg-yellow-400/20 animate-ping'
                  }`}></div>
                  
                  {/* 追加エフェクト */}
                  {gameState.battleClashActive && (
                    <>
                      <div className="absolute inset-0 bg-white/50 rounded-full blur-xl animate-pulse"></div>
                      <div className="absolute -inset-10 border-4 border-yellow-400 rounded-full animate-ping"></div>
                    </>
                  )}
                </div>

                {/* CPUサイド */}
                <div className="text-center relative">
                  <div className="bg-red-600/20 rounded-xl p-4 border border-red-400/50">
                    <h3 className="text-2xl text-red-300 mb-4 font-bold flex items-center justify-center gap-2">
                      🤖 CPU
                      <div className="animate-pulse text-red-400">💀</div>
                    </h3>
                    
                    <div className="relative transform hover:scale-105 transition-transform duration-300">
                      {/* カードグロー */}
                      <div className="absolute inset-0 bg-red-500/30 rounded-xl blur-lg animate-pulse"></div>
                      
                      <div className="relative">
                        <YuGiOhOrikaGenerator
                          title={gameState.selectedCpuCard.title}
                          level={Math.floor(gameState.selectedCpuCard.score / 15) + 1}
                          attribute="闇"
                          type="戦士族"
                          attack={gameState.selectedCpuCard.attack}
                          defense={gameState.selectedCpuCard.defense}
                          effectText={gameState.selectedCpuCard.effectText}
                          imageUrl={gameState.selectedCpuCard.imageUrl}
                          cardType="effect"
                          size="medium"
                          debugMode={false}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-full text-xl font-bold shadow-lg">
                      ⚔️ ATK: {gameState.selectedCpuCard.attack}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* バトル結果 */}
            {gameState.gamePhase === 'result' && (
              <div className="text-center mt-8">
                <div className="relative bg-black/80 backdrop-blur-lg border-2 border-yellow-400 rounded-2xl p-8 max-w-3xl mx-auto shadow-2xl">
                  {/* 勝利エフェクト */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-red-400/20 rounded-2xl animate-pulse"></div>
                  
                  <div className="relative z-10">
                    <div className="mb-6">
                      <h3 className="text-3xl font-bold text-white mb-4 drop-shadow-lg animate-bounce">
                        {gameState.battleResult.includes('プレイヤー') ? '🎊' : gameState.battleResult.includes('CPU') ? '💀' : '⚖️'} 
                        {gameState.battleResult.split('\n')[0]}
                        {gameState.battleResult.includes('プレイヤー') ? '🎊' : gameState.battleResult.includes('CPU') ? '💀' : '⚖️'}
                      </h3>
                      
                      {/* 特殊効果メッセージ表示 */}
                      {gameState.battleResult.includes('\n') && (
                        <div className="bg-purple-600/20 border border-purple-400 rounded-lg p-4 mb-4">
                          <h4 className="text-purple-300 font-bold mb-2">✨ 特殊効果</h4>
                          <div className="text-white text-sm space-y-1">
                            {gameState.battleResult.split('\n').slice(1).map((msg, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                <span>{msg}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* パーティクルエフェクト */}
                      {gameState.battleResult.includes('プレイヤー') && (
                        <div className="flex justify-center gap-2 text-2xl animate-bounce">
                          <span className="animate-pulse delay-100">✨</span>
                          <span className="animate-pulse delay-200">🎉</span>
                          <span className="animate-pulse delay-300">⭐</span>
                          <span className="animate-pulse delay-400">🎊</span>
                          <span className="animate-pulse delay-500">✨</span>
                        </div>
                      )}
                    </div>
                    
                    {gameState.winner === null ? (
                      <button
                        onClick={nextRound}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
                      >
                        ⚡ 次のラウンドへ ⚡
                      </button>
                    ) : (
                      <div>
                        <h2 className="text-4xl font-bold text-white mb-6 drop-shadow-xl">
                          {gameState.winner === 'player' ? (
                            <span className="text-yellow-400 animate-pulse">👑 勝利の栄光！ 👑</span>
                          ) : (
                            <span className="text-red-400">💀 敗北の刻印... 💀</span>
                          )}
                        </h2>
                        
                        {/* 最終結果エフェクト */}
                        <div className="mb-6">
                          {gameState.winner === 'player' ? (
                            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400 rounded-xl p-4">
                              <p className="text-yellow-200 text-lg font-semibold">
                                🏆 素晴らしい戦略と判断力で勝利を掴んだ！ 🏆
                              </p>
                            </div>
                          ) : (
                            <div className="bg-gradient-to-r from-red-500/20 to-gray-500/20 border border-red-400 rounded-xl p-4">
                              <p className="text-red-200 text-lg font-semibold">
                                ⚡ 次回は更なる戦略で挑戦せよ！ ⚡
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-4 justify-center">
                          <button
                            onClick={initializeGame}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
                          >
                            🔄 新たな戦いを始める 🔄
                          </button>
                          
                          {/* 特別報酬表示（レベルアップ時） */}
                          {gameState.playerLevel > 1 && (
                            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400 rounded-xl p-4 animate-levelUpGlow">
                              <p className="text-yellow-200 text-sm font-semibold">
                                🌟 レベル{gameState.playerLevel}達成！ 🌟
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ゲーム終了画面 */}
        {gameState.gamePhase === 'gameOver' && (
          <div className="text-center">
            <div className="relative bg-black/90 backdrop-blur-lg border-4 border-yellow-400 rounded-3xl p-12 max-w-4xl mx-auto shadow-2xl">
              {/* 勝利/敗北エフェクト */}
              <div className={`absolute inset-0 rounded-3xl animate-pulse ${
                gameState.winner === 'player' 
                  ? 'bg-gradient-to-r from-yellow-400/20 via-gold-400/20 to-orange-400/20' 
                  : 'bg-gradient-to-r from-red-400/20 via-gray-400/20 to-black/20'
              }`}></div>
              
              <div className="relative z-10">
                {gameState.winner === 'player' ? (
                  <div>
                    <h2 className="text-6xl font-bold text-yellow-400 mb-8 drop-shadow-2xl animate-bounce">
                      👑 チャンピオン誕生！ 👑
                    </h2>
                    <div className="flex justify-center gap-4 text-4xl animate-pulse mb-6">
                      <span className="animate-spin">🏆</span>
                      <span className="animate-bounce delay-100">⭐</span>
                      <span className="animate-pulse delay-200">✨</span>
                      <span className="animate-bounce delay-300">🎊</span>
                      <span className="animate-spin delay-400">🏆</span>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border border-yellow-400 rounded-2xl p-6 mb-8">
                      <p className="text-yellow-100 text-2xl font-bold">
                        🌟 伝説の戦士として記録された！ 🌟
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-6xl font-bold text-red-400 mb-8 drop-shadow-2xl">
                      💀 敗北... 💀
                    </h2>
                    <div className="bg-gradient-to-r from-red-500/30 to-gray-500/30 border border-red-400 rounded-2xl p-6 mb-8">
                      <p className="text-red-100 text-2xl font-bold">
                        ⚡ 次なる挑戦で復讐を果たせ！ ⚡
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="bg-black/50 rounded-xl p-6 mb-8 border border-white/20">
                  <h3 className="text-2xl text-white font-bold mb-4">📊 最終戦績</h3>
                  <div className="flex justify-center gap-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-300">プレイヤー</div>
                      <div className="text-5xl font-bold text-white">{gameState.playerWins}</div>
                    </div>
                    <div className="text-4xl text-yellow-400">-</div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-300">CPU</div>
                      <div className="text-5xl font-bold text-white">{gameState.cpuWins}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4 items-center">
                  <button
                    onClick={initializeGame}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-6 px-12 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-2xl text-2xl"
                  >
                    🎮 新たな伝説を始める 🎮
                  </button>
                  
                  {/* 最終統計 */}
                  <div className="bg-black/50 rounded-xl p-4 border border-white/20 text-center">
                    <h4 className="text-lg text-white font-bold mb-2">🏆 総合成績</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-blue-300 font-bold">レベル</div>
                        <div className="text-white text-xl">{gameState.playerLevel}</div>
                      </div>
                      <div>
                        <div className="text-green-300 font-bold">経験値</div>
                        <div className="text-white text-xl">{gameState.playerExp + (gameState.playerLevel - 1) * 100}</div>
                      </div>
                      <div>
                        <div className="text-yellow-300 font-bold">難易度</div>
                        <div className="text-white text-xl">
                          {gameState.difficulty === 'easy' ? '😊' : gameState.difficulty === 'normal' ? '😐' : '😤'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ルール説明 */}
        <div className="relative mt-12 bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-5xl mx-auto shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl"></div>
          <div className="relative z-10">
            <h3 className="text-3xl font-bold text-white mb-6 text-center flex items-center justify-center gap-3">
              <span className="animate-spin">⚙️</span>
              バトルルール
              <span className="animate-spin">⚙️</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-600/20 border border-blue-400/50 rounded-xl p-6">
                <h4 className="text-xl font-bold text-blue-300 mb-4 flex items-center gap-2">
                  🛡️ 基本ルール
                </h4>
                <ul className="text-white/90 space-y-3">
                  <li className="flex items-center gap-2">
                    <span className="text-yellow-400">⚔️</span>
                    プレイヤーは3枚のカードから1枚を選択
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-400">🤖</span>
                    CPUが戦略的に1枚を選択
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">💥</span>
                    攻撃力（ATK）の高い方が勝利
                  </li>
                </ul>
              </div>
              
              <div className="bg-purple-600/20 border border-purple-400/50 rounded-xl p-6">
                <h4 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                  ✨ 特殊システム
                </h4>
                <ul className="text-white/90 space-y-3">
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">🔮</span>
                    各カードに特殊能力あり
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-orange-400">🔥</span>
                    連勝でコンボボーナス
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">🌊</span>
                    属性相性で追加ボーナス
                  </li>
                </ul>
              </div>
              
              <div className="bg-green-600/20 border border-green-400/50 rounded-xl p-6">
                <h4 className="text-xl font-bold text-green-300 mb-4 flex items-center gap-2">
                  🏆 勝利条件
                </h4>
                <ul className="text-white/90 space-y-3">
                  <li className="flex items-center gap-2">
                    <span className="text-yellow-400">👑</span>
                    3勝先取でゲーム勝利
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">📷</span>
                    カードは実際の投稿写真から生成
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-orange-400">⚡</span>
                    写真の採点結果が攻撃力に反映
                  </li>
                </ul>
              </div>
              
              <div className="bg-yellow-600/20 border border-yellow-400/50 rounded-xl p-6">
                <h4 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
                  📊 データ情報
                </h4>
                <ul className="text-white/90 space-y-3">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-400">🎴</span>
                    総カード数: {allCardData.length}枚
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">🔄</span>
                    毎ゲーム新しいカードでプレイ
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">🎆</span>
                    あなたの思い出がカードに
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};