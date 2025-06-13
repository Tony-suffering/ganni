import { Post, Tag, AIComment } from '../types';

export const mockTags: Tag[] = [
  { id: '1', name: '国際線ターミナル', category: 'terminal', color: '#0072f5' },
  { id: '2', name: '離陸', category: 'aircraft', color: '#efb23b' },
  { id: '3', name: '待合室', category: 'terminal', color: '#7cc7ff' },
  { id: '4', name: '夕焼け', category: 'atmosphere', color: '#f2c464' },
  { id: '5', name: '建築美', category: 'architecture', color: '#36abff' },
  { id: '6', name: '旅行者', category: 'people', color: '#ba7c25' },
  { id: '7', name: '滑走路', category: 'aircraft', color: '#005bc4' },
  { id: '8', name: '夜景', category: 'atmosphere', color: '#334155' },
  { id: '9', name: 'アート', category: 'architecture', color: '#6366f1' },
  { id: '10', name: '静寂', category: 'atmosphere', color: '#8b5cf6' },
  { id: '11', name: '感動', category: 'atmosphere', color: '#ef4444' },
  { id: '12', name: '未来', category: 'architecture', color: '#10b981' },
];

const generateAIComments = (): AIComment[] => [
  {
    id: '1',
    type: 'comment',
    content: 'この写真から感じる光と影のコントラストが、まさに旅の始まりと終わりを象徴しているように思えます。空港という場所が持つ独特の時間の流れを見事に捉えていますね。',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '2',
    type: 'question',
    content: 'この瞬間を撮影された時、周りにはどのような音が聞こえていましたか？空港特有の音の風景も、この写真の物語の一部のような気がします。',
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: '3',
    type: 'observation',
    content: '建築の幾何学的な美しさと、そこを行き交う人々の有機的な動きの対比が印象的です。現代の空港デザインが目指す「機能美」の本質を表現した一枚だと感じます。',
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
    aiComments: generateAIComments()
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
        content: '飛行機の離陸シーンは何度見ても感動的ですが、この夕焼けの中での瞬間は特別ですね。黄金色の空に溶け込む機体が、まるで神話の中の場面のようです。',
        createdAt: new Date(Date.now() - 2700000).toISOString()
      },
      {
        id: '5',
        type: 'question',
        content: 'この写真を撮られた時の気温や風はどうでしたか？夕方の空港での撮影は、時間との勝負もありそうですが、どのようにしてこの完璧なタイミングを捉えたのでしょう？',
        createdAt: new Date(Date.now() - 1200000).toISOString()
      }
    ]
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
        content: '深夜の空港は昼間とは全く違う表情を見せますね。静寂の中にある緊張感と期待感が、写真からも伝わってきます。',
        createdAt: new Date(Date.now() - 4500000).toISOString()
      }
    ]
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
    aiComments: generateAIComments()
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
        content: 'この朝の風景を撮影する際、どのような心境でシャッターを切られましたか？人々の動きの中に何か特別なリズムを感じ取られたのでしょうか？',
        createdAt: new Date(Date.now() - 5400000).toISOString()
      }
    ]
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
        content: 'カフェでの一瞬の休息が、旅の重要な一部分だということを改めて感じさせてくれる写真ですね。黄金色の光が、その特別な時間を演出しています。',
        createdAt: new Date(Date.now() - 6300000).toISOString()
      },
      {
        id: '9',
        type: 'observation',
        content: '空港カフェは世界中どこでも似たような雰囲気がありますが、それぞれに独特の物語があるものです。この写真からは、静かな満足感が伝わってきます。',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  }
];