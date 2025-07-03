# Spotify本番環境セットアップ

## 1. Spotify Dashboard設定

1. https://developer.spotify.com/dashboard にアクセス
2. あなたのアプリを選択
3. 「Settings」をクリック
4. 「Redirect URIs」に以下を追加：
   ```
   https://zen-cloud.org/auth/spotify
   ```
5. 「Add」→「Save」をクリック

## 2. Vercel環境変数設定

1. https://vercel.com/dashboard にアクセス
2. あなたのプロジェクトを選択
3. 「Settings」→「Environment Variables」
4. 以下の環境変数を追加：

```
VITE_SPOTIFY_CLIENT_ID=59a3e3c0cace4ee083f8e17bf5ac6b1d
VITE_SPOTIFY_CLIENT_SECRET=84b999ad454448a1845c339493acd853
VITE_SPOTIFY_REDIRECT_URI=https://zen-cloud.org/auth/spotify
```

## 3. デプロイ

```bash
git add .
git commit -m "feat: Spotify API連携機能を追加"
git push
```

Vercelが自動的にデプロイします。

## 4. 動作確認

1. https://zen-cloud.org にアクセス
2. ダッシュボード → Spotifyタブ
3. 「Spotifyと連携」ボタンをクリック
4. Spotifyでログイン・承認
5. 自動的にダッシュボードに戻る

## 注意事項

- 本番環境では必ずHTTPS（`https://`）を使用
- Client Secretは絶対に公開しない
- Vercelの環境変数として安全に管理する