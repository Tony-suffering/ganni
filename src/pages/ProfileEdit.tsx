import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';

export const ProfileEdit: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
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
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${user.id}.${fileExt}`;
    setSaving(true);
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (!uploadError) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setProfile((prev) => ({ ...prev, avatar_url: data.publicUrl }));
      setAvatarPreview(data.publicUrl);
      setMessage('アバター画像を更新しました');
    } else {
      setMessage('アバター画像のアップロードに失敗しました');
    }
    setSaving(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', user.id);
    setSaving(false);
    setMessage(error ? 'プロフィールの更新に失敗しました' : 'プロフィールを更新しました');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg mt-8">
      <button onClick={() => navigate(-1)} className="flex items-center text-sm text-neutral-500 hover:text-primary-500 mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> 戻る
      </button>
      <h2 className="text-2xl font-bold mb-6 text-neutral-900">プロフィール編集</h2>
      <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
        <div className="relative">
          <img
            src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=0072f5&color=fff`}
            alt="avatar"
            className="w-32 h-32 rounded-full object-cover border-4 border-primary-100 shadow"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-2 right-2 p-2 bg-primary-500 text-white rounded-full shadow hover:bg-primary-600"
            title="アバター画像を変更"
          >
            <Upload className="w-5 h-5" />
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div className="flex-1 w-full space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">名前</label>
            <input name="name" value={profile.name} onChange={handleChange} placeholder="名前" className="input w-full" maxLength={32} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">自己紹介</label>
            <textarea name="bio" value={profile.bio} onChange={handleChange} placeholder="自己紹介" className="input w-full" maxLength={160} rows={3} />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">場所</label>
              <input name="location" value={profile.location} onChange={handleChange} placeholder="例: 東京" className="input w-full" maxLength={32} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">ウェブサイト</label>
              <input name="website" value={profile.website} onChange={handleChange} placeholder="https://" className="input w-full" maxLength={64} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end items-center gap-4">
        {message && <span className="text-sm text-primary-600">{message}</span>}
        <button
          onClick={handleSave}
          className="btn-primary px-8 py-2 text-base"
          disabled={saving}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}; 