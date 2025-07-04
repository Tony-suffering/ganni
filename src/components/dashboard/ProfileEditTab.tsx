import React, { useEffect, useState, useRef } from 'react';
import { Upload, User, Camera, Save } from 'lucide-react';
import { supabase } from '../../supabase';

interface ProfileEditTabProps {
  userId: string;
  user: any;
}

export const ProfileEditTab: React.FC<ProfileEditTabProps> = ({ userId, user }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({
    name: '',
    avatar_url: ''
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfile(data);
            setAvatarPreview(data.avatar_url || '');
          }
        });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // ファイルサイズチェック (5MB以下)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('ファイルサイズは5MB以下にしてください');
      setMessageType('error');
      return;
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      setMessage('画像ファイルを選択してください');
      setMessageType('error');
      return;
    }

    try {
      setSaving(true);

      // プレビュー用のURLを作成
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);

      // ファイル名を生成
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;

      // Supabase Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setMessage('アップロードに失敗しました');
        setMessageType('error');
        return;
      }

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // プロフィールを更新
      setProfile({ ...profile, avatar_url: publicUrl });
      setMessage('アバターを更新しました');
      setMessageType('success');

    } catch (error) {
      console.error('Error:', error);
      setMessage('エラーが発生しました');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      // 1. プロフィールテーブルを更新
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: profile.name,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile update error:', profileError);
        setMessage('プロフィールの更新に失敗しました');
        setMessageType('error');
        return;
      }

      // 2. 認証メタデータも更新
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          name: profile.name,
          avatar_url: profile.avatar_url
        }
      });

      if (metadataError) {
        console.error('Metadata update error:', metadataError);
        // メタデータの更新が失敗してもプロフィールは更新されているので警告のみ
        setMessage('プロフィールを更新しましたが、一部の表示更新に時間がかかる場合があります');
        setMessageType('success');
      } else {
        setMessage('プロフィールを更新しました');
        setMessageType('success');
      }
      
      // プロフィール完成度ボーナス機能は無効化
      // console.log('プロフィール更新完了');

      // 3. 投稿の作者名も更新（もし投稿がある場合）
      try {
        const { error: postsError } = await supabase
          .from('posts')
          .update({ 
            author_name: profile.name,
            author_avatar: profile.avatar_url 
          })
          .eq('author_id', user.id);

        if (postsError) {
          console.error('Posts update error:', postsError);
        }
      } catch (postsUpdateError) {
        console.error('Error updating posts:', postsUpdateError);
      }

      // ページをリロードして変更を反映
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Error:', error);
      setMessage('エラーが発生しました');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const getDisplayName = () => {
    return profile.name || user?.email?.split('@')[0] || 'ユーザー';
  };

  const getAvatarUrl = () => {
    return avatarPreview || profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName())}&background=0072f5&color=fff`;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              プロフィール設定
            </h3>
            <p className="text-sm text-gray-500">
              名前とアバター画像を設定できます
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              アバター画像
            </h4>
            
            <div className="flex items-center space-x-6">
              <div className="relative">
                <img
                  src={getAvatarUrl()}
                  alt="プロフィール画像"
                  className="w-20 h-20 rounded-full object-cover border-4 border-gray-200 shadow-sm"
                />
                {saving && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  画像を選択
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG, GIF (最大5MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Name Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              表示名
            </h4>
            
            <div>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                placeholder="あなたの名前を入力してください"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-2">
                この名前が他のユーザーに表示されます
              </p>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg ${
              messageType === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};