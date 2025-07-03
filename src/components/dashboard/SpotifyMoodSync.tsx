import React, { useState, useEffect } from 'react';
import { Music2, Camera, Sparkles, MapPin, Clock, Settings } from 'lucide-react';
import { Post } from '../../types';
import { SpotifyService } from '../../services/spotifyService';
import { generateMusicParametersFromMetadata, getLocationInfo } from '../../utils/imageMetadata';

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

// 🎯 AI分析結果から具体的な内容を抽出
const extractFromAIAnalysis = (post: Post) => {
  const analysis = {
    detectedElements: [],
    locations: [],
    emotions: [],
    specificContent: [],
    musicalContext: '',
    reasoning: ''
  };
  
  // AI画像分析結果を解析
  if (post.imageAIDescription) {
    const aiDesc = post.imageAIDescription.toLowerCase();
    
    // 🛩️ 航空関連の具体的検出
    if (aiDesc.includes('boeing') || aiDesc.includes('ボーイング')) {
      analysis.detectedElements.push('boeing', 'commercial_aviation');
      analysis.specificContent.push('Boeing aircraft');
      analysis.musicalContext = 'powerful_engines';
    }
    if (aiDesc.includes('airbus') || aiDesc.includes('エアバス')) {
      analysis.detectedElements.push('airbus', 'modern_aviation');
      analysis.specificContent.push('Airbus aircraft');
      analysis.musicalContext = 'sophisticated_flight';
    }
    if (aiDesc.includes('ana') || aiDesc.includes('全日空')) {
      analysis.detectedElements.push('ana', 'japanese_airline');
      analysis.locations.push('Japan');
      analysis.musicalContext = 'japanese_hospitality';
    }
    if (aiDesc.includes('jal') || aiDesc.includes('日本航空')) {
      analysis.detectedElements.push('jal', 'japanese_airline');
      analysis.locations.push('Japan');
      analysis.musicalContext = 'traditional_japan';
    }
    
    // 🌅 時間・光の具体的分析
    if (aiDesc.includes('sunset') || aiDesc.includes('夕日') || aiDesc.includes('golden hour')) {
      analysis.detectedElements.push('golden_hour', 'warm_light');
      analysis.emotions.push('romantic', 'peaceful');
      analysis.musicalContext = 'golden_moment';
    }
    if (aiDesc.includes('sunrise') || aiDesc.includes('朝日') || aiDesc.includes('dawn')) {
      analysis.detectedElements.push('sunrise', 'new_beginning');
      analysis.emotions.push('hopeful', 'fresh');
      analysis.musicalContext = 'new_day';
    }
    if (aiDesc.includes('night') || aiDesc.includes('nighttime') || aiDesc.includes('夜景')) {
      analysis.detectedElements.push('night_scene', 'city_lights');
      analysis.emotions.push('mysterious', 'urban');
      analysis.musicalContext = 'night_atmosphere';
    }
    
    // 🏙️ 具体的な都市・空港
    if (aiDesc.includes('narita') || aiDesc.includes('成田')) {
      analysis.locations.push('Narita Airport');
      analysis.musicalContext = 'international_gateway';
    }
    if (aiDesc.includes('haneda') || aiDesc.includes('羽田')) {
      analysis.locations.push('Haneda Airport');
      analysis.musicalContext = 'tokyo_skyline';
    }
    if (aiDesc.includes('lax') || aiDesc.includes('los angeles')) {
      analysis.locations.push('Los Angeles');
      analysis.musicalContext = 'california_dreams';
    }
    
    // 🎨 視覚的要素の検出
    if (aiDesc.includes('clouds') || aiDesc.includes('雲')) {
      analysis.detectedElements.push('clouds', 'sky_view');
      analysis.emotions.push('dreamy', 'elevated');
    }
    if (aiDesc.includes('runway') || aiDesc.includes('滑走路')) {
      analysis.detectedElements.push('runway', 'departure_arrival');
      analysis.emotions.push('anticipation', 'journey');
    }
    if (aiDesc.includes('terminal') || aiDesc.includes('ターミナル')) {
      analysis.detectedElements.push('terminal', 'modern_architecture');
      analysis.emotions.push('busy', 'purposeful');
    }
  }
  
  // AI コメントからも抽出
  if (post.aiComments && post.aiComments.length > 0) {
    post.aiComments.forEach(comment => {
      const commentText = comment.content.toLowerCase();
      
      // 感情的な表現を検出
      if (commentText.includes('beautiful') || commentText.includes('stunning') || commentText.includes('美しい')) {
        analysis.emotions.push('beauty', 'appreciation');
      }
      if (commentText.includes('powerful') || commentText.includes('majestic') || commentText.includes('力強い')) {
        analysis.emotions.push('powerful', 'impressive');
      }
      if (commentText.includes('peaceful') || commentText.includes('calm') || commentText.includes('穏やか')) {
        analysis.emotions.push('peaceful', 'serene');
      }
    });
  }
  
  // PhotoScore の具体的分析
  if (post.photoScore?.image_analysis) {
    const imgAnalysis = post.photoScore.image_analysis;
    
    if (imgAnalysis.specificContent) {
      analysis.specificContent.push(imgAnalysis.specificContent);
    }
    if (imgAnalysis.mainSubject) {
      analysis.detectedElements.push(imgAnalysis.mainSubject);
    }
    if (imgAnalysis.moodAtmosphere) {
      analysis.emotions.push(imgAnalysis.moodAtmosphere);
    }
  }
  
  // 分析理由を生成
  if (analysis.specificContent.length > 0) {
    analysis.reasoning = `写真から「${analysis.specificContent.join('、')}」を検出し、`;
  }
  if (analysis.emotions.length > 0) {
    analysis.reasoning += `「${analysis.emotions.slice(0, 2).join('・')}」な雰囲気を感じ取りました。`;
  }
  
  return analysis.detectedElements.length > 0 ? analysis : null;
};

