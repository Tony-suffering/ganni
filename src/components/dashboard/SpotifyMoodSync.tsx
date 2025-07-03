import React, { useState, useEffect } from 'react';
import { Music2, Camera, Sparkles } from 'lucide-react';
import { Post } from '../../types';
import { SpotifyService } from '../../services/spotifyService';

const spotifyService = new SpotifyService();

interface SpotifyMoodSyncProps {
  posts: Post[];
  userToken?: string;
}

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
    // 最近の投稿から感情を分析
    const recentPosts = posts.slice(0, 5);
    
    // 写真の雰囲気から感情を推定
    let totalEnergy = 0;
    let totalPositivity = 0;
    let analyzedCount = 0;
    
    recentPosts.forEach(post => {
      // photoScoreがある場合は使用
      if (post.photoScore) {
        totalEnergy += post.photoScore.lighting.quality * 0.1;
        totalPositivity += post.photoScore.overall * 0.1;
        analyzedCount++;
      } else {
        // photoScoreがない場合は、他の要素から推定
        // いいね数やコメントから人気度を推定
        const popularity = (post.likes_count || 0) * 0.1 + (post.comments?.length || 0) * 0.2;
        const estimatedPositivity = Math.min(popularity * 0.1, 1);
        
        // 時間帯から活発さを推定（朝昼は活発、夜は落ち着いた）
        const postHour = new Date(post.created_at).getHours();
        const estimatedEnergy = (postHour >= 6 && postHour <= 18) ? 0.7 : 0.3;
        
        totalEnergy += estimatedEnergy;
        totalPositivity += estimatedPositivity;
        analyzedCount++;
      }
    });

    // 分析した投稿がない場合のデフォルト値
    const avgEnergy = analyzedCount > 0 ? totalEnergy / analyzedCount : 0.5;
    const avgPositivity = analyzedCount > 0 ? totalPositivity / analyzedCount : 0.5;

    // 感情パラメータを設定
    const emotions = {
      joy: avgPositivity > 0.7 ? 0.8 : 0.4,
      peace: avgEnergy < 0.5 ? 0.8 : 0.4,
      excitement: avgEnergy > 0.7 ? 0.8 : 0.4,
      energy: avgEnergy
    };

    // 写真の雰囲気を判定
    if (avgPositivity > 0.7 && avgEnergy > 0.6) {
      setPhotoMood('明るく活発');
    } else if (avgPositivity > 0.7 && avgEnergy <= 0.6) {
      setPhotoMood('穏やかで幸せ');
    } else if (avgPositivity <= 0.5 && avgEnergy > 0.6) {
      setPhotoMood('ダイナミック');
    } else {
      setPhotoMood('落ち着いた');
    }

    // Spotifyから推薦を取得
    const recommendations = await spotifyService.getMoodBasedRecommendations(emotions);
    setMoodRecommendations(recommendations);
    setAnalyzedPosts(recentPosts);
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