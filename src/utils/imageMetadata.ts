/**
 * 写真のメタデータ（EXIF情報）を抽出・分析するユーティリティ
 */

interface ExifData {
  // 位置情報
  latitude?: number;
  longitude?: number;
  location?: string;
  
  // 撮影情報
  dateTime?: Date;
  cameraMake?: string;
  cameraModel?: string;
  
  // 撮影設定
  focalLength?: number;
  aperture?: number;
  shutterSpeed?: string;
  iso?: number;
  
  // 画像情報
  width?: number;
  height?: number;
  orientation?: number;
  
  // 天候・時間推定
  lighting?: 'bright' | 'dim' | 'artificial' | 'golden_hour' | 'blue_hour';
  timeOfDay?: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'sunset' | 'night';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
}

interface LocationInfo {
  airport?: string;
  city?: string;
  country?: string;
  timezone?: string;
}

/**
 * 画像ファイルからEXIFデータを抽出
 */
export const extractExifData = async (imageFile: File): Promise<ExifData> => {
  return new Promise((resolve, reject) => {
    // EXIF.jsライブラリを使用（実際の実装では npm install exif-js が必要）
    // 現在はモックデータで代替
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // 実際の実装では EXIF.getData() を使用
        const mockExifData = generateMockExifData(imageFile);
        resolve(mockExifData);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(imageFile);
  });
};

/**
 * 位置情報から空港・都市情報を取得
 */
export const getLocationInfo = async (latitude: number, longitude: number): Promise<LocationInfo> => {
  try {
    // 実際の実装では逆ジオコーディングAPIを使用
    // 現在はモックデータで空港位置を判定
    const locationInfo = identifyAirportLocation(latitude, longitude);
    return locationInfo;
  } catch (error) {
    console.error('Failed to get location info:', error);
    return {};
  }
};

/**
 * 撮影設定から写真の雰囲気を分析
 */
export const analyzeCameraSettings = (exifData: ExifData): {
  mood: string;
  energy: number;
  atmosphere: string;
} => {
  let mood = 'neutral';
  let energy = 0.5;
  let atmosphere = 'balanced';
  
  // ISO値から環境を推定
  if (exifData.iso) {
    if (exifData.iso < 200) {
      mood = 'bright_outdoor';
      energy = 0.8;
      atmosphere = 'sunny';
    } else if (exifData.iso > 1600) {
      mood = 'low_light';
      energy = 0.3;
      atmosphere = 'moody';
    }
  }
  
  // 絞り値から撮影意図を推定
  if (exifData.aperture) {
    if (exifData.aperture < 2.8) {
      mood = 'artistic_portrait';
      energy = 0.6;
      atmosphere = 'intimate';
    } else if (exifData.aperture > 8) {
      mood = 'landscape_detailed';
      energy = 0.7;
      atmosphere = 'expansive';
    }
  }
  
  // 焦点距離から撮影スタイルを推定
  if (exifData.focalLength) {
    if (exifData.focalLength < 35) {
      mood = 'wide_perspective';
      energy = 0.8;
      atmosphere = 'dynamic';
    } else if (exifData.focalLength > 200) {
      mood = 'telephoto_detail';
      energy = 0.4;
      atmosphere = 'focused';
    }
  }
  
  return { mood, energy, atmosphere };
};

/**
 * 時間データから音楽的ムードを決定
 */
export const determineTimeBasedMood = (dateTime: Date): {
  timeCategory: string;
  seasonalMood: string;
  musicalEnergy: number;
} => {
  const hour = dateTime.getHours();
  const month = dateTime.getMonth() + 1;
  
  // 時間帯分析
  let timeCategory = 'day';
  let musicalEnergy = 0.5;
  
  if (hour >= 5 && hour < 8) {
    timeCategory = 'dawn';
    musicalEnergy = 0.4; // 静かで希望的
  } else if (hour >= 8 && hour < 12) {
    timeCategory = 'morning';
    musicalEnergy = 0.8; // エネルギッシュ
  } else if (hour >= 12 && hour < 17) {
    timeCategory = 'afternoon';
    musicalEnergy = 0.7; // 明るく活発
  } else if (hour >= 17 && hour < 20) {
    timeCategory = 'sunset';
    musicalEnergy = 0.6; // ロマンチック
  } else if (hour >= 20 && hour < 23) {
    timeCategory = 'evening';
    musicalEnergy = 0.4; // リラックス
  } else {
    timeCategory = 'night';
    musicalEnergy = 0.3; // 神秘的
  }
  
  // 季節分析
  let seasonalMood = 'temperate';
  if (month >= 3 && month <= 5) seasonalMood = 'spring'; // 希望・新緑
  else if (month >= 6 && month <= 8) seasonalMood = 'summer'; // 活発・明るい
  else if (month >= 9 && month <= 11) seasonalMood = 'autumn'; // 感傷・穏やか
  else seasonalMood = 'winter'; // 静寂・内省
  
  return { timeCategory, seasonalMood, musicalEnergy };
};