// 投稿から写真メタデータを推測分析
const analyzeImageMetadataFromPost = (post: Post) => {
  const insights: any = {
    tags: [],
    timeAnalysis: null,
    locationAnalysis: null,
    technicalAnalysis: null
  };
  
  // 投稿時間から推測
  const postDate = new Date(post.created_at);
  const hour = postDate.getHours();
  const month = postDate.getMonth() + 1;
  
  // 時間帯分析
  if (hour >= 5 && hour < 8) {
    insights.tags.push('dawn', 'golden_hour');
    insights.timeAnalysis = '朝焼けの美しい時間帯';
  } else if (hour >= 17 && hour < 20) {
    insights.tags.push('sunset', 'golden_hour');
    insights.timeAnalysis = '夕日が美しい時間帯';
  } else if (hour >= 20 || hour < 5) {
    insights.tags.push('night', 'low_light');
    insights.timeAnalysis = '夜景や室内照明';
  } else {
    insights.tags.push('daylight', 'bright');
    insights.timeAnalysis = '明るい日中の撮影';
  }
  
  // 季節分析
  if (month >= 3 && month <= 5) {
    insights.tags.push('spring', 'fresh');
  } else if (month >= 6 && month <= 8) {
    insights.tags.push('summer', 'vibrant');
  } else if (month >= 9 && month <= 11) {
    insights.tags.push('autumn', 'warm_tones');
  } else {
    insights.tags.push('winter', 'cool_tones');
  }
  
  // タイトルやコメントから技術的推測
  const text = (post.title + ' ' + (post.content || '') + ' ' + (post.userComment || '')).toLowerCase();
  
  if (text.includes('夜景') || text.includes('night')) {
    insights.tags.push('night_photography', 'long_exposure');
    insights.technicalAnalysis = '夜景撮影（高ISO推定）';
  }
  
  if (text.includes('空港') || text.includes('airport') || text.includes('飛行機') || text.includes('plane')) {
    insights.tags.push('airport', 'aviation', 'travel');
    insights.locationAnalysis = '空港での撮影';
    insights.location = '空港';
  }
  
  if (text.includes('離陸') || text.includes('takeoff')) {
    insights.tags.push('departure', 'motion', 'telephoto');
    insights.technicalAnalysis = '離陸シーン（望遠レンズ推定）';
  }
  
  if (text.includes('夕日') || text.includes('sunset')) {
    insights.tags.push('sunset', 'golden_hour', 'landscape');
    insights.technicalAnalysis = '夕日撮影（ND フィルター推定）';
  }
  
  if (text.includes('窓') || text.includes('window')) {
    insights.tags.push('window_seat', 'aerial_view');
    insights.locationAnalysis = '機内からの眺望';
  }
  
  // いいね数から写真の魅力度推測
  if (post.likes_count && post.likes_count > 5) {
    insights.tags.push('appealing', 'well_composed');
    insights.technicalAnalysis = '魅力的な構図（いいね多数）';
  }
  
  return insights.tags.length > 0 ? insights : null;
};

