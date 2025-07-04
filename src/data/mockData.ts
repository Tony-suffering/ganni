import { Post, Tag, AIComment } from '../types';

export const mockTags: Tag[] = [
  { id: '1', name: 'ワクワク系', category: 'emotion', color: '#ff6b6b' },
  { id: '2', name: '癒し系', category: 'emotion', color: '#4ecdc4' },
  { id: '3', name: '驚き発見', category: 'discovery', color: '#ffe66d' },
  { id: '4', name: '笑顔になる', category: 'emotion', color: '#ff8b94' },
  { id: '5', name: '挑戦中', category: 'activity', color: '#a8e6cf' },
  { id: '6', name: '思い出キープ', category: 'moment', color: '#d4a4eb' },
  { id: '7', name: '今この瞬間', category: 'moment', color: '#ffd93d' },
  { id: '8', name: '自分らしさ', category: 'self', color: '#6c5ce7' },
  { id: '9', name: 'みんなで楽しむ', category: 'social', color: '#fd79a8' },
  { id: '10', name: 'ふとした瞬間', category: 'daily', color: '#74b9ff' },
];

const generateAIComments = (): AIComment[] => [
  {
    id: '1',
    type: 'comment',
    content: '光と影のコントラストがエモすぎる ✨ 旅の始まりの高揚感が伝わってくる！',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '2',
    type: 'question',
    content: 'この瞬間の音の風景も気になる！どんなサウンドが聞こえてた？ 🎧',
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: '3',
    type: 'observation',
    content: '建築と人の動きのコントラストが美しい 🏗️ 機能美の新しい表現だね',
    createdAt: new Date(Date.now() - 900000).toISOString()
  }
];

