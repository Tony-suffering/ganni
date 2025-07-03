import React, { useState, useEffect } from 'react';
import { Music2, Camera, Sparkles } from 'lucide-react';
import { Post } from '../../types';
import { SpotifyService } from '../../services/spotifyService';

const spotifyService = new SpotifyService();

interface SpotifyMoodSyncProps {
  posts: Post[];
  userToken?: string;
}

interface ContentAnalysis {
  keywords: string[];
  emotions: string[];
  locations: string[];
}

interface MusicMood {
  category: string;
  description: string;
  energy: number;
  valence: number;
  tags: string[];
}

// キーワード抽出関数
const extractKeywords = (text: string): string[] => {
  const keywords: string[] = [];
  const lowerText = text.toLowerCase();
  
  // 空港関連
  if (lowerText.includes('空港') || lowerText.includes('airport')) keywords.push('airport');
  if (lowerText.includes('離陸') || lowerText.includes('takeoff')) keywords.push('takeoff', 'departure');
  if (lowerText.includes('着陸') || lowerText.includes('landing')) keywords.push('landing', 'arrival');
  if (lowerText.includes('飛行機') || lowerText.includes('plane')) keywords.push('plane');
  
  // 時間・雰囲気
  if (lowerText.includes('朝') || lowerText.includes('morning')) keywords.push('morning');
  if (lowerText.includes('夜') || lowerText.includes('night')) keywords.push('night');
  if (lowerText.includes('夕日') || lowerText.includes('sunset')) keywords.push('sunset');
  if (lowerText.includes('綺麗') || lowerText.includes('美しい') || lowerText.includes('beautiful')) keywords.push('beautiful');
  
  // 感情
  if (lowerText.includes('楽しい') || lowerText.includes('fun')) keywords.push('fun');
  if (lowerText.includes('感動') || lowerText.includes('amazing')) keywords.push('emotional');
  if (lowerText.includes('旅行') || lowerText.includes('travel')) keywords.push('travel');
  if (lowerText.includes('思い出') || lowerText.includes('memory')) keywords.push('nostalgic');
  
  return keywords;
};

// 感情抽出関数
const extractEmotions = (text: string): string[] => {
  const emotions: string[] = [];
  const lowerText = text.toLowerCase();
  
  // ポジティブ感情
  if (lowerText.includes('嬉しい') || lowerText.includes('happy') || lowerText.includes('楽しい')) emotions.push('happy');
  if (lowerText.includes('感動') || lowerText.includes('感激') || lowerText.includes('amazing')) emotions.push('amazed');
  if (lowerText.includes('リラックス') || lowerText.includes('落ち着く') || lowerText.includes('peaceful')) emotions.push('peaceful');
  if (lowerText.includes('ワクワク') || lowerText.includes('興奮') || lowerText.includes('excited')) emotions.push('excited');
  
  // ネガティブ感情
  if (lowerText.includes('疲れた') || lowerText.includes('tired')) emotions.push('tired');
  if (lowerText.includes('寂しい') || lowerText.includes('lonely')) emotions.push('lonely');
  
  // ニュートラル
  if (lowerText.includes('思い出') || lowerText.includes('懐かしい') || lowerText.includes('nostalgic')) emotions.push('nostalgic');
  
  return emotions;
};

// 季節判定
const getSeason = (date: Date): string => {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
};

// 時間帯判定
const getTimeOfDay = (date: Date): string => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

// コンテンツ分析から音楽ムード決定
const determineMusicMoodFromContent = (analysis: ContentAnalysis): MusicMood => {
  const { keywords, emotions, locations } = analysis;
  
  // 空港・旅行系
  if (keywords.includes('airport') || keywords.includes('travel')) {
    if (keywords.includes('departure') || keywords.includes('takeoff')) {
      return {
        category: 'departure',
        description: '出発・旅立ちの高揚感',
        energy: 0.8,
        valence: 0.7,
        tags: ['travel', 'departure', 'uplifting']
      };
    }
    if (keywords.includes('arrival') || keywords.includes('landing')) {
      return {
        category: 'arrival',
        description: '到着・帰郷の安堵感',
        energy: 0.5,
        valence: 0.8,
        tags: ['arrival', 'peaceful', 'homecoming']
      };
    }
  }
  
  // 感情ベース
  if (emotions.includes('excited') || emotions.includes('happy')) {
    return {
      category: 'upbeat',
      description: '明るく元気な気分',
      energy: 0.9,
      valence: 0.9,
      tags: ['happy', 'energetic', 'positive']
    };
  }
  
  if (emotions.includes('peaceful') || keywords.includes('sunset')) {
    return {
      category: 'chill',
      description: '穏やかでリラックスした雰囲気',
      energy: 0.3,
      valence: 0.7,
      tags: ['chill', 'sunset', 'relaxing']
    };
  }
  
  if (emotions.includes('nostalgic') || keywords.includes('nostalgic')) {
    return {
      category: 'nostalgic',
      description: '懐かしさと思い出に浸る',
      energy: 0.4,
      valence: 0.6,
      tags: ['nostalgic', 'memories', 'reflective']
    };
  }
  
  // 時間帯ベース
  if (keywords.includes('morning')) {
    return {
      category: 'morning',
      description: '朝の清々しい気分',
      energy: 0.7,
      valence: 0.8,
      tags: ['morning', 'fresh', 'optimistic']
    };
  }
  
  if (keywords.includes('night')) {
    return {
      category: 'night',
      description: '夜の静けさと深み',
      energy: 0.3,
      valence: 0.5,
      tags: ['night', 'mysterious', 'contemplative']
    };
  }
  
  // デフォルト
  return {
    category: 'balanced',
    description: 'バランスの取れた心地よい雰囲気',
    energy: 0.6,
    valence: 0.7,
    tags: ['balanced', 'pleasant']
  };
};