export const SpotifyMoodSync: React.FC<SpotifyMoodSyncProps> = ({ posts }) => {
  const [moodRecommendations, setMoodRecommendations] = useState<any[]>([]);
  const [photoMood, setPhotoMood] = useState<string>('');
  const [analyzedPosts, setAnalyzedPosts] = useState<Post[]>([]);
  const [metadataAnalysis, setMetadataAnalysis] = useState<any[]>([]);

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
      const metadataInsights: any[] = [];
      
      recentPosts.forEach(post => {
        // 🎯 AIが実際に分析した内容を優先使用
        const aiAnalysis = extractFromAIAnalysis(post);
        if (aiAnalysis) {
          metadataInsights.push({
            postId: post.id,
            title: post.title,
            aiDescription: post.imageAIDescription,
            ...aiAnalysis
          });
          
          // AI分析から得られた具体的情報を活用
          keywords.push(...aiAnalysis.detectedElements);
          locations.push(...aiAnalysis.locations);
          emotions.push(...aiAnalysis.emotions);
        }
        
        // タイトル・コメントからキーワード抽出（補完）
        if (post.title) {
          const titleKeywords = extractKeywords(post.title);
          keywords.push(...titleKeywords);
        }
        
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
      });
      
      console.log('🎵 Extracted analysis:', { keywords, emotions, locations });
      
      // キーワードベースで音楽カテゴリを決定
      const musicMood = determineMusicMoodFromContent({
        keywords: [...new Set(keywords)], // 重複除去
        emotions: [...new Set(emotions)],
        locations: [...new Set(locations)]
      });
      
      // 分析結果に基づいて音楽を推薦
      setPhotoMood(musicMood.description);
      const recommendations = await spotifyService.getContentBasedRecommendations(musicMood);
      setMoodRecommendations(recommendations);
      setAnalyzedPosts(recentPosts);
      setMetadataAnalysis(metadataInsights);
      
      console.log('🎵 Content-based music analysis complete:', {
        mood: musicMood,
        recommendationsCount: recommendations.length,
        metadataInsights: metadataInsights.length
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

      {/* AI分析結果の詳細表示 */}
      {metadataAnalysis.length > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h4 className="font-medium text-purple-900">🎯 AI写真分析による具体的検出</h4>
          </div>
          <div className="space-y-4">
            {metadataAnalysis.map((analysis, index) => (
              <div key={analysis.postId} className="bg-white p-4 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={analyzedPosts.find(p => p.id === analysis.postId)?.imageUrl}
                    alt={analysis.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-1">{analysis.title}</h5>
                    {analysis.aiDescription && (
                      <p className="text-sm text-gray-600 italic">
                        「{analysis.aiDescription.substring(0, 80)}...」
                      </p>
                    )}
                  </div>
                </div>
                
                {analysis.specificContent && analysis.specificContent.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-green-700 mb-1">
                      🔍 検出された具体的内容:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.specificContent.map((item: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {analysis.reasoning && (
                  <div className="mb-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                    <p className="text-sm text-yellow-800">
                      <strong>推薦理由:</strong> {analysis.reasoning}
                    </p>
                  </div>
                )}
                
                {analysis.detectedElements && analysis.detectedElements.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">
                      📊 抽出された音楽的要素:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.detectedElements.slice(0, 8).map((element: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                        >
                          {element}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
          <li>• 📸 <strong>写真メタデータ</strong>: 撮影時間・場所・技術設定から推測</li>
          <li>• 📝 <strong>テキスト分析</strong>: タイトル・コメントからキーワード抽出</li>
          <li>• 🏷️ <strong>タグ情報</strong>: 場所タグや分類から文脈理解</li>
          <li>• ⏰ <strong>時間分析</strong>: 投稿時間帯・季節から雰囲気判定</li>
          <li>• 💝 <strong>人気度</strong>: いいね・コメント数から魅力度分析</li>
          <li>• 🎵 <strong>総合判定</strong>: 全要素から最適な音楽カテゴリーを決定</li>
        </ul>
      </div>
    </div>
  );
};