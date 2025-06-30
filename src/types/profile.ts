export interface ExtendedProfile {
  // 基本情報
  id: string;
  name: string;
  avatar_url?: string;
  
  // 個人情報
  age_range: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  occupation: string;
  family_status: 'single' | 'married' | 'with_children' | 'with_parents' | 'other';
  
  // 居住・移動情報
  living_area: string; // 居住地域
  commute_method: 'train' | 'car' | 'bike' | 'walk' | 'remote';
  activity_radius: number; // 普段の行動半径(km)
  
  // ライフスタイル
  wake_up_time: string; // "06:30"
  sleep_time: string; // "23:00" 
  weekend_preference: 'active' | 'relaxed' | 'mixed';
  exercise_habit: 'daily' | 'weekly' | 'occasionally' | 'rarely';
  
  // 経済・時間制約
  budget_range: 'low' | 'medium' | 'high'; // 体験・購入予算
  available_time_weekday: number; // 平日の自由時間(時間)
  available_time_weekend: number; // 休日の自由時間(時間)
  
  // 興味・嗜好
  interests: string[]; // ['photography', 'music', 'cooking', ...]
  music_genres: string[]; // ['pop', 'rock', 'jazz', ...]
  food_preferences: string[]; // ['japanese', 'italian', 'vegetarian', ...]
  
  // 目標・価値観
  life_goals: string[]; // ['health', 'creativity', 'social', ...]
  challenge_preference: 'low_risk' | 'moderate' | 'adventurous';
  social_preference: 'alone' | 'small_group' | 'large_group' | 'mixed';
  
  // 制約情報
  dietary_restrictions: string[]; // アレルギー等
  mobility_limitations: string[]; // 移動制約
  time_constraints: string[]; // 時間制約
  
  // AI分析用
  analysis_consent: boolean;
  data_sharing_level: 'minimal' | 'standard' | 'detailed';
  
  created_at: string;
  updated_at: string;
}