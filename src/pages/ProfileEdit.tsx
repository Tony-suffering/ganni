import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';

export const ProfileEdit: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({
    name: '',
    avatar_url: ''
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // ファイルサイズチェック (5MB以下)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('ファイルサイズは5MB以下にしてください');
      return;
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      setMessage('画像ファイルを選択してください');
      return;
    }

    setSaving(true);
    setMessage('画像をアップロード中...');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 既存のファイルを削除（もしあれば）
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath && oldPath.startsWith(user.id)) {
          await supabase.storage.from('avatars').remove([`avatars/${oldPath}`]);
        }
      }

      // 新しいファイルをアップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          cacheControl: '3600',
          upsert: false 
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setMessage(`アップロードエラー: ${uploadError.message}`);
        return;
      }

      // パブリックURLを取得
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      if (data?.publicUrl) {
        const newAvatarUrl = `${data.publicUrl}?t=${Date.now()}`;
        setProfile((prev) => ({ ...prev, avatar_url: newAvatarUrl }));
        setAvatarPreview(newAvatarUrl);
        setMessage('アバター画像を更新しました');
      } else {
        setMessage('画像URLの取得に失敗しました');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      setMessage('画像のアップロードに失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage('プロフィールを保存中...');

    try {
      // profilesテーブルを更新
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        setMessage('プロフィールの更新に失敗しました');
        return;
      }

      // ユーザーメタデータも更新
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: profile.name,
          avatar_url: profile.avatar_url
        }
      });

      if (authError) {
        console.error('Auth update error:', authError);
        setMessage('認証情報の更新に失敗しました');
        return;
      }

      setMessage('プロフィールを更新しました');
      
      // 成功時は少し待ってからメッセージをクリア
      setTimeout(() => {
        setMessage('');
      }, 3000);

    } catch (error) {
      console.error('Save error:', error);
      setMessage('プロフィールの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg mt-20 md:mt-28 flex flex-col items-center">
      <button onClick={() => navigate(-1)} className="flex items-center text-sm text-neutral-500 hover:text-primary-500 mb-6 self-start">
        <ArrowLeft className="w-4 h-4 mr-1" /> 戻る
      </button>
      <h2 className="text-3xl font-bold mb-8 text-neutral-900 text-center">プロフィール編集</h2>
      <div className="flex flex-col items-center mb-8 w-full">
        <div className="relative mb-4">
          <img
            src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=0072f5&color=fff`}
            alt="avatar"
            className="w-40 h-40 rounded-full object-cover border-4 border-primary-100 shadow-lg"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-3 right-3 p-3 bg-primary-500 text-white rounded-full shadow hover:bg-primary-600 border-2 border-white"
            title="アバター画像を変更"
          >
            <Upload className="w-6 h-6" />
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div className="w-full flex flex-col items-center">
          <label className="block text-lg font-medium mb-2">名前</label>
          <input name="name" value={profile.name} onChange={handleChange} placeholder="名前" className="input w-full text-center text-xl py-3 px-4 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200" maxLength={32} />
        </div>
      </div>
      {message && <span className={`text-sm mt-2 ${message.includes('失敗') ? 'text-red-600' : 'text-primary-600'}`}>{message}</span>}
      <button
        onClick={handleSave}
        className="mt-8 w-full py-3 text-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-semibold shadow-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={saving}
      >
        {saving ? '保存中...' : '保存'}
      </button>
    </div>
  );
}; 