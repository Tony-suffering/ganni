import React from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  ShoppingCart,
  MapPin,
  Calendar,
  Star,
  Zap,
  Gift,
  TrendingUp
} from 'lucide-react';

interface PersonalityType {
  type: string;
  title: string;
}

interface MonetizationEngineProps {
  personalityType: PersonalityType;
  onTrackClick: (category: string, item: string, url: string) => void;
}

interface MonetizationItem {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  rating: number;
  reviews: number;
  image: string;
  affiliateUrl: string;
  provider: 'amazon' | 'rakuten' | 'booking' | 'activity-japan' | 'custom';
  category: 'product' | 'experience' | 'destination' | 'service';
  urgency?: string;
  badge?: string;
}

export const MonetizationEngine: React.FC<MonetizationEngineProps> = ({ 
  personalityType, 
  onTrackClick 
}) => {
  
  const generatePersonalizedItems = (type: string): MonetizationItem[] => {
    const baseItems: Record<string, MonetizationItem[]> = {
      'explorer': [
        {
          id: 'exp-1',
          title: 'ソニー α7R V ミラーレス一眼',
          description: '冒険の瞬間を最高画質で記録。プロ仕様の機能で思い出を美しく残せます',
          price: '¥398,000',
          originalPrice: '¥448,000',
          rating: 4.8,
          reviews: 245,
          image: 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?w=300',
          affiliateUrl: 'https://amzn.to/explorer-camera',
          provider: 'amazon',
          category: 'product',
          badge: '11%OFF',
          urgency: 'タイムセール残り8時間'
        },
        {
          id: 'exp-2',
          title: '屋久島トレッキング 3日間ツアー',
          description: '縄文杉と出会う感動の旅。ガイド付きで安全に秘境を探索できます',
          price: '¥89,800',
          rating: 4.9,
          reviews: 156,
          image: 'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?w=300',
          affiliateUrl: 'https://booking.com/yakushima-tour',
          provider: 'booking',
          category: 'experience',
          badge: '人気No.1'
        },
        {
          id: 'exp-3',
          title: 'パタゴニア バックパック 40L',
          description: '軽量で耐久性抜群。長期トレッキングに最適な機能性を追求',
          price: '¥24,800',
          originalPrice: '¥29,800',
          rating: 4.7,
          reviews: 89,
          image: 'https://images.pexels.com/photos/1366957/pexels-photo-1366957.jpeg?w=300',
          affiliateUrl: 'https://amzn.to/patagonia-backpack',
          provider: 'amazon',
          category: 'product',
          badge: '17%OFF'
        }
      ],
      'aesthete': [
        {
          id: 'aes-1',
          title: 'Wacom Intuos Pro ペンタブレット',
          description: '最高のデジタルアート制作環境。プロアーティストも愛用する精密さ',
          price: '¥32,800',
          rating: 4.8,
          reviews: 321,
          image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?w=300',
          affiliateUrl: 'https://amzn.to/wacom-pro',
          provider: 'amazon',
          category: 'product',
          badge: 'ベストセラー'
        },
        {
          id: 'aes-2',
          title: '東京都現代美術館 特別展チケット',
          description: '現代アートの最前線を体感。限定展示で感性を刺激する作品群',
          price: '¥2,200',
          rating: 4.6,
          reviews: 78,
          image: 'https://images.pexels.com/photos/1194420/pexels-photo-1194420.jpeg?w=300',
          affiliateUrl: 'https://mot-art-museum.jp/tickets',
          provider: 'custom',
          category: 'experience',
          urgency: '今月末まで'
        },
        {
          id: 'aes-3',
          title: 'Adobe Creative Suite 年間プラン',
          description: 'プロのクリエイティブツール一式。写真編集からイラスト制作まで',
          price: '¥72,336/年',
          originalPrice: '¥84,480/年',
          rating: 4.9,
          reviews: 1205,
          image: 'https://images.pexels.com/photos/196645/pexels-photo-196645.jpeg?w=300',
          affiliateUrl: 'https://adobe.com/creative-suite',
          provider: 'custom',
          category: 'service',
          badge: '14%OFF'
        }
      ],
      'socializer': [
        {
          id: 'soc-1',
          title: 'GoProセット + アクセサリー',
          description: 'みんなでの思い出作りに最適。シェアしやすい高画質動画撮影',
          price: '¥68,800',
          rating: 4.7,
          reviews: 445,
          image: 'https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg?w=300',
          affiliateUrl: 'https://amzn.to/gopro-set',
          provider: 'amazon',
          category: 'product',
          badge: 'セット割引'
        },
        {
          id: 'soc-2',
          title: '温泉旅館 グループ宿泊プラン',
          description: '最大8名様まで。貸切風呂付きで仲間との特別な時間を演出',
          price: '¥18,500/人',
          originalPrice: '¥24,000/人',
          rating: 4.8,
          reviews: 267,
          image: 'https://images.pexels.com/photos/261181/pexels-photo-261181.jpeg?w=300',
          affiliateUrl: 'https://booking.com/group-onsen',
          provider: 'booking',
          category: 'destination',
          badge: '23%OFF',
          urgency: '早割適用中'
        }
      ],
      'documentarian': [
        {
          id: 'doc-1',
          title: 'モレスキン ハードカバーノート',
          description: '高品質な記録帳。旅の思い出や日常を美しく保存できる逸品',
          price: '¥3,200',
          rating: 4.6,
          reviews: 156,
          image: 'https://images.pexels.com/photos/261579/pexels-photo-261579.jpeg?w=300',
          affiliateUrl: 'https://amzn.to/moleskine-notebook',
          provider: 'amazon',
          category: 'product'
        },
        {
          id: 'doc-2',
          title: 'Evernote プレミアムプラン',
          description: '無制限のデジタル記録。写真、文書、アイデアをクラウドで一元管理',
          price: '¥680/月',
          rating: 4.5,
          reviews: 892,
          image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?w=300',
          affiliateUrl: 'https://evernote.com/premium',
          provider: 'custom',
          category: 'service',
          badge: '1ヶ月無料'
        }
      ],
      'minimalist': [
        {
          id: 'min-1',
          title: '無印良品 シンプルカメラ',
          description: '必要最小限の機能で本質的な撮影体験。洗練されたデザイン',
          price: '¥45,900',
          rating: 4.4,
          reviews: 89,
          image: 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?w=300',
          affiliateUrl: 'https://muji.com/simple-camera',
          provider: 'custom',
          category: 'product',
          badge: 'ミニマル設計'
        },
        {
          id: 'min-2',
          title: '瞑想リトリート 1日体験',
          description: '心の整理と本質的な気づき。静寂の中で自分と向き合う時間',
          price: '¥8,500',
          rating: 4.9,
          reviews: 34,
          image: 'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?w=300',
          affiliateUrl: 'https://meditation-retreat.jp',
          provider: 'custom',
          category: 'experience',
          badge: '少人数制'
        }
      ]
    };

    return baseItems[type] || baseItems['explorer'];
  };

  const items = generatePersonalizedItems(personalityType.type);

  const handleItemClick = (item: MonetizationItem) => {
    onTrackClick(item.category, item.title, item.affiliateUrl);
    
    // アナリティクス送信
    if (typeof gtag !== 'undefined') {
      gtag('event', 'affiliate_click', {
        'event_category': 'monetization',
        'event_label': item.title,
        'value': parseFloat(item.price.replace(/[¥,]/g, ''))
      });
    }
    
    // 新しいタブで開く
    window.open(item.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'product': return ShoppingCart;
      case 'experience': return Calendar;
      case 'destination': return MapPin;
      case 'service': return Zap;
      default: return Gift;
    }
  };

  const getProviderBadge = (provider: string) => {
    const badges = {
      'amazon': { text: 'Amazon', color: 'bg-orange-100 text-orange-800' },
      'rakuten': { text: '楽天', color: 'bg-red-100 text-red-800' },
      'booking': { text: 'Booking', color: 'bg-blue-100 text-blue-800' },
      'activity-japan': { text: 'Activity', color: 'bg-green-100 text-green-800' },
      'custom': { text: '公式', color: 'bg-purple-100 text-purple-800' }
    };
    return badges[provider] || badges['custom'];
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            {personalityType.title}タイプ向け おすすめ商品
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            あなたのパーソナリティに合わせて厳選しました
          </p>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 px-3 py-1 rounded-full">
          <span className="text-xs font-medium text-green-700">🎁 特別価格</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, index) => {
          const CategoryIcon = getCategoryIcon(item.category);
          const providerBadge = getProviderBadge(item.provider);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 bg-white group cursor-pointer"
              onClick={() => handleItemClick(item)}
            >
              <div className="relative">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {item.badge && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {item.badge}
                  </div>
                )}
                {item.urgency && (
                  <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    ⏰ {item.urgency}
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${providerBadge.color}`}>
                    <CategoryIcon className="w-3 h-3" />
                    <span>{providerBadge.text}</span>
                  </div>
                  {renderStars(item.rating)}
                </div>

                <h5 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h5>
                
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {item.description}
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">{item.price}</span>
                      {item.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">{item.originalPrice}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.reviews}件のレビュー
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors flex items-center space-x-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemClick(item);
                    }}
                  >
                    <span>詳細</span>
                    <ExternalLink className="w-3 h-3" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* プレミアム機能誘導 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <h5 className="font-semibold text-purple-800 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              もっと精密な提案が欲しい？
            </h5>
            <p className="text-sm text-purple-700 mt-1">
              プレミアムプランで、より詳細なパーソナリティ分析と専用おすすめ商品をお楽しみください
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors whitespace-nowrap"
            onClick={() => {
              onTrackClick('premium', 'upgrade_click', '/premium');
              // プレミアムページへの遷移
              window.location.href = '/premium';
            }}
          >
            詳細を見る
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};