export const mockPosts: Post[] = [
  {
    id: '1',
    title: '光の聖堂 - 朝の家での時間',
    imageUrl: 'https://images.pexels.com/photos/358319/pexels-photo-358319.jpeg?auto=compress&cs=tinysrgb&w=800',
    aiDescription: 'A magnificent room is filled with natural light streaming through geometric patterns. The architectural beauty creates a cathedral-like atmosphere where everyday moments become silhouettes against the luminous backdrop.',
    userComment: '家のリビングで撮影。朝の光が部屋全体を包み込んで、まるで光の聖堂のようでした。日常の中の小さな幸せと建築の美しさが重なる瞬間。',
    tags: [mockTags[1], mockTags[6]],
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T08:30:00Z',
    author: { id: 'user1', name: '田中 航', avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100' },
    aiComments: generateAIComments(),
    imageAIDescription: '',
    likeCount: 12,
    likedByCurrentUser: false,
    bookmarkedByCurrentUser: false,
    commentCount: 5,
  },
  {
    id: '2',
    title: '雲海を舞う - 散歩での風景',
    imageUrl: 'https://images.pexels.com/photos/912050/pexels-photo-912050.jpeg?auto=compress&cs=tinysrgb&w=800',
    aiDescription: 'Clouds gracefully float against a canvas of golden sky, creating beautiful silhouettes through the amber twilight. The scene captures the poetry of nature in its most serene moment.',
    userComment: '散歩中に空を見上げた瞬間を捉えました。夕日に染まった雲海が、まるで空の舞踏のよう。日常の中の小さな感動がよみがえります。',
    tags: [mockTags[0], mockTags[9]],
    createdAt: '2024-01-14T18:45:00Z',
    updatedAt: '2024-01-14T18:45:00Z',
    author: { id: 'user2', name: '佐藤 美咲', avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100' },
    aiComments: [
      {
        id: '4',
        type: 'comment',
        content: '夕焼けフライトがまじでドラマチック ✈️ 黄金の空が最高のシチュエーション',
        createdAt: new Date(Date.now() - 2700000).toISOString()
      },
      {
        id: '5',
        type: 'question',
        content: 'この完璧タイミングの秘訣、教えて！夕方の空港でこんなショットとれるのすごい 📸',
        createdAt: new Date(Date.now() - 1200000).toISOString()
      }
    ],
    imageAIDescription: '',
    likeCount: 8,
    likedByCurrentUser: true,
    bookmarkedByCurrentUser: false,
    commentCount: 3,
  },
  {
    id: '3',
    title: '静寂の中の物語 - 深夜の待合室',
    imageUrl: 'https://images.pexels.com/photos/2026324/pexels-photo-2026324.jpeg?auto=compress&cs=tinysrgb&w=800',
    aiDescription: 'Travelers in quiet anticipation occupy the modern waiting lounge, their figures softly illuminated by the ambient terminal lighting. The space breathes with a calm energy of journeys about to begin.',
    userComment: '深夜便を待つ人々の静寂。誰もが心の中で旅路に思いを馳せている、そんな特別な時間と空間。空港の待合室には、いつも物語がある。',
    tags: [mockTags[5], mockTags[9]],
    createdAt: '2024-01-13T23:15:00Z',
    updatedAt: '2024-01-13T23:15:00Z',
    author: { id: 'user3', name: '山田 健太', avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=100' },
    aiComments: [
      {
        id: '6',
        type: 'observation',
        content: '深夜の空港の雰囲気がエモい 🌃 静かな緊張感が伝わってくる',
        createdAt: new Date(Date.now() - 4500000).toISOString()
      }
    ],
    imageAIDescription: '',
    likeCount: 15,
    likedByCurrentUser: false,
    bookmarkedByCurrentUser: true,
    commentCount: 7,
  },
  {
    id: '4',
    title: '未来都市の光景 - 中部の夜景',
    imageUrl: 'https://images.pexels.com/photos/723240/pexels-photo-723240.jpeg?auto=compress&cs=tinysrgb&w=800',
    aiDescription: 'The runway extends like a river of light into the distance, bordered by a constellation of guidance lights. Aircraft rest peacefully in the background, creating a scene of technological serenity.',
    userComment: '滑走路の向こうに広がる夜景。管制塔から見下ろした景色は、まるで未来都市のよう。空港は眠らない街、そんな印象を受けました。',
    tags: [mockTags[2], mockTags[7]],
    createdAt: '2024-01-12T22:00:00Z',
    updatedAt: '2024-01-12T22:00:00Z',
    author: { id: 'user4', name: '鈴木 麗奈', avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100' },
    aiComments: generateAIComments(),
    imageAIDescription: '',
    likeCount: 20,
    likedByCurrentUser: true,
    bookmarkedByCurrentUser: false,
    commentCount: 2,
  },
  {
    id: '5',
    title: '朝の律動 - ターミナルの交響曲',
    imageUrl: 'https://images.pexels.com/photos/2026342/pexels-photo-2026342.jpeg?auto=compress&cs=tinysrgb&w=800',
    aiDescription: 'Passengers move through the terminal corridor like gentle waves, their movements creating a rhythmic dance of departure and arrival. The architecture frames human stories in motion.',
    userComment: '朝のラッシュ時間、ターミナルを行き交う人々。みんなそれぞれの目的地へ向かう姿が、人生の縮図のように見えて印象的でした。',
    tags: [mockTags[6], mockTags[9]],
    createdAt: '2024-01-11T07:30:00Z',
    updatedAt: '2024-01-11T07:30:00Z',
    author: { id: 'user1', name: '田中 航', avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100' },
    aiComments: [
      {
        id: '7',
        type: 'question',
        content: '朝のラッシュでこの角度が思いついたの？人の流れがいいリズム 🚶‍♂️',
        createdAt: new Date(Date.now() - 5400000).toISOString()
      }
    ],
    imageAIDescription: '',
    likeCount: 6,
    likedByCurrentUser: false,
    bookmarkedByCurrentUser: false,
    commentCount: 1,
  },
  {
    id: '6',
    title: '黄金の休息 - 夕方のカフェタイム',
    imageUrl: 'https://images.pexels.com/photos/2026365/pexels-photo-2026365.jpeg?auto=compress&cs=tinysrgb&w=800',
    aiDescription: 'Golden hour bathes the cafe in warm amber light, transforming ordinary seating areas into spaces of contemplation and dreams. Shadows and light play together in perfect harmony.',
    userComment: '夕方のカフェ。お客さんがコーヒーを飲みながら窓の外を眺める姿が、とても絵になっていました。日常の中の束の間の安らぎ。',
    tags: [mockTags[1], mockTags[5]],
    createdAt: '2024-01-10T17:20:00Z',
    updatedAt: '2024-01-10T17:20:00Z',
    author: { id: 'user2', name: '佐藤 美咲', avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100' },
    aiComments: [
      {
        id: '8',
        type: 'comment',
        content: 'カフェタイムが日常のハイライトだよね ☕ 黄金の光がいい感じ出してる',
        createdAt: new Date(Date.now() - 6300000).toISOString()
      },
      {
        id: '9',
        type: 'observation',
        content: '空港カフェは世界共通のチル空間 ✨ この静けさがいいんだよね',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    imageAIDescription: '',
    likeCount: 10,
    likedByCurrentUser: false,
    bookmarkedByCurrentUser: true,
    commentCount: 4,
  }
];