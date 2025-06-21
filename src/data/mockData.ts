import { Post, Tag, AIComment } from '../types';

export const mockTags: Tag[] = [
  { id: '1', name: '風景', category: 'nature', color: '#36abff' },
  { id: '2', name: '人物', category: 'people', color: '#efb23b' },
  { id: '3', name: '建物', category: 'architecture', color: '#7cc7ff' },
  { id: '4', name: '食べ物', category: 'food', color: '#f2c464' },
  { id: '5', name: '旅行', category: 'travel', color: '#10b981' },
  { id: '6', name: '自然', category: 'nature', color: '#8b5cf6' },
  { id: '7', name: '夜景', category: 'night', color: '#334155' },
  { id: '8', name: 'アート', category: 'art', color: '#6366f1' },
  { id: '9', name: '動物', category: 'animal', color: '#ba7c25' },
  { id: '10', name: 'スポーツ', category: 'sports', color: '#ef4444' },
  { id: '11', name: 'イベント', category: 'event', color: '#f59e42' },
  { id: '12', name: '日常', category: 'life', color: '#005bc4' },
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
    title: '光の聖堂 - 羽田空港の朝',
    imageUrl: 'https://images.pexels.com/photos/358319/pexels-photo-358319.jpeg?auto=compress&cs=tinysrgb&w=800',
    aiDescription: 'A magnificent glass terminal stretches endlessly, with natural light streaming through geometric patterns. The architectural grandeur creates a cathedral-like atmosphere where travelers become silhouettes against the luminous backdrop.',
    userComment: '羽田空港の国際線ターミナルで撮影。朝の光が建物全体を包み込んで、まるで光の聖堂のようでした。旅立ちの高揚感と建築の美しさが重なる瞬間。',
    tags: [mockTags[0], mockTags[4]],
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T08:30:00Z',
    author: { name: '田中 航', avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100' },
    aiComments: generateAIComments(),
    imageAIDescription: '',
  },
  {
    id: '2',
    title: '雲海を舞う - 成田発の詩',
    imageUrl: 'https://images.pexels.com/photos/912050/pexels-photo-912050.jpeg?auto=compress&cs=tinysrgb&w=800',
    aiDescription: 'A commercial aircraft gracefully ascends against a canvas of golden clouds, its silhouette cutting through the amber twilight sky. The scene captures the poetry of flight in its most serene moment.',
    userComment: '成田から飛び立つ瞬間を捉えました。夕日に染まった雲海の中を上昇していく機体が、まるで空の舞踏のよう。旅の始まりの感動がよみがえります。',
    tags: [mockTags[1], mockTags[3]],
    createdAt: '2024-01-14T18:45:00Z',
    updatedAt: '2024-01-14T18:45:00Z',
    author: { name: '佐藤 美咲', avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100' },
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
  },
  {
    id: '3',
    title: '静寂の中の物語 - 深夜の待合室',
    imageUrl: 'https://images.pexels.com/photos/2026324/pexels-photo-2026324.jpeg?auto=compress&cs=tinysrgb&w=800',
    aiDescription: 'Travelers in quiet anticipation occupy the modern waiting lounge, their figures softly illuminated by the ambient terminal lighting. The space breathes with a calm energy of journeys about to begin.',
    userComment: '深夜便を待つ人々の静寂。誰もが心の中で旅路に思いを馳せている、そんな特別な時間と空間。空港の待合室には、いつも物語がある。',
    tags: [mockTags[2], mockTags[5]],
    createdAt: '2024-01-13T23:15:00Z',
    updatedAt: '2024-01-13T23:15:00Z',
    author: { name: '山田 健太', avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=100' },
    aiComments: [
      {
        id: '6',
        type: 'observation',
        content: '深夜の空港の雰囲気がエモい 🌃 静かな緊張感が伝わってくる',
        createdAt: new Date(Date.now() - 4500000).toISOString()
      }
    ],
    imageAIDescription: '',
  },
  {
    id: '4',
    title: '未来都市の光景 - 中部の夜景',
    imageUrl: 'https://images.pexels.com/photos/723240/pexels-photo-723240.jpeg?auto=compress&cs=tinysrgb&w=800',
    aiDescription: 'The runway extends like a river of light into the distance, bordered by a constellation of guidance lights. Aircraft rest peacefully in the background, creating a scene of technological serenity.',
    userComment: '滑走路の向こうに広がる夜景。管制塔から見下ろした景色は、まるで未来都市のよう。空港は眠らない街、そんな印象を受けました。',
    tags: [mockTags[6], mockTags[7]],
    createdAt: '2024-01-12T22:00:00Z',
    updatedAt: '2024-01-12T22:00:00Z',
    author: { name: '鈴木 麗奈', avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100' },
    aiComments: generateAIComments(),
    imageAIDescription: '',
  },
  {
    id: '5',
    title: '朝の律動 - ターミナルの交響曲',
    imageUrl: 'https://images.pexels.com/photos/2026342/pexels-photo-2026342.jpeg?auto=compress&cs=tinysrgb&w=800',
    aiDescription: 'Passengers move through the terminal corridor like gentle waves, their movements creating a rhythmic dance of departure and arrival. The architecture frames human stories in motion.',
    userComment: '朝のラッシュ時間、ターミナルを行き交う人々。みんなそれぞれの目的地へ向かう姿が、人生の縮図のように見えて印象的でした。',
    tags: [mockTags[0], mockTags[5]],
    createdAt: '2024-01-11T07:30:00Z',
    updatedAt: '2024-01-11T07:30:00Z',
    author: { name: '田中 航', avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100' },
    aiComments: [
      {
        id: '7',
        type: 'question',
        content: '朝のラッシュでこの角度が思いついたの？人の流れがいいリズム 🚶‍♂️',
        createdAt: new Date(Date.now() - 5400000).toISOString()
      }
    ],
    imageAIDescription: '',
  },
  {
    id: '6',
    title: '黄金の休息 - 夕方のカフェタイム',
    imageUrl: 'https://images.pexels.com/photos/2026365/pexels-photo-2026365.jpeg?auto=compress&cs=tinysrgb&w=800',
    aiDescription: 'Golden hour bathes the terminal in warm amber light, transforming ordinary waiting areas into spaces of contemplation and dreams. Shadows and light play together in perfect harmony.',
    userComment: '夕方の空港カフェ。旅行者がコーヒーを飲みながら窓の外を眺める姿が、とても絵になっていました。旅の途中の束の間の安らぎ。',
    tags: [mockTags[2], mockTags[3]],
    createdAt: '2024-01-10T17:20:00Z',
    updatedAt: '2024-01-10T17:20:00Z',
    author: { name: '佐藤 美咲', avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100' },
    aiComments: [
      {
        id: '8',
        type: 'comment',
        content: 'カフェタイムが旅のハイライトだよね ☕ 黄金の光がいい感じ出してる',
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
  }
];