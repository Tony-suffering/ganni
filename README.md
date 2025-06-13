# Airport Moments - 空港の瞬間を切り取る

美しい空港写真とAI生成コメントを共有するブログプラットフォーム

## 🚀 機能

- **写真投稿**: 空港での美しい瞬間を投稿
- **AI情景描写**: Gemini AIによる詩的な情景描写生成
- **AI応答システム**: 3種類のAI応答（コメント・質問・観察）
- **タグ機能**: カテゴリー別の投稿分類
- **検索・フィルタ**: 投稿の検索とタグフィルタリング
- **ユーザー認証**: Supabase認証システム
- **レスポンシブデザイン**: モバイル・デスクトップ対応

## 🛠️ 技術スタック

- **フロントエンド**: React 18, TypeScript, Tailwind CSS
- **アニメーション**: Framer Motion
- **AI**: Google Gemini API
- **データベース**: Supabase
- **認証**: Supabase Auth
- **ビルドツール**: Vite

## 📋 セットアップ手順

### 1. 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定してください：

```bash
# Gemini API Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabaseプロジェクトの設定

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. データベースマイグレーションを実行：
   ```bash
   # supabase/migrations/ 内のSQLファイルを順番に実行
   ```
3. 認証設定でメール確認を無効化（開発用）

### 3. Gemini API キーの取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey)でAPIキーを取得
2. `.env`ファイルに設定

### 4. 開発サーバーの起動

```bash
npm install
npm run dev
```

## 🎯 デモモード

環境変数が設定されていない場合、アプリケーションはデモモードで動作します：

- モックデータを使用した投稿表示
- AI機能はフォールバックデータを使用
- ログイン機能は無効（デモユーザーとして表示）

## 📁 プロジェクト構造

```
src/
├── components/          # Reactコンポーネント
│   ├── auth/           # 認証関連コンポーネント
│   ├── Header.tsx      # ヘッダーコンポーネント
│   ├── PostCard.tsx    # 投稿カードコンポーネント
│   └── ...
├── contexts/           # Reactコンテキスト
├── hooks/              # カスタムフック
├── services/           # API・サービス層
├── types/              # TypeScript型定義
└── data/               # モックデータ
```

## 🔧 主要機能の説明

### AI情景描写生成
- ユーザーの投稿タイトルとコメントを分析
- Gemini AIが詩的で美しい情景描写を生成

### AI応答システム
1. **AIコメント**: 投稿者の感性を称賛する温かいコメント
2. **AI質問**: 対話を促す興味深い質問
3. **AI観察**: 文化的・建築的な専門的観察

### セキュリティ
- Supabase RLS（Row Level Security）による適切なアクセス制御
- ユーザー認証とデータ保護
- XSS・CSRF対策

## 🚀 本番環境デプロイ

### Netlify
1. 環境変数を設定
2. ビルドコマンド: `npm run build`
3. 公開ディレクトリ: `dist`

### Vercel
1. プロジェクトをインポート
2. 環境変数を設定
3. 自動デプロイ

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎します。

---

**Airport Moments** - 空港での特別な瞬間を、AIと共に美しく記録しましょう ✈️