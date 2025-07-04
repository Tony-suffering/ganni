import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Palette,
  Users,
  BookOpen,
  Minimize2,
  TrendingUp,
  ShoppingBag,
  MapPin,
  Camera,
  Lightbulb
} from 'lucide-react';
import { Post } from '../../types';
import { analyticsService } from '../../services/analyticsService';

interface PersonalityAnalysisProps {
  posts: Post[];
  user: any;
}

interface PersonalityTraits {
  adventurous: number;      // 冒険性
  aesthetic: number;        // 美的感覚
  social: number;          // 社交性
  detail_oriented: number; // 記録性
  minimalist: number;      // ミニマリズム
}

interface PersonalityType {
  type: string;
  title: string;
  description: string;
  characteristics: string[];
  recommendations: {
    products: string[];
    experiences: string[];
    destinations: string[];
  };
  icon: React.ElementType;
  color: string;
  score: number;
}

export const PersonalityAnalysis: React.FC<PersonalityAnalysisProps> = ({ posts, user }) => {
  
  const analyzePersonality = (): PersonalityTraits => {
    if (posts.length === 0) {
      return { adventurous: 0, aesthetic: 0, social: 0, detail_oriented: 0, minimalist: 0 };
    }

    let adventurous = 0;
    let aesthetic = 0;
    let social = 0;
    let detail_oriented = 0;
    let minimalist = 0;

    posts.forEach(post => {
      const text = (post.title + ' ' + post.userComment).toLowerCase();
      const tags = post.tags.map(tag => tag.name.toLowerCase());
      
      // 冒険性分析
      const adventureWords = ['旅行', '冒険', '探索', '発見', '新しい', '初めて', '挑戦', '体験'];
      const adventureTags = ['旅行', '自然', '建物', 'イベント'];
      if (adventureWords.some(word => text.includes(word)) || 
          tags.some(tag => adventureTags.includes(tag))) {
        adventurous += 1;
      }

      // 美的感覚分析
      const aestheticWords = ['美しい', '素晴らしい', '芸術', 'アート', '色彩', '構図', '光', '影'];
      const aestheticTags = ['アート', '風景', '夜景'];
      if (aestheticWords.some(word => text.includes(word)) || 
          tags.some(tag => aestheticTags.includes(tag))) {
        aesthetic += 1;
      }

      // 社交性分析
      const socialWords = ['みんな', '友達', '一緒', '仲間', '集まり', '会う', 'パーティー'];
      const socialTags = ['人物', 'イベント'];
      if (socialWords.some(word => text.includes(word)) || 
          tags.some(tag => socialTags.includes(tag))) {
        social += 1;
      }

      // 記録性分析（詳細な投稿）
      if (post.userComment.length > 50) {
        detail_oriented += 1;
      }
      const detailWords = ['詳細', '記録', '思い出', '日記', '覚えて'];
      if (detailWords.some(word => text.includes(word))) {
        detail_oriented += 1;
      }

      // ミニマリズム分析
      if (post.userComment.length < 20 && post.title.length < 10) {
        minimalist += 1;
      }
      const minimalWords = ['シンプル', 'ミニマル', '静寂', '無駄', '厳選'];
      if (minimalWords.some(word => text.includes(word))) {
        minimalist += 1;
      }
    });

    // 正規化（0-100スケール）
    const total = posts.length;
    return {
      adventurous: Math.round((adventurous / total) * 100),
      aesthetic: Math.round((aesthetic / total) * 100),
      social: Math.round((social / total) * 100),
      detail_oriented: Math.round((detail_oriented / total) * 100),
      minimalist: Math.round((minimalist / total) * 100)
    };
  };

  const generatePersonalityTypes = (traits: PersonalityTraits): PersonalityType[] => {
    return [
      {
        type: 'explorer',
        title: 'エクスプローラー',
        description: '新しい場所や体験を求める冒険家タイプ',
        characteristics: [
          '多様な場所を訪れる',
          '新しい体験を積極的に求める',
          '変化を楽しむ',
          'チャレンジ精神旺盛'
        ],
        recommendations: {
          products: ['アウトドアギア', '旅行グッズ', '地図・ガイドブック'],
          experiences: ['アドベンチャーツアー', '新しいアクティビティ', '文化体験'],
          destinations: ['秘境スポット', '新興観光地', 'トレッキングコース']
        },
        icon: Compass,
        color: 'bg-orange-500',
        score: traits.adventurous
      },
      {
        type: 'aesthete',
        title: 'アーティスト',
        description: '美的感覚に優れ、芸術性を重視するタイプ',
        characteristics: [
          '美しいものに敏感',
          '構図や色彩にこだわり',
          '芸術的な表現を好む',
          'クリエイティブな視点'
        ],
        recommendations: {
          products: ['カメラ・撮影機材', 'アート用品', 'デザイン雑貨'],
          experiences: ['美術館・ギャラリー巡り', '写真ワークショップ', 'アート制作体験'],
          destinations: ['美術館', 'フォトジェニックスポット', '歴史的建造物']
        },
        icon: Palette,
        color: 'bg-gray-500',
        score: traits.aesthetic
      },
      {
        type: 'socializer',
        title: 'ソーシャライザー',
        description: '人とのつながりを大切にする社交的なタイプ',
        characteristics: [
          '人との交流を楽しむ',
          'グループ活動を好む',
          'コミュニケーション重視',
          '共有体験を大切にする'
        ],
        recommendations: {
          products: ['パーティーグッズ', 'ゲーム・エンタメ', 'ギフト用品'],
          experiences: ['グループツアー', 'ワークショップ', 'イベント参加'],
          destinations: ['人気観光地', 'フェスティバル会場', 'カフェ・レストラン']
        },
        icon: Users,
        color: 'bg-blue-500',
        score: traits.social
      },
      {
        type: 'documentarian',
        title: 'ドキュメンタリアン',
        description: '詳細な記録と思い出の保存を重視するタイプ',
        characteristics: [
          '詳細な記録を残す',
          '思い出を大切にする',
          '情報収集が得意',
          '継続的な記録'
        ],
        recommendations: {
          products: ['日記・手帳', 'ストレージ機器', '記録用品'],
          experiences: ['歴史学習ツアー', 'ワークショップ記録', 'スキルアップ講座'],
          destinations: ['博物館', '歴史的場所', '学習施設']
        },
        icon: BookOpen,
        color: 'bg-green-500',
        score: traits.detail_oriented
      },
      {
        type: 'minimalist',
        title: 'ミニマリスト',
        description: 'シンプルで洗練されたものを好むタイプ',
        characteristics: [
          'シンプルを好む',
          '質重視の選択',
          '無駄を削ぎ落とす',
          '洗練された美意識'
        ],
        recommendations: {
          products: ['シンプルデザイン商品', '高品質アイテム', 'ミニマル雑貨'],
          experiences: ['瞑想・ヨガ', 'シンプルライフ講座', '断捨離サービス'],
          destinations: ['静寂なスポット', 'ミニマルデザイン施設', '自然スポット']
        },
        icon: Minimize2,
        color: 'bg-gray-500',
        score: traits.minimalist
      }
    ];
  };

  const traits = analyzePersonality();
  const personalityTypes = generatePersonalityTypes(traits);
  const dominantType = personalityTypes.reduce((max, type) => type.score > max.score ? type : max);

  useEffect(() => {
    if (posts.length > 0 && dominantType) {
      // パーソナリティ分析完了をトラッキング
      analyticsService.setPersonalityType(dominantType.type);
      analyticsService.trackRecommendationShown('personality_products', [
        dominantType.recommendations.products.join(', ')
      ]);
    }
  }, [posts.length, dominantType]);

  const handleMonetizationClick = (category: string, item: string, url: string) => {
    const partner = url.includes('amzn.to') ? 'amazon' : 
                   url.includes('booking.com') ? 'booking' : 'custom';
    analyticsService.trackAffiliateClick(category, item, url, partner);
  };

  if (posts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">パーソナリティ分析</h3>
        <div className="text-center text-gray-500 py-8">
          投稿データがありません
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-6">あなたのパーソナリティ分析</h3>
        
        {/* メインパーソナリティ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className={`p-4 rounded-full ${dominantType.color}`}>
              <dominantType.icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">{dominantType.title}タイプ</h4>
              <p className="text-gray-600">{dominantType.description}</p>
              <div className="text-sm text-indigo-600 font-medium mt-1">
                適合度: {dominantType.score}%
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-semibold text-gray-800 mb-2">あなたの特徴</h5>
              <ul className="space-y-1">
                {dominantType.characteristics.map((char, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2" />
                    {char}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-800 mb-2">おすすめ提案</h5>
              <div className="text-sm text-gray-600 space-y-1">
                <div>📦 {dominantType.recommendations.products.slice(0, 2).join(', ')}</div>
                <div>🎯 {dominantType.recommendations.experiences.slice(0, 2).join(', ')}</div>
                <div>📍 {dominantType.recommendations.destinations.slice(0, 2).join(', ')}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* パーソナリティスコア詳細 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-indigo-500" />
            パーソナリティスコア
          </h4>
          
          <div className="space-y-4">
            {personalityTypes.map((type, index) => (
              <motion.div
                key={type.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-4"
              >
                <div className={`p-2 rounded-lg ${type.color}`}>
                  <type.icon className="w-4 h-4 text-white" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{type.title}</span>
                    <span className="text-sm text-gray-600">{type.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${type.score}%` }}
                      transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                      className={`h-2 rounded-full ${type.color}`}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* パーソナライズド提案 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
            あなたへのおすすめ
          </h4>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center mb-3">
                <ShoppingBag className="w-4 h-4 text-blue-500 mr-2" />
                <h5 className="font-medium text-gray-800">商品・サービス</h5>
              </div>
              <ul className="space-y-2">
                {dominantType.recommendations.products.map((product, index) => (
                  <li key={index} className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                    {product}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <div className="flex items-center mb-3">
                <Camera className="w-4 h-4 text-green-500 mr-2" />
                <h5 className="font-medium text-gray-800">体験・アクティビティ</h5>
              </div>
              <ul className="space-y-2">
                {dominantType.recommendations.experiences.map((experience, index) => (
                  <li key={index} className="text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-lg">
                    {experience}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <div className="flex items-center mb-3">
                <MapPin className="w-4 h-4 text-purple-500 mr-2" />
                <h5 className="font-medium text-gray-800">おすすめスポット</h5>
              </div>
              <ul className="space-y-2">
                {dominantType.recommendations.destinations.map((destination, index) => (
                  <li key={index} className="text-sm text-gray-600 bg-purple-50 px-3 py-2 rounded-lg">
                    {destination}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
        </motion.div>

        {/* マネタイズエンジン */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <MonetizationEngine 
            personalityType={dominantType}
            onTrackClick={handleMonetizationClick}
          />
        </motion.div>
      </div>
    </div>
  );
};