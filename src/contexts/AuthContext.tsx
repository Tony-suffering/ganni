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
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // ログイン処理完了
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ ユーザーログイン完了:', session.user.id);
        }
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
        console.log('Attempting signup for:', email);
        
        try {
            // Supabaseの認証
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: data.name,
                        avatar_url: data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=0072f5&color=fff`
                    },
                    emailRedirectTo: window.location.origin,
                },
            });

            if (authError) {
                console.error('Auth signup error:', authError);
                return { error: authError };
            }

            // ユーザーが作成された場合、プロファイルを作成
            if (authData.user && authData.user.id) {
                console.log('Creating profile for user:', authData.user.id);
                
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: authData.user.id,
                        name: data.name,
                        avatar_url: data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=0072f5&color=fff`,
                        created_at: new Date().toISOString()
                    });

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                    // プロファイル作成エラーは認証エラーとは別として扱う
                    return { error: new Error(`Database error saving new user: ${profileError.message}`) as any };
                }

                console.log('Profile created successfully');
            }

            return { error: null };
        } catch (error) {
            console.error('Signup process error:', error);
            return { error: error as any };
        }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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
