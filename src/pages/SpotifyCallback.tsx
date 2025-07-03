import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SpotifyService } from '../services/spotifyService';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

const spotifyService = new SpotifyService();

export const SpotifyCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setError('Spotify認証がキャンセルされました');
        setIsProcessing(false);
        return;
      }

      if (!code || !state) {
        setError('認証エラー: 必要なパラメータが不足しています');
        setIsProcessing(false);
        return;
      }

      if (!user) {
        setError('ログインが必要です');
        setIsProcessing(false);
        return;
      }

      try {
        const tokenData = await spotifyService.handleAuthCallback(code, state);
        
        const { error: dbError } = await supabase
          .from('user_spotify_tokens')
          .upsert({
            user_id: user.id,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (dbError) {
          throw dbError;
        }

        navigate('/dashboard?tab=spotify&success=true');
      } catch (err) {
        console.error('Spotify認証エラー:', err);
        setError('認証中にエラーが発生しました');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, user]);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          {isProcessing ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4">
                <div className="w-full h-full border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Spotify認証処理中...</h2>
              <p className="text-gray-600">しばらくお待ちください</p>
            </>
          ) : error ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 text-red-500">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-red-600">認証エラー</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ダッシュボードに戻る
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};