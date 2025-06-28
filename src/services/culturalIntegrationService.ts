import { CulturalContext, ArtExhibition, ArtVenue, EmotionAnalysis, CuratorResponse } from '../types/curator';

/**
 * 音楽・アート情報連携サービス
 * Spotify API、美術館・ギャラリー情報と感情分析を統合
 */
export class CulturalIntegrationService {
  private spotifyAccessToken: string | null = null;
  private readonly spotifyClientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  private readonly spotifyClientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

  constructor() {
    this.initializeSpotifyAuth();
  }

  /**
   * Spotify認証初期化
   */
  private async initializeSpotifyAuth() {
    if (!this.spotifyClientId || !this.spotifyClientSecret) {
      console.warn('🎵 Spotify API credentials not found, using mock data');
      return;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.spotifyClientId}:${this.spotifyClientSecret}`)}`
        },
        body: 'grant_type=client_credentials'
      });

      if (response.ok) {
        const data = await response.json();
        this.spotifyAccessToken = data.access_token;
        console.log('✅ Spotify API authenticated successfully');
      }
    } catch (error) {
      console.warn('⚠️ Spotify authentication failed:', error);
    }
  }

  /**
   * 感情分析に基づく文化的コンテキスト生成
   */
  async generateCulturalContext(
    emotionAnalysis: EmotionAnalysis,
    userLocation?: { latitude: number; longitude: number }
  ): Promise<CuratorResponse<CulturalContext>> {
    console.log('🎨 Generating cultural context based on emotions...');

    try {
      const startTime = Date.now();
      
      // 並行して音楽とアート情報を取得
      const [musicContext, artContext] = await Promise.all([
        this.getMusicRecommendations(emotionAnalysis),
        this.getArtRecommendations(emotionAnalysis, userLocation)
      ]);

      const culturalContext: CulturalContext = {
        music: musicContext,
        art: artContext
      };

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: culturalContext,
        metadata: {
          processingTime,
          confidence: 0.8,
          version: '1.0.0'
        }
      };
    } catch (error) {
      console.error('❌ Cultural context generation failed:', error);
      return {
        success: false,
        error: 'Failed to generate cultural context',
        data: this.getMockCulturalContext(),
        metadata: {
          processingTime: 500,
          confidence: 0.3,
          version: '1.0.0-fallback'
        }
      };
    }
  }

  /**
   * 感情に基づく音楽レコメンデーション
   */
  private async getMusicRecommendations(emotionAnalysis: EmotionAnalysis): Promise<CulturalContext['music']> {
    if (!this.spotifyAccessToken) {
      return this.getMockMusicRecommendations(emotionAnalysis);
    }

    try {
      // 感情スコアから音楽的特徴量を計算
      const musicFeatures = this.emotionToMusicFeatures(emotionAnalysis);
      
      // Spotify API でトラック検索
      const response = await fetch(
        `https://api.spotify.com/v1/recommendations?${new URLSearchParams({
          ...musicFeatures,
          limit: '10'
        })}`,
        {
          headers: {
            'Authorization': `Bearer ${this.spotifyAccessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return this.parseSpotifyRecommendations(data, emotionAnalysis);
      }
    } catch (error) {
      console.error('Spotify API call failed:', error);
    }

    return this.getMockMusicRecommendations(emotionAnalysis);
  }

  /**
   * 感情スコアを音楽特徴量に変換
   */
  private emotionToMusicFeatures(emotionAnalysis: EmotionAnalysis): Record<string, string> {
    const emotions = emotionAnalysis.emotions;
    
    // 感情から音楽特徴量を推算
    const valence = (emotions.joy * 0.4 + emotions.excitement * 0.3 + emotions.peace * 0.2 - emotions.melancholy * 0.1).toString();
    const energy = (emotions.excitement * 0.5 + emotions.curiosity * 0.3 + emotions.joy * 0.2).toString();
    const danceability = (emotions.excitement * 0.6 + emotions.joy * 0.4).toString();
    
    // ジャンルシードを感情に基づいて選択
    let seedGenres = 'ambient,acoustic';
    if (emotions.excitement > 0.7) seedGenres = 'electronic,pop,rock';
    else if (emotions.peace > 0.7) seedGenres = 'ambient,classical,jazz';
    else if (emotions.melancholy > 0.6) seedGenres = 'indie,folk,alternative';

    return {
      seed_genres: seedGenres,
      target_valence: Math.max(0, Math.min(1, parseFloat(valence))).toString(),
      target_energy: Math.max(0, Math.min(1, parseFloat(energy))).toString(),
      target_danceability: Math.max(0, Math.min(1, parseFloat(danceability))).toString()
    };
  }

  /**
   * Spotifyレスポンスのパース
   */
  private parseSpotifyRecommendations(spotifyData: any, emotionAnalysis: EmotionAnalysis): CulturalContext['music'] {
    const tracks = spotifyData.tracks || [];
    const genres = [...new Set(tracks.flatMap((track: any) => 
      track.artists.flatMap((artist: any) => artist.genres || [])
    ))].slice(0, 5);

    const recommendations = tracks.slice(0, 5).map((track: any) => 
      `${track.name} - ${track.artists.map((a: any) => a.name).join(', ')}`
    );

    // 感情に基づいてムードを決定
    let mood = 'balanced';
    if (emotionAnalysis.emotions.excitement > 0.7) mood = 'energetic';
    else if (emotionAnalysis.emotions.peace > 0.7) mood = 'peaceful';
    else if (emotionAnalysis.emotions.melancholy > 0.6) mood = 'contemplative';

    return {
      genres,
      mood,
      recommendations
    };
  }

  /**
   * アート・展示情報の取得
   */
  private async getArtRecommendations(
    emotionAnalysis: EmotionAnalysis, 
    userLocation?: { latitude: number; longitude: number }
  ): Promise<CulturalContext['art']> {
    // 実際の実装では美術館API、イベントサイトのスクレイピング等を行う
    // ここではモックデータを使用
    return this.getMockArtRecommendations(emotionAnalysis, userLocation);
  }

  /**
   * 感情に基づくアートスタイル推薦
   */
  private getArtStylesForEmotion(emotionAnalysis: EmotionAnalysis): string[] {
    const emotions = emotionAnalysis.emotions;
    const styles: string[] = [];

    if (emotions.peace > 0.6) styles.push('ミニマリズム', '水彩画', '風景画');
    if (emotions.excitement > 0.6) styles.push('ポップアート', '現代アート', '抽象画');
    if (emotions.melancholy > 0.5) styles.push('印象派', 'ロマン主義', '写実主義');
    if (emotions.curiosity > 0.7) styles.push('シュルレアリスム', '前衛芸術', 'インスタレーション');
    if (emotions.nostalgia > 0.6) styles.push('クラシック', '伝統工芸', '古典絵画');

    return styles.length > 0 ? styles : ['現代アート', '写真', '絵画'];
  }

  /**
   * モック音楽レコメンデーション
   */
  private getMockMusicRecommendations(emotionAnalysis: EmotionAnalysis): CulturalContext['music'] {
    const emotions = emotionAnalysis.emotions;
    
    let genres: string[] = [];
    let mood = 'balanced';
    let recommendations: string[] = [];

    if (emotions.excitement > 0.7) {
      genres = ['Electronic', 'Pop', 'Rock'];
      mood = 'energetic';
      recommendations = [
        'Midnight City - M83',
        'Feel It Still - Portugal. The Man',
        'Levitating - Dua Lipa',
        'Blinding Lights - The Weeknd',
        'Good 4 U - Olivia Rodrigo'
      ];
    } else if (emotions.peace > 0.7) {
      genres = ['Ambient', 'Classical', 'Jazz'];
      mood = 'peaceful';
      recommendations = [
        'Gymnopédie No.1 - Erik Satie',
        'River - Joni Mitchell',
        'Weightless - Marconi Union',
        'Clair de Lune - Claude Debussy',
        'Porz Goret - Yann Tiersen'
      ];
    } else if (emotions.melancholy > 0.6) {
      genres = ['Indie', 'Folk', 'Alternative'];
      mood = 'contemplative';
      recommendations = [
        'Mad World - Gary Jules',
        'The Night We Met - Lord Huron',
        'Skinny Love - Bon Iver',
        'Hurt - Johnny Cash',
        'Black - Pearl Jam'
      ];
    } else {
      genres = ['Indie Pop', 'Alternative', 'Folk'];
      recommendations = [
        'Young Folks - Peter Bjorn and John',
        'Electric Feel - MGMT',
        'Dog Days Are Over - Florence + The Machine',
        'Ho Hey - The Lumineers',
        'Budapest - George Ezra'
      ];
    }

    return { genres, mood, recommendations };
  }

  /**
   * モックアートレコメンデーション
   */
  private getMockArtRecommendations(
    emotionAnalysis: EmotionAnalysis,
    userLocation?: { latitude: number; longitude: number }
  ): CulturalContext['art'] {
    const styles = this.getArtStylesForEmotion(emotionAnalysis);
    
    // モック展示会データ
    const exhibitions: ArtExhibition[] = [
      {
        id: 'ex-1',
        title: '現代アートの新潮流',
        venue: '現代美術館',
        description: '21世紀のアート表現を探る企画展',
        startDate: '2024-01-15',
        endDate: '2024-03-30',
        location: {
          latitude: 35.6762,
          longitude: 139.6503,
          address: '東京都港区六本木7-22-2'
        },
        genres: ['現代アート', '抽象画'],
        ticketPrice: 1800,
        website: 'https://example-museum.jp'
      },
      {
        id: 'ex-2',
        title: 'ミニマリズムの美学',
        venue: 'アートギャラリー SPACE',
        description: 'シンプルな美しさを追求した作品展',
        startDate: '2024-02-01',
        endDate: '2024-04-15',
        location: {
          latitude: 35.6694,
          longitude: 139.7014,
          address: '東京都渋谷区神宮前5-10-1'
        },
        genres: ['ミニマリズム', '彫刻'],
        ticketPrice: 1200
      }
    ];

    // モック美術館データ
    const venues: ArtVenue[] = [
      {
        id: 'venue-1',
        name: '国立新美術館',
        type: 'museum',
        location: {
          latitude: 35.6658,
          longitude: 139.7277,
          address: '東京都港区六本木7-22-2'
        },
        rating: 4.5,
        description: '多様な企画展を開催する国立美術館',
        openingHours: '10:00-18:00（金土は20:00まで）',
        website: 'https://www.nact.jp'
      },
      {
        id: 'venue-2',
        name: '森美術館',
        type: 'museum',
        location: {
          latitude: 35.6606,
          longitude: 139.7298,
          address: '東京都港区六本木6-10-1'
        },
        rating: 4.3,
        description: '現代アートを中心とした美術館',
        openingHours: '10:00-22:00',
        website: 'https://www.mori.art.museum'
      }
    ];

    return {
      exhibitions: exhibitions.slice(0, 3),
      styles,
      venues: venues.slice(0, 3)
    };
  }

  /**
   * モック文化的コンテキスト
   */
  private getMockCulturalContext(): CulturalContext {
    return {
      music: {
        genres: ['Indie', 'Alternative', 'Folk'],
        mood: 'balanced',
        recommendations: [
          'Young Folks - Peter Bjorn and John',
          'Electric Feel - MGMT',
          'Dog Days Are Over - Florence + The Machine'
        ]
      },
      art: {
        exhibitions: [],
        styles: ['現代アート', '写真', '絵画'],
        venues: []
      }
    };
  }

  /**
   * 地域の文化イベント情報取得（拡張用）
   */
  async getCulturalEventsNearby(
    location: { latitude: number; longitude: number },
    radius: number = 10
  ): Promise<ArtExhibition[]> {
    // 実装時は地域のイベント情報APIを使用
    console.log(`🌍 Fetching cultural events within ${radius}km of location...`);
    
    return this.getMockArtRecommendations({} as EmotionAnalysis, location).exhibitions;
  }

  /**
   * 音楽プレイリスト生成（拡張用）
   */
  async createEmotionalPlaylist(
    emotionAnalysis: EmotionAnalysis,
    playlistLength: number = 20
  ): Promise<string[]> {
    const musicRec = await this.getMusicRecommendations(emotionAnalysis);
    return musicRec.recommendations.slice(0, Math.min(playlistLength, musicRec.recommendations.length));
  }

  /**
   * API利用可能性チェック
   */
  isSpotifyAvailable(): boolean {
    return !!this.spotifyAccessToken;
  }

  /**
   * 感情と文化的要素の相関分析
   */
  analyzeCulturalAlignment(emotionAnalysis: EmotionAnalysis, culturalContext: CulturalContext): {
    musicAlignment: number;
    artAlignment: number;
    overallAlignment: number;
    recommendations: string[];
  } {
    // 感情と提案された文化的要素の一致度を分析
    let musicAlignment = 0.7; // デフォルト値
    let artAlignment = 0.7;   // デフォルト値

    // 簡易的な相関計算
    const emotions = emotionAnalysis.emotions;
    
    if (emotions.excitement > 0.7 && culturalContext.music.mood === 'energetic') {
      musicAlignment = 0.9;
    } else if (emotions.peace > 0.7 && culturalContext.music.mood === 'peaceful') {
      musicAlignment = 0.9;
    }

    const overallAlignment = (musicAlignment + artAlignment) / 2;
    
    const recommendations = [];
    if (overallAlignment < 0.6) {
      recommendations.push('より個人的な嗜好を反映した提案を行います');
    }
    if (musicAlignment > 0.8) {
      recommendations.push('音楽の趣味がよく分析できています');
    }

    return {
      musicAlignment,
      artAlignment,
      overallAlignment,
      recommendations
    };
  }
}

export const culturalIntegrationService = new CulturalIntegrationService();