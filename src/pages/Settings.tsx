import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'ja',
    notifications: true
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setSettings(data);
            if (data.theme) setTheme(data.theme);
          }
        });
    }
  }, [user, setTheme]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setSettings({ ...settings, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setSettings({ ...settings, [name]: value });
      if (name === 'theme') {
        setTheme(value as 'light' | 'dark');
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from('user_settings')
      .upsert({ ...settings, user_id: user.id });
    setSaving(false);
    setMessage('設定を保存しました');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg mt-8">
      <button onClick={() => navigate(-1)} className="flex items-center text-sm text-neutral-500 hover:text-primary-500 mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> 戻る
      </button>
      <h2 className="text-2xl font-bold mb-6 text-neutral-900">設定</h2>
      <div className="space-y-8">
        {/* アカウント情報 */}
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Mail className="w-4 h-4" />メールアドレス</h3>
          <div className="bg-neutral-50 rounded-lg p-4 flex items-center justify-between">
            <span className="text-base text-neutral-800">{user?.email}</span>
            {/* パスワード変更は別画面やモーダルで実装推奨 */}
            <button className="text-primary-500 hover:underline flex items-center gap-1 text-sm" onClick={() => alert('パスワードリセットは未実装です')}> <Lock className="w-4 h-4" />パスワード変更</button>
          </div>
        </section>
        {/* 表示設定 */}
        <section>
          <h3 className="text-lg font-semibold mb-3">表示設定</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">テーマ</label>
              <select name="theme" value={settings.theme} onChange={handleChange} className="input w-full">
                <option value="light">ライト</option>
                <option value="dark">ダーク</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">言語</label>
              <select name="language" value={settings.language} onChange={handleChange} className="input w-full">
                <option value="ja">日本語</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </section>
        {/* 通知設定 */}
        <section>
          <h3 className="text-lg font-semibold mb-3">通知設定</h3>
          <label className="flex items-center mt-2">
            <input type="checkbox" name="notifications" checked={settings.notifications} onChange={handleChange} className="mr-2" />
            通知を受け取る
          </label>
        </section>
      </div>
      <div className="flex justify-end items-center gap-4 mt-8">
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