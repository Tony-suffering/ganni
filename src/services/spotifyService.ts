/**
 * Spotify API連携サービス
 * 音楽データの取得と文化的コンテキストの提供
 */

interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: string[];
  album: string;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  energy: number;
  valence: number;
  tempo: number;
}

interface MoodBasedRecommendation {
  mood: string;
  tracks: SpotifyTrack[];
  reasoning: string;
}

export class SpotifyService {
  private config: SpotifyConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    // 環境変数から設定を読み込み（本番では適切に設定）
    this.config = {
      clientId: process.env.VITE_SPOTIFY_CLIENT_ID || '',
      clientSecret: process.env.VITE_SPOTIFY_CLIENT_SECRET || '',
      redirectUri: process.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:5174/auth/spotify'
    };
  }

  /**
   * アクセストークンの取得
   */
  private async getAccessToken(): Promise<string> {
    // トークンが有効な場合はそのまま返す
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${this.config.clientId}:${this.config.clientSecret}`)
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error('Failed to get Spotify access token');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Spotify authentication error:', error);
      throw error;
    }
  }

  /**
   * 感情に基づく音楽推薦
   */
  async getMoodBasedRecommendations(emotions: {
    joy: number;
    peace: number;
    excitement: number;
    energy: number;
  }): Promise<MoodBasedRecommendation[]> {
    // 実際のAPI実装では認証が必要
    // 現在はモックデータを返す
    return this.getMockRecommendations(emotions);
  }

  /**
   * 場所に基づく音楽推薦
   */
  async getLocationBasedMusic(location: {
    country?: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  }): Promise<SpotifyTrack[]> {
    // 実際のAPI実装では地域プレイリストを取得
    return this.getMockLocationMusic(location);
  }

  /**
   * アーティスト情報の取得
   */
  async getArtistInfo(artistName: string): Promise<{
    id: string;
    name: string;
    genres: string[];
    popularity: number;
    external_urls: { spotify: string };
    images: { url: string; width: number; height: number }[];
  } | null> {
    try {
      if (!this.config.clientId) {
        console.warn('Spotify API not configured');
        return null;
      }

      const token = await this.getAccessToken();
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search artist');
      }

      const data = await response.json();
      const artists = data.artists.items;
      
      return artists.length > 0 ? artists[0] : null;
    } catch (error) {
      console.error('Error fetching artist info:', error);
      return null;
    }
  }

  /**
   * モック推薦データ（実際のAPI未設定時）
   */
  private getMockRecommendations(emotions: any): MoodBasedRecommendation[] {
    const recommendations: MoodBasedRecommendation[] = [];

    if (emotions.joy > 0.7) {
      recommendations.push({
        mood: 'joyful',
        reasoning: '喜びの感情が高いため、アップビートで明るい楽曲をお勧めします',
        tracks: [
          {
            id: 'mock1',
            name: 'Happy',
            artists: ['Pharrell Williams'],
            album: 'G I R L',
            preview_url: null,
            external_urls: { spotify: 'https://open.spotify.com/track/example' },
            energy: 0.8,
            valence: 0.9,
            tempo: 160
          }
        ]
      });
    }

    if (emotions.peace > 0.7) {
      recommendations.push({
        mood: 'peaceful',
        reasoning: '穏やかな気分のため、リラックスできる楽曲をお勧めします',
        tracks: [
          {
            id: 'mock2',
            name: 'Weightless',
            artists: ['Marconi Union'],
            album: 'Ambient Music',
            preview_url: null,
            external_urls: { spotify: 'https://open.spotify.com/track/example2' },
            energy: 0.1,
            valence: 0.6,
            tempo: 50
          }
        ]
      });
    }

    return recommendations;
  }

  /**
   * モック場所音楽データ
   */
  private getMockLocationMusic(location: any): SpotifyTrack[] {
    // 場所に基づくモック楽曲
    return [
      {
        id: 'location1',
        name: 'Tokyo Nights',
        artists: ['City Pop Artist'],
        album: 'Urban Sounds',
        preview_url: null,
        external_urls: { spotify: 'https://open.spotify.com/track/tokyo' },
        energy: 0.6,
        valence: 0.7,
        tempo: 120
      }
    ];
  }

  /**
   * ユーザー認証URL生成
   */
  getAuthUrl(): string {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'user-top-read'
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      scope: scopes,
      redirect_uri: this.config.redirectUri,
      state: this.generateState()
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  /**
   * 認証コールバック処理
   */
  async handleAuthCallback(code: string, state: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    // ステート検証は省略

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${this.config.clientId}:${this.config.clientSecret}`)
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri
      })
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return await response.json();
  }

  /**
   * ユーザーのトップトラック取得
   */
  async getUserTopTracks(userToken: string, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'): Promise<SpotifyTrack[]> {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user top tracks');
      }

      const data = await response.json();
      return data.items.map((track: any) => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map((artist: any) => artist.name),
        album: track.album.name,
        preview_url: track.preview_url,
        external_urls: track.external_urls,
        energy: 0.5, // 実際はaudio featuresから取得
        valence: 0.5,
        tempo: 120
      }));
    } catch (error) {
      console.error('Error fetching user top tracks:', error);
      return [];
    }
  }

  /**
   * 音楽分析に基づく感情マッピング
   */
  mapMusicToEmotion(tracks: SpotifyTrack[]): {
    dominantMood: string;
    energyLevel: 'low' | 'medium' | 'high';
    musicalPersonality: string;
  } {
    if (tracks.length === 0) {
      return {
        dominantMood: 'neutral',
        energyLevel: 'medium',
        musicalPersonality: 'バランス型'
      };
    }

    const avgEnergy = tracks.reduce((sum, track) => sum + track.energy, 0) / tracks.length;
    const avgValence = tracks.reduce((sum, track) => sum + track.valence, 0) / tracks.length;
    
    let dominantMood = 'neutral';
    if (avgValence > 0.6 && avgEnergy > 0.6) dominantMood = 'energetic';
    else if (avgValence > 0.6 && avgEnergy <= 0.6) dominantMood = 'happy';
    else if (avgValence <= 0.4 && avgEnergy > 0.6) dominantMood = 'intense';
    else if (avgValence <= 0.4 && avgEnergy <= 0.4) dominantMood = 'melancholic';

    const energyLevel = avgEnergy > 0.7 ? 'high' : avgEnergy > 0.4 ? 'medium' : 'low';
    
    const personalities = {
      'energetic': 'エナジェティック',
      'happy': 'ポジティブ',
      'intense': 'インテンス',
      'melancholic': 'メランコリック',
      'neutral': 'バランス型'
    };

    return {
      dominantMood,
      energyLevel,
      musicalPersonality: personalities[dominantMood as keyof typeof personalities]
    };
  }

  /**
   * ランダムステート生成
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * API設定状況の確認
   */
  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret);
  }

  /**
   * 設定情報の更新
   */
  updateConfig(config: Partial<SpotifyConfig>): void {
    this.config = { ...this.config, ...config };
  }
}