export const SpotifyMoodSync: React.FC<SpotifyMoodSyncProps> = ({ posts }) => {
  const [moodRecommendations, setMoodRecommendations] = useState<any[]>([]);
  const [photoMood, setPhotoMood] = useState<string>('');
  const [analyzedPosts, setAnalyzedPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (posts.length > 0) {
      analyzeMoodFromPhotos();
    }
  }, [posts]);

  const analyzeMoodFromPhotos = async () => {
    try {
      // 最近の投稿から感情を分析
      const recentPosts = posts.slice(0, 5);
      console.log('🎵 Analyzing posts for music sync:', recentPosts.length);
      
      // テキスト分析によるキーワード抽出
      const keywords: string[] = [];
      const emotions: string[] = [];
      const locations: string[] = [];
      
      recentPosts.forEach(post => {
        // タイトルからキーワード抽出
        if (post.title) {
          const titleKeywords = extractKeywords(post.title);
          keywords.push(...titleKeywords);
        }
        
        // ユーザーコメントから感情抽出
        if (post.content || post.userComment) {
          const text = post.content || post.userComment || '';
          const textEmotions = extractEmotions(text);
          emotions.push(...textEmotions);
          
          const textKeywords = extractKeywords(text);
          keywords.push(...textKeywords);
        }
        
        // タグから場所情報抽出
        if (post.tags) {
          post.tags.forEach(tag => {
            if (tag.name) {
              locations.push(tag.name);
            }
          });
        }
        
        // 投稿時間の分析
        const postDate = new Date(post.created_at);
        const season = getSeason(postDate);
        const timeOfDay = getTimeOfDay(postDate);
        keywords.push(season, timeOfDay);
      });
      
      console.log('🎵 Extracted analysis:', { keywords, emotions, locations });
      
      // 分析結果に基づいて音楽を推薦
      setPhotoMood(musicMood.description);
      const recommendations = await spotifyService.getContentBasedRecommendations(musicMood);
      setMoodRecommendations(recommendations);
      setAnalyzedPosts(recentPosts);
      
      console.log('🎵 Content-based music analysis complete:', {
        mood: musicMood,
        recommendationsCount: recommendations.length
      });
    } catch (error) {
      console.error('❌ Error analyzing mood from photos:', error);
      // エラー時はデフォルトの推薦を表示
      setPhotoMood('バランス型');
      const defaultEmotions = { joy: 0.5, peace: 0.5, excitement: 0.5, energy: 0.5 };
      const recommendations = await spotifyService.getMoodBasedRecommendations(defaultEmotions);
      setMoodRecommendations(recommendations);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Music2 className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">写真の雰囲気に合う音楽</h3>
          <p className="text-sm text-gray-600">
            あなたの写真から感じる雰囲気：{photoMood}
          </p>
        </div>
      </div>

      {moodRecommendations.length > 0 && (
        <div className="space-y-4">
          {moodRecommendations.map((rec, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">{rec.reasoning}</p>
              <div className="space-y-2">
                {rec.tracks.slice(0, 3).map((track: any) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{track.name}</p>
                      <p className="text-xs text-gray-600">{track.artists.join(', ')}</p>
                    </div>
                    <a
                      href={track.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 text-sm"
                    >
                      聴く
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分析対象の投稿を表示 */}
      {analyzedPosts.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            <Camera className="w-4 h-4 inline mr-1" />
            最新{analyzedPosts.length}件の投稿を分析しました
          </p>
          <div className="flex gap-2 overflow-x-auto">
            {analyzedPosts.map((post) => (
              <img
                key={post.id}
                src={post.imageUrl}
                alt={post.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-4 bg-purple-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h4 className="font-medium text-purple-900">分析の仕組み</h4>
        </div>
        <ul className="text-sm text-purple-700 space-y-1">
          <li>• AI写真スコア（明るさ、構図など）を分析</li>
          <li>• 投稿時間帯から活動パターンを推定</li>
          <li>• いいね数から人気度を考慮</li>
          <li>• 総合的な雰囲気から最適な音楽を選定</li>
        </ul>
      </div>
    </div>
  );
};