# 🛩️ AI日記 

写真投稿 + AI分析 + ゲーミフィケーション機能を統合したモダンなブログアプリ

## 🚀 セットアップ

### 必要な環境変数
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI分析
VITE_GEMINI_API_KEY=your_gemini_api_key

# Spotify連携
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5174/auth/spotify

# プッシュ通知（本番のみ）
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your-email@domain.com
```

### 起動
```bash
npm install
npm run dev
```

## 🎯 主要機能

### AI機能
- **Gemini AI分析**: 投稿内容の情景描写・コメント・質問・観察を自動生成
- **写真スコアリング**: AI による写真品質評価システム
- **音楽推薦**: 投稿内容に基づくSpotify楽曲推薦

### ゲーミフィケーション
- **ポイントシステム**: 投稿・いいね・コメントでポイント獲得
- **ランキング**: 総合・写真品質・投稿数・影響力の4種類
- **バッジシステム**: 達成度に応じたバッジ獲得
- **投稿ボーナス**: 連続投稿・品質・マイルストーンボーナス

### ソーシャル機能
- **いいね・コメント・ブックマーク機能**
- **リアルタイム通知**
- **ユーザープロフィール**
- **パーソナルダッシュボード**

## 🔧 API設定

### 1. Supabase
- プロジェクト作成 → 設定からURL・ANON_KEYを取得
- `database/` 内のSQLファイルを順次実行

### 2. Gemini AI
- [Google AI Studio](https://makersuite.google.com/app/apikey) でAPIキー取得

### 3. Spotify（音楽連携）
- [Spotify Dashboard](https://developer.spotify.com/dashboard) でアプリ作成
- Redirect URI設定: `http://localhost:5174/auth/spotify`

## 📁 アーキテクチャ

```
src/
├── components/     # UIコンポーネント
├── pages/         # ページコンポーネント
├── services/      # API・ビジネスロジック
├── hooks/         # カスタムフック
├── contexts/      # React Context
├── types/         # TypeScript型定義
└── utils/         # ユーティリティ
```

## 🎨 技術スタック

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Google Gemini API
- **Music**: Spotify Web API
- **Deploy**: Vercel

## 📊 データベース構造

### 主要テーブル
- `posts` - 投稿データ
- `users` - ユーザー情報  
- `point_history` - ポイント履歴
- `user_badges` - バッジ情報
- `ranking_cache` - ランキングキャッシュ
- `post_bonuses` - 投稿ボーナス記録

## 🎮 ゲーミフィケーション詳細

### ポイント獲得
- 投稿作成: +5pt（基本）+ 品質ボーナス（最大+30pt）
- いいね送信: +1 IP / 受信: +2 LP
- コメント: +5pt
- ブックマーク受信: +3pt

### ランキング種別
1. **総合**: 学習ポイント + 影響力ポイント + 投稿ボーナス
2. **写真品質**: 平均AIスコア × log(投稿数+1)  
3. **投稿数**: 期間内投稿数
4. **影響力**: 与えた×2 + 受けた + チェーンレベル×5

## 🚀 デプロイ

### Vercel（推奨）
1. GitHubリポジトリをVercelに連携
2. Environment Variablesに環境変数を設定
3. 自動デプロイ

### 本番環境のSpotify設定
- Redirect URI: `https://your-domain.com/auth/spotify`
- 環境変数を本番用URLに更新

## 📝 開発ルール

### デザインガイドライン
- カラー: グレー・白ベース（紫色使用禁止）
- アイコン: 🧠 使用禁止
- 用語: "エクスペリエンス"

### コード規約
- コメントなし（要求時のみ）
- console.logは本番前に削除
- エラーハンドリング必須

2025年7月4日更新