# 🚀 本番環境デプロイガイド

## 1. 事前準備（最重要）

### A. VAPID鍵の生成
プッシュ通知機能に必要なVAPID鍵を生成します。

**方法1: オンラインツール（推奨）**
1. [Web Push Codelab](https://web-push-codelab.glitch.me/) にアクセス
2. "Generate Keys" ボタンをクリック
3. 生成された Public Key と Private Key をコピー

**方法2: コマンドライン**
```bash
npx web-push generate-vapid-keys
```

**方法3: Node.jsスクリプト**
```javascript
const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();
console.log('Public Key:', keys.publicKey);
console.log('Private Key:', keys.privateKey);
```

### B. 必要な環境変数一覧
以下の環境変数を準備してください：

```env
# Supabase設定
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI設定
VITE_GEMINI_API_KEY=your_gemini_api_key

# VAPID設定（プッシュ通知用）
VAPID_PUBLIC_KEY=generated_public_key
VAPID_PRIVATE_KEY=generated_private_key
VAPID_SUBJECT=mailto:your-email@domain.com

# Vision API（オプション）
VITE_VISION_API_KEY=your_vision_api_key
```

## 2. Supabaseプロジェクト設定

### A. 新しいプロジェクト作成
1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. "New Project" をクリック
3. プロジェクト名: `ai-commentator-prod`
4. データベースパスワードを設定
5. リージョン: `Tokyo (ap-northeast-1)` を選択

### B. データベースマイグレーション実行
```bash
# Supabase CLIインストール
npm install -g supabase

# プロジェクトとリンク
supabase login
supabase link --project-ref your_project_ref

# マイグレーション実行
supabase db push
```

### C. RLS（Row Level Security）の確認
すべてのテーブルでRLSが有効になっていることを確認：
- `posts`
- `comments` 
- `likes`
- `notifications`
- `push_subscriptions`
- `ai_comments`

### D. Storage設定
1. Supabase Dashboard > Storage
2. 新しいバケット作成: `avatars`
3. Public access を有効化
4. ファイルサイズ制限: 5MB

## 3. デプロイプラットフォーム選択

### オプション1: Vercel（推奨）

**手順:**
1. [Vercel](https://vercel.com) にGitHubアカウントでログイン
2. "Import Project" でGitHubリポジトリを選択
3. Framework: `Vite` を選択
4. Environment Variables に上記の環境変数を設定
5. "Deploy" をクリック

**Vercel設定ファイル作成:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

### オプション2: Netlify

**手順:**
1. [Netlify](https://netlify.com) にログイン
2. "New site from Git" を選択
3. GitHubリポジトリを接続
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Environment variables を設定
6. "Deploy site" をクリック

## 4. ドメイン設定（オプション）

### A. カスタムドメイン設定
1. ドメインを購入（お名前.com、Cloudflareなど）
2. Vercel/Netlifyでカスタムドメインを追加
3. DNSレコードを設定
4. SSL証明書の自動発行を確認

### B. PWA設定の確認
- HTTPSでアクセス可能であること
- Service Worker が正常に動作すること
- マニフェストファイルが正しく配信されること

## 5. Edge Functions デプロイ

### A. Supabase Edge Functions
```bash
# プッシュ通知用Function
supabase functions deploy sendPushNotification

# 画像解析用Function（使用している場合）
supabase functions deploy analyzeImage
```

### B. 環境変数の設定
```bash
supabase secrets set VAPID_PUBLIC_KEY=your_public_key
supabase secrets set VAPID_PRIVATE_KEY=your_private_key
supabase secrets set VAPID_SUBJECT=mailto:your-email@domain.com
```

## 6. テスト手順

### A. 基本機能テスト
- [ ] ユーザー登録・ログイン
- [ ] 投稿作成・編集・削除
- [ ] ライク・コメント機能
- [ ] AI生成機能
- [ ] 画像アップロード

### B. プッシュ通知テスト
- [ ] 通知許可の要求
- [ ] テスト通知の送信
- [ ] ライク時の自動通知
- [ ] コメント時の自動通知

### C. パフォーマンステスト
- [ ] 画像遅延読み込み
- [ ] レスポンス速度
- [ ] モバイル対応

## 7. モニタリング設定

### A. Supabase Analytics
- データベースパフォーマンス監視
- API使用量の確認
- エラーログの監視

### B. Vercel Analytics（Vercel使用時）
- ページビューの追跡
- パフォーマンス指標
- Core Web Vitals

## 8. セキュリティチェックリスト

- [ ] 全ての環境変数が正しく設定されている
- [ ] RLSポリシーが適切に設定されている
- [ ] CORS設定が正しい
- [ ] APIキーが外部に漏れていない
- [ ] HTTPS接続のみ許可
- [ ] 適切な認証・認可が実装されている

## 9. 運用開始後

### A. バックアップ設定
- Supabaseの自動バックアップ確認
- 定期的なデータエクスポート

### B. アップデート手順
1. developmentブランチで開発
2. staging環境でテスト
3. mainブランチにマージでproduction自動デプロイ

## トラブルシューティング

### よくある問題

**1. プッシュ通知が動かない**
- VAPID鍵が正しく設定されているか確認
- HTTPS接続になっているか確認
- Service Workerが登録されているか確認

**2. 画像アップロードが失敗する**
- Supabase Storageの設定確認
- ファイルサイズ制限の確認
- CORS設定の確認

**3. AI機能が動かない**
- Gemini API キーの確認
- API使用量制限の確認
- ネットワーク接続の確認

---

## 🚨 重要な注意事項

1. **API キーの管理**: 絶対にGitHubにコミットしない
2. **データベース**: 本番データは定期的にバックアップ
3. **パフォーマンス**: 画像最適化と遅延読み込みの実装済み
4. **セキュリティ**: 全ての入力値の検証とサニタイズ
5. **プライバシー**: ユーザーデータの適切な処理とGDPR対応