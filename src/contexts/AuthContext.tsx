import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../supabase';

// Contextで提供する値の型を定義
interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  // 新規登録機能を追加
  signUp: (email: string, password: string, data: { [key: string]: any }) => Promise<{ error: AuthError | null }>;
}

// AuthProviderコンポーネントが受け取るpropsの型を定義
interface AuthProviderProps {
  children: ReactNode;
}

// Contextを作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * アプリケーション全体に認証状態を提供するプロバイダーコンポーネント
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 最初に現在のセッションを非同期で取得
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 認証状態の変化を監視するリスナーを設定
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // コンポーネントがアンマウントされるときにリスナーを解除
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Contextに渡す値
  const value = {
    session,
    user,
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
      }
    },
    loading,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    },
    // 新規登録関数を実装
    signUp: async (email, password, data) => {
        const { data: signUpData, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data, // ここで { name: 'Taro' } のようなユーザーメタデータを渡す
            },
        });
        if (!error && signUpData?.user) {
            // 認証ユーザー作成成功時、profilesテーブルに追加
            const userId = signUpData.user.id;
            const name = data.name || '';
            const avatar_url = data.avatar_url || null;
            await supabase.from('profiles').insert({
                id: userId,
                name,
                avatar_url
            });
        }
        return { error };
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {/* 認証状態のチェックが終わるまで子要素を表示しない */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

/**
 * 認証情報に簡単にアクセスするためのカスタムフック
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