/**
 * メタデータを統合して音楽推薦パラメータを生成
 */
export const generateMusicParametersFromMetadata = (exifData: ExifData, locationInfo: LocationInfo): {
  category: string;
  energy: number;
  valence: number;
  tags: string[];
  reasoning: string;
} => {
  const tags: string[] = [];
  let energy = 0.5;
  let valence = 0.5;
  let category = 'general';
  let reasoning = '';
  
  // 位置情報ベースの分析
  if (locationInfo.airport) {
    tags.push('airport', 'travel');
    category = 'travel';
    energy += 0.2;
    valence += 0.1;
    reasoning += `${locationInfo.airport}での撮影。`;
  }
  
  // 時間ベースの分析
  if (exifData.dateTime) {
    const timeMood = determineTimeBasedMood(exifData.dateTime);
    tags.push(timeMood.timeCategory, timeMood.seasonalMood);
    energy = (energy + timeMood.musicalEnergy) / 2;
    
    if (timeMood.timeCategory === 'sunset') {
      category = 'sunset';
      valence += 0.2;
      reasoning += '夕日の美しい時間帯。';
    } else if (timeMood.timeCategory === 'dawn') {
      category = 'dawn';
      valence += 0.3;
      reasoning += '朝の清々しい時間。';
    }
  }
  
  // カメラ設定ベースの分析
  const cameraAnalysis = analyzeCameraSettings(exifData);
  tags.push(cameraAnalysis.atmosphere);
  energy = (energy + cameraAnalysis.energy) / 2;
  
  if (cameraAnalysis.mood === 'low_light') {
    category = 'atmospheric';
    valence -= 0.1;
    reasoning += '雰囲気のある低光量撮影。';
  } else if (cameraAnalysis.mood === 'bright_outdoor') {
    category = 'bright';
    valence += 0.2;
    reasoning += '明るい屋外での撮影。';
  }
  
  // 値を0-1の範囲に正規化
  energy = Math.max(0, Math.min(1, energy));
  valence = Math.max(0, Math.min(1, valence));
  
  return {
    category,
    energy,
    valence,
    tags: [...new Set(tags)],
    reasoning: reasoning || 'メタデータから総合的に分析した楽曲です。'
  };
};

/**
 * モックEXIFデータ生成（実際の実装では不要）
 */
const generateMockExifData = (imageFile: File): ExifData => {
  // ファイル名や作成時間から推測
  const now = new Date();
  const fileName = imageFile.name.toLowerCase();
  
  const mockData: ExifData = {
    dateTime: new Date(imageFile.lastModified || now),
    width: 1920,
    height: 1080,
    cameraMake: 'Apple',
    cameraModel: 'iPhone 15 Pro',
  };
  
  // ファイル名から推測される設定
  if (fileName.includes('night') || fileName.includes('夜')) {
    mockData.iso = 3200;
    mockData.aperture = 1.8;
    mockData.lighting = 'dim';
  } else if (fileName.includes('sunset') || fileName.includes('夕日')) {
    mockData.iso = 800;
    mockData.aperture = 2.8;
    mockData.lighting = 'golden_hour';
  } else {
    mockData.iso = 200;
    mockData.aperture = 4.0;
    mockData.lighting = 'bright';
  }
  
  // 位置情報のモック（実際の実装では GPS データを使用）
  if (fileName.includes('airport') || fileName.includes('空港')) {
    mockData.latitude = 35.7641; // 成田空港付近
    mockData.longitude = 140.3856;
  }
  
  return mockData;
};

/**
 * 空港位置の特定（モック）
 */
const identifyAirportLocation = (lat: number, lng: number): LocationInfo => {
  // 主要空港の座標データベース（実際の実装ではより包括的なデータが必要）
  const airports = [
    { name: '成田国際空港', lat: 35.7641, lng: 140.3856, city: '千葉', country: '日本' },
    { name: '羽田空港', lat: 35.5494, lng: 139.7798, city: '東京', country: '日本' },
    { name: '関西国際空港', lat: 34.4271, lng: 135.2446, city: '大阪', country: '日本' },
    { name: 'ロサンゼルス国際空港', lat: 33.9425, lng: -118.4081, city: 'Los Angeles', country: 'USA' },
  ];
  
  // 最も近い空港を見つける
  let nearestAirport = null;
  let minDistance = Infinity;
  
  for (const airport of airports) {
    const distance = Math.sqrt(
      Math.pow(lat - airport.lat, 2) + Math.pow(lng - airport.lng, 2)
    );
    
    if (distance < minDistance && distance < 0.1) { // 約10km以内
      minDistance = distance;
      nearestAirport = airport;
    }
  }
  
  return nearestAirport ? {
    airport: nearestAirport.name,
    city: nearestAirport.city,
    country: nearestAirport.country,
    timezone: nearestAirport.country === '日本' ? 'Asia/Tokyo' : 'America/Los_Angeles'
  } : {};
};