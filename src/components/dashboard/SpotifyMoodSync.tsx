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

// コンテンツ分析から音楽ムード決定（実際のユーザーデータに基づく完全強化版）
const determineMusicMoodFromContent = (analysis: ContentAnalysis): MusicMood => {
  const { keywords, emotions, locations } = analysis;
  
  console.log('🎯 ENHANCED determineMusicMoodFromContent called with:', {
    keywords: keywords,
    emotions: emotions,
    locations: locations,
    keywordsLength: keywords.length,
    emotionsLength: emotions.length,
    locationsLength: locations.length,
    keywordsDetail: JSON.stringify(keywords),
    emotionsDetail: JSON.stringify(emotions)
  });
  
  // 👥 人物・社交系（実際のデータ: "人間", "3人の男性"）
  console.log('🎯 Checking people/social keywords:', {
    hasPeople: keywords.includes('people'),
    hasHumanConnection: keywords.includes('human_connection'),
    hasSocial: keywords.includes('social'),
    hasSocialScene: keywords.includes('social_scene')
  });
  
  if (keywords.includes('people') || keywords.includes('human_connection') || keywords.includes('social') || keywords.includes('social_scene')) {
    console.log('✅ Found people/social keywords! Returning human_stories category');
    return {
      category: 'human_stories',
      description: '人々の温かさと繋がりを感じる音楽',
      energy: 0.6,
      valence: 0.8,
      tags: ['people', 'social', 'warm', 'human_connection']
    };
  }
  
  // 🌊 海・自然系（実際のデータ: "海", "海岸線"）
  console.log('🎯 Checking ocean/nature keywords:', {
    hasOcean: keywords.includes('ocean'),
    hasCoastal: keywords.includes('coastal'),
    hasCoastline: keywords.includes('coastline'),
    hasNature: keywords.includes('nature')
  });
  
  if (keywords.includes('ocean') || keywords.includes('coastal') || keywords.includes('coastline')) {
    console.log('✅ Found ocean/coastal keywords! Returning ocean category');
    return {
      category: 'ocean',
      description: '海の広がりと波の音を感じる音楽',
      energy: 0.5,
      valence: 0.8,
      tags: ['ocean', 'coastal', 'nature', 'expansive']
    };
  }
  
  // 🏔️ 山・高地系（実際のデータ: "山々"）
  if (keywords.includes('mountains') || keywords.includes('mountain') || keywords.includes('majestic_view') || keywords.includes('highlands')) {
    console.log('✅ Found mountain keywords! Returning mountain category');
    return {
      category: 'mountain',
      description: '山々の雄大さと静寂を表現する音楽',
      energy: 0.4,
      valence: 0.7,
      tags: ['mountain', 'majestic', 'nature']
    };
  }
  
  // 🛣️ 道路・旅系（実際のデータ: "道路"）
  console.log('🎯 Checking road/journey keywords:', {
    hasRoad: keywords.includes('road'),
    hasJourney: keywords.includes('journey'),
    hasUrban: keywords.includes('urban')
  });
  
  if (keywords.includes('road') || keywords.includes('journey') || keywords.includes('urban')) {
    console.log('✅ Found road/journey keywords! Returning road_trip category');
    return {
      category: 'road_trip',
      description: '道路の自由と冷険心を感じる音楽',
      energy: 0.7,
      valence: 0.8,
      tags: ['road', 'journey', 'freedom', 'exploration']
    };
  }
  
  // 💻 テクノロジー・仕事系（実際のデータ: "メール", "HTMLスタイル"）
  console.log('🎯 Checking technology/work keywords:', {
    hasTechnology: keywords.includes('technology'),
    hasWork: keywords.includes('work'),
    hasDigitalInterface: keywords.includes('digital_interface'),
    hasInterface: keywords.includes('interface')
  });
  
  if (keywords.includes('technology') || keywords.includes('work') || keywords.includes('digital_interface') || keywords.includes('interface')) {
    console.log('✅ Found technology/work keywords! Returning digital category');
    return {
      category: 'digital',
      description: 'デジタル作業と集中力を高める音楽',
      energy: 0.6,
      valence: 0.6,
      tags: ['technology', 'focused', 'modern', 'productive']
    };
  }
  
  // 🌳 自然・植生系（実際のデータ: "緑の木々", "植生"）
  if (keywords.includes('trees') || keywords.includes('green_scenery') || keywords.includes('nature')) {
    console.log('✅ Found nature/trees keywords! Returning nature category');
    return {
      category: 'nature',
      description: '自然の緑とやすらぎを感じる音楽',
      energy: 0.4,
      valence: 0.7,
      tags: ['nature', 'organic', 'fresh']
    };
  }
  
  // 🎅 空港・旅行系
  if (keywords.includes('airport') || keywords.includes('travel')) {
    console.log('🎯 Found airport/travel keywords!');
    if (keywords.includes('departure') || keywords.includes('takeoff')) {
      console.log('🎯 Found departure/takeoff keywords!');
      return {
        category: 'departure',
        description: '出発・旅立ちの高揚感',
        energy: 0.8,
        valence: 0.7,
        tags: ['travel', 'departure', 'uplifting']
      };
    }
    if (keywords.includes('arrival') || keywords.includes('landing')) {
      console.log('🎯 Found arrival/landing keywords!');
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
  
  // 自然・風景ベース
  if (keywords.includes('ocean') || keywords.includes('nature')) {
    return {
      category: 'ocean',
      description: '海の広がりと自然の壮大さ',
      energy: 0.5,
      valence: 0.8,
      tags: ['ocean', 'nature', 'expansive']
    };
  }
  
  if (keywords.includes('mountain')) {
    return {
      category: 'mountain',
      description: '山の雄大さと静寂',
      energy: 0.4,
      valence: 0.7,
      tags: ['mountain', 'nature', 'majestic']
    };
  }
  
  if (keywords.includes('road') || keywords.includes('journey')) {
    return {
      category: 'road_trip',
      description: '道路の自由と冒険心',
      energy: 0.7,
      valence: 0.8,
      tags: ['road', 'journey', 'freedom']
    };
  }
  
  // 人物・日常ベース
  if (keywords.includes('people') || keywords.includes('human_connection')) {
    return {
      category: 'human_stories',
      description: '人々の温かさと日常の物語',
      energy: 0.5,
      valence: 0.7,
      tags: ['people', 'social', 'warm']
    };
  }
  
  if (keywords.includes('daily_life') || emotions.includes('comfortable')) {
    return {
      category: 'everyday',
      description: '日常の心地よさと親しみ',
      energy: 0.4,
      valence: 0.7,
      tags: ['daily', 'comfortable', 'familiar']
    };
  }
  
  // テクノロジー・仕事ベース
  if (keywords.includes('technology') || keywords.includes('work')) {
    return {
      category: 'digital',
      description: 'デジタル時代の集中とクリエイティビティ',
      energy: 0.6,
      valence: 0.6,
      tags: ['technology', 'focused', 'modern']
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
  
  // 🚀 感情ベースの判定（キーワードでマッチしなかった場合）
  if (emotions.includes('excited') || emotions.includes('happy')) {
    console.log('✅ Found excited/happy emotions! Returning upbeat category');
    return {
      category: 'upbeat',
      description: '明るく元気な気分',
      energy: 0.9,
      valence: 0.9,
      tags: ['happy', 'energetic', 'positive']
    };
  }
  
  if (emotions.includes('peaceful') || emotions.includes('serene')) {
    console.log('✅ Found peaceful emotions! Returning chill category');
    return {
      category: 'chill',
      description: '穏やかでリラックスした雰囲気',
      energy: 0.3,
      valence: 0.7,
      tags: ['chill', 'relaxing', 'peaceful']
    };
  }
  
  if (emotions.includes('nostalgic')) {
    console.log('✅ Found nostalgic emotions! Returning nostalgic category');
    return {
      category: 'nostalgic',
      description: '懐かしさと思い出に浸る',
      energy: 0.4,
      valence: 0.6,
      tags: ['nostalgic', 'memories', 'reflective']
    };
  }
  
  // デフォルト
  console.log('⚠️ No specific conditions matched, using balanced default');
  console.log('🎯 FINAL analysis summary:', {
    totalKeywords: keywords.length,
    totalEmotions: emotions.length,
    totalLocations: locations.length,
    keywords: JSON.stringify(keywords),
    emotions: JSON.stringify(emotions),
    locations: JSON.stringify(locations),
    message: 'No specific patterns detected - falling back to balanced music'
  });
  
  return {
    category: 'balanced',
    description: 'バランスの取れた心地よい雰囲気',
    energy: 0.6,
    valence: 0.7,
    tags: ['balanced', 'pleasant']
  };
};

// 🎯 AI分析結果から具体的な内容を抽出（実際のユーザーデータに基づく完全修正版）
const extractFromAIAnalysis = (post: Post) => {
  const analysis = {
    detectedElements: [],
    locations: [],
    emotions: [],
    specificContent: [],
    musicalContext: '',
    reasoning: ''
  };
  
  console.log('🔍 ENHANCED extractFromAIAnalysis input:', {
    title: post.title,
    hasImageAIDescription: !!post.imageAIDescription,
    imageAIDescriptionPreview: post.imageAIDescription?.substring(0, 150) + '...',
    hasPhotoScore: !!post.photoScore,
    photoScoreDetails: post.photoScore?.image_analysis?.specificContent?.substring(0, 100),
    hasAIComments: !!(post.aiComments && post.aiComments.length > 0)
  });
  
  // タイトルから直接分析（実際のユーザーデータパターンに基づく）
  const title = post.title.toLowerCase();
  console.log('🔍 Analyzing title for specific content:', title);
  
  // 🌊 海・自然の検出（実際のデータ: "海"）
  if (title.includes('海')) {
    analysis.detectedElements.push('ocean', 'nature', 'coastal');
    analysis.emotions.push('peaceful', 'expansive', 'serene');
    analysis.musicalContext = 'ocean_waves';
    analysis.specificContent.push('海の風景');
    console.log('✅ Detected ocean from title');
  }
  
  // 👥 人物の検出（実際のデータ: "人間"）
  if (title.includes('人間') || title.includes('人') || title.includes('人物')) {
    analysis.detectedElements.push('people', 'human_connection', 'social');
    analysis.emotions.push('social', 'warm', 'human');
    analysis.musicalContext = 'human_stories';
    analysis.specificContent.push('人物の写真');
    console.log('✅ Detected people from title');
  }
  
  // 🎯 PhotoScore の画像分析から抽出（実際のUIデータを完全解析）
  if (post.photoScore?.image_analysis?.specificContent) {
    const specificContent = post.photoScore.image_analysis.specificContent.toLowerCase();
    console.log('🔍 ENHANCED Analyzing specificContent:', specificContent);
    
    // 実際のデータ例: "3人の男性、帽、道路、緑の木々"
    // 人物検出の強化
    if (specificContent.includes('男性') || specificContent.includes('女性') || specificContent.includes('人') || specificContent.includes('people')) {
      analysis.detectedElements.push('people', 'human_connection', 'social_scene');
      analysis.emotions.push('social', 'warm', 'human_interaction');
      analysis.musicalContext = 'human_stories';
      analysis.specificContent.push('人物が含まれる写真');
      console.log('✅ Enhanced people detection from specificContent');
    }
    
    // 帽子・ファッション検出
    if (specificContent.includes('帽') || specificContent.includes('服') || specificContent.includes('ファッション')) {
      analysis.detectedElements.push('fashion', 'lifestyle', 'casual');
      analysis.emotions.push('stylish', 'casual', 'contemporary');
      analysis.musicalContext = 'lifestyle_moments';
    }
    
    // 道路・交通の検出
    if (specificContent.includes('道路') || specificContent.includes('street') || specificContent.includes('道')) {
      analysis.detectedElements.push('road', 'journey', 'urban');
      analysis.emotions.push('freedom', 'movement', 'exploration');
      analysis.musicalContext = 'road_trip';
      analysis.specificContent.push('道路の風景');
      console.log('✅ Enhanced road detection from specificContent');
    }
    
    // 植生・自然の検出（実際のデータ: "緑の木々"）
    if (specificContent.includes('木') || specificContent.includes('緑') || specificContent.includes('植生') || specificContent.includes('自然')) {
      analysis.detectedElements.push('trees', 'nature', 'green_scenery');
      analysis.emotions.push('natural', 'fresh', 'organic');
      analysis.musicalContext = 'nature_sounds';
      analysis.specificContent.push('自然の緑');
      console.log('✅ Enhanced nature detection from specificContent');
    }
    
    // 実際のデータ例: "海岸線、山々、道路、植生"
    if (specificContent.includes('海岸') || specificContent.includes('海岸線')) {
      analysis.detectedElements.push('coastline', 'ocean', 'scenic_route');
      analysis.emotions.push('coastal', 'scenic', 'breathtaking');
      analysis.musicalContext = 'coastal_drive';
      analysis.specificContent.push('海岸線の景色');
      console.log('✅ Enhanced coastline detection');
    }
    
    if (specificContent.includes('山') || specificContent.includes('山々')) {
      analysis.detectedElements.push('mountains', 'highlands', 'majestic_view');
      analysis.emotions.push('majestic', 'elevated', 'inspiring');
      analysis.musicalContext = 'mountain_majesty';
      analysis.specificContent.push('山々の風景');
      console.log('✅ Enhanced mountain detection');
    }
    
    // 💻 実際のデータ例: "メールアドレス、フォント設定、HTMLスタイル"
    if (specificContent.includes('メール') || specificContent.includes('フォント') || specificContent.includes('html') || specificContent.includes('設定') || specificContent.includes('画面') || specificContent.includes('google')) {
      analysis.detectedElements.push('technology', 'work', 'digital_interface');
      analysis.emotions.push('focused', 'productive', 'technical');
      analysis.musicalContext = 'digital_life';
      analysis.specificContent.push('デジタル作業環境');
      console.log('✅ Enhanced technology detection from specificContent');
    }
    
    // Webフォーム・アンケート関連（実際のデータ例に基づく）
    if (specificContent.includes('フォーム') || specificContent.includes('アンケート') || specificContent.includes('入力') || specificContent.includes('質問')) {
      analysis.detectedElements.push('interface', 'interaction', 'systematic');
      analysis.emotions.push('systematic', 'organized', 'methodical');
      analysis.musicalContext = 'workflow';
      analysis.specificContent.push('インターフェース操作');
      console.log('✅ Enhanced interface detection');
    }
    
    analysis.specificContent.push(post.photoScore.image_analysis.specificContent);
  }
  
  // AI画像分析結果を解析（従来の方法）
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
    
    // 🌊 自然・風景の検出
    if (aiDesc.includes('海') || aiDesc.includes('ocean') || aiDesc.includes('sea') || aiDesc.includes('海岸')) {
      analysis.detectedElements.push('ocean', 'nature');
      analysis.emotions.push('peaceful', 'expansive');
      analysis.musicalContext = 'ocean_waves';
    }
    if (aiDesc.includes('山') || aiDesc.includes('mountain')) {
      analysis.detectedElements.push('mountain', 'nature');
      analysis.emotions.push('majestic', 'grounded');
      analysis.musicalContext = 'mountain_heights';
    }
    if (aiDesc.includes('道路') || aiDesc.includes('road') || aiDesc.includes('ドライブ')) {
      analysis.detectedElements.push('road', 'journey');
      analysis.emotions.push('freedom', 'adventure');
      analysis.musicalContext = 'road_trip';
    }
    
    // 👥 人物・日常の検出
    if (aiDesc.includes('人') || aiDesc.includes('男性') || aiDesc.includes('女性') || aiDesc.includes('people')) {
      analysis.detectedElements.push('people', 'human_connection');
      analysis.emotions.push('social', 'warm');
      analysis.musicalContext = 'human_stories';
    }
    if (aiDesc.includes('住宅街') || aiDesc.includes('日常') || aiDesc.includes('カジュアル')) {
      analysis.detectedElements.push('daily_life', 'casual');
      analysis.emotions.push('comfortable', 'familiar');
      analysis.musicalContext = 'everyday_moments';
    }
    
    // 💻 テクノロジー・仕事の検出
    if (aiDesc.includes('メール') || aiDesc.includes('設定') || aiDesc.includes('画面') || aiDesc.includes('google')) {
      analysis.detectedElements.push('technology', 'work');
      analysis.emotions.push('focused', 'productive');
      analysis.musicalContext = 'digital_life';
    }
    if (aiDesc.includes('フォーム') || aiDesc.includes('アンケート') || aiDesc.includes('入力')) {
      analysis.detectedElements.push('interface', 'interaction');
      analysis.emotions.push('systematic', 'organized');
      analysis.musicalContext = 'workflow';
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
  const postDate = new Date(post.createdAt);
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
  const text = (post.title + ' ' + (post.userComment || '')).toLowerCase();
  
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
  if (post.likeCount && post.likeCount > 5) {
    insights.tags.push('appealing', 'well_composed');
    insights.technicalAnalysis = '魅力的な構図（いいね多数）';
  }
  
  return insights.tags.length > 0 ? insights : null;
};

// 🎯 詳細な理由説明を生成（透明性を提供）
const generateDetailedReasoning = (metadataInsights: any[], contentAnalysis: any, musicMood: any): string => {
  const reasons: string[] = [];
  
  // 検出された具体的内容を説明
  if (metadataInsights.length > 0) {
    const specificContents = metadataInsights
      .filter(insight => insight.specificContent && insight.specificContent.length > 0)
      .flatMap(insight => insight.specificContent);
    
    if (specificContents.length > 0) {
      reasons.push(`「${specificContents.slice(0, 2).join('・')}」を検出`);
    }
  }
  
  // キーワードベースの説明
  if (contentAnalysis.keywords.length > 0) {
    const keywordGroups = {
      people: ['people', 'human_connection', 'social', 'social_scene'],
      nature: ['ocean', 'coastal', 'coastline', 'mountains', 'trees', 'nature'],
      road: ['road', 'journey', 'urban'],
      tech: ['technology', 'work', 'digital_interface', 'interface']
    };
    
    for (const [group, groupKeywords] of Object.entries(keywordGroups)) {
      const matchedKeywords = contentAnalysis.keywords.filter(k => groupKeywords.includes(k));
      if (matchedKeywords.length > 0) {
        switch (group) {
          case 'people':
            reasons.push('人物・社交的な要素');
            break;
          case 'nature':
            reasons.push('自然・風景的な要素');
            break;
          case 'road':
            reasons.push('道路・旅的な要素');
            break;
          case 'tech':
            reasons.push('デジタル・作業的な要素');
            break;
        }
        break; // 最初にマッチしたグループのみ
      }
    }
  }
  
  // 感情ベースの説明
  if (contentAnalysis.emotions.length > 0) {
    const emotionSummary = contentAnalysis.emotions.slice(0, 2).join('・');
    reasons.push(`${emotionSummary}な雰囲気`);
  }
  
  return reasons.length > 0 ? reasons.join('、') : '写真の全体的な雰囲気';
};

export const SpotifyMoodSync: React.FC<SpotifyMoodSyncProps> = ({ posts }) => {
  const [moodRecommendations, setMoodRecommendations] = useState<any[]>([]);
  const [photoMood, setPhotoMood] = useState<string>('');
  const [analyzedPosts, setAnalyzedPosts] = useState<Post[]>([]);
  const [metadataAnalysis, setMetadataAnalysis] = useState<any[]>([]);

  console.log('🎵 SpotifyMoodSync rendered with posts:', posts.length);

  useEffect(() => {
    console.log('🎵 SpotifyMoodSync useEffect triggered, posts.length:', posts.length);
    if (posts.length > 0) {
      analyzeMoodFromPhotos();
    } else {
      console.log('🎵 No posts available for music analysis');
    }
  }, [posts]);

  const analyzeMoodFromPhotos = async () => {
    try {
      // 最近の投稿から感情を分析
      const recentPosts = posts.slice(0, 5);
      console.log('🎵 Analyzing posts for music sync:', recentPosts.length);
      
      // デバッグ用：各投稿のAI分析データを確認
      recentPosts.forEach((post, idx) => {
        console.log(`🔍 Post ${idx + 1} debugging:`, {
          title: post.title,
          hasImageAIDescription: !!post.imageAIDescription,
          imageAIDescription: post.imageAIDescription?.substring(0, 100),
          hasAIComments: !!(post.aiComments && post.aiComments.length > 0),
          aiCommentsCount: post.aiComments?.length || 0,
          hasPhotoScore: !!post.photoScore
        });
      });
      
      // テキスト分析によるキーワード抽出
      const keywords: string[] = [];
      const emotions: string[] = [];
      const locations: string[] = [];
      const metadataInsights: any[] = [];
      
      recentPosts.forEach(post => {
        // 🎯 AIが実際に分析した内容を優先使用
        const aiAnalysis = extractFromAIAnalysis(post);
        console.log(`🎯 AI Analysis for "${post.title}":`, JSON.stringify(aiAnalysis));
        
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
        
        if (post.userComment) {
          const text = post.userComment || '';
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
      
      console.log('🎵 Extracted analysis:', { 
        keywords: keywords, 
        emotions: emotions, 
        locations: locations,
        keywordsCount: keywords.length,
        emotionsCount: emotions.length,
        locationsCount: locations.length
      });
      
      // キーワードベースで音楽カテゴリを決定
      const contentAnalysis = {
        keywords: [...new Set(keywords)], // 重複除去
        emotions: [...new Set(emotions)],
        locations: [...new Set(locations)]
      };
      
      console.log('🎵 Final content analysis for music mood:', {
        ...contentAnalysis,
        keywordsArray: contentAnalysis.keywords,
        emotionsArray: contentAnalysis.emotions,
        locationsArray: contentAnalysis.locations
      });
      
      const musicMood = determineMusicMoodFromContent(contentAnalysis);
      
      console.log('🎵 Determined music mood:', musicMood);
      
      // 🎯 分析理由の詳細生成
      const detailedReasoning = generateDetailedReasoning(metadataInsights, contentAnalysis, musicMood);
      console.log('🎵 Generated detailed reasoning:', detailedReasoning);
      
      // 分析結果に基づいて音楽を推薦
      setPhotoMood(musicMood.description + ' - ' + detailedReasoning);
      const recommendations = await spotifyService.getContentBasedRecommendations(musicMood);
      
      console.log('🎵 Setting recommendations:', {
        recommendationsLength: recommendations.length,
        recommendations: JSON.stringify(recommendations, null, 2)
      });
      
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

  console.log('🎵 SpotifyMoodSync rendering:', {
    postsLength: posts.length,
    moodRecommendationsLength: moodRecommendations.length,
    photoMood: photoMood,
    analyzedPostsLength: analyzedPosts.length,
    moodRecommendations: JSON.stringify(moodRecommendations)
  });

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Music2 className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">🎵 写真の雰囲気に合う音楽</h3>
          <p className="text-sm text-gray-600">
            あなたの写真から感じる雰囲気：{photoMood || '分析中...'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            デバッグ: posts={posts.length}, recommendations={moodRecommendations.length}
          </p>
        </div>
      </div>

      {moodRecommendations.length > 0 ? (
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
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700 text-sm">
            🎵 写真を分析して音楽を推薦中です...
            {posts.length === 0 && ' まず写真を投稿してください。'}
          </p>
          {posts.length > 0 && (
            <p className="text-xs text-blue-600 mt-1">
              投稿数: {posts.length}件 | 分析済み: {analyzedPosts.length}件
            </p>
          )}
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