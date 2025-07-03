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
      clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '',
      redirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:5174/auth/spotify'
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
   * コンテンツ分析に基づく音楽推薦
   */
  async getContentBasedRecommendations(musicMood: any): Promise<MoodBasedRecommendation[]> {
    return this.getContentBasedMockRecommendations(musicMood);
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

    console.log('🎵 Generating recommendations with emotions:', emotions);

    // 明るく活発な雰囲気
    if (emotions.joy > 0.6 && emotions.energy > 0.6) {
      recommendations.push({
        mood: 'energetic-happy',
        reasoning: '明るく活発な写真の雰囲気に合う、エネルギッシュで前向きな楽曲です',
        tracks: [
          {
            id: 'mock1',
            name: 'Good Time',
            artists: ['Owl City', 'Carly Rae Jepsen'],
            album: 'The Midsummer Station',
            preview_url: null,
            external_urls: { spotify: 'https://open.spotify.com/track/5Z7ygHQo02SUrFmcgpwsKW' },
            energy: 0.82,
            valence: 0.89,
            tempo: 126
          },
          {
            id: 'mock2',
            name: 'Walking On Sunshine',
            artists: ['Katrina & The Waves'],
            album: 'Walking on Sunshine',
            preview_url: null,
            external_urls: { spotify: 'https://open.spotify.com/track/05wIrZSwuaVWhcv5FfqeH0' },
            energy: 0.78,
            valence: 0.96,
            tempo: 109
          },
          {
            id: 'mock3',
            name: 'Can\'t Stop The Feeling!',
            artists: ['Justin Timberlake'],
            album: 'Trolls',
            preview_url: null,
            external_urls: { spotify: 'https://open.spotify.com/track/6JV2JOEocMgcZxYSZelKcc' },
            energy: 0.82,
            valence: 0.93,
            tempo: 113
          }
        ]
      });
    }

    // 穏やかで幸せな雰囲気
    if (emotions.joy > 0.5 && emotions.peace > 0.5) {
      recommendations.push({
        mood: 'peaceful-happy',
        reasoning: '穏やかで幸せな写真の雰囲気に合う、心地よく優しい楽曲です',
        tracks: [
          {
            id: 'mock4',
            name: 'Somewhere Over The Rainbow',
            artists: ['Israel Kamakawiwoʻole'],
            album: 'Facing Future',
            preview_url: null,
            external_urls: { spotify: 'https://open.spotify.com/track/3skn2lauGk7Dx6bVIt5DVj' },
            energy: 0.26,
            valence: 0.64,
            tempo: 91
          },
          {
            id: 'mock5',
            name: 'Better Days',
            artists: ['OneRepublic'],
            album: 'Human',
            preview_url: null,
            external_urls: { spotify: 'https://open.spotify.com/track/5FfCiHTkMJQPB7EqsqBqOB' },
            energy: 0.65,
            valence: 0.78,
            tempo: 115
          },
          {
            id: 'mock6',
            name: 'Three Little Birds',
            artists: ['Bob Marley & The Wailers'],
            album: 'Exodus',
            preview_url: null,
            external_urls: { spotify: 'https://open.spotify.com/track/1YrnDTqvcnUKxAIeXyaEmU' },
            energy: 0.60,
            valence: 0.83,
            tempo: 76
          }
        ]
      });
    }

    // ダイナミックな雰囲気
    if (emotions.excitement > 0.6 || emotions.energy > 0.7) {
      recommendations.push({
        mood: 'dynamic',
        reasoning: 'ダイナミックな写真の雰囲気に合う、力強くドラマチックな楽曲です',
        tracks: [
          {
            id: 'mock7',
            name: 'Thunder',
            artists: ['Imagine Dragons'],
            album: 'Evolve',
            preview_url: null,
            external_urls: { spotify: 'https://open.spotify.com/track/1zB4vmk8tFRmM9UULNzbLB' },
            energy: 0.81,
            valence: 0.29,
            tempo: 168
          },
          {
            id: 'mock8',
            name: 'Eye of the Tiger',
            artists: ['Survivor'],
            album: 'Eye of the Tiger',
            preview_url: null,
            external_urls: { spotify: 'https://open.spotify.com/track/2KH16WveTQWT6KOG9Rg6e2' },
            energy: 0.82,
            valence: 0.51,
            tempo: 109
          },
          {
            id: 'mock9',
            name: 'Titanium',
            artists: ['David Guetta', 'Sia'],
            album: 'Nothing but the Beat',
            preview_url: null,
            external_urls: { spotify: 'https://open.spotify.com/track/0lHAMNU8RGiIObNnlR8f1F' },
            energy: 0.79,
            valence: 0.28,
            tempo: 126
          }
        ]
      });
    }

    // 落ち着いた雰囲気
    if (emotions.peace > 0.6 || (emotions.joy < 0.5 && emotions.energy < 0.5)) {
      recommendations.push({
        mood: 'calm',
        reasoning: '落ち着いた写真の雰囲気に合う、リラックスできる静かな楽曲です',
        tracks: [
          {
            id: 'mock10',
            name: 'River Flows In You',
            artists: ['Yiruma'],
            album: 'First Love',
            preview_url: null,
            external_urls: { spotify: 'https://open.spotify.com/track/7tJQNzahITYkHdKR2PQBH1' },
            energy: 0.21,
            valence: 0.22,
            tempo: 64
          },
          {
            id: 'mock11',
            name: 'Clair de Lune',
            artists: ['Claude Debussy'],
            album: 'Suite Bergamasque',
            preview_url: null,
            external_urls: { spotify: 'https://open.spotify.com/track/6pWgRkpqVfxnj3WuIcJ7WP' },
            energy: 0.12,
            valence: 0.09,
            tempo: 68
          },
          {
            id: 'mock12',
            name: 'The Night We Met',
            artists: ['Lord Huron'],
            album: 'Strange Trails',
            preview_url: null,
            external_urls: { spotify: 'https://open.spotify.com/track/0yAeHSMpDrOgrCMdq8vPiX' },
            energy: 0.44,
            valence: 0.21,
            tempo: 88
          }
        ]
      });
    }

    return recommendations;
  }

  /**
   * コンテンツ分析に基づくモック推薦データ
   */
  private getContentBasedMockRecommendations(musicMood: any): MoodBasedRecommendation[] {
    const recommendations: MoodBasedRecommendation[] = [];
    
    console.log('🎵 Generating content-based recommendations for:', musicMood.category);
    
    switch (musicMood.category) {
      case 'departure':
        recommendations.push({
          mood: 'departure',
          reasoning: '旅立ちの瞬間に合う、希望と冒険心を感じる楽曲です',
          tracks: [
            {
              id: 'dep1',
              name: 'Come on Eileen',
              artists: ['Dexys Midnight Runners'],
              album: 'Searching for the Young Soul Rebels',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/3w0BoJhLbXZEhL34IY5Ks6' },
              energy: 0.8,
              valence: 0.8,
              tempo: 125
            },
            {
              id: 'dep2',
              name: 'Here I Go Again',
              artists: ['Whitesnake'],
              album: 'Saints & Sinners',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/5R0NTEqfEfWYi0WZAoQpjO' },
              energy: 0.7,
              valence: 0.7,
              tempo: 132
            },
            {
              id: 'dep3',
              name: 'I\'m Gonna Be (500 Miles)',
              artists: ['The Proclaimers'],
              album: 'Sunshine on Leith',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/7tFiyTwD0nx5a1eklYtX2J' },
              energy: 0.8,
              valence: 0.9,
              tempo: 130
            }
          ]
        });
        break;
        
      case 'arrival':
        recommendations.push({
          mood: 'arrival',
          reasoning: '到着の安堵感と達成感を表現する、温かく迎え入れる楽曲です',
          tracks: [
            {
              id: 'arr1',
              name: 'Coming Home',
              artists: ['Diddy – Dirty Money', 'Skylar Grey'],
              album: 'Last Train to Paris',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/7KXjTSCq5nL1LoYtL7XAwS' },
              energy: 0.6,
              valence: 0.8,
              tempo: 89
            },
            {
              id: 'arr2',
              name: 'Home',
              artists: ['Edward Sharpe & The Magnetic Zeros'],
              album: 'Up from Below',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/4ceKDVNSO3oI3a6Z2Aqz9j' },
              energy: 0.7,
              valence: 0.9,
              tempo: 120
            },
            {
              id: 'arr3',
              name: 'Sweet Caroline',
              artists: ['Neil Diamond'],
              album: 'Brother Love\'s Travelling Salvation Show',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/1mXVgsBdtIVeCLJnSnmtdV' },
              energy: 0.6,
              valence: 0.8,
              tempo: 125
            }
          ]
        });
        break;
        
      case 'upbeat':
        recommendations.push({
          mood: 'upbeat',
          reasoning: '明るく元気な気分を盛り上げる、エネルギッシュな楽曲です',
          tracks: [
            {
              id: 'up1',
              name: 'Shut Up and Dance',
              artists: ['WALK THE MOON'],
              album: 'Talking Is Hard',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/0LoSg5Gru0mG06s8x2bNk7' },
              energy: 0.9,
              valence: 0.9,
              tempo: 128
            },
            {
              id: 'up2',
              name: 'Good as Hell',
              artists: ['Lizzo'],
              album: 'Cuz I Love You',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/4kzMSzW7dUyKtbJqwQHKNX' },
              energy: 0.8,
              valence: 0.9,
              tempo: 96
            },
            {
              id: 'up3',
              name: 'Uptown Funk',
              artists: ['Mark Ronson', 'Bruno Mars'],
              album: 'Uptown Special',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/32OlwWuMpZ6b0aN2RZOeMS' },
              energy: 0.9,
              valence: 0.9,
              tempo: 115
            }
          ]
        });
        break;
        
      case 'chill':
        recommendations.push({
          mood: 'chill',
          reasoning: '穏やかでリラックスした時間を演出する、心地よい楽曲です',
          tracks: [
            {
              id: 'ch1',
              name: 'Electric Feel',
              artists: ['MGMT'],
              album: 'Oracular Spectacular',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/3FtYBEfBWJFaWd2yQBRHKB' },
              energy: 0.6,
              valence: 0.7,
              tempo: 108
            },
            {
              id: 'ch2',
              name: 'Breathe Me',
              artists: ['Sia'],
              album: 'Colour the Small One',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/7hUfABNQbPdBc0lYNZiEOm' },
              energy: 0.3,
              valence: 0.4,
              tempo: 140
            },
            {
              id: 'ch3',
              name: 'Mad World',
              artists: ['Gary Jules'],
              album: 'Trading Snakeoil for Wolftickets',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/3JOVTQ5h4FNwYSCZOUhOAC' },
              energy: 0.2,
              valence: 0.2,
              tempo: 89
            }
          ]
        });
        break;
        
      case 'nostalgic':
        recommendations.push({
          mood: 'nostalgic',
          reasoning: '懐かしさと思い出に浸れる、感傷的で美しい楽曲です',
          tracks: [
            {
              id: 'nos1',
              name: 'Yesterday',
              artists: ['The Beatles'],
              album: 'Help!',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/3BQHpFgAp4l80e1XslIjNI' },
              energy: 0.3,
              valence: 0.4,
              tempo: 97
            },
            {
              id: 'nos2',
              name: 'The Way You Look Tonight',
              artists: ['Frank Sinatra'],
              album: 'Songs for Swingin\' Lovers!',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/1GgI4u6cZr71zzQFE7V4TS' },
              energy: 0.4,
              valence: 0.7,
              tempo: 120
            },
            {
              id: 'nos3',
              name: 'Fly Me to the Moon',
              artists: ['Frank Sinatra'],
              album: 'It Might as Well Be Swing',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/5b7_rVA0mGNWD3Vna6jYZy' },
              energy: 0.5,
              valence: 0.8,
              tempo: 142
            }
          ]
        });
        break;
        
      case 'morning':
        recommendations.push({
          mood: 'morning',
          reasoning: '朝の清々しさと新しい一日の始まりを感じる、爽やかな楽曲です',
          tracks: [
            {
              id: 'mor1',
              name: 'Good Morning Sunshine',
              artists: ['Oliver'],
              album: 'Good Morning Starshine',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/5sXHVyEj9K6tHFhrNbPy8P' },
              energy: 0.7,
              valence: 0.9,
              tempo: 130
            },
            {
              id: 'mor2',
              name: 'Here Comes the Sun',
              artists: ['The Beatles'],
              album: 'Abbey Road',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/6dGnYIeXmHdcikdzNNDMm2' },
              energy: 0.6,
              valence: 0.9,
              tempo: 129
            },
            {
              id: 'mor3',
              name: 'Beautiful Boy (Darling Boy)',
              artists: ['John Lennon'],
              album: 'Double Fantasy',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/2ZiucNOY1vbRo7zBrZhc7Z' },
              energy: 0.4,
              valence: 0.8,
              tempo: 73
            }
          ]
        });
        break;
        
      case 'night':
        recommendations.push({
          mood: 'night',
          reasoning: '夜の静けさと深みを感じる、神秘的で考えさせる楽曲です',
          tracks: [
            {
              id: 'nig1',
              name: 'Midnight City',
              artists: ['M83'],
              album: 'Hurry Up, We\'re Dreaming',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/0lEjsN8vVqSL0Xnj5vksee' },
              energy: 0.6,
              valence: 0.6,
              tempo: 105
            },
            {
              id: 'nig2',
              name: 'Blue Monday',
              artists: ['New Order'],
              album: 'Power, Corruption & Lies',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/0mltLo4UjzY6MHXB3vXiGl' },
              energy: 0.7,
              valence: 0.3,
              tempo: 124
            },
            {
              id: 'nig3',
              name: 'Nightcall',
              artists: ['Kavinsky'],
              album: 'OutRun',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/0lYBSQXN6rCTvUZvg9S0lU' },
              energy: 0.5,
              valence: 0.4,
              tempo: 124
            }
          ]
        });
        break;
        
      default:
        recommendations.push({
          mood: 'balanced',
          reasoning: 'バランスの取れた心地よい楽曲で、どんな場面にも合います',
          tracks: [
            {
              id: 'bal1',
              name: 'Count on Me',
              artists: ['Bruno Mars'],
              album: 'Doo-Wops & Hooligans',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/1PGa1GfcGGOPl8P8Cx44k5' },
              energy: 0.6,
              valence: 0.8,
              tempo: 140
            },
            {
              id: 'bal2',
              name: 'Perfect',
              artists: ['Ed Sheeran'],
              album: '÷ (Divide)',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/0tgVpDi06FyKpA1z0VMD4v' },
              energy: 0.4,
              valence: 0.7,
              tempo: 95
            },
            {
              id: 'bal3',
              name: 'Better Days',
              artists: ['OneRepublic'],
              album: 'Human',
              preview_url: null,
              external_urls: { spotify: 'https://open.spotify.com/track/5FfCiHTkMJQPB7EqsqBqOB' },
              energy: 0.6,
              valence: 0.8,
              tempo: 115
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

    // デバッグ用ログ
    console.log('🎵 Spotify Auth URL Debug:', {
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      currentUrl: window.location.origin
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      scope: scopes,
      redirect_uri: this.config.redirectUri,
      state: this.generateState()
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    console.log('🎵 Full Auth URL:', authUrl);

    return authUrl;
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