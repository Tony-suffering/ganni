import React, { useState, useEffect } from 'react';
import { Music, Headphones, TrendingUp, Play, ExternalLink } from 'lucide-react';
import { SpotifyService } from '../../services/spotifyService';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';

const spotifyService = new SpotifyService();

interface SpotifyTrack {
  id: string;
  name: string;
  artists: string[];
  album: string;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

interface MusicProfile {
  topTracks: SpotifyTrack[];
  musicalPersonality: string;
  energyLevel: 'low' | 'medium' | 'high';
  dominantMood: string;
}

export const SpotifyIntegration: React.FC = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [musicProfile, setMusicProfile] = useState<MusicProfile | null>(null);
  const [recommendations, setRecommendations] = useState<SpotifyTrack[]>([]);

  useEffect(() => {
    checkSpotifyConnection();
  }, [user]);

  const checkSpotifyConnection = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_spotify_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setIsConnected(true);
        
        // トークンの有効期限をチェック
        const expiresAt = new Date(data.expires_at);
        const now = new Date();
        
        if (expiresAt <= now) {
          console.log('🎵 Spotify token expired, refreshing...');
          try {
            const refreshedData = await spotifyService.refreshUserToken(data.refresh_token);
            
            // 新しいトークンをDBに保存
            const newExpiresAt = new Date(Date.now() + refreshedData.expires_in * 1000);
            await supabase
              .from('user_spotify_tokens')
              .update({
                access_token: refreshedData.access_token,
                expires_at: newExpiresAt.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id);
              
            await loadMusicProfile(refreshedData.access_token);
          } catch (refreshError) {
            console.error('🎵 Failed to refresh token:', refreshError);
            setIsConnected(false);
          }
        } else {
          await loadMusicProfile(data.access_token);
        }
      }
    } catch (error) {
      console.error('Error checking Spotify connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMusicProfile = async (accessToken: string) => {
    try {
      console.log('🎵 Loading music profile with access token');
      const topTracks = await spotifyService.getUserTopTracks(accessToken);
      
      if (!topTracks || topTracks.length === 0) {
        console.warn('🎵 No top tracks returned from Spotify');
        return;
      }
      
      const analysis = spotifyService.mapMusicToEmotion(topTracks);

      setMusicProfile({
        topTracks: topTracks.slice(0, 5),
        ...analysis
      });

      const emotions = {
        joy: analysis.dominantMood === 'happy' ? 0.8 : 0.4,
        peace: analysis.dominantMood === 'melancholic' ? 0.7 : 0.5,
        excitement: analysis.energyLevel === 'high' ? 0.8 : 0.4,
        energy: analysis.energyLevel === 'high' ? 0.9 : 0.5
      };

      const recs = await spotifyService.getMoodBasedRecommendations(emotions);
      if (recs.length > 0) {
        setRecommendations(recs[0].tracks);
      }
    } catch (error) {
      console.error('Error loading music profile:', error);
    }
  };

  const connectSpotify = () => {
    const authUrl = spotifyService.getAuthUrl();
    window.location.href = authUrl;
  };

  const disconnectSpotify = async () => {
    if (!user) return;

    try {
      await supabase
        .from('user_spotify_tokens')
        .delete()
        .eq('user_id', user.id);

      setIsConnected(false);
      setMusicProfile(null);
      setRecommendations([]);
    } catch (error) {
      console.error('Error disconnecting Spotify:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!spotifyService.isConfigured()) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <Music className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Spotify連携は現在準備中です</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Music className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Spotify連携</h3>
              <p className="text-sm text-gray-600">
                {isConnected ? '音楽プロファイルを分析中' : '音楽の好みを分析します'}
              </p>
            </div>
          </div>

          {isConnected ? (
            <button
              onClick={disconnectSpotify}
              className="text-sm text-red-600 hover:text-red-700"
            >
              連携を解除
            </button>
          ) : (
            <button
              onClick={connectSpotify}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Music className="w-4 h-4" />
              Spotifyと連携
            </button>
          )}
        </div>

        {isConnected && musicProfile && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Headphones className="w-5 h-5 text-gray-600" />
                あなたの音楽プロファイル
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">音楽パーソナリティ</p>
                  <p className="font-semibold">{musicProfile.musicalPersonality}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">エネルギーレベル</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-1">
                      {['low', 'medium', 'high'].map((level) => (
                        <div
                          key={level}
                          className={`h-2 w-8 rounded ${
                            musicProfile.energyLevel === level ||
                            (musicProfile.energyLevel === 'high' && level !== 'low') ||
                            (musicProfile.energyLevel === 'medium' && level === 'low')
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">
                      {musicProfile.energyLevel === 'high' ? '高' : 
                       musicProfile.energyLevel === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">主な気分</p>
                  <p className="font-semibold">
                    {musicProfile.dominantMood === 'energetic' ? 'エネルギッシュ' :
                     musicProfile.dominantMood === 'happy' ? 'ハッピー' :
                     musicProfile.dominantMood === 'intense' ? 'インテンス' :
                     musicProfile.dominantMood === 'melancholic' ? 'メランコリック' :
                     'バランス型'}
                  </p>
                </div>
              </div>
            </div>

            {musicProfile.topTracks.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                  最近よく聴いている曲
                </h4>
                <div className="space-y-2">
                  {musicProfile.topTracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Play className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-sm">{track.name}</p>
                          <p className="text-xs text-gray-600">
                            {track.artists.join(', ')} • {track.album}
                          </p>
                        </div>
                      </div>
                      <a
                        href={track.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Music className="w-5 h-5 text-gray-600" />
                  おすすめの曲
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recommendations.slice(0, 4).map((track) => (
                    <a
                      key={track.id}
                      href={track.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <p className="font-medium text-sm">{track.name}</p>
                      <p className="text-xs text-gray-600">{track.artists.join(', ')}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!isConnected && (
          <div className="text-center py-8">
            <Music className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-4">
              Spotifyと連携すると、あなたの音楽の好みに基づいた<br />
              パーソナライズされた体験を提供できます
            </p>
            <ul className="text-sm text-gray-600 space-y-2 max-w-md mx-auto">
              <li>• 音楽の好みから性格分析</li>
              <li>• 投稿に合う楽曲の推薦</li>
              <li>• 気分に合わせたプレイリスト</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};